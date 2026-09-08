export interface MenuItem {
  key: string
  title: string
  path?: string
  icon?: string
  badgeKey?: string
  /** 数据范围：仅这些 roleCode 可见（ADMIN=平台账号） */
  roles?: string[]
  /** 模块权限：需 all 或与 permissions 有交集 */
  perms?: string[]
  children?: MenuItem[]
}

export const menuConfig: MenuItem[] = [
  {
    key: 'overview',
    title: '概览',
    children: [
      { key: 'home', title: '工作台', path: '/home', icon: 'House' },
    ],
  },
  {
    key: 'channel',
    title: '渠道',
    children: [
      { key: 'agent-l1', title: '一级代理商', path: '/agent/l1', icon: 'OfficeBuilding', roles: ['ADMIN'], perms: ['all'] },
      { key: 'agent-l2', title: '二级代理商', path: '/agent/l2', icon: 'Avatar', perms: ['l2'] },
      { key: 'agent-audit', title: '二级审核', path: '/agent/audit', icon: 'CircleCheck', badgeKey: 'pendingAudit', roles: ['ADMIN'], perms: ['all'] },
      { key: 'agent-pending', title: '待分配(法人)', path: '/agent/pending', icon: 'Timer', badgeKey: 'pendingAssign', roles: ['ADMIN'], perms: ['all'] },
    ],
  },
  {
    key: 'goods',
    title: '货品',
    children: [
      { key: 'sn', title: 'SN码库', path: '/goods/sn', icon: 'Grid', perms: ['stock'] },
      { key: 'product', title: '商品库', path: '/goods/product', icon: 'Goods', roles: ['ADMIN'], perms: ['all'] },
      { key: 'purchase', title: '采购单管理', path: '/trade/purchase', icon: 'Document', badgeKey: 'pendingPo', perms: ['purchase'] },
      { key: 'sales', title: '销售单管理', path: '/trade/sales', icon: 'Notebook', perms: ['sales'] },
      { key: 'stock', title: '库存管理', path: '/trade/stock', icon: 'Box', perms: ['stock'] },
    ],
  },
  {
    key: 'risk',
    title: '售后与风控',
    children: [
      { key: 'return', title: '返货管理', path: '/risk/return', icon: 'RefreshLeft', badgeKey: 'pendingReturn', perms: ['aftersale'] },
      { key: 'exception', title: '异常管理', path: '/risk/exception', icon: 'Warning', badgeKey: 'openEx', perms: ['exception'] },
      { key: 'customers', title: '销售客户', path: '/risk/customers', icon: 'User', perms: ['sales'] },
      { key: 'stats', title: '数据统计', path: '/risk/stats', icon: 'DataAnalysis', perms: ['purchase', 'sales', 'stock', 'aftersale', 'exception'] },
    ],
  },
  {
    key: 'system',
    title: '系统',
    roles: ['ADMIN'],
    perms: ['all'],
    children: [
      { key: 'role', title: '角色与权限', path: '/system/roles', icon: 'Setting', roles: ['ADMIN'], perms: ['all'] },
      { key: 'log', title: '操作日志', path: '/system/logs', icon: 'DocumentCopy', roles: ['ADMIN'], perms: ['all'] },
    ],
  },
]

export function hasPerm(permissions: string[] | undefined, perm: string) {
  const list = permissions || []
  return list.includes('all') || list.includes(perm)
}

export function hasAnyPerm(permissions: string[] | undefined, perms: string[]) {
  if (!perms.length) return true
  const list = permissions || []
  if (list.includes('all')) return true
  return perms.some((p) => list.includes(p))
}

export function canSeeMenu(item: MenuItem, role: string, permissions: string[] = []): boolean {
  if (item.roles?.length && !item.roles.includes(role)) return false
  if (item.perms?.length && !hasAnyPerm(permissions, item.perms)) return false
  return true
}

export function filterMenus(items: MenuItem[], role: string, permissions: string[] = []): MenuItem[] {
  return items
    .filter((it) => canSeeMenu(it, role, permissions))
    .map((it) => ({
      ...it,
      children: it.children ? filterMenus(it.children, role, permissions) : undefined,
    }))
    .filter((it) => it.path || (it.children && it.children.length))
}

export function findMenuByPath(path: string, items: MenuItem[] = menuConfig): MenuItem | undefined {
  const clean = path.split('?')[0]
  for (const it of items) {
    if (it.path && it.path === clean) return it
    if (it.children) {
      const hit = findMenuByPath(clean, it.children)
      if (hit) return hit
    }
  }
  return undefined
}

export function canAccessPath(path: string, role: string, permissions: string[] = []): boolean {
  const clean = path.split('?')[0]
  if (!clean || clean === '/' || clean === '/home' || clean === '/login') return true
  const item = findMenuByPath(clean)
  if (!item) return true
  return canSeeMenu(item, role, permissions)
}
