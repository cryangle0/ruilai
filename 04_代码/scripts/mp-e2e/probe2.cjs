const automator = require('miniprogram-automator')
const path = require('path')
const OUT = path.resolve(__dirname, '..', '..', '..', 'docs', 'test-evidence', 'mp-2026-09-03')

;(async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })
  mp.on('console', (msg) => console.log('console', JSON.stringify(msg)))
  mp.on('exception', (msg) => console.log('exception', JSON.stringify(msg)))
  await new Promise((r) => setTimeout(r, 500))

  for (const fn of [
    () => mp.evaluate(() => {
      try { return getCurrentPages().map((p) => p.route || p.__route__) } catch (e) { return String(e) }
    }),
    () => mp.callWxMethod('reLaunch', { url: '/pages/login/index' }),
    () => mp.reLaunch('/pages/login/index'),
  ]) {
    try { console.log('ok', JSON.stringify(await fn())) }
    catch (e) { console.log('fail', e.message) }
  }

  await new Promise((r) => setTimeout(r, 2500))
  try {
    console.log('pages', JSON.stringify(await mp.evaluate(() => {
      try { return getCurrentPages().map((p) => p.route || p.__route__) } catch (e) { return String(e) }
    })))
  } catch (e) { console.log('eval fail', e.message) }

  await mp.screenshot({ path: path.join(OUT, 'probe-after-relaunch.png') })
  console.log('shot after relaunch')
  try { await mp.disconnect() } catch {}
})().catch((e) => { console.error(e); process.exit(1) })
