const { spawnSync } = require('child_process')
const fs = require('fs')

const IDE = '/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide'
const PROJECT = '/Users/macmini/dev/ruilai/04_代码/miniprogram/dist/dev/mp-weixin'
const EVID = '/Users/macmini/dev/ruilai/docs/test-evidence/mp-2026-09-09'

function ide(tool, extra = [], timeout = 30000) {
  const args = ['-c', 'cursor', tool, '--project', PROJECT, ...extra]
  const r = spawnSync(IDE, args, { encoding: 'utf8', timeout })
  const out = (r.stdout || '') + (r.stderr || '')
  const start = out.indexOf('{')
  const end = out.lastIndexOf('}')
  let json = null
  if (start >= 0 && end > start) {
    try { json = JSON.parse(out.slice(start, end + 1)) } catch { /* */ }
  }
  console.log('>>', tool, extra.slice(0, 4).join(' '), json?.ok === false ? json.message : 'ok')
  return { json }
}
function sleep(ms) { spawnSync('sleep', [String(ms / 1000)]) }
function shot(name) {
  ide('simulator_screenshot', ['--path', `${EVID}/${name}.png`, '--optimize', 'false'])
}
function evaluate(fn) {
  return ide('automation_evaluate', ['--fn-source', fn], 20000)
}
function tap(sel) {
  return ide('automation_element_action', ['--selector', sel, '--action', 'tap', '--wait-for-selector', sel, '--wait', '1'])
}
function input(sel, value) {
  return ide('automation_element_action', ['--selector', sel, '--action', 'input', '--value', value, '--wait-for-selector', sel])
}
function nav(action, url) {
  ide('automation_navigate', ['--action', action, '--url', url, '--wait', '3'])
  sleep(2500)
}

fs.mkdirSync(EVID, { recursive: true })
ide('simulator_refresh')
sleep(4000)

console.log('\n==== home KPI C端 ====')
nav('switchTab', '/pages/home/index')
tap('[data-kpi="direct"]')
sleep(2500)
shot('issue-067-cend-list-3')

console.log('\n==== C端/销售/库存/退货/异常详情 navigateTo ====')
nav('navigateTo', '/pkg/detail/index?kind=cend&id=SOB5546093')
shot('issue-067-cend-detail')
evaluate('function(){ wx.navigateBack({ delta: 1 }) }')
sleep(1500)

nav('navigateTo', '/pkg/detail/index?kind=sales&id=SOCA936FF1')
shot('issue-065-sales-detail-2')
evaluate('function(){ wx.navigateBack({ delta: 1 }) }')
sleep(1500)

nav('switchTab', '/pages/stock/index')
tap('[data-seg="sn"]')
sleep(2000)
shot('issue-069-stock-sn-3')
nav('navigateTo', '/pkg/detail/index?kind=stock&id=P1&size=M&belt=腰带M&scope=self')
shot('issue-070-stock-detail-3')
evaluate('function(){ wx.navigateBack({ delta: 1 }) }')
sleep(1200)
nav('navigateTo', '/pkg/detail/index?kind=sn&id=RL202607200009')
shot('issue-069-sn-detail-3')
evaluate('function(){ wx.navigateBack({ delta: 1 }) }')
sleep(1200)

console.log('\n==== 售后 退原厂 + 异常 ====')
evaluate('function(){ wx.setStorageSync("rl_nav_intent", { target: "service", tab: "return", status: "pending" }); wx.switchTab({ url: "/pages/service/index" }); return true }')
sleep(3500)
tap('[data-seg="l1_to_factory"]')
sleep(2000)
shot('issue-077-factory-return-3')

evaluate('function(){ wx.setStorageSync("rl_nav_intent", { target: "service", tab: "exception", dimension: "activate-dist" }); wx.switchTab({ url: "/pages/service/index" }); return true }')
sleep(3500)
shot('issue-079-080-exception-dist')
tap('[data-seg="activate-direct"]')
sleep(1800)
shot('issue-079-exception-direct')
tap('[data-seg="stock"]')
sleep(1800)
shot('issue-081-exception-stock')

nav('navigateTo', '/pkg/detail/index?kind=exception&id=EX85ADCEEC')
shot('issue-078-exception-detail-3')
evaluate('function(){ wx.navigateBack({ delta: 1 }) }')
sleep(1200)

nav('navigateTo', '/pkg/detail/index?kind=return&id=RTD00C3FE7')
shot('issue-071-return-detail-3')
evaluate('function(){ wx.navigateBack({ delta: 1 }) }')
sleep(1200)

console.log('\n==== 退货表单输入多个 SN ====')
nav('navigateTo', '/pkg/return-form/index?type=user')
sleep(1500)
input('textarea', 'RL202607200009 RL202608319001')
sleep(1000)
shot('issue-074-075-return-multi-sn')

console.log('DONE')
