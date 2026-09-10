const { spawnSync } = require('child_process')
const IDE = '/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide'
const PROJECT = '/Users/macmini/dev/ruilai/04_代码/miniprogram/dist/dev/mp-weixin'
const EVID = '/Users/macmini/dev/ruilai/docs/test-evidence/mp-2026-09-09'

function ide(tool, extra = [], timeout = 25000) {
  const r = spawnSync(IDE, ['-c', 'cursor', tool, '--project', PROJECT, ...extra], { encoding: 'utf8', timeout })
  const out = (r.stdout || '') + (r.stderr || '')
  const start = out.indexOf('{')
  const end = out.lastIndexOf('}')
  let json = null
  if (start >= 0 && end > start) try { json = JSON.parse(out.slice(start, end + 1)) } catch {}
  console.log('>>', tool, extra.slice(0, 3).join(' '), json?.ok === false ? json.message : 'ok')
  return json
}
function sleep(ms) { spawnSync('sleep', [String(ms / 1000)]) }
function shot(name) { ide('simulator_screenshot', ['--path', `${EVID}/${name}.png`, '--optimize', 'false']) }
function tap(sel) { return ide('automation_element_action', ['--selector', sel, '--action', 'tap', '--wait', '2']) }
function nav(action, url) { ide('automation_navigate', ['--action', action, '--url', url, '--wait', '4']); sleep(3000) }

nav('switchTab', '/pages/service/index')
shot('issue-073-service-month')
tap('[data-seg="l1_to_factory"]')
sleep(2000)
shot('issue-077-factory-tabs')
tap('[data-seg="exception"]')
sleep(2500)
shot('issue-078-exception-list-3')
tap('[data-seg="activate-dist"]')
sleep(2000)
shot('issue-079-080-dist-3')
tap('[data-seg="stock"]')
sleep(2000)
shot('issue-081-stock-3')

nav('navigateTo', '/pkg/return-form/index?type=user')
sleep(1500)
ide('automation_evaluate', ['--fn-source', 'function(){var p=getCurrentPages();var c=p[p.length-1];if(c&&c.setData){}try{c.$vm.snsText="RL202607200009\\nRL202608319001"}catch(e){}return {route:c&&c.route};}'])
sleep(800)
shot('issue-074-075-typed-sn')
console.log('DONE')
