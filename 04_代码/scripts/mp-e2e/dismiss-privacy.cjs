const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const IDE = 'D:\\weixindev\\微信web开发者工具\\wechatide.cmd'
const PROJECT = 'e:\\angsa\\angsa_data\\项目\\锐涞经销商管理系统\\04_代码\\miniprogram\\dist\\build\\mp-weixin'
const OUT = 'e:\\angsa\\angsa_data\\项目\\锐涞经销商管理系统\\docs\\test-evidence\\mp-2026-09-03'

function ide(tool, extra = []) {
  const r = spawnSync('cmd', ['/c', IDE, '-c', 'cursor', tool, '--project', PROJECT, ...extra], {
    encoding: 'utf8',
    timeout: 90000,
    windowsHide: true,
  })
  const out = (r.stdout || '') + (r.stderr || '')
  console.log(out.slice(0, 1500))
  return out
}

function evaluate(fn) {
  return ide('automation_evaluate', ['--fn-source', fn])
}

console.log('=== evaluate privacy hook ===')
evaluate('function(){try{wx.onNeedPrivacyAuthorization(function(cb){cb({event:"agree"})});return "hooked"}catch(e){return String(e)}}')

console.log('=== requirePrivacyAuthorize ===')
evaluate('function(){return new Promise(function(resolve){try{wx.requirePrivacyAuthorize({success:function(){resolve("ok")},fail:function(e){resolve(e)}})}catch(e){resolve(String(e))}})}')

const shot = path.join(OUT, 'privacy-after-wx.png')
console.log('=== screenshot ===')
ide('simulator_screenshot', ['--path', shot, '--optimize', 'false'])
console.log('wrote', shot)
