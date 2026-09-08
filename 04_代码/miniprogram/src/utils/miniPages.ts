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

export function createNavigationIntent(intent: NavigationIntent) {
  navigationIntent = { ...intent }
}

export function consumeNavigationIntent(target: MiniTarget) {
  if (!navigationIntent || navigationIntent.target !== target) return null
  const intent = navigationIntent
  navigationIntent = null
  return intent
}

export function isOpenException(row: Record<string, any>) {
  return ['待处理', '会签中', 'pending', 'cosigning', 'open'].includes(String(row.status || ''))
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
  const key = tab === 'all' ? 'open' : tab
  return Number(counts[key]) || 0
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
    const key = String(row.id ?? row.sn ?? keyed.size)
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
