export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  total: number
  list: T[]
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
