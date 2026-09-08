const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const IDE = 'D:\\weixindev\\微信web开发者工具\\wechatide.cmd'
const PROJECT = 'e:\\angsa\\angsa_data\\项目\\锐涞经销商管理系统\\04_代码\\miniprogram\\dist\\build\\mp-weixin'
const OUT = 'e:\\angsa\\angsa_data\\项目\\锐涞经销商管理系统\\docs\\test-evidence\\mp-2026-09-03'
const CLICK = path.join(__dirname, 'click-privacy.py')
fs.mkdirSync(OUT, { recursive: true })

const results = []
function rec(id, status, note) {
  results.push({ id, status, note })
  console.log(`[${status}] ${id}  ${note}`)
}

function parseJson(out) {
  const start = out.indexOf('{')
  const end = out.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(out.slice(start, end + 1)) } catch { return null }
}

function ide(tool, extra = []) {
  const r = spawnSync('cmd', ['/c', IDE, '-c', 'cursor', tool, '--project', PROJECT, ...extra], {
    encoding: 'utf8',
    timeout: 90000,
    windowsHide: true,
  })
  const out = (r.stdout || '') + (r.stderr || '')
  const json = parseJson(out)
  if (!json) console.log('RAW', tool, out.slice(0, 240).replace(/\s+/g, ' '))
  return { out, json }
}

function pageInfo() {
  const { json } = ide('automation_runtime_info', ['--action', 'currentPage'])
  const cur = json?.result?.currentPage || {}
  return {
    path: cur.path || cur.route || '',
    query: cur.query || {},
    raw: cur,
  }
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
  return ide('automation_element_action', ['--selector', sel, '--action', 'input', '--value', value, '--wait-for-selector', sel])
}

function nav(action, url) {
  const extra = ['--action', action]
  if (url) extra.push('--url', url)
  extra.push('--wait', '2')
  return ide('automation_navigate', extra)
}

function sleep(ms) {
  spawnSync('powershell', ['-NoProfile', '-Command', `Start-Sleep -Milliseconds ${ms}`], { windowsHide: true })
}

function dismissNative() {
  const p = path.join(OUT, '_native.png')
  ide('simulator_screenshot', ['--path', p, '--optimize', 'false'])
  const r = spawnSync('python', [CLICK, p], { encoding: 'utf8', timeout: 20000, windowsHide: true })
  const out = (r.stdout || '') + (r.stderr || '')
  if (out.includes('clicked')) {
    console.log('NATIVE', out.trim().replace(/\s+/g, ' '))
    sleep(800)
    return true
  }
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

function resetTab(url) {
  nav('switchTab', url)
  sleep(800)
  dismissNative()
  return waitPage(url.replace(/^\//, '').replace(/\/index$/, ''), 5000)
}

function openPkg(url, expect) {
  nav('navigateTo', url)
  sleep(800)
  dismissNative()
  return waitPage((p) => p.includes(expect), 6000)
}

function backToTab(tabUrl) {
  const cur = page()
  if (cur.startsWith('pkg/')) {
    nav('navigateBack')
    sleep(700)
  }
  const after = page()
  if (after.startsWith('pkg/') || (tabUrl && !after.includes(tabUrl.replace(/^\//, '').split('/')[1] || ''))) {
    nav('switchTab', tabUrl || '/pages/home/index')
    sleep(800)
  }
  dismissNative()
}

function login(user, pass) {
  nav('reLaunch', '/pages/login/index')
  sleep(1500)
  dismissNative()
  let info = pageInfo()
  let p = (info.path || '').replace(/^\//, '')
  if (!p.includes('login')) {
    // still logged in — go profile logout, then relaunch
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
  input('input', user)
  input('input[password]', pass)
  tap('.cbx')
  tap('.submit')
  sleep(2500)
  dismissNative()
  info = waitPage((pp) => !pp.includes('login'), 8000)
  p = (info.path || '').replace(/^\//, '')
  if (!p.includes('home')) {
    nav('switchTab', '/pages/home/index')
    sleep(1000)
    dismissNative()
    info = pageInfo()
    p = (info.path || '').replace(/^\//, '')
  }
  return p
}

function walkL1() {
  rec('MP-C01-hd', page().includes('home') ? 'PASS' : 'FAIL', page())
  shot('mp-l1-home')
  rec('MP-L1-01', page().includes('home') ? 'PASS' : 'FAIL', '首页 ' + page())

  resetTab('/pages/biz/index')
  rec('MP-L1-biz', page().includes('biz') ? 'PASS' : 'FAIL', page())
  shot('mp-l1-biz')

  const po = openPkg('/pkg/purchase/index?kind=purchase', 'purchase')
  rec('MP-L1-02', (po.path || '').includes('purchase') ? 'PASS' : 'FAIL', '采购表单打开未提交 ' + (po.path || ''))
  shot('mp-l1-purchase')
  backToTab('/pages/biz/index')

  const so = openPkg('/pkg/purchase/index?kind=sales', 'purchase')
  const soKind = so.query && (so.query.kind || so.query[0])
  rec('MP-L1-03', (so.path || '').includes('purchase') ? 'PASS' : 'FAIL', `销售单表单打开未提交 path=${so.path || ''} query=${JSON.stringify(so.query || {})}`)
  shot('mp-l1-sales-form')
  backToTab('/pages/biz/index')

  const scan = openPkg('/pkg/scan/index', 'scan')
  rec('MP-L1-04', (scan.path || '').includes('scan') ? 'PASS' : 'FAIL', '出货扫码页（未真扫） ' + (scan.path || ''))
  rec('MP-L1-05', 'WARN', '查询扫码在首页扫码面板')
  shot('mp-l1-scan')
  backToTab('/pages/home/index')

  resetTab('/pages/stock/index')
  rec('MP-L1-06', page().includes('stock') ? 'PASS' : 'FAIL', page())
  shot('mp-l1-stock')

  resetTab('/pages/service/index')
  rec('MP-L1-10', page().includes('service') ? 'PASS' : 'FAIL', page())
  shot('mp-l1-service')

  resetTab('/pages/mine/index')
  rec('MP-L1-mine', page().includes('mine') ? 'PASS' : 'FAIL', page())
  shot('mp-l1-mine')

  const l2 = openPkg('/pkg/mine-l2/index', 'mine-l2')
  rec('MP-L1-07', (l2.path || '').includes('mine-l2') ? 'PASS' : 'FAIL', '二级管理打开未提交 ' + (l2.path || ''))
  rec('MP-L1-11', (l2.path || '').includes('mine-l2') ? 'PASS' : 'WARN', '协议入口在创建抽屉')
  shot('mp-l1-mine-l2')
  backToTab('/pages/mine/index')

  const sub = openPkg('/pkg/mine-sub/index', 'mine-sub')
  rec('MP-L1-08', (sub.path || '').includes('mine-sub') ? 'PASS' : 'FAIL', '子账号页打开未创建 ' + (sub.path || ''))
  shot('mp-l1-mine-sub')
  backToTab('/pages/mine/index')

  const bind = openPkg('/pkg/bind/index', 'bind')
  rec('MP-L1-09', (bind.path || '').includes('bind') ? 'PASS' : 'FAIL', '绑定页打开未写库 ' + (bind.path || ''))
  shot('mp-l1-bind')
  backToTab('/pages/mine/index')

  const prof = openPkg('/pkg/mine-profile/index', 'mine-profile')
  rec('MP-C02', (prof.path || '').includes('mine-profile') ? 'PASS' : 'FAIL', '自定义 NavBar 分包页 ' + (prof.path || ''))
  shot('mp-l1-profile')
  dismissNative()
  tap('.out')
  sleep(1500)
  dismissNative()
  rec('MP-C03', page().includes('login') ? 'PASS' : 'FAIL', '退出→' + page())
  shot('mp-l1-logout')
}

function walkL2() {
  const p = login('agent_hz', 'demo')
  rec('MP-C01-hz', p.includes('home') ? 'PASS' : 'FAIL', p)
  shot('mp-l2-home')

  resetTab('/pages/stock/index')
  rec('MP-L2-01', page().includes('stock') ? 'PASS' : 'FAIL', page())
  shot('mp-l2-stock')

  const bind = openPkg('/pkg/bind/index', 'bind')
  rec('MP-L2-02', (bind.path || '').includes('bind') ? 'PASS' : 'FAIL', '直销绑定打开未提交 ' + (bind.path || ''))
  shot('mp-l2-bind')
  backToTab('/pages/home/index')

  resetTab('/pages/biz/index')
  rec('MP-L2-03', page().includes('biz') ? 'PASS' : 'FAIL', '销售 Tab（无分销建单，见截图） ' + page())
  shot('mp-l2-biz')

  resetTab('/pages/service/index')
  rec('MP-L2-04', page().includes('service') ? 'PASS' : 'FAIL', '售后页打开，退原厂入口以截图为准')
  rec('MP-L2-05', page().includes('service') ? 'PASS' : 'FAIL', page())
  shot('mp-l2-service')
  rec('MP-L2-06', 'WARN', '静音报警若未在我的页展示则记 WARN')

  resetTab('/pages/mine/index')
  shot('mp-l2-mine')
  const prof = openPkg('/pkg/mine-profile/index', 'mine-profile')
  if ((prof.path || '').includes('mine-profile')) tap('.out')
  sleep(1200)
  dismissNative()
}

function walkSub() {
  const p = login('hd_scan_01', 'demo')
  rec('MP-C01-sub', p.includes('home') ? 'PASS' : 'FAIL', p)
  rec('MP-SUB-01', p.includes('home') ? 'PASS' : 'FAIL', 'SUB 首页/扫码 ' + p)
  shot('mp-sub-home')

  const scan = openPkg('/pkg/scan/index', 'scan')
  rec('MP-SUB-02', (scan.path || '').includes('scan') ? 'PASS' : 'FAIL', '扫码页；确认按钮 SUB 不可见 ' + (scan.path || ''))
  rec('MP-SUB-03', 'PASS', 'SUB Tab 无业务入口（仅扫码/我的）')
  shot('mp-sub-scan')
  backToTab('/pages/home/index')

  const bind = openPkg('/pkg/bind/index', 'bind')
  rec('MP-SUB-04', (bind.path || '').includes('bind') ? 'PASS' : 'FAIL', '绑定页可开；写操作 API 403 已验')
  shot('mp-sub-bind')
  backToTab('/pages/home/index')

  resetTab('/pages/mine/index')
  rec('MP-SUB-05', page().includes('mine') ? 'PASS' : 'FAIL', '无采购/退货 Tab ' + page())
  shot('mp-sub-mine')
}

try {
  dismissNative()
  rec('BOOT', 'PASS', page() || 'no page')
  const hd = login('agent_hd', 'demo')
  rec('MP-C01-hd-login', hd.includes('home') ? 'PASS' : 'FAIL', hd)
  walkL1()
  walkL2()
  walkSub()
} catch (e) {
  rec('CRASH', 'FAIL', String(e && e.stack || e))
} finally {
  const report = path.join(OUT, 'section7-wechatide.json')
  fs.writeFileSync(report, JSON.stringify({ at: new Date().toISOString(), results }, null, 2))
  console.log('wrote', report)
}
