import type { LocationQuery, LocationQueryValue, RouteLocationRaw } from 'vue-router'
import { monthStart, todayDate } from '@/utils/dates'

export type AgentBack = 'l1' | 'l2'

export type JumpOpts = {
  tab?: string
  kind?: string
  status?: string
  hist?: boolean
  from?: string
  to?: string
}

function qstr(v: LocationQueryValue | LocationQueryValue[] | undefined) {
  if (v == null) return ''
  return String(Array.isArray(v) ? v[0] : v)
}

/** Read a single query string from the current route. */
export function routeQ(query: LocationQuery, key: string) {
  return qstr(query[key])
}

export function applyListDates(
  target: { from?: unknown; to?: unknown },
  routeQuery?: LocationQuery,
) {
  if (routeQ(routeQuery || {}, 'hist') === '1') {
    target.from = ''
    target.to = ''
    return
  }
  const from = routeQ(routeQuery || {}, 'from') || String(target.from || '')
  const to = routeQ(routeQuery || {}, 'to') || String(target.to || '')
  target.from = from || monthStart()
  target.to = to || todayDate()
}

/** 侧栏直接进入：默认不限日期，避免角标有数但列表被「本月」筛空 */
export function applyListDatesWide(
  target: { from?: unknown; to?: unknown },
  routeQuery?: LocationQuery,
) {
  if (routeQ(routeQuery || {}, 'hist') === '1') {
    target.from = ''
    target.to = ''
    return
  }
  const from = routeQ(routeQuery || {}, 'from')
  const to = routeQ(routeQuery || {}, 'to')
  if (from || to) {
    target.from = from || monthStart()
    target.to = to || todayDate()
    return
  }
  target.from = ''
  target.to = ''
}

function dateQuery(opts?: JumpOpts) {
  if (opts?.hist) return { hist: '1', from: '', to: '' }
  if (opts && (opts.from != null || opts.to != null)) {
    return { from: opts.from || '', to: opts.to || '' }
  }
  return { from: monthStart(), to: todayDate() }
}

function backQuery(back: AgentBack, backId: string) {
  return { back, backId }
}

export function l1Purchase(l1Id: string, opts?: JumpOpts): RouteLocationRaw {
  return {
    path: '/trade/purchase',
    query: { l1Id, tab: opts?.tab || 'all', ...dateQuery(opts), ...backQuery('l1', l1Id) },
  }
}

export function l1Sales(l1Id: string, opts?: JumpOpts): RouteLocationRaw {
  return {
    path: '/trade/sales',
    query: { l1Id, tab: opts?.tab || 'all', ...dateQuery(opts), ...backQuery('l1', l1Id) },
  }
}

export function l1Return(l1Id: string, opts?: JumpOpts): RouteLocationRaw {
  return {
    path: '/risk/return',
    query: {
      l1Id,
      l2Id: '',
      kind: opts?.kind || 'all',
      status: opts?.status || 'all',
      ...dateQuery(opts),
      ...backQuery('l1', l1Id),
    },
  }
}

export function l1Stock(l1Id: string): RouteLocationRaw {
  return {
    path: '/trade/stock',
    query: { agentType: 'l1', agentId: l1Id, tab: 'summary', ...backQuery('l1', l1Id) },
  }
}

export function l1Exception(l1Id: string, opts?: JumpOpts): RouteLocationRaw {
  return {
    path: '/risk/exception',
    query: {
      l1Id,
      l2Id: '',
      tab: opts?.tab || 'activate-direct',
      ...dateQuery(opts),
      ...backQuery('l1', l1Id),
    },
  }
}

export function l2Sales(l2Id: string, l1Id: string, opts?: JumpOpts): RouteLocationRaw {
  return {
    path: '/trade/sales',
    query: { l1Id, l2Id, tab: opts?.tab || 'all', ...dateQuery(opts), ...backQuery('l2', l2Id) },
  }
}

/** 原型二级「采购」进销售单分销 tab */
export function l2Purchase(l2Id: string, l1Id: string, opts?: JumpOpts): RouteLocationRaw {
  return l2Sales(l2Id, l1Id, { ...opts, tab: opts?.tab || 'distribute' })
}

export function l2Return(l2Id: string, l1Id: string, opts?: JumpOpts): RouteLocationRaw {
  return {
    path: '/risk/return',
    query: {
      l1Id,
      l2Id,
      kind: opts?.kind || 'all',
      status: opts?.status || 'all',
      ...dateQuery(opts),
      ...backQuery('l2', l2Id),
    },
  }
}

export function l2Stock(l2Id: string): RouteLocationRaw {
  return {
    path: '/trade/stock',
    query: { agentType: 'l2', agentId: l2Id, tab: 'summary', ...backQuery('l2', l2Id) },
  }
}

export function l2Exception(l2Id: string, l1Id: string, opts?: JumpOpts): RouteLocationRaw {
  return {
    path: '/risk/exception',
    query: {
      l1Id,
      l2Id,
      tab: opts?.tab || 'activate-dist',
      ...dateQuery(opts),
      ...backQuery('l2', l2Id),
    },
  }
}

/** 工作台 KPI / 待办：计数不是「本月」的项带 hist，避免默认本月把列表筛空 */
export function homeL1(): RouteLocationRaw {
  return { path: '/agent/l1' }
}
export function homeL2(): RouteLocationRaw {
  return { path: '/agent/l2' }
}
export function homeSalesMonth(): RouteLocationRaw {
  return { path: '/trade/sales', query: { tab: 'all', from: monthStart(), to: todayDate() } }
}
export function homeBoundSn(): RouteLocationRaw {
  return { path: '/goods/sn', query: { status: 'bound' } }
}
export function homePendingPurchase(): RouteLocationRaw {
  return { path: '/trade/purchase', query: { tab: 'pending', ...dateQuery({ hist: true }) } }
}
export function homeOpenException(): RouteLocationRaw {
  return { path: '/risk/exception', query: dateQuery({ hist: true }) }
}
export function homePendingAssign(): RouteLocationRaw {
  return { path: '/agent/pending' }
}
export function homePendingAudit(): RouteLocationRaw {
  return { path: '/agent/audit' }
}
export function homePendingReturn(): RouteLocationRaw {
  return {
    path: '/risk/return',
    query: { kind: 'l1_to_factory', status: 'pending', ...dateQuery({ hist: true }) },
  }
}

/** 数据统计 KPI：采购 all；累计用 hist */
export function statsToPurchase(scope: { l1Id?: string; from?: string; to?: string }, hist = false): RouteLocationRaw {
  return {
    path: '/trade/purchase',
    query: {
      ...(scope.l1Id ? { l1Id: scope.l1Id } : {}),
      tab: 'all',
      ...dateQuery(hist ? { hist: true } : { from: scope.from, to: scope.to }),
    },
  }
}

/** 数据统计 KPI：直售/分销 tab；累计用 hist */
export function statsToSales(
  tab: 'direct' | 'distribute',
  scope: { l1Id?: string; l2Id?: string; from?: string; to?: string },
  hist = false,
): RouteLocationRaw {
  return {
    path: '/trade/sales',
    query: {
      ...(scope.l1Id ? { l1Id: scope.l1Id } : {}),
      ...(scope.l2Id ? { l2Id: scope.l2Id } : {}),
      tab,
      ...dateQuery(hist ? { hist: true } : { from: scope.from, to: scope.to }),
    },
  }
}

/** 数据统计 KPI：库存 summary + 当前筛的代理 */
export function statsToStock(scope: { l1Id?: string; l2Id?: string }): RouteLocationRaw {
  if (scope.l2Id) {
    return { path: '/trade/stock', query: { agentType: 'l2', agentId: scope.l2Id, tab: 'summary' } }
  }
  if (scope.l1Id) {
    return { path: '/trade/stock', query: { agentType: 'l1', agentId: scope.l1Id, tab: 'summary' } }
  }
  return { path: '/trade/stock', query: { tab: 'summary' } }
}

export function statsToException(scope: { l1Id?: string; l2Id?: string; from?: string; to?: string }, hist = false): RouteLocationRaw {
  return {
    path: '/risk/exception',
    query: {
      ...(scope.l1Id ? { l1Id: scope.l1Id } : {}),
      ...(scope.l2Id ? { l2Id: scope.l2Id } : {}),
      tab: 'activate-direct',
      ...dateQuery(hist ? { hist: true } : { from: scope.from, to: scope.to }),
    },
  }
}

export function statsToReturn(scope: { l1Id?: string; l2Id?: string; from?: string; to?: string }, hist = false): RouteLocationRaw {
  return {
    path: '/risk/return',
    query: {
      ...(scope.l1Id ? { l1Id: scope.l1Id } : {}),
      ...(scope.l2Id ? { l2Id: scope.l2Id } : {}),
      kind: 'all',
      ...dateQuery(hist ? { hist: true } : { from: scope.from, to: scope.to }),
    },
  }
}

export function statsToCustomers(scope: { l1Id?: string; l2Id?: string; from?: string; to?: string }, channel?: string): RouteLocationRaw {
  return {
    path: '/risk/customers',
    query: {
      ...(scope.l1Id ? { l1Id: scope.l1Id } : {}),
      ...(scope.l2Id ? { l2Id: scope.l2Id } : {}),
      ...(channel ? { channel } : {}),
      ...dateQuery({ from: scope.from, to: scope.to }),
    },
  }
}
