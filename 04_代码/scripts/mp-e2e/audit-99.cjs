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
  const note = json?.ok === false ? json.message : (json?.result?.path || json?.status || 'ok')
  console.log('>>', tool, extra.slice(0, 4).join(' '), note)
  return { json, out }
}
function sleep(ms) { spawnSync('sleep', [String(ms / 1000)]) }
function shot(name) {
  const p = `${OUT}/${name}.png`
  ide('simulator_screenshot', ['--path', p, '--optimize', 'false'])
  console.log('shot', name, fs.existsSync(p) ? fs.statSync(p).size : 0)
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
  sleep(1800)
}
function page() {
  const { json } = ide('automation_runtime_info', ['--action', 'currentPage'])
  const cur = json?.result?.currentPage || {}
  return (cur.path || cur.route || '').replace(/^\//, '')
}
function pageText() {
  const r = evaluate(`function(){
    return new Promise(function(resolve){
      wx.createSelectorQuery().selectAll('text,view,button').fields({text:true,dataset:true,size:true}, function(){}).exec(function(res){
        var nodes = (res && res[0]) || []
        var texts = nodes.map(function(n){ return (n && n.text) || '' }).filter(Boolean)
        resolve(texts.join('|').slice(0, 4000))
      })
    })
  }`)
  const val = r.json?.result?.result
  return typeof val === 'string' ? val : JSON.stringify(val || r.json?.result || '').slice(0, 4000)
}

fs.mkdirSync(OUT, { recursive: true })
const report = []

function rec(id, note, extra) {
  report.push({ id, note, extra })
  console.log(`[${id}] ${note}`)
}

nav('switchTab', '/pages/home/index')
sleep(1200)
shot('audit-14-home-top')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 1400, duration: 0 }); return true }')
sleep(800)
shot('audit-14-home-bottom')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 0, duration: 0 }); return true }')
sleep(400)
ide('automation_element_action', ['--selector', '[data-seg="scan"]', '--action', 'tap'])
sleep(1000)
shot('audit-25-scan-tab')
const scanText = pageText()
rec(25, scanText.includes('扫码') ? 'scan tab opened' : 'scan tab text missing', scanText.slice(0, 500))
if (/\b扫码\b.*\b1\b/.test(scanText) && scanText.includes('badge')) rec(25, 'POSSIBLE badge leftover', scanText.slice(0, 300))

nav('switchTab', '/pages/biz/index')
sleep(1500)
shot('audit-15-biz-list')
nav('navigateTo', '/pkg/detail/index?kind=purchase&id=PO20260904001')
sleep(2000)
shot('audit-15-purchase-detail')
rec(15, page(), pageText().slice(0, 800))
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

nav('navigateTo', '/pkg/detail/index?kind=sales&id=SO20260904001')
sleep(2000)
shot('audit-16-sales-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 900, duration: 0 }); return true }')
sleep(800)
shot('audit-16-sales-detail-sn')
rec(16, page(), pageText().slice(0, 800))
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

nav('navigateTo', '/pkg/purchase/index?kind=sales')
sleep(2000)
shot('audit-17-create-sales')
rec(17, page(), pageText().slice(0, 800))
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

nav('navigateTo', '/pkg/detail/index?kind=cend&id=SO20260908002')
sleep(2000)
shot('audit-18-cend-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 900, duration: 0 }); return true }')
sleep(800)
shot('audit-18-cend-detail-sn')
rec(18, page(), pageText().slice(0, 800))
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

nav('switchTab', '/pages/stock/index')
sleep(1500)
shot('audit-20-stock-list')
evaluate("function(){ wx.setStorageSync('rl_stock_detail', { productId:'P1', productName:'锐涞经典款套件', size:'M', belt:'腰带M', scope:'self', qty:25, l1Name:'华东锐涞总代', l2Name:'', status:'l1', agentType:'l1' }); return true }")
sleep(400)
nav('navigateTo', '/pkg/detail/index?kind=stock&id=P1&size=M&belt=' + encodeURIComponent('腰带M') + '&scope=self')
sleep(2200)
shot('audit-20-stock-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 900, duration: 0 }); return true }')
sleep(900)
shot('audit-20-stock-detail-sn')
rec(20, page(), pageText().slice(0, 1200))
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

nav('navigateTo', '/pkg/detail/index?kind=sn&id=RL202608010001')
sleep(2000)
shot('audit-19-sn-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 1200, duration: 0 }); return true }')
sleep(900)
shot('audit-19-sn-timeline')
rec(19, page(), pageText().slice(0, 800))
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

nav('switchTab', '/pages/service/index')
sleep(1500)
nav('navigateTo', '/pkg/detail/index?kind=return&id=RTD00C3FE7')
sleep(2000)
shot('audit-21-return-detail')
evaluate('function(){ wx.pageScrollTo({ scrollTop: 1400, duration: 0 }); return true }')
sleep(900)
shot('audit-21-return-detail-bottom')
rec(21, page(), pageText().slice(0, 800))
evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
sleep(800)

nav('switchTab', '/pages/service/index')
sleep(800)
ide('automation_element_action', ['--selector', '[data-seg="exception"]', '--action', 'tap'])
sleep(1200)
shot('audit-30-exception-list')
nav('navigateTo', '/pkg/detail/index?kind=exception&id=EX6BCD27AE')
sleep(2000)
shot('audit-22-exception-detail')
rec(22, page(), pageText().slice(0, 800))

fs.writeFileSync(`${OUT}/audit-99-report.json`, JSON.stringify(report, null, 2))
console.log('WROTE', `${OUT}/audit-99-report.json`)
