// 管理台 UI 端到端检查：登录 → 打开用户页 → 编辑第一条 → 保存 → 通过接口核对 → 还原
import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9334
const BASE = 'http://127.0.0.1:3100'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const userDataDir = path.join(os.tmpdir(), 'xlf-ui-' + Date.now())

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDataDir}`, '--window-size=1440,940', 'about:blank'], { stdio: 'ignore' })

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) } }) }
  static async connect(url) { const ws = new WebSocket(url); await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }) }); return new CDP(ws) }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject })) }
  async evaluate(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value }
}

const results = []
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`) }

async function main() {
  let target
  for (let i = 0; i < 40; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) { target = list[0]; break } } catch (e) {}
    await sleep(250)
  }
  const cdp = await CDP.connect(target.webSocketDebuggerUrl)
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
  await cdp.send('Page.navigate', { url: BASE + '/admin/' })
  await sleep(1200)

  const logged = await cdp.evaluate(`(async () => {
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: 'admin', password: 'admin123' }) })
    const b = await r.json()
    localStorage.setItem('xlf_admin_token', b.data.token)
    localStorage.setItem('xlf_admin_info', JSON.stringify(b.data.admin))
    return b.code
  })()`)
  check('管理员登录接口', logged === 200)

  await cdp.send('Page.reload', { ignoreCache: true })
  await sleep(1400)
  await cdp.evaluate(`location.hash = '#/users'`)
  await sleep(1200)

  const rows = await cdp.evaluate(`document.querySelectorAll('tbody tr').length`)
  check('用户列表渲染', rows === 9, `行数=${rows}`)

  // 编辑 teacher02 的昵称
  const before = await cdp.evaluate(`(async () => {
    const r = await fetch('/api/admin/list/users?q=teacher02', { headers: { Authorization: 'Bearer ' + localStorage.getItem('xlf_admin_token') } })
    return (await r.json()).data.items[0].nickname
  })()`)
  await cdp.evaluate(`(() => {
    const row = [...document.querySelectorAll('tbody tr')].find((tr) => tr.innerText.includes('teacher02'))
    row.querySelector('[data-edit]').click()
  })()`)
  await sleep(500)
  await cdp.evaluate(`(() => {
    const input = document.querySelector('#modal-form [name=nickname]')
    input.value = '李老师·UI测试'
    document.querySelector('#modal-save').click()
  })()`)
  await sleep(1200)
  const after = await cdp.evaluate(`(async () => {
    const r = await fetch('/api/admin/list/users?q=teacher02', { headers: { Authorization: 'Bearer ' + localStorage.getItem('xlf_admin_token') } })
    return (await r.json()).data.items[0].nickname
  })()`)
  check('弹窗保存写入数据库', after === '李老师·UI测试', `${before} → ${after}`)

  const toastText = await cdp.evaluate(`document.querySelector('#toast').textContent`)
  check('保存后出现提示', toastText.includes('已保存'), toastText)

  // 还原
  await cdp.evaluate(`(async () => {
    const token = localStorage.getItem('xlf_admin_token')
    const list = await (await fetch('/api/admin/list/users?q=teacher02', { headers: { Authorization: 'Bearer ' + token } })).json()
    const id = list.data.items[0].id
    await fetch('/api/admin/one/users/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ nickname: '李老师' }) })
  })()`)
  const restored = await cdp.evaluate(`(async () => {
    const r = await fetch('/api/admin/list/users?q=teacher02', { headers: { Authorization: 'Bearer ' + localStorage.getItem('xlf_admin_token') } })
    return (await r.json()).data.items[0].nickname
  })()`)
  check('还原昵称', restored === '李老师', restored)

  // 搜索
  await cdp.evaluate(`(() => { const el = document.querySelector('#search-input'); el.value = 'student01'; el.dispatchEvent(new Event('input')) })()`)
  await sleep(900)
  const searched = await cdp.evaluate(`document.querySelectorAll('tbody tr').length`)
  check('搜索过滤', searched === 1, `行数=${searched}`)

  // 分页信息
  const pager = await cdp.evaluate(`document.querySelector('#pager').innerText`)
  check('分页信息', /共 \d+ 条/.test(pager), pager.replace(/\n/g, ' '))

  const failed = results.filter((r) => !r.ok)
  console.log(`\nUI 检查: ${results.length - failed.length} 通过 / ${failed.length} 失败`)
  chrome.kill()
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => { console.error('ERR', e); chrome.kill(); process.exit(2) })
