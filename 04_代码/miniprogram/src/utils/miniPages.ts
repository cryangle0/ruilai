export type MiniTarget = 'biz' | 'service'

export interface NavigationIntent {
  target: MiniTarget
  tab: string
  from?: string
  to?: string
  l2Id?: string
  status?: string
  dimension?: string
}

let navigationIntent: NavigationIntent | null = null

function storageApi() {
  const g = globalThis as { uni?: { setStorageSync: Function; getStorageSync: Function; removeStorageSync: Function } }
  if (g.uni) return g.uni
  try {
    // eslint-disable-next-line no-undef
    if (typeof uni !== 'undefined') return uni
  } catch { /* tests have no uni */ }
  return null
}

function persistIntent(intent: NavigationIntent | null) {
  try {
    const storage = storageApi()
    if (!storage) return
    if (intent) storage.setStorageSync('rl_nav_intent', intent)
    else storage.removeStorageSync('rl_nav_intent')
  } catch { /* storage is optional in unit tests */ }
}

function readPersistedIntent(): NavigationIntent | null {
  try {
    const row = storageApi()?.getStorageSync?.('rl_nav_intent')
    return row && typeof row === 'object' ? row as NavigationIntent : null
  } catch {
    return null
  }
}

export function createNavigationIntent(intent: NavigationIntent) {
  navigationIntent = { ...intent }
  persistIntent(navigationIntent)
}

export function consumeNavigationIntent(target: MiniTarget) {
  const stored = readPersistedIntent()
  const intent = stored || navigationIntent
  if (!intent || intent.target !== target) return null
  navigationIntent = null
  persistIntent(null)
  return intent
}

export function isOpenException(row: Record<string, any>) {
  return ['待处理', '会签中', 'pending', 'cosigning', 'open'].includes(String(row.status || ''))
}

export function compareOpenThenTime(a: Record<string, any>, b: Record<string, any>) {
  const openDiff = Number(isOpenException(b)) - Number(isOpenException(a))
  if (openDiff) return openDiff
  return String(b.occurredAt || b.createdAt || '').localeCompare(String(a.occurredAt || a.createdAt || ''))
}

export function exceptionDimension(row: Record<string, any>) {
  const dim = String(row.dim || '')
  const type = String(row.type || '')
  const normalized = /超量|库存|压货|周转|下单预警/.test(type)
    ? 'stock'
    : ['scan', 'activate', 'stock'].includes(dim)
      ? dim
      : dim === 'nonSn'
        ? 'scan'
        : dim === 'sn' || /激活|归属地|客户信息|跨区/.test(type)
          ? 'activate'
          : /扫码|尺码不匹配|不在库/.test(type)
            ? 'scan'
            : 'activate'
  if (normalized === 'stock' || normalized === 'scan') return normalized
  const l2Id = row.l2Id || row.extra?.l2Id
  return l2Id ? 'activate-dist' : 'activate-direct'
}

export function exceptionApiDimension(tab: string) {
  if (tab === 'activate-direct' || tab === 'activate-dist') return 'activate'
  if (tab === 'scan') return 'scan'
  return 'stock'
}

export function exceptionCountForTab(counts: Record<string, unknown>, tab: string) {
  if (tab === 'all') {
    return (['activate-direct', 'activate-dist', 'stock'] as const)
      .reduce((sum, key) => sum + (Number(counts[key]) || 0), 0)
  }
  return Number(counts[tab]) || 0
}

export function salesScanSummary(row: Record<string, any>) {
  const product = String(
    row.productDetail
      || row.productName
      || row.lines?.map((line: any) => line.productName || line.productId).filter(Boolean).join('、')
      || row.productId
      || '商品待补充',
  )
  const scanned = Array.isArray(row.scanned) ? row.scanned.length : 0
  const total = Number(row.planTotal) || 0
  return { product, progress: `${scanned}/${total}` }
}

export function statusBadge(status: string, count: unknown, visible: readonly string[]) {
  if (!visible.includes(status)) return undefined
  return Number(count) || undefined
}

export function compactSnRanges(values: unknown[]) {
  const sns = values.map(String).filter(Boolean).sort()
  const out: string[] = []
  for (let i = 0; i < sns.length;) {
    let end = i
    const match = sns[i].match(/^(.*?)(\d+)$/)
    while (match && end + 1 < sns.length) {
      const next = sns[end + 1].match(/^(.*?)(\d+)$/)
      if (!next || next[1] !== match[1] || Number(next[2]) !== Number(match[2]) + end - i + 1) break
      end++
    }
    out.push(end > i ? `${sns[i]}-${sns[end]}` : sns[i])
    i = end + 1
  }
  return out
}

export function purchaseSegmentText(row: Record<string, any>) {
  const values = Object.values(row.segments || {})
    .flatMap((value: any) => Array.isArray(value) ? value : [value])
    .map(String).filter(Boolean)
  return values.length ? `号段：${values.join('、')}` : '暂无号段'
}

export function purchaseLineKey(line: Record<string, any>) {
  return `${line.productId || ''}_${line.size || ''}_${line.belt || ''}`
}

export function segmentQty(seg: unknown) {
  const bits = String(seg || '').split('-')
  const from = (bits[0] || '').trim().toUpperCase()
  const to = (bits.length > 1 ? bits.slice(1).join('-') : from).trim().toUpperCase()
  if (!from) return 0
  if (!/^RL\d{5,}$/.test(from) || !/^RL\d{5,}$/.test(to)) return 0
  const prefix = from.slice(0, -4)
  if (!to.startsWith(prefix) || to.length !== from.length) return 0
  const a = Number(from.slice(-4))
  const b = Number(to.slice(-4))
  if (!Number.isInteger(a) || !Number.isInteger(b) || b < a || b - a > 5000) return 0
  return b - a + 1
}

export function purchaseLineRows(lines: unknown, segments: Record<string, any> = {}) {
  if (!Array.isArray(lines)) return []
  return lines.map((raw) => {
    const line = raw && typeof raw === 'object' ? raw as Record<string, any> : {}
    const segs = ([] as unknown[])
      .concat(segments[purchaseLineKey(line)] || [])
      .map(String)
      .filter(Boolean)
    return {
      product: String(line.productName || line.name || line.productId || '商品'),
      size: String(line.size || '—'),
      belt: String(line.belt || '—'),
      qty: Number(line.qty) || 0,
      segments: segs.join('；') || '—',
      segQty: segs.reduce((n, item) => n + segmentQty(item), 0),
    }
  })
}

export function purchasePartRows(parts: unknown) {
  if (!Array.isArray(parts)) return []
  return parts.map((raw) => {
    const row = raw && typeof raw === 'object' ? raw as Record<string, any> : {}
    return {
      product: String(row.productName || row.name || row.partId || row.productId || '配件'),
      spec: String(row.spec || row.size || '—'),
      qty: Number(row.qty) || 0,
    }
  })
}

export function saleProductRows(sale: Record<string, any>) {
  const scanned = Array.isArray(sale.snRows) ? sale.snRows : []
  const parts = (Array.isArray(sale.parts) ? sale.parts : []).map((row: Record<string, any>) => ({
    product: `${row.partName || row.productName || row.partId || '配件'}（配件）`,
    size: '—',
    belt: String(row.spec || '—'),
    plan: Number(row.qty) || 0,
    scanned: '—',
  }))
  if (Array.isArray(sale.lines) && sale.lines.length) {
    return [
      ...sale.lines.map((line: Record<string, any>) => ({
        product: String(line.productName || sale.productName || line.productId || '商品'),
        size: String(line.size || '—'),
        belt: String(line.belt || '—'),
        plan: Number(line.qty) || 0,
        scanned: scanned.filter((item: any) => item.size === line.size && (!line.belt || item.belt === line.belt)).length,
      })),
      ...parts,
    ]
  }
  const plan = sale.planBySize || {}
  return [
    ...Object.keys(plan).map((size) => ({
      product: String(sale.productName || sale.productId || '商品'),
      size,
      belt: String(scanned.find((item: any) => item.size === size)?.belt || '—'),
      plan: Number(plan[size] || 0),
      scanned: scanned.filter((item: any) => item.size === size).length,
    })),
    ...parts,
  ]
}

export function factoryDateText(sn?: string, factoryAt?: string | number | null) {
  const match = String(sn || '').match(/^RL(\d{4})(\d{2})(\d{2})/i)
  if (match) {
    const stamp = `${match[1]}-${match[2]}-${match[3]}`
    if (!Number.isNaN(Date.parse(`${stamp}T00:00:00`))) return stamp
  }
  if (factoryAt == null || factoryAt === '') return '—'
  const text = String(factoryAt)
  const day = text.match(/^(\d{4}-\d{2}-\d{2})/)
  return day ? day[1] : text.slice(0, 10) || '—'
}

export function noteRows(extra: Record<string, any> | undefined, key: string) {
  const arr = extra?.[key]
  if (!Array.isArray(arr) || !arr.length) return []
  return arr.map((item) => {
    if (item && typeof item === 'object') {
      const note = item as Record<string, unknown>
      return { date: String(note.date || ''), text: String(note.text || '') }
    }
    return { date: '', text: String(item || '') }
  }).filter((row) => row.text.trim())
}

export function timelineTone(event: { title?: string; type?: string }) {
  const title = String(event.title || '')
  const type = String(event.type || '')
  if (type === 'exception' || title.includes('异常')) return 'danger'
  if (type === 'return' || title.includes('退货')) return 'warn'
  return 'ok'
}

export function cendCustomer(sale: Record<string, any>) {
  const customer = sale.customer || {}
  const snUser = (Array.isArray(sale.snRows) ? sale.snRows : [])
    .map((row: any) => row.customer)
    .find(Boolean) || {}
  return {
    name: customer.name || snUser.name || '—',
    gender: customer.gender || snUser.gender || '—',
    age: customer.age || snUser.age || '—',
    phone: customer.phone || snUser.phone || '—',
    region: customer.phoneLoc || snUser.phoneLoc || customer.region || '—',
    addr: customer.addr || customer.address || snUser.addr || '—',
  }
}

export function agentDisplay(row: Record<string, any>, kind: 'l1' | 'l2') {
  if (kind === 'l1') return row.l1Name || row.l1Id || '—'
  return row.l2Name || row.l2Id || '—'
}

export function decodeQueryValue(value?: string | number | null) {
  let out = value == null ? '' : String(value)
  if (!out) return ''
  for (let i = 0; i < 2; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(out)) break
    try { out = decodeURIComponent(out.replace(/\+/g, '%20')) } catch { break }
  }
  return out
}

export function stockBeltText(belt?: string | number | null) {
  return decodeQueryValue(belt).replace(/^腰带/, '')
}

export function sameStockBelt(a?: string | number | null, b?: string | number | null) {
  return stockBeltText(a) === stockBeltText(b)
}

export function stockSpecText(size?: string, belt?: string) {
  const s = decodeQueryValue(size)
  const b = stockBeltText(belt)
  return b ? `${s || ''}+腰带${b}` : (s || '—')
}

export function stockRowMatches(row: Record<string, any> | null | undefined, productId: string, size: string, belt: string) {
  const r = row || {}
  return String(r.productId || '') === String(productId || '')
    && String(r.size || r.sizeCode || '') === String(size || '')
    && sameStockBelt(r.belt, belt)
}

export function snRowMatches(row: Record<string, any> | null | undefined, productId: string, size: string, belt: string) {
  const r = row || {}
  if (String(r.productId || '') !== String(productId || '')) return false
  if (size && String(r.sizeCode || r.size || '') !== String(size)) return false
  if (belt && !sameStockBelt(r.belt, belt)) return false
  return true
}

export function stockLevelLabel(row: Record<string, any> = {}) {
  if (row.agentType === 'l2' || row.status === 'l2') return '二级在库'
  if (row.status === 'warehouse') return '原厂在库'
  if (row.status === 'bound') return '已销售'
  return '一级在库'
}

export function returnTypeLabel(type?: string, fallback?: string) {
  return ({
    l2_to_l1: '二级退一级',
    user: '终端退货',
    l1_to_factory: '一级退原厂',
  } as Record<string, string>)[String(type || '')] || fallback || type || '退货'
}

export function returnProductRows(snDetail: unknown) {
  if (!Array.isArray(snDetail)) return []
  const grouped = new Map<string, { product: string; spec: string; qty: number }>()
  for (const raw of snDetail) {
    const row = raw && typeof raw === 'object' ? raw as Record<string, any> : {}
    const product = String(row.productName || row.productId || '商品')
    const spec = String(row.spec || stockSpecText(row.size, row.belt))
    const key = `${product}::${spec}`
    const current = grouped.get(key) || { product, spec, qty: 0 }
    current.qty += Number(row.qty) || 1
    grouped.set(key, current)
  }
  return [...grouped.values()]
}

export function exceptionDimLabel(row: Record<string, any>) {
  return ({
    'activate-direct': '直售激活异常',
    'activate-dist': '分销激活异常',
    stock: '销售库存异常',
    scan: '扫码异常',
  } as Record<string, string>)[exceptionDimension(row)] || row.dim || '异常'
}

export function exceptionExplainLabel(row: Record<string, any>) {
  return exceptionDimension(row) === 'activate-dist' ? '二级解释' : '一级解释'
}

export function exceptionExplainText(row: Record<string, any>) {
  return exceptionDimension(row) === 'activate-dist'
    ? String(row.explainL2 || row.explainTxt || '')
    : String(row.explainTxt || row.explainL2 || '')
}

const STOCK_DETAIL_KEY = 'rl_stock_detail'
const STOCK_FILTER_KEY = 'rl_stock_filter'

export function saveStockDraft(row: Record<string, any>) {
  try { storageApi()?.setStorageSync?.(STOCK_DETAIL_KEY, row) } catch { /* storage optional in tests */ }
}

export function peekStockDraft() {
  try {
    const row = storageApi()?.getStorageSync?.(STOCK_DETAIL_KEY)
    return row && typeof row === 'object' ? row as Record<string, any> : null
  } catch {
    return null
  }
}

export function consumeStockDraft() {
  try {
    const storage = storageApi()
    const row = storage?.getStorageSync?.(STOCK_DETAIL_KEY)
    storage?.removeStorageSync?.(STOCK_DETAIL_KEY)
    return row && typeof row === 'object' ? row as Record<string, any> : null
  } catch {
    return null
  }
}

export function saveStockFilter(row: Record<string, any>) {
  try { storageApi()?.setStorageSync?.(STOCK_FILTER_KEY, row) } catch { /* storage optional in tests */ }
}

export function consumeStockFilter() {
  try {
    const storage = storageApi()
    const row = storage?.getStorageSync?.(STOCK_FILTER_KEY)
    storage?.removeStorageSync?.(STOCK_FILTER_KEY)
    return row && typeof row === 'object' ? row as Record<string, any> : null
  } catch {
    return null
  }
}

export function visibleSnTags(tags?: unknown) {
  return (Array.isArray(tags) ? tags : [])
    .map(String)
    .filter((tag) => tag && tag !== '修理过' && tag !== '个性化')
}

export function aggregateStockRows(rows: Array<Record<string, any>>) {
  const grouped = new Map<string, Record<string, any>>()
  for (const row of rows) {
    const productId = String(row.productId || '')
    const size = String(row.size || row.sizeCode || '')
    const belt = String(row.belt || '')
    const key = `${productId}::${size}::${belt}`
    const current = grouped.get(key)
    const sns = Array.isArray(row.sns) ? row.sns.map(String) : []
    if (current) {
      current.qty += Number(row.qty) || 0
      current.sns = [...new Set([...current.sns, ...sns])]
    } else {
      grouped.set(key, {
        key,
        productId,
        productName: row.productName || productId,
        size,
        belt,
        qty: Number(row.qty) || 0,
        sns: [...new Set(sns)],
      })
    }
  }
  return [...grouped.values()]
}

export function sortStockSns<T extends { sn?: string }>(
  rows: T[],
  exceptions: Array<Record<string, any>>,
) {
  const marked = stockExceptionSnSet(exceptions)
  return rows
    .map((row, index) => ({ row, index, marked: marked.has(String(row.sn || '')) }))
    .sort((a, b) => Number(b.marked) - Number(a.marked) || a.index - b.index)
    .map(({ row }) => row)
}

export function stockExceptionSnSet(exceptions: Array<Record<string, any>>) {
  return new Set(
    exceptions
      .filter((row) => isOpenException(row) && exceptionDimension(row).startsWith('activate-'))
      .flatMap((row) => [
        String(row.target || ''),
        ...(Array.isArray(row.relatedSns) ? row.relatedSns.map(String) : []),
        ...(Array.isArray(row.extra?.relatedSns) ? row.extra.relatedSns.map(String) : []),
      ])
      .filter(Boolean),
  )
}

export function mergePage<T extends { id?: string | number; sn?: string }>(
  current: T[],
  incoming: T[],
  total: number,
) {
  const keyed = new Map<string, T>()
  for (const row of [...current, ...incoming]) {
    const key = String(row.id != null ? row.id : row.sn != null ? row.sn : keyed.size)
    keyed.set(key, row)
  }
  const list = [...keyed.values()]
  return { list, hasMore: list.length < total }
}

export async function fetchNextPage<T>(
  currentPage: number,
  fetchPage: (page: number) => Promise<T>,
) {
  const page = currentPage + 1
  const result = await fetchPage(page)
  return { page, result }
}

export async function collectAllPages<T extends { id?: string | number; sn?: string }>(
  fetchPage: (page: number, pageSize: number) => Promise<{ total: number; list: T[] }>,
  pageSize = 100,
) {
  let page = 1
  let total = 0
  let list: T[] = []
  while (page === 1 || list.length < total) {
    const result = await fetchPage(page, pageSize)
    total = Number(result.total) || 0
    const merged = mergePage(list, result.list || [], total)
    if (page > 1 && merged.list.length === list.length) break
    list = merged.list
    if (!(result.list || []).length) break
    page += 1
  }
  return { total, list }
}

export function createRefreshCycleCache() {
  let requests = new Map<string, Promise<unknown>>()
  return {
    begin() {
      requests = new Map()
    },
    run<T>(key: string, loader: () => Promise<T>): Promise<T> {
      const current = requests.get(key)
      if (current) return current as Promise<T>
      const request = loader()
      requests.set(key, request)
      return request
    },
  }
}
