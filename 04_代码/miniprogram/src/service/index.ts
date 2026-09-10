import { http } from './http'
import type { AuthUser, PageResult } from './types'

export const authApi = {
  login: (username: string, password: string) =>
    http.post<{ token: string; user: AuthUser }>('/api/auth/login', { username, password, client: 'mini' }),
  smsCode: (phone: string) => http.post<{ devCode?: string }>('/api/auth/sms-code', { phone }),
  smsLogin: (phone: string, code: string) =>
    http.post<{ token: string; user: AuthUser }>('/api/auth/sms-login', { phone, code, client: 'mini' }),
  me: () => http.get<AuthUser>('/api/auth/me'),
  updateProfile: (data: { name: string; phone?: string; password?: string }) =>
    http.post<AuthUser>('/api/auth/profile', data),
}

export const miniApi = {
  home: (params?: Record<string, unknown>) => http.get<Record<string, any>>('/api/mini/home', params),
  products: () => http.get<any[]>('/api/products/on-shelf'),
  product: (id: string) => http.get<any>(`/api/products/${id}`),

  purchases: (params?: Record<string, unknown>) => http.get<PageResult<any>>('/api/purchases', params),
  purchase: (id: string) => http.get<any>(`/api/purchases/${id}`),
  createPurchase: (data: object) => http.post('/api/purchases', data),

  sales: (params?: Record<string, unknown>) => http.get<PageResult<any>>('/api/sales', params),
  sale: (id: string) => http.get<any>(`/api/sales/${id}`),
  createSale: (data: object) => http.post('/api/sales', data),
  scan: (id: string, sn: string) => http.post(`/api/sales/${id}/scan`, { sn }),
  confirm: (id: string) => http.post(`/api/sales/${id}/confirm`),
  bind: (data: object) => http.post('/api/sales/direct-bind', data),
  bindBatch: (data: object) => http.post('/api/sales/direct-bind-batch', data),

  stock: (params?: Record<string, unknown>) => http.get<any[]>('/api/stock/summary', params),
  stockLogs: (params?: Record<string, unknown>) => http.get<any[]>('/api/stock/logs', params),

  returns: (params?: Record<string, unknown>) => http.get<PageResult<any>>('/api/returns', params),
  returnOne: (id: string) => http.get<any>(`/api/returns/${id}`),
  createReturn: (data: object) => http.post('/api/returns', data),
  decideReturn: (id: string, pass: boolean, processNote?: string) =>
    http.post(`/api/returns/${id}/decide`, { pass, processNote }),

  exceptions: (params?: Record<string, unknown>) => http.get<PageResult<any>>('/api/exceptions', params),
  exceptionCounts: (params?: Record<string, unknown>) => http.get<Record<string, number>>('/api/exceptions/counts', params),
  exception: (id: string) => http.get<any>(`/api/exceptions/${id}`),
  explainEx: (id: string, text: string) => http.post(`/api/exceptions/${id}/explain`, { text }),

  customers: (params?: Record<string, unknown>) => http.get<PageResult<any>>('/api/customers', params),
  customer: (id: string) => http.get<any>(`/api/customers/${id}`),
  agentsL2: (params?: Record<string, unknown>) => http.get<PageResult<any>>('/api/agents/l2', params),
  agentL1: (id: string) => http.get<any>(`/api/agents/l1/${id}`),
  saveL2: (data: object) => http.post('/api/agents/l2', data),
  l2Status: (id: string, status: string) => http.post(`/api/agents/l2/${id}/status`, { status }),
  deleteL2: (id: string) => http.post(`/api/agents/l2/${id}/delete`),
  subs: () => http.get<any[]>('/api/agents/subs'),
  saveSub: (data: object) => http.post('/api/agents/subs', data),
  subStatus: (id: string, status: string) => http.post(`/api/agents/subs/${id}/status`, { status }),
  sns: (params?: Record<string, unknown>) => http.get<PageResult<any>>('/api/sns', params),
  sn: (sn: string) => http.get<any>(`/api/sns/${sn}`),
}
