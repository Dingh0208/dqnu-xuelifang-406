/* 学立方后台管理台 —— 无框架 SPA，全部由 /api/admin/meta 的资源配置驱动 */
(() => {
  'use strict';

  const TOKEN_KEY = 'xlf_admin_token';
  const ADMIN_KEY = 'xlf_admin_info';
  const API = '';

  const GROUPS = [
    { label: '总览', items: [{ key: 'overview', label: '概览' }] },
    { label: '用户与班级', items: ['users', 'user_assets', 'classes', 'class_memberships'] },
    { label: '任务', items: ['tasks', 'student_tasks', 'daily_tasks'] },
    { label: '学习内容', items: ['wrong_questions', 'upload_history'] },
    { label: '商业化', items: ['coin_transactions', 'orders', 'silver_products', 'coin_products'] },
    { label: '运营', items: ['feedback', 'faq_items', 'parent_children'] }
  ];

  const SUBTITLES = {
    overview: '平台整体运行情况',
    users: '学生 / 教师 / 家长 / 管理员账号与学生资产',
    user_assets: '学习金币、银币与连续未完成计数',
    classes: '班级基本信息与邀请码',
    class_memberships: 'ADMIN / MEMBER 班级成员关系',
    tasks: '教师布置的班级任务',
    student_tasks: '任务 × 学生的完成归属',
    daily_tasks: '学生端今日任务（含班级任务下发）',
    wrong_questions: '错题本与 AI 解析状态',
    upload_history: '拍照 / 文档上传批次',
    coin_transactions: '学习金币流水（余额权威来源）',
    orders: '银币充值 / 金币兑换订单',
    silver_products: '银币套餐与价格',
    coin_products: '学习金币可兑换权益',
    feedback: '用户建议与反馈处理',
    faq_items: '常见问题内容维护',
    parent_children: '家长与孩子的绑定关系'
  };

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || '',
    admin: JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null'),
    resources: [],
    byKey: new Map(),
    route: 'overview',
    page: 1,
    pageSize: 20,
    q: '',
    sort: '',
    order: 'desc',
    listData: null,
    modalMode: 'form',
    editing: null
  };

  /* ---------------- 基础工具 ---------------- */
  const $ = (sel) => document.querySelector(sel);
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  let toastTimer = null;
  function toast(msg, isErr) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast' + (isErr ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  async function api(path, options = {}) {
    const res = await fetch(API + path, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { Authorization: 'Bearer ' + state.token } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    let body = null;
    try { body = await res.json(); } catch (e) { body = { code: res.status, message: '响应解析失败' }; }
    if (res.status === 401 && !path.includes('/login')) {
      logout(true);
      throw new Error('登录已失效，请重新登录');
    }
    if (!res.ok || (body.code && body.code !== 200)) {
      throw new Error(body.message || `请求失败 (${res.status})`);
    }
    return body.data;
  }

  /* ---------------- 登录 / 退出 ---------------- */
  function showLogin() {
    $('#app-view').classList.add('hidden');
    $('#login-view').classList.remove('hidden');
    $('#login-error').textContent = '';
  }

  function showApp() {
    $('#login-view').classList.add('hidden');
    $('#app-view').classList.remove('hidden');
    $('#admin-name').textContent = (state.admin && (state.admin.nickname || state.admin.account)) || 'admin';
  }

  function logout(silent) {
    state.token = '';
    state.admin = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    if (!silent) toast('已退出登录');
    showLogin();
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const account = $('#login-account').value.trim();
    const password = $('#login-password').value;
    try {
      const data = await api('/api/admin/login', { method: 'POST', body: { account, password } });
      state.token = data.token;
      state.admin = data.admin;
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
      await boot();
    } catch (err) {
      $('#login-error').textContent = err.message;
    }
  });

  $('#btn-logout').addEventListener('click', () => logout());
  $('#btn-refresh').addEventListener('click', () => render());

  /* ---------------- 启动 ---------------- */
  async function boot() {
    if (!state.token) return showLogin();
    try {
      const meta = await api('/api/admin/meta');
      state.resources = meta.resources;
      state.byKey = new Map(meta.resources.map((r) => [r.key, r]));
    } catch (e) {
      return showLogin();
    }
    showApp();
    renderNav();
    checkDb();
    if (!location.hash) location.hash = '#/overview';
    render();
  }

  async function checkDb() {
    const badge = $('#db-badge');
    try {
      const h = await fetch('/api/health').then((r) => r.json());
      if (h.code === 200) {
        badge.textContent = `MySQL ${h.data.mysql} · ${h.data.database}`;
        badge.classList.remove('bad');
      } else throw new Error('bad');
    } catch (e) {
      badge.textContent = 'MySQL 连接异常';
      badge.classList.add('bad');
    }
  }

  function renderNav() {
    const nav = $('#side-nav');
    const groups = GROUPS.map((g) => {
      const items = g.items.map((it) => {
        const key = typeof it === 'string' ? it : it.key;
        const label = typeof it === 'string' ? (state.byKey.get(it) ? state.byKey.get(it).label : it) : it.label;
        return { key, label };
      });
      return { label: g.label, items };
    });
    nav.innerHTML = groups.map((g) => `
      <div class="nav-group">${esc(g.label)}</div>
      ${g.items.map((it) => `
        <a class="nav-item" href="#/${it.key}" data-route="${it.key}">
          <span>${esc(it.label)}</span>
        </a>`).join('')}
    `).join('');
    markActive();
  }

  function markActive() {
    document.querySelectorAll('.nav-item').forEach((a) => {
      a.classList.toggle('active', a.dataset.route === state.route);
    });
  }

  window.addEventListener('hashchange', () => {
    const key = (location.hash || '').replace(/^#\//, '') || 'overview';
    if (key !== state.route) {
      state.route = key;
      state.page = 1;
      state.q = '';
      state.sort = '';
      render();
    }
  });

  async function render() {
    const key = state.route;
    markActive();
    if (key === 'overview') return renderOverview();
    const meta = state.byKey.get(key);
    if (!meta) { $('#content').innerHTML = '<div class="empty">未知页面</div>'; return; }
    return renderResource(meta);
  }

  /* ---------------- 概览 ---------------- */
  async function renderOverview() {
    $('#page-title').textContent = '概览';
    $('#page-sub').textContent = SUBTITLES.overview;
    $('#content').innerHTML = '<div class="empty">加载中…</div>';
    let s;
    try { s = await api('/api/admin/stats'); } catch (e) { $('#content').innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }

    const c = s.counts;
    const roleTotal = s.roleDist.reduce((a, b) => a + b.c, 0) || 1;
    const roleName = { student: '学生', teacher: '教师', parent: '家长', admin: '管理员' };
    const maxClass = Math.max(1, ...s.classRanking.map((x) => x.students));

    $('#content').innerHTML = `
      <div class="cards">
        ${card('学生', c.students, '含今日任务与错题数据')}
        ${card('教师', c.teachers, '班级 ADMIN 身份')}
        ${card('家长', c.parents, '已绑定孩子的家长账号')}
        ${card('班级', c.classes, '任务 ' + c.tasks + ' 个')}
        ${card('任务完成', c.completedTasks + ' / ' + c.studentTasks, '完成率 ' + (c.studentTasks ? Math.round(c.completedTasks / c.studentTasks * 1000) / 10 : 0) + '%')}
        ${card('错题', c.wrongQuestions, '待处理反馈 ' + c.feedbackNew)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h3>班级概览</h3><span class="muted">按学生数排序</span></div>
          <div class="panel-body">
            ${s.classRanking.length ? s.classRanking.map((x) => `
              <div class="bar-row" style="margin-bottom:10px">
                <span title="${esc(x.name)}" style="overflow:hidden;text-overflow:ellipsis">${esc(x.name)}</span>
                <span class="bar"><i style="width:${Math.round(x.students / maxClass * 100)}%"></i></span>
                <span style="text-align:right">${x.students} 人</span>
              </div>
              <div class="muted" style="margin:-6px 0 10px 90px">任务 ${x.tasks} 个 · 完成率 ${x.rate == null ? '—' : x.rate + '%'}</div>
            `).join('') : '<div class="empty">暂无班级</div>'}
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><h3>用户构成</h3></div>
          <div class="panel-body bars">
            ${s.roleDist.map((r) => `
              <div class="bar-row">
                <span>${roleName[r.role] || r.role}</span>
                <span class="bar"><i style="width:${Math.round(r.c / roleTotal * 100)}%"></i></span>
                <span style="text-align:right">${r.c}</span>
              </div>`).join('')}
            <div class="muted" style="margin-top:6px">学生任务：已完成 ${(s.taskDist.find((t) => t.status === 'completed') || { c: 0 }).c} · 未完成 ${(s.taskDist.find((t) => t.status === 'pending') || { c: 0 }).c}</div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h3>最近反馈</h3><a class="btn btn-sm btn-ghost" href="#/feedback">去处理</a></div>
          <div class="panel-body feed">
            ${s.recentFeedback.length ? s.recentFeedback.map((f) => `
              <div class="feed-item">
                <div>
                  <div class="t">${esc(f.content)}</div>
                  <div class="m">${esc(f.nickname || f.user_id)} · ${esc(f.type)} · ${esc(f.created_at)}</div>
                </div>
                <span class="badge ${f.status === 'new' ? 'amber' : 'gray'}">${statusText(f.status)}</span>
              </div>`).join('') : '<div class="empty">暂无反馈</div>'}
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><h3>金币榜</h3><span class="muted">学习金币余额</span></div>
          <div class="panel-body feed">
            ${s.coinTop.map((x) => `
              <div class="feed-item">
                <div class="t">${esc(x.user_id)}</div>
                <div class="m">金币 <b>${x.learning_coin}</b> · 银币 ${x.silver_coin}</div>
              </div>`).join('') || '<div class="empty">暂无数据</div>'}
          </div>
        </div>
      </div>
    `;
  }

  function card(k, v, s) {
    return `<div class="card"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`;
  }

  /* ---------------- 通用列表页 ---------------- */
  async function renderResource(meta) {
    $('#page-title').textContent = meta.label;
    $('#page-sub').textContent = SUBTITLES[meta.key] || '';
    const content = $('#content');
    content.innerHTML = `
      <div class="toolbar">
        <input class="search" id="search-input" placeholder="搜索 ${meta.search.map((c) => fieldLabel(meta, c)).join(' / ') || '…'}" value="${esc(state.q)}" />
        <span class="grow"></span>
        ${meta.key === 'coin_transactions' ? '<button class="btn btn-ghost" id="btn-adjust">手动调金币</button>' : ''}
        <button class="btn btn-primary" id="btn-create">+ 新增${esc(meta.label)}</button>
      </div>
      <div class="panel"><div class="table-wrap" id="table-wrap"><div class="empty">加载中…</div></div>
        <div class="pager" id="pager"></div>
      </div>`;

    $('#btn-create').addEventListener('click', () => openForm(meta, null));
    const adjust = $('#btn-adjust');
    if (adjust) adjust.addEventListener('click', openAdjust);
    let timer = null;
    $('#search-input').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; loadList(meta); }, 250);
    });
    await loadList(meta);
  }

  async function loadList(meta) {
    const wrap = $('#table-wrap');
    wrap.innerHTML = '<div class="empty">加载中…</div>';
    const params = new URLSearchParams({ page: state.page, pageSize: state.pageSize });
    if (state.q) params.set('q', state.q);
    if (state.sort) { params.set('sort', state.sort); params.set('order', state.order); }
    let data;
    try { data = await api(`/api/admin/list/${meta.key}?${params}`); }
    catch (e) { wrap.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
    state.listData = data;

    const cols = data.columns;
    if (!data.items.length) {
      wrap.innerHTML = '<div class="empty">暂无数据</div>';
      $('#pager').innerHTML = '';
      return;
    }
    wrap.innerHTML = `<table>
      <thead><tr>${cols.map((c) => `<th data-col="${c}">${esc(fieldLabel(meta, c))}${state.sort === c ? (state.order === 'asc' ? ' ↑' : ' ↓') : ''}</th>`).join('')}<th style="width:120px">操作</th></tr></thead>
      <tbody>${data.items.map((row) => `
        <tr>
          ${cols.map((c) => `<td class="${typeof row[c] === 'number' ? 'num' : ''}" title="${esc(row[c])}">${cellHtml(c, row[c], meta.key)}</td>`).join('')}
          <td><div class="row-actions">
            <button class="btn btn-sm btn-ghost" data-edit="${esc(pkOf(meta, row))}">编辑</button>
            <button class="btn btn-sm btn-danger" data-del="${esc(pkOf(meta, row))}">删除</button>
          </div></td>
        </tr>`).join('')}</tbody>
    </table>`;

    wrap.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
      const row = data.items.find((r) => String(pkOf(meta, r)) === b.dataset.edit);
      openForm(meta, row);
    }));
    wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm(`确定删除这条${meta.label}记录？此操作不可撤销。`)) return;
      try {
        await api(`/api/admin/one/${meta.key}/${encodeURIComponent(b.dataset.del)}`, { method: 'DELETE' });
        toast('已删除');
        loadList(meta);
      } catch (e) { toast(e.message, true); }
    }));
    wrap.querySelectorAll('th[data-col]').forEach((th) => th.addEventListener('click', () => {
      const c = th.dataset.col;
      if (state.sort === c) state.order = state.order === 'asc' ? 'desc' : 'asc';
      else { state.sort = c; state.order = 'desc'; }
      loadList(meta);
    }));

    renderPager(meta, data);
  }

  function renderPager(meta, data) {
    const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
    $('#pager').innerHTML = `
      <span class="muted">共 ${data.total} 条 · 第 ${data.page} / ${totalPages} 页</span>
      <span class="pages">
        <button class="btn btn-sm btn-ghost" id="prev-page" ${data.page <= 1 ? 'disabled' : ''}>上一页</button>
        <button class="btn btn-sm btn-ghost" id="next-page" ${data.page >= totalPages ? 'disabled' : ''}>下一页</button>
      </span>`;
    $('#prev-page').addEventListener('click', () => { state.page--; loadList(meta); });
    $('#next-page').addEventListener('click', () => { state.page++; loadList(meta); });
  }

  function pkOf(meta, row) {
    if (meta.pk in row) return row[meta.pk];
    return row.id;
  }

  function fieldLabel(meta, col) {
    const f = meta.fields.find((x) => x.name === col);
    return f ? f.label : col;
  }

  const STATUS_TEXT = {
    active: '进行中', ended: '已结束', pending: '待完成', completed: '已完成',
    review: '待复习', mastered: '已掌握', processing: '识别中', success: '成功', failed: '失败',
    new: '未读', read: '已读', replied: '已回复', closed: '已关闭',
    ACTIVE: '正常', DISSOLVED: '已解散', LEFT: '已退出', ADMIN: '管理员', MEMBER: '成员',
    paid: '已支付', cancelled: '已取消', earn: '获得', penalty: '扣除', redeem: '兑换', recharge: '充值',
    student: '学生', teacher: '教师', parent: '家长', admin: '管理员',
    camera: '拍照', document: '文档', disabled: '已停用', self_register: '自助注册',
    choice: '选择题', fill: '填空题', application: '应用题', proof: '证明题',
    free: '自由描述', theme: '主题皮肤', report: '周报', title: '头衔', virtual: '虚拟权益'
  };
  const statusText = (v) => STATUS_TEXT[v] || v;

  function cellHtml(col, v, resKey) {
    if (v === null || v === undefined || v === '') return '<span class="muted">—</span>';
    if (resKey === 'users' && col === 'status') {
      return v === 'active' ? '<span class="badge">正常</span>' : '<span class="badge red">已停用</span>';
    }
    if (col === 'status' || col === 'role' || col === 'type' || col === 'ai_status' || col === 'product_type' || col === 'source') {
      const tone = v === 'failed' || v === 'disabled' || v === 'cancelled' ? 'red'
        : v === 'new' || v === 'pending' || v === 'processing' ? 'amber'
        : v === 'completed' || v === 'mastered' || v === 'paid' || v === 'success' ? 'blue' : '';
      return `<span class="badge ${tone}">${esc(statusText(v))}</span>`;
    }
    if (col === 'enabled' || col === 'completed' || col === 'need_review' || col === 'is_primary' || col === 'due') {
      return v ? '<span class="badge">是</span>' : '<span class="badge gray">否</span>';
    }
    if (typeof v === 'string' && v.length > 60) return esc(v.slice(0, 60)) + '…';
    return esc(v);
  }

  /* ---------------- 表单弹窗 ---------------- */
  function openForm(meta, row) {
    state.editing = { meta, row };
    state.modalMode = 'form';
    const isEdit = !!row;
    $('#modal-title').textContent = (isEdit ? '编辑' : '新增') + meta.label;
    const form = $('#modal-form');
    const fields = meta.fields.filter((f) => !f.hidden);

    form.innerHTML = fields.map((f) => {
      const val = row ? row[f.name] : '';
      const full = f.type === 'textarea' ? ' full' : '';
      const disabled = isEdit && f.onlyCreate ? ' disabled' : '';
      if (f.type === 'select') {
        return `<label class="field${full}">${esc(f.label)}
          <select name="${f.name}">
            <option value="">（空）</option>
            ${f.options.map((o) => `<option value="${esc(o)}" ${String(val) === String(o) ? 'selected' : ''}>${esc(statusText(o))}</option>`).join('')}
          </select></label>`;
      }
      if (f.type === 'textarea') {
        return `<label class="field${full}">${esc(f.label)}<textarea name="${f.name}"${disabled}>${esc(val)}</textarea></label>`;
      }
      const type = f.type === 'number' ? 'number' : f.type === 'password' ? 'password' : f.type === 'date' ? 'date' : 'text';
      return `<label class="field${full}">${esc(f.label)}<input type="${type}" name="${f.name}" value="${esc(val)}"${disabled} /></label>`;
    }).join('');

    $('#modal').classList.remove('hidden');
    if (!isEdit) {
      const first = form.querySelector('input,select,textarea');
      if (first) first.focus();
    }
  }

  function closeModal() {
    $('#modal').classList.add('hidden');
    state.editing = null;
    state.modalMode = 'form';
  }

  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-cancel').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  // 弹窗保存：按模式分发（form = 资源表单，adjust = 手动调金币）
  $('#modal-save').addEventListener('click', async () => {
    if (state.modalMode === 'adjust') return saveAdjust();
    if (!state.editing) return;
    const { meta, row } = state.editing;
    const body = {};
    $('#modal-form').querySelectorAll('[name]').forEach((input) => {
      if (input.disabled) return;
      body[input.name] = input.value;
    });
    try {
      if (row) {
        await api(`/api/admin/one/${meta.key}/${encodeURIComponent(pkOf(meta, row))}`, { method: 'PATCH', body });
        toast('已保存');
      } else {
        await api(`/api/admin/list/${meta.key}`, { method: 'POST', body });
        toast('已新增');
      }
      closeModal();
      loadList(meta);
    } catch (e) { toast(e.message, true); }
  });

  /* ---------------- 手动调金币 ---------------- */
  function openAdjust() {
    state.editing = null;
    state.modalMode = 'adjust';
    $('#modal-title').textContent = '手动调整学习金币';
    $('#modal-form').innerHTML = `
      <label class="field">学生账号<input name="account" placeholder="如 student01" /></label>
      <label class="field">变动值（正数发放 / 负数扣除）<input name="delta" type="number" value="10" /></label>
      <label class="field full">说明<input name="description" value="管理员调整" /></label>`;
    $('#modal').classList.remove('hidden');
    const first = $('#modal-form').querySelector('input');
    if (first) first.focus();
  }

  async function saveAdjust() {
    const fd = new FormData($('#modal-form'));
    try {
      const data = await api('/api/admin/coins/adjust', {
        method: 'POST',
        body: { account: fd.get('account'), delta: Number(fd.get('delta')), description: fd.get('description') }
      });
      toast(`已调整，${data.account} 当前金币 ${data.balance}`);
      closeModal();
      if (state.route === 'coin_transactions') loadList(state.byKey.get('coin_transactions'));
    } catch (e) { toast(e.message, true); }
  }

  /* ---------------- 启动 ---------------- */
  boot();
})();
