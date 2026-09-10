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

console.log('\n==== #14 home ====')
nav('switchTab', '/pages/home/index')
sleep(1500)
shot('issue-14-home-top')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 4000, duration: 0 }); return true }')
sleep(1200)
shot('issue-14-home-bottom')

console.log('\n==== #15 purchase detail ====')
nav('navigateTo', '/pkg/detail/index?kind=purchase&id=PO73477CF4')
sleep(1500)
shot('issue-15-purchase-detail')
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

console.log('\n==== #16 sales detail ====')
nav('navigateTo', '/pkg/detail/index?kind=sales&id=SOCA936FF1')
sleep(1500)
shot('issue-16-sales-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 1200, duration: 0 }); return true }')
sleep(800)
shot('issue-16-sales-detail-sn')
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

console.log('\n==== #17 create sales ====')
nav('navigateTo', '/pkg/purchase/index?kind=sales')
sleep(1500)
shot('issue-17-create-sales')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 1600, duration: 0 }); return true }')
sleep(800)
shot('issue-17-create-sales-cart')
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

console.log('\n==== #18 cend detail ====')
nav('navigateTo', '/pkg/detail/index?kind=cend&id=SOF57645B6')
sleep(1500)
shot('issue-18-cend-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 1200, duration: 0 }); return true }')
sleep(800)
shot('issue-18-cend-detail-sn')
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

console.log('\n==== #19 sn detail ====')
nav('navigateTo', '/pkg/detail/index?kind=sn&id=RL202607200009')
sleep(1500)
shot('issue-19-sn-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 1800, duration: 0 }); return true }')
sleep(800)
shot('issue-19-sn-timeline')

console.log('DONE')
