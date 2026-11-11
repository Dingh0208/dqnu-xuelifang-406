// 验证小程序 H5 端已经真实连上后端：登录 → 首页 → 断网式证据（请求域名 + MySQL 直改后页面变化）
import fs from 'node:fs'
import path from 'node:path'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(import.meta.dirname, '..', '.env') })

const PORT = 9336
const APP = 'http://127.0.0.1:5192'
const API = 'http://127.0.0.1:3100'
const OUT = process.argv[2] || '.'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))


// ---------- 验证用「标记数据」：只改数据库，页面能显示出来才算真连上了 ----------
async function db() {
  return mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, charset: 'utf8mb4'
  })
}

let fixtureId = null
let fixtureTitle = null

// 挑一个「未完成」的任务改写标题：首页只展示未完成任务，改已完成的任务看不到效果
async function applyFixture() {
  const c = await db()
  const [rows] = await c.execute("SELECT id, title FROM daily_tasks WHERE user_id = 'student01' AND completed = 0 ORDER BY id LIMIT 1")
  if (rows.length) {
    fixtureId = rows[0].id
    fixtureTitle = rows[0].title
    await c.execute('UPDATE daily_tasks SET title = ? WHERE id = ?', ['【MySQL】' + fixtureTitle, fixtureId])
  }
  await c.execute("UPDATE users SET nickname = ? WHERE account = 'student01'", ['后端小明'])
  await c.end()
}

async function restoreFixture() {
  const c = await db()
  if (fixtureId) await c.execute('UPDATE daily_tasks SET title = ? WHERE id = ?', [fixtureTitle, fixtureId])
  await c.execute("UPDATE users SET nickname = ? WHERE account = 'student01'", ['小明同学'])
  await c.end()
}
const results = []
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`) }

async function newTarget(url) {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  return res.json()
}

class CDP {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    this.events = []
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
      } else if (msg.method) {
        this.events.push(msg)
      }
    })
  }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true })
      ws.addEventListener('error', reject, { once: true })
    })
    return new CDP(ws)
  }
  send(method, params = {}) {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }))
  }
  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || ''))
    return r.result.value
  }
  apiCalls() {
    return this.events
      .filter((e) => e.method === 'Network.requestWillBeSent')
      .map((e) => e.params.request.url)
      .filter((u) => u.startsWith(API + '/api/'))
  }
}

async function waitFor(cdp, expression, timeout = 25000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try { if (await cdp.evaluate(expression)) return true } catch (e) {}
    await sleep(300)
  }
  throw new Error('timeout waiting for: ' + expression)
}

async function login(account, expectHash, file) {
  const target = await newTarget(`${APP}/#/pages/auth/login`)
  const cdp = await CDP.connect(target.webSocketDebuggerUrl)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })

  await waitFor(cdp, `document.readyState === 'complete' && document.querySelectorAll('input').length >= 2`)
  // 清掉上一次运行留下的本地缓存（taskState 会按天缓存任务标题，不清会读到旧标题）
  await cdp.evaluate('localStorage.clear()')
  await cdp.send('Page.reload', { ignoreCache: true })
  await sleep(1200)
  await waitFor(cdp, `document.readyState === 'complete' && document.querySelectorAll('input').length >= 2`)
  await cdp.evaluate(`(() => {
    const setVal = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const inputs = [...document.querySelectorAll('input')]
    setVal(inputs[0], ${JSON.stringify(account)})
    setVal(inputs[1], '123456')
  })()`)
  await sleep(300)
  await cdp.evaluate(`(() => {
    const btn = document.querySelector('.submit-btn')
    if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    return !!btn
  })()`)

  await waitFor(cdp, `location.hash.indexOf(${JSON.stringify(expectHash)}) >= 0`)
  await sleep(2500)

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.writeFileSync(path.join(OUT, file), Buffer.from(shot.data, 'base64'))

  const text = await cdp.evaluate('document.body.innerText')
  const calls = cdp.apiCalls()
  return { cdp, target, text, calls }
}

async function main() {
  await applyFixture()
  // 1. 学生端
  const stu = await login('student01', '/pages/index/index', 'shot-real-student-home.png')
  check('学生登录跳转首页', stu.text.includes('今日') || stu.text.includes('任务'))
  check('登录请求打到 3100 后端', stu.calls.some((u) => u.includes('/api/auth/login')), stu.calls[0] || '无')
  check('首页聚合请求打到后端', stu.calls.some((u) => u.includes('/api/student/home/today')), stu.calls.filter((u) => u.includes('home/today'))[0] || '无')
  check('首页出现 MySQL 里改过的任务标题', stu.text.includes('【MySQL】'), stu.text.slice(0, 60).replace(/\\n/g, ' '))

  // 2. 我的页：昵称来自数据库
  await stu.cdp.evaluate(`location.hash = '#/pages/profile/index'`)
  await sleep(2000)
  const profileText = await stu.cdp.evaluate('document.body.innerText')
  check('「我的」显示后端昵称', profileText.includes('后端小明'), profileText.slice(0, 40).replace(/\n/g, ' '))
  const shot2 = await stu.cdp.send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(OUT, 'shot-real-profile.png'), Buffer.from(shot2.data, 'base64'))
  await fetch(`http://127.0.0.1:${PORT}/json/close/${stu.target.id}`)

  // 3. 教师端
  const tea = await login('teacher01', '/pages/teacher/home', 'shot-real-teacher-home.png')
  check('教师首页请求打到后端', tea.calls.some((u) => u.includes('/api/teacher/home')), tea.calls.filter((u) => u.includes('teacher'))[0] || '无')
  check('教师首页读到班级名', tea.text.includes('高一（3）班'))
  await fetch(`http://127.0.0.1:${PORT}/json/close/${tea.target.id}`)

  // 4. 家长端
  const par = await login('parent01', '/pages/parent/home', 'shot-real-parent-home.png')
  check('家长首页请求打到后端', par.calls.some((u) => u.includes('/api/parent/home')), par.calls.filter((u) => u.includes('parent'))[0] || '无')
  check('家长首页读到孩子档案', par.text.includes('哥哥') && par.text.includes('初三'))
  await fetch(`http://127.0.0.1:${PORT}/json/close/${par.target.id}`)

  await restoreFixture()
  const failed = results.filter((r) => !r.ok)
  console.log(`\n结果: ${results.length - failed.length} 通过 / ${failed.length} 失败`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => { console.error('ERR', e); process.exit(2) })
