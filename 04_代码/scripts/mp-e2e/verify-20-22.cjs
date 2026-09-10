const { spawnSync } = require('child_process')
const fs = require('fs')

const IDE = '/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide'
const PROJECT = '/Users/macmini/dev/ruilai/04_代码/miniprogram/dist/dev/mp-weixin'
const OUT = '/Users/macmini/dev/ruilai/docs/2026-09-09/verify'

function ide(tool, extra = [], timeout = 30000) {
  const args = ['-c', 'cursor', tool]
  if (tool !== 'check_wechatide_status' && tool !== 'polling_task_result') {
    args.push('--project', PROJECT)
  }
  args.push(...extra)
  const r = spawnSync(IDE, args, { encoding: 'utf8', timeout })
  const out = (r.stdout || '') + (r.stderr || '')
  const start = out.indexOf('{')
  const end = out.lastIndexOf('}')
  let json = null
  if (start >= 0 && end > start) {
    try { json = JSON.parse(out.slice(start, end + 1)) } catch { /* */ }
  }
  console.log('>>', tool, extra.slice(0, 3).join(' '), json?.ok === false ? json.message : (json?.status || 'ok'))
  return { json, out }
}
function sleep(ms) { spawnSync('sleep', [String(ms / 1000)]) }
function shot(name) {
  const p = `${OUT}/${name}.png`
  ide('simulator_screenshot', ['--path', p, '--optimize', 'false'])
  console.log('shot', p, fs.existsSync(p) ? fs.statSync(p).size : 0)
  return p
}
function evaluate(fn) {
  return ide('automation_evaluate', ['--fn-source', fn], 20000)
}
function nav(action, url) {
  const extra = ['--action', action]
  if (url) extra.push('--url', url)
  extra.push('--wait', '3')
  ide('automation_navigate', extra)
  sleep(2200)
}

fs.mkdirSync(OUT, { recursive: true })

const st = ide('check_wechatide_status', ['--skill-version', '0.3.9'])
if (st.json?.result?.status === 'pending') {
  console.log('AUTH_PENDING')
  process.exit(2)
}

ide('project_import')
ide('open_project_window', ['--window-mode', 'fullMode'])
sleep(2000)
ide('simulator_refresh')
sleep(4000)

console.log('\n==== #20 stock product detail ====')
nav('switchTab', '/pages/stock/index')
sleep(1500)
shot('issue-20-stock-list')
evaluate("function(){ wx.setStorageSync('rl_stock_detail', { productId:'P1', productName:'锐涞经典款套件', size:'M', belt:'腰带M', scope:'self', qty:25, l1Name:'华东锐涞总代', l2Name:'', status:'l1', agentType:'l1' }); return true }")
sleep(400)
nav('navigateTo', '/pkg/detail/index?kind=stock&id=P1&size=M&scope=self')
sleep(2000)
shot('issue-20-stock-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 900, duration: 0 }); return true }')
sleep(1000)
shot('issue-20-stock-detail-sn')
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

console.log('\n==== #21 return detail ====')
nav('switchTab', '/pages/service/index')
sleep(1500)
nav('navigateTo', '/pkg/detail/index?kind=return&id=RTD00C3FE7')
sleep(2000)
shot('issue-21-return-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 1400, duration: 0 }); return true }')
sleep(1000)
shot('issue-21-return-detail-bottom')
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

console.log('\n==== #22 exception detail ====')
evaluate("function(){ const pages = getCurrentPages(); const p = pages[pages.length-1]; if (p && p.setData) p.setData({ tab: 'exception' }); return true }")
nav('switchTab', '/pages/service/index')
sleep(800)
evaluate("function(){ wx.setStorageSync('rl_nav_intent', { target:'service', tab:'exception' }); return true }")
nav('switchTab', '/pages/service/index')
sleep(1500)
nav('navigateTo', '/pkg/detail/index?kind=exception&id=EX6BCD27AE')
sleep(2000)
shot('issue-22-exception-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 900, duration: 0 }); return true }')
sleep(800)
shot('issue-22-exception-customer')

console.log('DONE')
