/**
 * 用「微信上传」目录的私钥上传开发版。
 * 私钥不进仓库，路径默认：
 *   E:\angsa\angsa_data\项目\锐涞经销商管理系统\微信上传\private.wx242669dc618156c6.key
 */
import ci from 'miniprogram-ci'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const miniRoot = path.resolve(__dirname, '..')
const projectPath = path.join(miniRoot, 'dist', 'build', 'mp-weixin')
const keyPath = process.env.RUILAI_WX_KEY
  || 'E:\\angsa\\angsa_data\\项目\\锐涞经销商管理系统\\微信上传\\private.wx242669dc618156c6.key'
const appid = (process.env.RUILAI_WX_APPID
  || fs.readFileSync(path.join(miniRoot, 'APPID'), 'utf8')).trim()

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath,
  privateKeyPath: keyPath,
  ignores: ['node_modules/**/*'],
})

const version = process.env.RUILAI_WX_VERSION || '0.1.0'
const desc = process.env.RUILAI_WX_DESC || '锐涞经销商开发版'

await ci.upload({
  project,
  version,
  desc,
  setting: { es6: true, minify: true },
  onProgressUpdate: console.log,
})
console.log('upload done', version)
