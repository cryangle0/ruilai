const { spawnSync } = require('child_process')
const fs = require('fs')
const IDE = '/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide'
const PROJECT = '/Users/macmini/dev/ruilai/04_代码/miniprogram/dist/dev/mp-weixin'
const OUT = '/Users/macmini/dev/ruilai/docs/2026-09-09/verify'

function ide(tool, extra = [], timeout = 25000) {
  const args = ['-c', 'cursor', tool, '--project', PROJECT, ...extra]
  const r = spawnSync(IDE, args, { encoding: 'utf8', timeout })
  const out = (r.stdout || '') + (r.stderr || '')
  const start = out.indexOf('{')
  const end = out.lastIndexOf('}')
  let json = null
  if (start >= 0 && end > start) {
    try { json = JSON.parse(out.slice(start, end + 1)) } catch { /* */ }
  }
  console.log('>>', tool, extra.filter((x, i) => i < 4).join(' '), json?.ok === false ? json.message : 'ok')
  return json
}
function sleep(ms) { spawnSync('sleep', [String(ms / 1000)]) }
function shot(name) {
  const p = `${OUT}/${name}.png`
  ide('simulator_screenshot', ['--path', p, '--optimize', 'false'])
  console.log('shot', name, fs.existsSync(p) ? fs.statSync(p).size : 0)
}
function nav(action, url) {
  const extra = ['--action', action, '--wait', '3']
  if (url) extra.push('--url', url)
  ide('automation_navigate', extra)
  sleep(1600)
}

nav('reLaunch', '/pages/home/index')
sleep(1200)
nav('navigateTo', '/pkg/detail/index?kind=purchase&id=PO73477CF4')
sleep(1800)
shot('audit-15-purchase-detail')
ide('automation_evaluate', ['--fn-source', 'function(){ wx.pageScrollTo({ scrollTop: 600, duration: 0 }); return true }'])
sleep(600)
shot('audit-15-purchase-lines')

nav('redirectTo', '/pkg/detail/index?kind=sales&id=SOCA936FF1')
sleep(1800)
shot('audit-16-sales-detail')
ide('automation_evaluate', ['--fn-source', 'function(){ wx.pageScrollTo({ scrollTop: 700, duration: 0 }); return true }'])
sleep(600)
shot('audit-16-sales-detail-sn')

nav('redirectTo', '/pkg/detail/index?kind=cend&id=SOF57645B6')
sleep(1800)
shot('audit-18-cend-detail')
ide('automation_evaluate', ['--fn-source', 'function(){ wx.pageScrollTo({ scrollTop: 700, duration: 0 }); return true }'])
sleep(600)
shot('audit-18-cend-detail-sn')

nav('redirectTo', '/pkg/detail/index?kind=sn&id=RL202608010001')
sleep(1800)
shot('audit-19-sn-detail')
ide('automation_evaluate', ['--fn-source', 'function(){ wx.pageScrollTo({ scrollTop: 1100, duration: 0 }); return true }'])
sleep(600)
shot('audit-19-sn-timeline')

nav('redirectTo', '/pkg/detail/index?kind=return&id=RTD8655305')
sleep(1800)
shot('audit-21-return-detail')
ide('automation_evaluate', ['--fn-source', 'function(){ wx.pageScrollTo({ scrollTop: 1200, duration: 0 }); return true }'])
sleep(600)
shot('audit-21-return-detail-bottom')

nav('redirectTo', '/pkg/detail/index?kind=exception&id=EX731EF102')
sleep(1800)
shot('audit-22-exception-detail')

nav('redirectTo', '/pkg/detail/index?kind=exception&id=EXE58C7919')
sleep(1800)
shot('audit-22-exception-activate')

nav('switchTab', '/pages/stock/index')
sleep(1400)
ide('automation_element_action', ['--selector', '.item', '--action', 'tap'])
sleep(1800)
shot('audit-20-from-list')

nav('switchTab', '/pages/home/index')
sleep(1000)
ide('automation_element_action', ['--selector', 'seg-bar >>> .btn', '--action', 'tap'])
sleep(400)
ide('automation_element_action', ['--selector', '.btn', '--action', 'tap'])
sleep(800)
shot('audit-25-scan-attempt')
