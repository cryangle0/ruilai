import test from 'node:test'
import assert from 'node:assert/strict'
import {
  aggregateStockRows,
  collectAllPages,
  consumeNavigationIntent,
  createNavigationIntent,
  createRefreshCycleCache,
  exceptionDimension,
  exceptionApiDimension,
  exceptionCountForTab,
  fetchNextPage,
  mergePage,
  salesScanSummary,
  sortStockSns,
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

test('distributed activation requests activate dimension before local classification', () => {
  assert.equal(exceptionApiDimension('activate-direct'), 'activate')
  assert.equal(exceptionApiDimension('activate-dist'), 'activate')
  assert.equal(exceptionApiDimension('stock'), 'stock')
})

test('exception badges use server counts without loading ticket pages', () => {
  const counts = { open: 7, 'activate-direct': 2, 'activate-dist': 3, stock: 2 }
  assert.equal(exceptionCountForTab(counts, 'activate-direct'), 2)
  assert.equal(exceptionCountForTab(counts, 'activate-dist'), 3)
  assert.equal(exceptionCountForTab(counts, 'stock'), 2)
  assert.equal(exceptionCountForTab(counts, 'all'), 7)
})

test('sales scan cards show product and progress', () => {
  assert.deepEqual(salesScanSummary({
    productDetail: '锐涞套件/M×2',
    scanned: ['S1'],
    planTotal: 2,
  }), { product: '锐涞套件/M×2', progress: '1/2' })
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
