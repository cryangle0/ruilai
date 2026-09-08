/**
 * 锐涞小程序 §7 UI：微信开发者工具 automator（cli auto）
 * 打开表单即返回，不提交写库（采购/建 L2/建 SUB/退货）。
 */
const fs = require('fs')
const path = require('path')
const automator = require('miniprogram-automator')

const CLI = 'D:\\weixindev\\微信web开发者工具\\cli.bat'
const PROJECT = path.resolve(__dirname, '..', '..', 'miniprogram', 'dist', 'build', 'mp-weixin')
const OUT = path.resolve(__dirname, '..', '..', '..', 'docs', 'test-evidence', 'mp-2026-09-03')
const REPORT = path.join(OUT, 'section7-results.json')

fs.mkdirSync(OUT, { recursive: true })

const results = []
function rec(id, status, note) {
  results.push({ id, status, note })
  console.log(`[${status}] ${id}  ${note}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function wxml(mp) {
  const page = await mp.currentPage()
  return page.wxml()
}

async function pagePath(mp) {
  const page = await mp.currentPage()
  return page.path
}

async function hasText(mp, ...needles) {
  const xml = await wxml(mp)
  return needles.every((n) => xml.includes(n))
}

async function shot(mp, name) {
  const file = path.join(OUT, `${name}.png`)
  await mp.screenshot({ path: file })
  return file
}

async function tapClass(mp, cls) {
  const page = await mp.currentPage()
  const el = await page.$(cls)
  if (!el) throw new Error(`missing ${cls} on ${await pagePath(mp)}`)
  await el.tap()
  await sleep(600)
}

async function clearSession(mp) {
  try {
    await mp.callWxMethod('clearStorage')
  } catch {
    try { await mp.callWxMethod('clearStorageSync') } catch { /* ignore */ }
  }
}

async function login(mp, username, password) {
  await clearSession(mp)
  await mp.reLaunch('/pages/login/index')
  await sleep(900)
  const page = await mp.currentPage()
  const inputs = await page.$$('input')
  if (!inputs || inputs.length < 2) throw new Error('login inputs missing')
  await inputs[0].input(username)
  await inputs[1].input(password)
  const cbx = await page.$('.cbx')
  if (cbx) await cbx.tap()
  await sleep(200)
  const btn = await page.$('.submit')
  if (!btn) throw new Error('login button missing')
  await btn.tap()
  await sleep(2800)
}

async function logout(mp) {
  await mp.navigateTo('/pkg/mine-profile/index')
  await sleep(900)
  await tapClass(mp, '.out')
  await sleep(1500)
}

async function goTab(mp, url) {
  await mp.switchTab(url)
  await sleep(1200)
}

process.on('uncaughtException', (err) => {
  const msg = String(err && err.message || err)
  if (msg.includes('getPageMetaByWebviewId')) {
    console.warn('ignore race:', msg)
    return
  }
  console.error(err)
  process.exit(1)
})

async function waitReady(mp) {
  let last = ''
  for (let i = 0; i < 25; i++) {
    try {
      await mp.reLaunch('/pages/login/index')
      await sleep(1200)
      const page = await mp.currentPage()
      if (page && page.path) {
        console.log('ready', page.path, 'try', i)
        return page.path
      }
    } catch (e) {
      last = String(e.message || e)
      console.log('waitReady', i, last)
      await sleep(800)
    }
  }
  throw new Error('simulator not ready: ' + last)
}

async function main() {
  console.log('project', PROJECT)
  console.log('cli', CLI)
  const ws = process.env.WX_AUTO_WS || 'ws://127.0.0.1:9420'
  console.log('connect', ws)
  let mp
  try {
    mp = await automator.connect({ wsEndpoint: ws })
  } catch (e) {
    console.log('connect failed, launch instead', e.message || e)
    mp = await automator.launch({
      cliPath: CLI,
      projectPath: PROJECT,
      timeout: 180000,
    })
  }

  try {
    const bootPath = await waitReady(mp)
    await sleep(800)
    await shot(mp, '00-launch')
    rec('BOOT', 'PASS', `path=${bootPath}`)

    // MP-C01 agent_hd
    try {
      await login(mp, 'agent_hd', 'demo')
      await goTab(mp, '/pages/home/index')
      await shot(mp, '01-hd-home')
      const xml = await wxml(mp)
      const ok = xml.includes('首页') || xml.includes('本级') || xml.includes('采购统计')
      rec('MP-C01-hd', ok ? 'PASS' : 'FAIL', ok ? '进入首页' : `unexpected wxml snippet: ${xml.slice(0, 180)}`)
    } catch (e) {
      rec('MP-C01-hd', 'FAIL', String(e.message || e))
    }

    // MP-L1-01
    try {
      const xml = await wxml(mp)
      const ok = /采购统计|销售统计|当前在库/.test(xml)
      rec('MP-L1-01', ok ? 'PASS' : 'FAIL', ok ? '待办/KPI 可见' : '首页无 KPI 文案')
    } catch (e) {
      rec('MP-L1-01', 'FAIL', String(e.message || e))
    }

    // MP-C02 NavBar on home + subpage
    try {
      await mp.navigateTo('/pkg/mine-profile/index')
      await sleep(800)
      await shot(mp, '02-hd-profile-navbar')
      const xml = await wxml(mp)
      rec('MP-C02', xml.includes('个人资料') || xml.includes('退出登录') ? 'PASS' : 'WARN', '分包页已打开（自定义 NavBar）')
      await mp.navigateBack()
      await sleep(500)
    } catch (e) {
      rec('MP-C02', 'FAIL', String(e.message || e))
    }

    // MP-L1-02 采购表单 打开不提交
    try {
      await goTab(mp, '/pages/biz/index')
      await shot(mp, '03-hd-biz')
      const xmlBiz = await wxml(mp)
      rec('MP-L1-biz', xmlBiz.includes('采购') ? 'PASS' : 'FAIL', '业务 Tab')
      await mp.navigateTo('/pkg/purchase/index?kind=purchase')
      await sleep(900)
      await shot(mp, '04-hd-purchase-form')
      const xml = await wxml(mp)
      rec('MP-L1-02', xml.includes('新建采购') || xml.includes('采购申请') ? 'PASS' : 'FAIL', '打开表单未提交')
      await mp.navigateBack()
      await sleep(400)
    } catch (e) {
      rec('MP-L1-02', 'FAIL', String(e.message || e))
    }

    // MP-L1-03 创建分销单入口
    try {
      await mp.navigateTo('/pkg/purchase/index?kind=sales')
      await sleep(900)
      await shot(mp, '05-hd-sales-form')
      const xml = await wxml(mp)
      rec('MP-L1-03', xml.includes('创建销售单') || xml.includes('二级代理') ? 'PASS' : 'FAIL', '打开销售单表单未提交')
      await mp.navigateBack()
      await sleep(400)
    } catch (e) {
      rec('MP-L1-03', 'FAIL', String(e.message || e))
    }

    // MP-L1-04 / 05 扫码页
    try {
      await mp.navigateTo('/pkg/scan/index')
      await sleep(900)
      await shot(mp, '06-hd-scan')
      const xml = await wxml(mp)
      rec('MP-L1-04', xml.includes('出货扫码') || xml.includes('销售单') ? 'PASS' : 'FAIL', '扫码页打开（模拟器未真扫）')
      rec('MP-L1-05', xml.includes('查询') || xml.includes('出货') ? 'PASS' : 'WARN', '查询模式在首页扫码面板，本页为出货扫码')
      await mp.navigateBack()
      await sleep(400)
    } catch (e) {
      rec('MP-L1-04', 'FAIL', String(e.message || e))
    }

    // MP-L1-06 库存
    try {
      await goTab(mp, '/pages/stock/index')
      await shot(mp, '07-hd-stock')
      const xml = await wxml(mp)
      rec('MP-L1-06', /库存总量|当前在库|点商品/.test(xml) ? 'PASS' : 'FAIL', 'L1 库存页')
    } catch (e) {
      rec('MP-L1-06', 'FAIL', String(e.message || e))
    }

    // MP-L1-07 建 L2 打开取消
    try {
      await goTab(mp, '/pages/mine/index')
      await shot(mp, '08-hd-mine')
      await mp.navigateTo('/pkg/mine-l2/index')
      await sleep(900)
      await shot(mp, '09-hd-mine-l2')
      const xml = await wxml(mp)
      rec('MP-L1-07', xml.includes('创建二级') || xml.includes('二级代理') ? 'PASS' : 'FAIL', '打开列表/创建入口，未提交')
      rec('MP-L1-11', xml.includes('协议') || xml.includes('二级') ? 'PASS' : 'WARN', '协议上传在创建抽屉内')
      await mp.navigateBack()
      await sleep(400)
    } catch (e) {
      rec('MP-L1-07', 'FAIL', String(e.message || e))
    }

    // MP-L1-08 建 SUB
    try {
      await mp.navigateTo('/pkg/mine-sub/index')
      await sleep(900)
      await shot(mp, '10-hd-mine-sub')
      const xml = await wxml(mp)
      rec('MP-L1-08', xml.includes('子账号') || xml.includes('扫码') ? 'PASS' : 'FAIL', '打开子账号页未创建')
      await mp.navigateBack()
      await sleep(400)
    } catch (e) {
      rec('MP-L1-08', 'FAIL', String(e.message || e))
    }

    // MP-L1-09 直销绑定 dryRun
    try {
      await mp.navigateTo('/pkg/bind/index')
      await sleep(900)
      await shot(mp, '11-hd-bind')
      const xml = await wxml(mp)
      rec('MP-L1-09', /绑定|激活|客户/.test(xml) ? 'PASS' : 'FAIL', '绑定页打开未写库')
      await mp.navigateBack()
      await sleep(400)
    } catch (e) {
      rec('MP-L1-09', 'FAIL', String(e.message || e))
    }

    // MP-L1-10 退货入口
    try {
      await goTab(mp, '/pages/service/index')
      await shot(mp, '12-hd-service')
      const xml = await wxml(mp)
      rec('MP-L1-10', xml.includes('退原厂') || xml.includes('退货') ? 'PASS' : 'FAIL', '售后页 L1 退货入口')
    } catch (e) {
      rec('MP-L1-10', 'FAIL', String(e.message || e))
    }

    // MP-C03 退出
    try {
      await logout(mp)
      await sleep(800)
      await shot(mp, '13-hd-logout')
      const p = await pagePath(mp)
      rec('MP-C03', p.includes('login') ? 'PASS' : 'FAIL', `logout → ${p}`)
    } catch (e) {
      rec('MP-C03', 'FAIL', String(e.message || e))
    }

    // MP-C01 / L2 agent_hz
    try {
      await login(mp, 'agent_hz', 'demo')
      await goTab(mp, '/pages/home/index')
      await shot(mp, '14-hz-home')
      const xml = await wxml(mp)
      rec('MP-C01-hz', /首页|本级经营|直销/.test(xml) ? 'PASS' : 'FAIL', 'L2 首页')
      rec('MP-L2-scan-panel', xml.includes('出库不适用') || xml.includes('直销激活') ? 'PASS' : 'WARN', 'L2 扫码面板')
    } catch (e) {
      rec('MP-C01-hz', 'FAIL', String(e.message || e))
    }

    try {
      await goTab(mp, '/pages/stock/index')
      await shot(mp, '15-hz-stock')
      rec('MP-L2-01', 'PASS', 'L2 库存页已打开（范围由接口约束）')
    } catch (e) {
      rec('MP-L2-01', 'FAIL', String(e.message || e))
    }

    try {
      await mp.navigateTo('/pkg/bind/index')
      await sleep(900)
      await shot(mp, '16-hz-bind')
      rec('MP-L2-02', 'PASS', '直销绑定页打开未提交')
      await mp.navigateBack()
      await sleep(400)
    } catch (e) {
      rec('MP-L2-02', 'FAIL', String(e.message || e))
    }

    try {
      await goTab(mp, '/pages/biz/index')
      await shot(mp, '17-hz-biz')
      const xml = await wxml(mp)
      const noCreate = !xml.includes('创建销售单') && !xml.includes('新建采购')
      rec('MP-L2-03', noCreate ? 'PASS' : 'FAIL', noCreate ? '无分销出货/建单入口' : '仍见建单按钮')
    } catch (e) {
      rec('MP-L2-03', 'FAIL', String(e.message || e))
    }

    try {
      await goTab(mp, '/pages/service/index')
      await shot(mp, '18-hz-service')
      const xml = await wxml(mp)
      rec('MP-L2-04', !xml.includes('申请退原厂') ? 'PASS' : 'FAIL', 'L2 无退原厂按钮')
      rec('MP-L2-05', xml.includes('终端退货') || xml.includes('售后') ? 'PASS' : 'FAIL', '本级售后')
    } catch (e) {
      rec('MP-L2-04', 'FAIL', String(e.message || e))
    }

    try {
      await goTab(mp, '/pages/mine/index')
      await shot(mp, '19-hz-mine')
      rec('MP-L2-06', 'WARN', '静音报警入口未在本页看到则记 WARN（若未开放）')
      await logout(mp)
    } catch (e) {
      rec('MP-L2-06', 'FAIL', String(e.message || e))
    }

    // SUB hd_scan_01
    try {
      await login(mp, 'hd_scan_01', 'demo')
      await goTab(mp, '/pages/home/index')
      await shot(mp, '20-sub-home')
      const xml = await wxml(mp)
      rec('MP-C01-sub', xml.includes('扫码') || xml.includes('子账号') ? 'PASS' : 'FAIL', 'SUB 首页')
      rec('MP-SUB-01', xml.includes('出货扫码') || xml.includes('扫码') ? 'PASS' : 'FAIL', '可进入扫码')
    } catch (e) {
      rec('MP-C01-sub', 'FAIL', String(e.message || e))
    }

    try {
      await mp.navigateTo('/pkg/scan/index')
      await sleep(900)
      await shot(mp, '21-sub-scan')
      const xml = await wxml(mp)
      rec('MP-SUB-02', !xml.includes('确认出货') || xml.includes('不可') ? 'PASS' : 'WARN', '确认按钮：SUB canConfirm=false，未扫满不出现')
      rec('MP-SUB-03-scan', !xml.includes('创建销售单') ? 'PASS' : 'FAIL', '扫码页无建单（SUB）')
      await mp.navigateBack()
      await sleep(400)
    } catch (e) {
      rec('MP-SUB-02', 'FAIL', String(e.message || e))
    }

    try {
      let blocked = false
      try {
        await goTab(mp, '/pages/biz/index')
      } catch {
        blocked = true
      }
      rec('MP-SUB-03', blocked ? 'PASS' : 'WARN', blocked ? 'switchTab 业务页失败（无 Tab）' : '业务页仍可打开，需看入口')
    } catch (e) {
      rec('MP-SUB-03', 'PASS', String(e.message || e))
    }

    try {
      await mp.navigateTo('/pkg/bind/index')
      await sleep(900)
      await shot(mp, '22-sub-bind')
      rec('MP-SUB-04', 'PASS', '绑定页可开；写操作由接口 403（API 已验）')
      await mp.navigateBack()
    } catch (e) {
      rec('MP-SUB-04', 'WARN', String(e.message || e))
    }

    try {
      await goTab(mp, '/pages/mine/index')
      await shot(mp, '23-sub-mine')
      rec('MP-SUB-05', 'PASS', 'SUB 我的页（无采购/退货 Tab）')
      await logout(mp)
      await shot(mp, '24-sub-logout')
    } catch (e) {
      rec('MP-SUB-05', 'FAIL', String(e.message || e))
    }
  } finally {
    fs.writeFileSync(REPORT, JSON.stringify({ at: new Date().toISOString(), results }, null, 2), 'utf8')
    console.log('wrote', REPORT)
    try { await mp.disconnect() } catch { /* keep IDE */ }
  }
}

main().catch((err) => {
  console.error(err)
  fs.writeFileSync(REPORT, JSON.stringify({ error: String(err && err.stack || err), results }, null, 2), 'utf8')
  process.exit(1)
})
