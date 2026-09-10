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
  console.log('>>', tool, extra[0], json?.ok === false ? json.message : 'ok')
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
function evaluate(fn) {
  return ide('automation_evaluate', ['--fn-source', fn], 20000)
}

const idsJson = evaluate(`function(){
  return new Promise(function(resolve){
    var token = wx.getStorageSync("rl_token");
    function req(path){
      return new Promise(function(res){
        wx.request({
          url:"https://label.onnsa.cn/ruilai-api"+path,
          header:{ Authorization: "Bearer "+token },
          success:function(r){ res((r.data && r.data.data) || r.data); },
          fail:function(e){ res({fail:e.errMsg}); }
        });
      });
    }
    Promise.all([
      req("/api/purchases?page=1&pageSize=3"),
      req("/api/sales?page=1&pageSize=8"),
      req("/api/returns?page=1&pageSize=3"),
      req("/api/exceptions?page=1&pageSize=8")
    ]).then(function(all){
      function brief(page){
        var list = (page && page.list) || [];
        return list.slice(0,8).map(function(x){
          return { id:x.id, no:x.no, channel:x.channel, l1Name:x.l1Name, l2Name:x.l2Name, type:x.type, status:x.status };
        });
      }
      resolve({ purchase:brief(all[0]), sales:brief(all[1]), returns:brief(all[2]), ex:brief(all[3]) });
    });
  });
}`)
const ids = idsJson?.result?.result || idsJson?.result || {}
console.log('IDS', JSON.stringify(ids, null, 2))
fs.writeFileSync(`${OUT}/audit-ids.json`, JSON.stringify(ids, null, 2))

const po = (ids.purchase || [])[1] || (ids.purchase || [])[0]
const soDist = (ids.sales || []).find((x) => x.channel !== 'direct') || (ids.sales || [])[0]
const soDirect = (ids.sales || []).find((x) => x.channel === 'direct')
const rt = (ids.returns || [])[0]
const ex = (ids.ex || [])[0]

if (po) {
  nav('navigateTo', `/pkg/detail/index?kind=purchase&id=${po.id}`)
  sleep(1800)
  shot('audit-15-purchase-detail')
  evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
  sleep(700)
}
if (soDist) {
  nav('navigateTo', `/pkg/detail/index?kind=sales&id=${soDist.id}`)
  sleep(1800)
  shot('audit-16-sales-detail')
  evaluate('function(){ wx.pageScrollTo({ scrollTop: 700, duration: 0 }); return true }')
  sleep(700)
  shot('audit-16-sales-detail-sn')
  evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
  sleep(700)
}
if (soDirect) {
  nav('navigateTo', `/pkg/detail/index?kind=cend&id=${soDirect.id}`)
  sleep(1800)
  shot('audit-18-cend-detail')
  evaluate('function(){ wx.pageScrollTo({ scrollTop: 700, duration: 0 }); return true }')
  sleep(700)
  shot('audit-18-cend-detail-sn')
  evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
  sleep(700)
}

nav('switchTab', '/pages/home/index')
sleep(1000)
evaluate(`function(){ const q = wx.createSelectorQuery(); return true }`)
ide('automation_element_action', ['--selector', '.seg .btn', '--action', 'tap'])
sleep(400)
const btns = evaluate(`function(){
  return new Promise(function(resolve){
    wx.createSelectorQuery().selectAll('.seg .btn').fields({dataset:true,text:true}, function(){}).exec(function(res){
      resolve((res && res[0]) || []);
    });
  });
}`)
console.log('SEGBTN', JSON.stringify(btns?.result?.result || btns?.result || btns))
ide('automation_element_action', ['--selector', '.seg .btn:nth-child(2)', '--action', 'tap'])
sleep(1000)
shot('audit-25-scan-tab')

nav('switchTab', '/pages/service/index')
sleep(1200)
ide('automation_element_action', ['--selector', '.seg .btn:nth-child(2)', '--action', 'tap'])
sleep(1200)
shot('audit-30-exception-list')

if (rt) {
  nav('navigateTo', `/pkg/detail/index?kind=return&id=${rt.id}`)
  sleep(1800)
  shot('audit-21-return-detail')
  evaluate('function(){ wx.pageScrollTo({ scrollTop: 1200, duration: 0 }); return true }')
  sleep(700)
  shot('audit-21-return-detail-bottom')
  evaluate('function(){ wx.navigateBack({ delta: 1 }); return true }')
  sleep(700)
}
if (ex) {
  nav('navigateTo', `/pkg/detail/index?kind=exception&id=${ex.id}`)
  sleep(1800)
  shot('audit-22-exception-detail')
}

nav('switchTab', '/pages/stock/index')
sleep(1200)
ide('automation_element_action', ['--selector', '.list-card, .card', '--action', 'tap'])
sleep(1800)
shot('audit-20-from-list')
