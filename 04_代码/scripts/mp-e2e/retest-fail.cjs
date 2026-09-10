const { spawnSync } = require('child_process')
const fs = require('fs')

const IDE = '/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide'
const PROJECT = '/Users/macmini/dev/ruilai/04_代码/miniprogram/dist/dev/mp-weixin'
const EVID = '/Users/macmini/dev/ruilai/docs/test-evidence/mp-2026-09-09'

function ide(tool, extra = [], timeout = 35000) {
  const args = ['-c', 'cursor', tool, '--project', PROJECT, ...extra]
  const r = spawnSync(IDE, args, { encoding: 'utf8', timeout })
  const out = (r.stdout || '') + (r.stderr || '')
  const start = out.indexOf('{')
  const end = out.lastIndexOf('}')
  let json = null
  if (start >= 0 && end > start) {
    try { json = JSON.parse(out.slice(start, end + 1)) } catch { /* */ }
  }
  const msg = json?.ok === false ? (json.message || json.reason) : 'ok'
  console.log('>>', tool, extra.filter((x, i) => i < 4).join(' '), msg)
  return { out, json }
}

function sleep(ms) { spawnSync('sleep', [String(ms / 1000)]) }
function shot(name) {
  const p = `${EVID}/${name}.png`
  ide('simulator_screenshot', ['--path', p, '--optimize', 'false'])
  return p
}
function tapText(text) {
  return ide('automation_element_action', [
    '--selector', `text=${text}`, '--action', 'tap', '--wait-for-selector', `text=${text}`, '--wait', '1',
  ])
}
function openPage(page, query) {
  const extra = ['--page', page]
  if (query) extra.push('--query', query)
  const r = ide('simulator_open_page', extra, 45000)
  sleep(6000)
  return r
}
function switchTab(url) {
  const r = ide('automation_navigate', ['--action', 'switchTab', '--url', url, '--wait', '3'])
  sleep(2500)
  return r
}

fs.mkdirSync(EVID, { recursive: true })

console.log('\n==== C端 list via 区间直售 KPI ====')
switchTab('/pages/home/index')
tapText('区间直售')
sleep(2500)
shot('issue-067-cend-list-2')

console.log('\n==== C端 detail wait compile ====')
openPage('pkg/detail/index', 'kind=cend&id=SOB5546093')
shot('issue-068-cend-detail-2')

console.log('\n==== 在库SN ====')
switchTab('/pages/stock/index')
tapText('在库SN')
sleep(2000)
shot('issue-069-stock-sn-2')
tapText('库存流水')
sleep(2000)
shot('issue-069-stock-flow-2')

console.log('\n==== stock/sn/return/exception details ====')
openPage('pkg/detail/index', 'kind=stock&id=P1&size=M&belt=腰带M&scope=self')
shot('issue-070-stock-detail-2')
openPage('pkg/detail/index', 'kind=sn&id=RL202607200009')
shot('issue-070-sn-detail-2')
openPage('pkg/detail/index', 'kind=return&id=RTD00C3FE7')
shot('issue-071-return-detail-2')
openPage('pkg/detail/index', 'kind=exception&id=EX85ADCEEC')
shot('issue-078-exception-detail-2')

console.log('\n==== 退原厂 + 异常列表 via home KPI ====')
switchTab('/pages/home/index')
tapText('激活绑定')
sleep(2500)
shot('issue-078-exception-list-2')

switchTab('/pages/service/index')
tapText('退原厂')
sleep(2000)
shot('issue-077-factory-return-2')

console.log('\n==== return forms ====')
openPage('pkg/return-form/index', 'type=l2_to_l1')
shot('issue-072-return-form-l2-2')
openPage('pkg/return-form/index', 'type=l1_to_factory')
shot('issue-072-return-form-factory-2')

console.log('DONE')
