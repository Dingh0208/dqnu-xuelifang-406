// 用 Chrome DevTools Protocol 打开后台管理台并截图（Node 24 自带 WebSocket）
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333
const BASE = 'http://127.0.0.1:3100'
const OUT = process.argv[2] || '.'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const userDataDir = path.join(process.env.TEMP || '.', 'xlf-shot-' + Date.now())
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDataDir}`,
  '--window-size=1440,940', 'about:blank'
], { stdio: 'ignore' })

class CDP {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
      }
    })
  }
  static async connect(url) {
    const ws = new WebSocket(url)
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
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400))
    return r.result.value
  }
  async shot(file) {
    const r = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await fsp.writeFile(file, Buffer.from(r.data, 'base64'))
  }
}

async function main() {
  let target
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const list = await res.json()
      if (list.length) { target = list[0]; break }
    } catch (e) { /* not ready */ }
    await sleep(250)
  }
  if (!target) throw new Error('Chrome 调试端口未就绪')
  const cdp = await CDP.connect(target.webSocketDebuggerUrl)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 940, deviceScaleFactor: 1, mobile: false })

  const files = []
  const shot = async (name) => {
    const file = path.join(OUT, name)
    await cdp.shot(file)
    files.push(file)
  }

  // 1. 登录页
  await cdp.send('Page.navigate', { url: BASE + '/admin/' })
  await sleep(1200)
  await shot('shot-admin-login.png')

  // 2. 用真实接口登录后写入 token，再刷新
  const login = await cdp.evaluate(`(async () => {
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: 'admin', password: 'admin123' }) })
    const body = await r.json()
    if (body.code !== 200) throw new Error(body.message)
    localStorage.setItem('xlf_admin_token', body.data.token)
    localStorage.setItem('xlf_admin_info', JSON.stringify(body.data.admin))
    return body.data.admin.nickname
  })()`)
  console.log('已登录:', login)

  await cdp.send('Page.reload', { ignoreCache: true })
  await sleep(1500)
  await cdp.evaluate(`location.hash = '#/overview'`)
  await sleep(1500)
  await shot('shot-admin-overview.png')

  // 3. 用户列表
  await cdp.evaluate(`location.hash = '#/users'`)
  await sleep(1200)
  await shot('shot-admin-users.png')

  // 4. 班级任务
  await cdp.evaluate(`location.hash = '#/tasks'`)
  await sleep(1200)
  await shot('shot-admin-tasks.png')

  // 5. 错题本
  await cdp.evaluate(`location.hash = '#/wrong_questions'`)
  await sleep(1200)
  await shot('shot-admin-wrong.png')

  // 6. 编辑弹窗（第一行）
  await cdp.evaluate(`document.querySelector('[data-edit]')?.click()`)
  await sleep(700)
  await shot('shot-admin-modal.png')

  // 7. 收集控制台错误
  const errors = await cdp.evaluate(`window.__errs || []`)
  console.log('页面错误:', JSON.stringify(errors))
  console.log('截图:', files.join('\n'))
  chrome.kill()
  process.exit(0)
}

main().catch((e) => { console.error('ERR', e); chrome.kill(); process.exit(1) })
