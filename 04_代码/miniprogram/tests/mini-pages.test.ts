import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inputEventValue } from '../src/utils/inputValue.ts'
import { scanOrPrompt } from '../src/utils/scan.ts'
import { submitActivationBatch } from '../src/utils/activation.ts'
import {
  aggregateStockRows,
  canExplainException,
  compactSnRanges,
  collectAllPages,
  consumeNavigationIntent,
  createNavigationIntent,
  createRefreshCycleCache,
  exceptionDimension,
  exceptionApiDimension,
  exceptionRequestScope,
  exceptionCountForTab,
  exceptionDimLabel,
  exceptionExplainLabel,
  exceptionExplainText,
  decodeQueryValue,
  fetchNextPage,
  mergePage,
  peekStockDraft,
  purchaseSegmentText,
  purchaseLineRows,
  returnProductRows,
  returnTypeLabel,
  saleProductRows,
  saleProductSections,
  factoryDateText,
  sameStockBelt,
  snRowMatches,
  stockLevelLabel,
  stockSpecText,
  stockRowMatches,
  timelineTone,
  salesScanSummary,
  statusBadge,
  sortStockSns,
  compareOpenThenTime,
} from '../src/utils/miniPages.ts'

test('navigation intent is consumed once by its target only', () => {
  createNavigationIntent({
    target: 'biz',
    tab: 'sales',
    from: '2026-09-01',
    to: '2026-09-08',
    l2Id: 'L2A',
  })

  assert.equal(consumeNavigationIntent('service'), null)
  assert.deepEqual(consumeNavigationIntent('biz'), {
    target: 'biz',
    tab: 'sales',
    from: '2026-09-01',
    to: '2026-09-08',
    l2Id: 'L2A',
  })
  assert.equal(consumeNavigationIntent('biz'), null)
})

test('unhandled exception SNs are sorted first without guessing fields', () => {
  const sns = [{ sn: 'RL3' }, { sn: 'RL1' }, { sn: 'RL2' }]
  const exceptions = [
    { dim: 'activate', target: 'RL2', status: '待处理' },
    { dim: 'activate', target: 'RL3', status: '已处理' },
  ]

  assert.deepEqual(sortStockSns(sns, exceptions).map((row) => row.sn), ['RL2', 'RL3', 'RL1'])
})

test('exception display dimensions map real backend values', () => {
  assert.equal(exceptionDimension({ dim: 'activate', type: '异地激活' }), 'activate-direct')
  assert.equal(exceptionDimension({ dim: 'activate', type: '异地激活', extra: { l2Id: 'L2A' } }), 'activate-dist')
  assert.equal(exceptionDimension({ dim: 'activate', type: '异地激活', l2Id: 'L2A' }), 'activate-dist')
  assert.equal(exceptionDimension({ dim: 'scan', type: '扫码尺码不匹配' }), 'scan')
  assert.equal(exceptionDimension({ dim: 'stock', type: '库存预警' }), 'stock')
})

test('exception explanation controls follow persisted server status and explanation', () => {
  assert.equal(canExplainException({ status: '待处理' }), true)
  assert.equal(canExplainException({ status: '待处理', explainTxt: '已核实' }), false)
  assert.equal(canExplainException({ status: '会签中', explainL2: '二级已说明' }), false)
  assert.equal(canExplainException({ status: '已处理' }), false)
})

test('exception list requests preserve the same server scope used by badge counts', () => {
  assert.equal(exceptionApiDimension('activate-direct'), 'activate-direct')
  assert.equal(exceptionApiDimension('activate-dist'), 'activate-dist')
  assert.equal(exceptionApiDimension('stock'), 'stock')
  assert.deepEqual(exceptionRequestScope({
    dim: 'activate-dist',
    from: '2026-09-01',
    to: '2026-09-30',
    l2Id: 'L2A',
    sn: ' RL-SN-1 ',
  }), {
    dim: 'activate-dist',
    from: undefined,
    to: undefined,
    l2Id: 'L2A',
    sn: 'RL-SN-1',
  })
})

test('exception badges use visible tab counts and ignore scan leftovers', () => {
  const counts = { open: 12, scan: 1, 'activate-direct': 2, 'activate-dist': 3, stock: 2 }
  assert.equal(exceptionCountForTab(counts, 'activate-direct'), 2)
  assert.equal(exceptionCountForTab(counts, 'activate-dist'), 3)
  assert.equal(exceptionCountForTab(counts, 'stock'), 2)
  assert.equal(exceptionCountForTab(counts, 'all'), 7)
})

test('open exceptions sort pending first then newest time', () => {
  const rows = [
    { status: '已处理', occurredAt: '2026-09-04 18:30:49' },
    { status: '待处理', occurredAt: '2026-09-03 03:31:01' },
    { status: '待处理', occurredAt: '2026-09-04 18:30:49' },
  ].sort(compareOpenThenTime)
  assert.equal(rows[0].status, '待处理')
  assert.equal(rows[0].occurredAt, '2026-09-04 18:30:49')
  assert.equal(rows[2].status, '已处理')
})

test('sales scan cards show product and progress', () => {
  assert.deepEqual(salesScanSummary({
    productDetail: '锐涞套件/M×2',
    scanned: ['S1'],
    planTotal: 2,
  }), { product: '锐涞套件/M×2', progress: '1/2' })
})

test('cancelled or failed scanning returns without opening an editable prompt', async () => {
  const originalUni = (globalThis as any).uni
  let promptCalls = 0
  ;(globalThis as any).uni = {
    scanCode: ({ fail }: any) => fail(new Error('scan cancelled')),
    showModal: async () => {
      promptCalls += 1
      return { confirm: false, content: '' }
    },
  }
  try {
    await assert.rejects(scanOrPrompt(), /scan cancelled/)
    assert.equal(promptCalls, 0)
  } finally {
    ;(globalThis as any).uni = originalUni
  }
})

test('activation submits one preview and one commit for the complete SN batch', async () => {
  const calls: Record<string, unknown>[] = []
  const request = async (payload: Record<string, unknown>) => {
    calls.push(payload)
    return { data: { issues: calls.length === 1 ? ['地址预警'] : [] } }
  }

  const result = await submitActivationBatch(
    request,
    { customer: { phone: '13800000000' }, lng: 120, lat: 30 },
    ['S1', 'S2'],
    async (issues) => {
      assert.deepEqual(issues, ['地址预警'])
      return true
    },
  )

  assert.equal(result.committed, true)
  assert.deepEqual(calls, [
    { customer: { phone: '13800000000' }, lng: 120, lat: 30, sns: ['S1', 'S2'], dryRun: true },
    { customer: { phone: '13800000000' }, lng: 120, lat: 30, sns: ['S1', 'S2'] },
  ])
})

test('input events keep typed text instead of wiping the native value', () => {
  assert.equal(inputEventValue({ detail: { value: 'RL1' } }), 'RL1')
  assert.equal(inputEventValue('RL2'), 'RL2')
  assert.equal(inputEventValue({ target: { value: 'abc' } }), 'abc')
  assert.equal(inputEventValue({ detail: { detail: { value: 'nested' } } }), 'nested')
  assert.equal(inputEventValue({ mp: { detail: { value: 'mp' } } }), 'mp')
  assert.equal(inputEventValue({ detail: {} }, 'keep'), 'keep')
  const field = readFileSync(new URL('../src/components/FieldRow.vue', import.meta.url), 'utf8')
  const scan = readFileSync(new URL('../src/pkg/scan/index.vue', import.meta.url), 'utf8')
  const search = readFileSync(new URL('../src/components/SearchBar.vue', import.meta.url), 'utf8')
  const dateBar = readFileSync(new URL('../src/components/DateBar.vue', import.meta.url), 'utf8')
  const bind = readFileSync(new URL('../src/pkg/bind/index.vue', import.meta.url), 'utf8')
  const login = readFileSync(new URL('../src/pages/login/index.vue', import.meta.url), 'utf8')
  const ret = readFileSync(new URL('../src/pkg/return-form/index.vue', import.meta.url), 'utf8')
  const purchase = readFileSync(new URL('../src/pkg/purchase/index.vue', import.meta.url), 'utf8')
  const profile = readFileSync(new URL('../src/pkg/mine-profile/index.vue', import.meta.url), 'utf8')
  const l2 = readFileSync(new URL('../src/pkg/mine-l2/index.vue', import.meta.url), 'utf8')
  const sub = readFileSync(new URL('../src/pkg/mine-sub/index.vue', import.meta.url), 'utf8')
  const detail = readFileSync(new URL('../src/pkg/detail/index.vue', import.meta.url), 'utf8')
  assert.match(field, /const draft = ref/)
  assert.match(field, /onInput\(event/)
  assert.match(field, /virtualHost:\s*true/)
  assert.match(field, /always-embed="true"/)
  assert.match(scan, /data-echo="1"/)
  assert.match(scan, /onManualInput/)
  assert.doesNotMatch(scan, /:disabled="!manualSn\.trim\(\)"/)
  assert.doesNotMatch(scan, /<button class="btn-add"/)
  assert.match(search, /const draft = ref/)
  assert.match(search, /always-embed="true"/)
  assert.match(dateBar, /const snDraft = ref/)
  assert.match(dateBar, /always-embed="true"/)
  assert.match(dateBar, /<slot \/>/)
  assert.match(bind, /name = eventValue\(\$event, name\)/)
  assert.match(bind, /age = eventValue\(\$event, age\)/)
  assert.match(bind, /note = eventValue\(\$event, note\)/)
  assert.match(bind, /<textarea/)
  assert.doesNotMatch(bind, /v-model="name"/)
  assert.doesNotMatch(bind, /<button class="ghost" @click="step=1"/)
  assert.doesNotMatch(bind, /<button class="btn-p" @click="addInputSn"/)
  assert.doesNotMatch(login, /<button class="submit"/)
  assert.match(login, /username = eventValue\(\$event, username\)/)
  assert.match(login, /<PrivacyPopup/)
  assert.doesNotMatch(login, /<scroll-view/)
  const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(app, /<PrivacyPopup/)
  assert.doesNotMatch(app, /hideTabBar/)
  assert.doesNotMatch(login, /hideTabBar/)
  const home = readFileSync(new URL('../src/pages/home/index.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(home, /hideTabBar/)
  const manifest = readFileSync(new URL('../src/manifest.json', import.meta.url), 'utf8')
  assert.match(manifest, /"es6": false/)
  assert.match(manifest, /"minified": false/)
  assert.doesNotMatch(ret, /FieldRow/)
  assert.match(ret, /snsText = eventValue\(\$event, snsText\)/)
  assert.doesNotMatch(ret, /<button class="btn-p"/)
  assert.doesNotMatch(purchase, /FieldRow/)
  assert.match(purchase, /customQty = eventValue\(\$event, customQty\)/)
  assert.doesNotMatch(purchase, /<button class="add-line"/)
  assert.doesNotMatch(profile, /FieldRow/)
  assert.match(profile, /name = eventValue\(\$event, name\)/)
  assert.doesNotMatch(l2, /FieldRow/)
  assert.match(l2, /loginPassword = 'demo'/)
  assert.match(l2, /cityAllowed/)
  assert.doesNotMatch(sub, /FieldRow/)
  assert.doesNotMatch(detail, /FieldRow/)
  assert.match(detail, /explain = eventValue\(\$event, explain\)/)
})

test('corner badges sit at the top-right instead of inline', () => {
  const seg = readFileSync(new URL('../src/components/SegBar.vue', import.meta.url), 'utf8')
  const home = readFileSync(new URL('../src/pages/home/index.vue', import.meta.url), 'utf8')
  assert.match(seg, /@include rl-corner-badge/)
  assert.doesNotMatch(seg, /margin-left:\s*6rpx/)
  assert.match(home, /@include rl-corner-badge/)
  assert.match(home, /<view v-if="home\.pendingPo" class="badge">/)
  assert.doesNotMatch(home, /id: 'scan', title: '扫码', badge:/)
  assert.doesNotMatch(home, /采购统计' \}<text v-if="home\.pendingPo"/)
})

test('business tabs expose only actionable badges and readable SN ranges', () => {
  assert.equal(statusBadge('pending', 3, ['pending', 'cosigning']), 3)
  assert.equal(statusBadge('approved', 9, ['pending', 'cosigning']), undefined)
  assert.equal(purchaseSegmentText({ segments: { M: ['RL100-RL102'] } }), '号段：RL100-RL102')
  assert.deepEqual(compactSnRanges(['RL100', 'RL101', 'RL103']), ['RL100-RL101', 'RL103'])
})

test('batch seven pages keep redesigned order and stock detail contracts', () => {
  const biz = readFileSync(new URL('../src/pages/biz/index.vue', import.meta.url), 'utf8')
  const detail = readFileSync(new URL('../src/pkg/detail/index.vue', import.meta.url), 'utf8')
  const purchase = readFileSync(new URL('../src/pkg/purchase/index.vue', import.meta.url), 'utf8')
  const stock = readFileSync(new URL('../src/pages/stock/index.vue', import.meta.url), 'utf8')
  const home = readFileSync(new URL('../src/pages/home/index.vue', import.meta.url), 'utf8')
  assert.match(biz, /title: '已驳回'/)
  assert.match(biz, /purchaseSegmentText\(r\)/)
  assert.doesNotMatch(stock, /title: '在库SN', badge:/)
  assert.match(detail, /标准品/)
  assert.match(detail, /商品明细/)
  assert.match(detail, /完整流转/)
  assert.match(detail, /class="timeline"/)
  assert.match(detail, /商品信息/)
  assert.match(detail, /查看在库SN/)
  assert.match(purchase, /提交销售单（购物车）/)
  assert.match(purchase, /标准套件/)
  assert.match(purchase, /\.\.\.payload\.lines, \.\.\.payload\.customLines/)
  assert.match(home, /padding: 0 32rpx 8rpx/)
  assert.doesNotMatch(home, /padding: 0 32rpx 240rpx/)
  assert.match(home, /compact/)
})

test('purchase and sale detail helpers keep prototype tables', () => {
  assert.deepEqual(purchaseLineRows(
    [{ productId: 'P1', productName: '锐涞经典款套件', size: 'M', belt: '腰带M', qty: 10 }],
    { P1_M_腰带M: ['RL202608010001-RL202608010010'] },
  ), [{
    product: '锐涞经典款套件',
    size: 'M',
    belt: '腰带M',
    qty: 10,
    segments: 'RL202608010001-RL202608010010',
    segQty: 10,
  }])
  assert.deepEqual(saleProductRows({
    productName: '锐涞经典款套件',
    lines: [{ productId: 'P1', productName: '锐涞经典款套件', size: 'M', belt: '腰带M', qty: 2 }],
    snRows: [{ size: 'M', belt: '腰带M' }],
  }), [{
    product: '锐涞经典款套件',
    size: 'M',
    belt: '腰带M',
    plan: 2,
    scanned: 1,
  }])
  assert.equal(factoryDateText('RL202607200009', '2026-07-20T00:00:00'), '2026-07-20')
  assert.equal(timelineTone({ title: '异常：扫码尺码不匹配', type: 'exception' }), 'danger')
  assert.equal(timelineTone({ title: '直售客户退货', type: 'return' }), 'warn')
})

test('sales detail separates standard nonstandard and single product rows', () => {
  const sections = saleProductSections({
    lines: [
      { productName: '康复弹力套件', category: 'standard', size: 'SS', belt: '腰带S', qty: 1 },
      { productName: '康复弹力套件', category: 'nonstandard', size: 'M', belt: '腰带S', qty: 2 },
      { productName: '护膝单品', category: 'single', size: 'L', belt: '', qty: 3 },
    ],
    snRows: [],
  })

  assert.deepEqual(sections.standard.map((row) => [row.size, row.belt]), [['SS', '腰带S']])
  assert.deepEqual(sections.nonstandard.map((row) => [row.size, row.belt]), [['M', '腰带S']])
  assert.deepEqual(sections.single.map((row) => [row.product, row.size]), [['护膝单品', 'L']])
})

test('batch eight after-sales pages keep status, multi-SN and customer contracts', () => {
  const service = readFileSync(new URL('../src/pages/service/index.vue', import.meta.url), 'utf8')
  const form = readFileSync(new URL('../src/pkg/return-form/index.vue', import.meta.url), 'utf8')
  const detail = readFileSync(new URL('../src/pkg/detail/index.vue', import.meta.url), 'utf8')
  const constants = readFileSync(new URL('../src/utils/constants.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(service, /title: '二级退一级', badge:/)
  assert.match(service, /id: 'pending', title: '待审核', badge:/)
  assert.match(service, /id: 'rejected', title: '已驳回'/)
  assert.match(service, /label="二级代理"/)
  assert.match(form, /snsText = eventValue\(\$event, snsText\)/)
  assert.match(form, /class="sn-textarea"/)
  assert.match(form, /v-for="sn in sns"/)
  assert.match(detail, /销售客户信息/)
  assert.match(detail, /snDetail/)
  assert.match(detail, /凭证图片/)
  assert.match(constants, /done: '已通过'/)
})

test('stock detail query puts belt in the URL and decodes leftover encodings', () => {
  const stock = readFileSync(new URL('../src/pages/stock/index.vue', import.meta.url), 'utf8')
  const detail = readFileSync(new URL('../src/pkg/detail/index.vue', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const home = readFileSync(new URL('../src/pages/home/index.vue', import.meta.url), 'utf8')
  assert.match(stock, /belt=\$\{encodeURIComponent/)
  assert.match(stock, /saveStockDraft/)
  assert.match(detail, /peekStockDraft/)
  assert.match(detail, /buildStockDetail/)
  assert.match(detail, /stockSpecText/)
  assert.match(app, /min-height: 0/)
  assert.doesNotMatch(home, /min-height: 100vh/)
  assert.equal(decodeQueryValue('%E8%85%B0%E5%B8%A6M'), '腰带M')
  assert.equal(decodeQueryValue('腰带M'), '腰带M')
  assert.equal(stockSpecText('M', '腰带M'), 'M+腰带M')
  assert.equal(stockSpecText('M', '%E8%85%B0%E5%B8%A6M'), 'M+腰带M')
  assert.equal(sameStockBelt('腰带M', '%E8%85%B0%E5%B8%A6M'), true)
  assert.equal(stockRowMatches({ productId: 'P1', size: 'M', belt: '腰带M' }, 'P1', 'M', '%E8%85%B0%E5%B8%A6M'), true)
  assert.equal(snRowMatches({ productId: 'P1', sizeCode: 'M', belt: '腰带M' }, 'P1', 'M', '腰带M'), true)
  assert.equal(typeof peekStockDraft, 'function')
  assert.equal(stockLevelLabel({ agentType: 'l1', status: 'l1' }), '一级在库')
  assert.deepEqual(returnProductRows([
    { productName: '锐涞经典款套件', spec: 'M+腰带M' },
    { productName: '锐涞经典款套件', spec: 'M+腰带M' },
  ]), [{ product: '锐涞经典款套件', spec: 'M+腰带M', qty: 2 }])
  assert.equal(returnTypeLabel('l2_to_l1'), '二级退一级')
  assert.equal(exceptionDimLabel({ dim: 'activate', extra: { l2Id: 'L2A' } }), '分销激活异常')
  assert.equal(exceptionExplainLabel({ dim: 'activate', extra: { l2Id: 'L2A' } }), '二级解释')
  assert.equal(exceptionExplainText({ dim: 'activate', extra: { l2Id: 'L2A' }, explainL2: '出差' }), '出差')
})

test('complete paging keeps page size stable and removes repeated rows', async () => {
  const calls: Array<{ page: number; pageSize: number }> = []
  const result = await collectAllPages(async (page, pageSize) => {
    calls.push({ page, pageSize })
    if (page === 1) return { total: 4, list: [{ id: '1' }, { id: '2' }] }
    return { total: 4, list: [{ id: '2' }, { id: '3' }, { id: '4' }] }
  }, 2)

  assert.deepEqual(calls, [{ page: 1, pageSize: 2 }, { page: 2, pageSize: 2 }])
  assert.deepEqual(result.list.map((row) => row.id), ['1', '2', '3', '4'])
})

test('complete paging stops when an entire page repeats', async () => {
  const calls: number[] = []
  const result = await collectAllPages(async (page) => {
    calls.push(page)
    return { total: 4, list: [{ id: '1' }, { id: '2' }] }
  }, 2)

  assert.deepEqual(calls, [1, 2])
  assert.deepEqual(result.list.map((row) => row.id), ['1', '2'])
})

test('show request cache deduplicates only inside one refresh cycle', async () => {
  const cache = createRefreshCycleCache()
  let loads = 0
  const load = async () => ({ value: ++loads })

  cache.begin()
  const [first, duplicate] = await Promise.all([
    cache.run('badge:all', load),
    cache.run('badge:all', load),
  ])
  assert.deepEqual(first, duplicate)
  assert.equal(loads, 1)

  cache.begin()
  const refreshed = await cache.run('badge:all', load)
  assert.equal(refreshed.value, 2)
  assert.equal(loads, 2)
})

test('stock summary rows aggregate by product, size and belt with unique key', () => {
  const rows = aggregateStockRows([
    { productId: 'P1', productName: '套件', size: 'M', belt: '腰带M', qty: 2, sns: ['S1'] },
    { productId: 'P1', productName: '套件', size: 'M', belt: '腰带M', qty: 3, sns: ['S2', 'S3'] },
    { productId: 'P1', productName: '套件', size: 'L', belt: '腰带L', qty: 1, sns: ['S4'] },
  ])

  assert.deepEqual(rows, [
    { key: 'P1::M::腰带M', productId: 'P1', productName: '套件', size: 'M', belt: '腰带M', qty: 5, sns: ['S1', 'S2', 'S3'] },
    { key: 'P1::L::腰带L', productId: 'P1', productName: '套件', size: 'L', belt: '腰带L', qty: 1, sns: ['S4'] },
  ])
})

test('page merge de-duplicates rows and reports completeness', () => {
  const first = mergePage([], [{ id: '1' }, { id: '2' }], 3)
  assert.equal(first.hasMore, true)
  const second = mergePage(first.list, [{ id: '2' }, { id: '3' }], 3)
  assert.deepEqual(second.list.map((row) => row.id), ['1', '2', '3'])
  assert.equal(second.hasMore, false)
})

test('failed next-page requests do not advance the committed page', async () => {
  let committedPage = 2
  const requestedPages: number[] = []
  const request = async (page: number) => {
    requestedPages.push(page)
    throw new Error('网络不可用')
  }

  await assert.rejects(fetchNextPage(committedPage, request), /网络不可用/)
  assert.equal(committedPage, 2)
  assert.deepEqual(requestedPages, [3])

  const successful = await fetchNextPage(committedPage, async (page) => ({
    page,
    result: { list: [{ sn: 'S3' }], total: 3 },
  }))
  committedPage = successful.page
  assert.equal(committedPage, 3)
})

test('stock SN priority uses only open activation exceptions and related SNs', () => {
  const sns = [{ sn: 'S1' }, { sn: 'S2' }, { sn: 'S3' }, { sn: 'S4' }]
  const exceptions = [
    { dim: 'activate', target: 'customer', relatedSns: ['S3'], status: '待处理' },
    { dim: 'scan', target: 'S1', status: '待处理' },
    { dim: 'stock', target: 'S2', status: '待处理' },
    { dim: 'activate', target: 'S4', status: '已处理' },
  ]

  assert.deepEqual(sortStockSns(sns, exceptions).map((row) => row.sn), ['S3', 'S1', 'S2', 'S4'])
})
