const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const IDE = '/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide'
const PROJECT = '/Users/macmini/dev/ruilai/04_代码/miniprogram/dist/dev/mp-weixin'
const CLIENT = 'cursor'
const SKILL = '0.3.9'
const USER = 'agent_hd'
const PASS = 'demo'
const OUT = '/tmp/ruilai-mp-login'
const CLICK = path.join(__dirname, 'click-privacy-mac.py')
const LOGIN_ARGS = path.join(__dirname, 'wx-login-args.json')

fs.mkdirSync(OUT, { recursive: true })

function parseJson(out) {
  const start = out.indexOf('{')
  const end = out.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(out.slice(start, end + 1)) } catch { return null }
}

function ide(tool, extra = []) {
  const args = ['-c', CLIENT, tool, ...extra]
  if (tool !== 'check_wechatide_status' && tool !== 'polling_task_result') {
    if (!args.includes('--project')) args.push('--project', PROJECT)
  }
  const r = spawnSync(IDE, args, { encoding: 'utf8', timeout: 25000 })
  const out = (r.stdout || '') + (r.stderr || '')
  const json = parseJson(out)
  if (!json) console.log('RAW', tool, out.slice(0, 400).replace(/\s+/g, ' '))
  else console.log('OK', tool, json.status || json.message || json.result?.path || '')
  return { out, json, code: r.status }
}

function sleep(ms) {
  spawnSync('sleep', [String(ms / 1000)])
}

function pageInfo() {
  const { json } = ide('automation_runtime_info', ['--action', 'currentPage'])
  const cur = json?.result?.currentPage || json?.currentPage || {}
  return { path: cur.path || cur.route || '', query: cur.query || {}, raw: cur }
}

function page() {
  return pageInfo().path.replace(/^\//, '')
}

function shot(name) {
  const p = path.join(OUT, `${name}.png`)
  ide('simulator_screenshot', ['--path', p, '--optimize', 'false'])
  return p
}

function tap(sel) {
  return ide('automation_element_action', ['--selector', sel, '--action', 'tap', '--wait-for-selector', sel])
}

function input(sel, value) {
  return ide('automation_element_action', [
    '--selector', sel, '--action', 'input', '--value', value, '--wait-for-selector', sel,
  ])
}

function nav(action, url) {
  const extra = ['--action', action]
  if (url) extra.push('--url', url)
  extra.push('--wait', '2')
  return ide('automation_navigate', extra)
}

function dismissNative() {
  const p = shot('_native')
  const r = spawnSync('python3', [CLICK, p], { encoding: 'utf8', timeout: 20000 })
  const out = (r.stdout || '') + (r.stderr || '')
  if (out.includes('clicked')) {
    console.log('NATIVE', out.trim().replace(/\s+/g, ' '))
    sleep(800)
    return true
  }
  console.log('NATIVE', out.trim().replace(/\s+/g, ' ').slice(0, 200))
  return false
}

function waitPage(pred, ms = 8000) {
  const t0 = Date.now()
  let last = pageInfo()
  while (Date.now() - t0 < ms) {
    last = pageInfo()
    const p = (last.path || '').replace(/^\//, '')
    if (typeof pred === 'string' ? p.includes(pred) : pred(p, last)) return last
    sleep(400)
  }
  return last
}

function pollAuth(taskId) {
  for (let i = 0; i < 10; i++) {
    const { json } = ide('polling_task_result', ['--task-id', taskId])
    const status = json?.result?.status || json?.status
    console.log('auth poll', i, status)
    if (status === 'success') return true
    if (status && status !== 'pending') return false
    sleep(10000)
  }
  return false
}

function main() {
  console.log('== check status ==')
  const st = ide('check_wechatide_status', ['--skill-version', SKILL])
  console.log(JSON.stringify(st.json, null, 2)?.slice(0, 800))
  const pending = st.json?.result
  if (pending?.status === 'pending' && pending?.taskId) {
    console.log('Waiting for DevTools to authorize client cursor. Please click 允许 in the IDE.')
    if (!pollAuth(pending.taskId)) {
      console.log('AUTH_PENDING')
      process.exit(2)
    }
  }

  console.log('== project list / open ==')
  ide('project_list')
  ide('project_import')
  ide('open_project_window', ['--window-mode', 'fullMode'])
  sleep(3000)

  console.log('== current page ==')
  let p = page()
  console.log('page', p)
  shot('00-before')
  dismissNative()

  if (!p.includes('login')) {
    nav('reLaunch', '/pages/login/index')
    sleep(1500)
    dismissNative()
    p = page()
  }
  if (!p.includes('login')) {
    nav('switchTab', '/pages/mine/index')
    sleep(800)
    dismissNative()
    nav('navigateTo', '/pkg/mine-profile/index')
    sleep(1000)
    dismissNative()
    tap('.out')
    sleep(1500)
    nav('reLaunch', '/pages/login/index')
    sleep(1500)
    dismissNative()
  }

  console.log('== fill login agent_hd / demo ==')
  shot('01-login')
  ide('automation_page_action', ['--action', 'querySelectorAll', '--selector', 'input'])
  input('input[placeholder="代理 ID / 账号"]', USER)
  input('input[placeholder="请输入密码"]', PASS)
  tap('.cbx')
  tap('.submit')
  sleep(2500)
  dismissNative()

  let info = waitPage((pp) => !pp.includes('login'), 8000)
  p = (info.path || '').replace(/^\//, '')
  if (p.includes('login')) {
    console.log('UI login still on login page, probe network then wx.request fallback check')
    ide('get_simulator_network', ['--command', 'grep ruilai'])
  }
  if (p.includes('login')) {
    nav('switchTab', '/pages/home/index')
    sleep(1000)
    dismissNative()
    p = page()
  }

  if (p.includes('login')) {
    console.log('== wx.request login probe (does not write uni storage) ==')
    ide('automation_wx_api', ['--action', 'call', '--method', 'request', '--args-file', LOGIN_ARGS])
  }

  shot('02-after')
  p = page()
  console.log('FINAL_PAGE', p)
  ide('get_simulator_network', ['--command', 'grep ruilai-api'])
  ide('get_simulator_console', ['--command', 'grep -i error'])
  if (!p.includes('login') && (p.includes('home') || p.includes('pages/'))) {
    console.log('LOGIN_OK', p)
    process.exit(0)
  }
  console.log('LOGIN_FAIL', p)
  process.exit(1)
}

main()
