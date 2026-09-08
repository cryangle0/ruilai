const { spawnSync } = require('child_process')
const path = require('path')

const IDE = 'D:\\weixindev\\微信web开发者工具\\wechatide.cmd'
const PROJECT = 'e:\\angsa\\angsa_data\\项目\\锐涞经销商管理系统\\04_代码\\miniprogram\\dist\\build\\mp-weixin'
const OUT = 'e:\\angsa\\angsa_data\\项目\\锐涞经销商管理系统\\docs\\test-evidence\\mp-2026-09-03'

function ide(tool, extra) {
  const args = ['-c', 'cursor', tool, '--project', PROJECT, ...extra]
  console.log('\n>>', tool, extra.join(' '))
  const r = spawnSync(IDE, args, { encoding: 'utf8', timeout: 60000, shell: true, windowsHide: true })
  if (r.stdout) process.stdout.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  return r.stdout || ''
}

ide('automation_page_action', ['--action', 'setData', '--patch', JSON.stringify({ e: 'demo', g: true })])
ide('automation_page_action', ['--action', 'getData'])
ide('automation_element_action', ['--selector', '.submit', '--action', 'tap', '--wait', '3'])
ide('automation_runtime_info', ['--action', 'currentPage'])
ide('simulator_screenshot', ['--path', path.join(OUT, 'mp-hd-home.png')])
ide('get_simulator_network', ['--command', 'grep ruilai'])
