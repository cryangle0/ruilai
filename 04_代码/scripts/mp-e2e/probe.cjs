const automator = require('miniprogram-automator')
const path = require('path')
const OUT = path.resolve(__dirname, '..', '..', '..', 'docs', 'test-evidence', 'mp-2026-09-03')

;(async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })
  const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(mp))
  console.log('methods', proto.join(','))
  for (const name of ['screenshot', 'systemInfo', 'pageStack', 'currentPage', 'evaluate', 'callWxMethod']) {
    try {
      if (name === 'screenshot') {
        const p = path.join(OUT, 'probe-screenshot.png')
        await mp.screenshot({ path: p })
        console.log('screenshot OK', p)
      } else if (name === 'systemInfo') {
        console.log('systemInfo', JSON.stringify(await mp.systemInfo()))
      } else if (name === 'pageStack') {
        console.log('pageStack', await mp.pageStack())
      } else if (name === 'currentPage') {
        const page = await mp.currentPage()
        console.log('currentPage', page && page.path)
      } else if (name === 'evaluate') {
        const r = await mp.evaluate(() => ({ href: location && location.href }))
        console.log('evaluate', r)
      } else if (name === 'callWxMethod') {
        const r = await mp.callWxMethod('getSystemInfoSync')
        console.log('callWxMethod', r)
      }
    } catch (e) {
      console.log(name, 'FAIL', e.message)
    }
  }
  try { await mp.disconnect() } catch {}
})().catch((e) => { console.error(e); process.exit(1) })
