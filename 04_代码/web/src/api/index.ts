import { get, post } from './http'

export interface PageResult<T> {
  total: number
  list: T[]
}

export const authApi = {
  login(data: { username: string; password: string; client?: string }) {
    return post<{ token: string; user: AuthUser }>('/api/auth/login', data)
  },
  logout() {
    return post('/api/auth/logout')
  },
  me() {
    return get<AuthUser>('/api/auth/me')
  },
}

export interface AuthUser {
  accountId: number
  username: string
  name: string
  roleCode: string
  agentId?: string
  phone?: string
  permissions: string[]
}

export const api = {
  dashboard: () => get<Record<string, number>>('/api/dashboard'),
  stats: (params?: object) => get<Record<string, any>>('/api/dashboard/stats', { params }),
  agentsL1: (params?: object) => get<PageResult<any>>('/api/agents/l1', { params }),
  agentL1: (id: string) => get<any>(`/api/agents/l1/${id}`),
  agentL2: (id: string) => get<any>(`/api/agents/l2/${id}`),
  saveL1: (data: object) => post('/api/agents/l1', data),
  setL1Status: (id: string, status: string) => post(`/api/agents/l1/${id}/status`, { status }),
  disableL1: (id: string) => post(`/api/agents/l1/${id}/disable-cosign`),
  agentsL2: (params?: object) => get<PageResult<any>>('/api/agents/l2', { params }),
  saveL2: (data: object) => post('/api/agents/l2', data),
  auditL2: (id: string, pass: boolean) => post(`/api/agents/l2/${id}/audit`, { pass }),
  assignL2: (id: string, parentId: string, areas: string[]) =>
    post(`/api/agents/l2/${id}/assign`, { parentId, areas }),
  unbindL2: (id: string) => post(`/api/agents/l2/${id}/unbind`),
  disableL2: (id: string) => post(`/api/agents/l2/${id}/disable-cosign`),
  disablePending: () => get<{ l1: any[]; l2: any[] }>('/api/agents/disable-pending'),
  badges: () => get<{ pendingAssign: number; pendingAudit: number; pendingDisable?: number }>('/api/agents/badges'),
  products: (params?: object) => get<PageResult<any>>('/api/products', { params }),
  saveProduct: (data: object) => post('/api/products', data),
  deleteProduct: (id: string) => post(`/api/products/${id}/delete`),
  sns: (params?: object) => get<PageResult<any>>('/api/sns', { params }),
  sn: (sn: string) => get<any>(`/api/sns/${sn}`),
  freezeSn: (sn: string, frozen: boolean) => post(`/api/sns/${sn}/freeze`, { frozen }),
  generateSn: (data: object) => post<any[]>('/api/sns/generate', data),
  importSnSeg: (data: object) => post<any[]>('/api/sns/import-seg', data),
  updateSn: (sn: string, data: object) => post(`/api/sns/${sn}/update`, data),
  reassignSn: (sn: string, l1Id: string) => post(`/api/sns/${sn}/reassign`, { l1Id }),
  purchases: (params?: object) => get<PageResult<any>>('/api/purchases', { params }),
  purchase: (id: string) => get<any>(`/api/purchases/${id}`),
  createPurchase: (data: object) => post('/api/purchases', data),
  cosign: (id: string, segments?: object, customLines?: object[]) => post(`/api/purchases/${id}/cosign`, { segments, customLines }),
  rejectPurchase: (id: string, reason?: string) => post(`/api/purchases/${id}/reject`, { reason }),
  deletePurchase: (id: string) => post(`/api/purchases/${id}/delete`),
  sales: (params?: object) => get<PageResult<any>>('/api/sales', { params }),
  sale: (id: string) => get<any>(`/api/sales/${id}`),
  createSale: (data: object) => post('/api/sales', data),
  scanSale: (id: string, sn: string) => post(`/api/sales/${id}/scan`, { sn }),
  confirmSale: (id: string) => post(`/api/sales/${id}/confirm`),
  directBind: (data: object) => post('/api/sales/direct-bind', data),
  salesSummary: (params?: object) => get<Record<string, number>>('/api/sales/summary', { params }),
  stock: (params?: object) => get<any[]>('/api/stock/summary', { params }),
  stockLogs: (params?: object) => get<any[]>('/api/stock/logs', { params }),
  returns: (params?: object) => get<PageResult<any>>('/api/returns', { params }),
  returnOrder: (id: string) => get<any>(`/api/returns/${id}`),
  createReturn: (data: object) => post('/api/returns', data),
  decideReturn: (id: string, pass: boolean, processNote?: string) =>
    post(`/api/returns/${id}/decide`, { pass, processNote }),
  exceptions: (params?: object) => get<PageResult<any>>('/api/exceptions', { params }),
  exception: (id: string) => get<any>(`/api/exceptions/${id}`),
  exceptionCounts: (params?: object) => get<Record<string, number>>('/api/exceptions/counts', { params }),
  explainEx: (id: string, text: string) => post(`/api/exceptions/${id}/explain`, { text }),
  handleEx: (id: string) => post(`/api/exceptions/${id}/handle`),
  deleteEx: (id: string) => post(`/api/exceptions/${id}/delete`),
  scanStockWarn: () => post('/api/exceptions/scan-stock'),
  exceptionRules: () => get<Record<string, any>>('/api/settings/exception'),
  saveExceptionRules: (data: object) => post('/api/settings/exception', data),
  customers: (params?: object) => get<PageResult<any> & { rangeQty?: number; histQty?: number }>('/api/customers', { params }),
  saveCustomer: (data: object) => post('/api/customers', data),
  deleteCustomer: (id: string) => post(`/api/customers/${id}/delete`),
  capabilities: () => get<Record<string, any>>('/api/support/capabilities'),
  locate: (params?: object) => get<Record<string, any>>('/api/support/locate', { params }),
  setL2Status: (id: string, status: string) => post(`/api/agents/l2/${id}/status`, { status }),
  deleteL2: (id: string) => post(`/api/agents/l2/${id}/delete`),
  muteL2Alarm: (ids: string[], mute = true) => post<number>('/api/agents/l2/mute-alarm', { ids, mute }),
  roles: () => get<any[]>('/api/roles'),
  saveRole: (data: object) => post('/api/roles', data),
  deleteRole: (id: string) => post(`/api/roles/${id}/delete`),
  accounts: (params?: object) => get<any[]>('/api/accounts', { params }),
  createAccount: (data: object) => post('/api/accounts', data),
  toggleAccount: (id: number | string) => post(`/api/accounts/${id}/status`),
  changeAccountPassword: (id: number | string, password: string) => post(`/api/accounts/${id}/password`, { password }),
  logs: (params?: object) => get<PageResult<any>>('/api/logs', { params }),
  notifications: () => get<any[]>('/api/notifications'),
  unreadNotificationCount: () => get<number>('/api/notifications/unread-count'),
  readNotify: (id: string) => post(`/api/notifications/${id}/read`),
  readAllNotify: () => post('/api/notifications/read-all'),
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return post<{ url: string }>('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  subs: (l1Id?: string) => get<any[]>('/api/agents/subs', { params: { l1Id } }),
  setSubStatus: (id: string, status: string) => post(`/api/agents/subs/${id}/status`, { status }),
}
