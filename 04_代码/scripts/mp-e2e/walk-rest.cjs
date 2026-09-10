const { spawnSync } = require('child_process')
const fs = require('fs')

const IDE = '/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide'
const PROJECT = '/Users/macmini/dev/ruilai/04_代码/miniprogram/dist/dev/mp-weixin'
const EVID = '/Users/macmini/dev/ruilai/docs/test-evidence/mp-2026-09-09'

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
  console.log('>>', tool, extra[0] || '', extra[1] || '', json?.ok === false ? json.message : 'ok')
  return { out, json }
}

function sleep(ms) {
  spawnSync('sleep', [String(ms / 1000)])
}

function shot(name) {
  const p = `${EVID}/${name}.png`
  ide('simulator_screenshot', ['--path', p, '--optimize', 'false'])
  return p
}

function openPage(page, query) {
  const extra = ['--page', page]
  if (query) extra.push('--query', query)
  return ide('simulator_open_page', extra, 40000)
}

function evaluate(fn) {
  return ide('automation_evaluate', ['--fn-source', fn], 20000)
}

function tap(sel) {
  return ide('automation_element_action', ['--selector', sel, '--action', 'tap', '--wait-for-selector', sel], 20000)
}

function nav(action, url) {
  const extra = ['--action', action]
  if (url) extra.push('--url', url)
  extra.push('--wait', '2')
  return ide('automation_navigate', extra)
}

function current() {
  const { json } = evaluate('function(){var p=getCurrentPages();var c=p[p.length-1];return c&&c.route;}')
  return json?.result?.result || ''
}

fs.mkdirSync(EVID, { recursive: true })

const steps = [
  () => { nav('switchTab', '/pages/biz/index'); sleep(2500); shot('issue-067-biz-before-cend') },
  () => { tap('.seg.is-line .btn:nth-child(3)'); sleep(2000); shot('issue-067-cend-list') },
  () => { openPage('pkg/detail/index', 'kind=cend&id=SOB5546093'); sleep(2500); shot('issue-068-cend-detail') },
  () => { nav('switchTab', '/pages/stock/index'); sleep(2500); shot('issue-069-stock-product') },
  () => { tap('.seg.is-line .btn:nth-child(2)'); sleep(2000); shot('issue-069-stock-sn') },
  () => { tap('.seg.is-line .btn:nth-child(3)'); sleep(2000); shot('issue-069-stock-flow') },
  () => { openPage('pkg/detail/index', 'kind=stock&id=P1&size=M&belt=腰带M&scope=self'); sleep(2500); shot('issue-070-stock-detail') },
  () => { openPage('pkg/detail/index', 'kind=sn&id=RL202607200009'); sleep(2500); shot('issue-070-sn-detail') },
  () => { nav('switchTab', '/pages/service/index'); sleep(2500); shot('issue-073-service-return') },
  () => { tap('.seg.is-seg .btn:nth-child(2)'); sleep(1800); shot('issue-074-user-return') },
  () => { tap('.seg.is-seg .btn:nth-child(3)'); sleep(1800); shot('issue-077-factory-return') },
  () => { openPage('pkg/return-form/index', 'type=user'); sleep(2000); shot('issue-072-return-form-user') },
  () => { openPage('pkg/return-form/index', 'type=l2_to_l1'); sleep(2000); shot('issue-072-return-form-l2') },
  () => { openPage('pkg/return-form/index', 'type=l1_to_factory'); sleep(2000); shot('issue-072-return-form-factory') },
  () => { openPage('pkg/detail/index', 'kind=return&id=RTD00C3FE7'); sleep(2500); shot('issue-071-return-detail') },
  () => { nav('switchTab', '/pages/service/index'); sleep(2000); tap('.seg.is-line .btn:nth-child(2)'); sleep(2000); shot('issue-078-exception-list') },
  () => { openPage('pkg/detail/index', 'kind=exception&id=EX7441AD50'); sleep(2500); shot('issue-078-exception-detail') },
  () => { nav('switchTab', '/pages/mine/index'); sleep(2500); shot('issue-080-mine') },
]

for (const [i, step] of steps.entries()) {
  try {
    console.log(`\n==== step ${i + 1}/${steps.length} page=${current()} ====`)
    step()
  } catch (e) {
    console.log('STEP FAIL', i + 1, e.message)
  }
}

console.log('DONE current=', current())
