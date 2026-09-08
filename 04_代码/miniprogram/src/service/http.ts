import type { ApiResponse } from './types'
import { API_BASE_URL } from '@/config'
import { handleAuthExpired, readToken } from '@/store/session'

const AUTH_PUBLIC = /\/api\/auth\/(login|sms-code|sms-login)(\?|$)/

function isAuthPublic(url: string) {
  return AUTH_PUBLIC.test(url)
}

class Http {
  request<T>(opts: { url: string; method?: 'GET' | 'POST'; data?: object; silent?: boolean }) {
    return new Promise<ApiResponse<T>>((resolve, reject) => {
      const publicAuth = isAuthPublic(opts.url)
      const token = publicAuth ? '' : readToken()
      const header: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) header.Authorization = `Bearer ${token}`

      uni.request({
        url: API_BASE_URL + opts.url,
        method: opts.method || 'GET',
        data: opts.data,
        header,
        success: (res) => {
          const payload = res.data as ApiResponse<T>
          if (res.statusCode === 401 || payload?.code === 401) {
            if (publicAuth) {
              const msg = payload?.message || '登录失败'
              if (!opts.silent) uni.showToast({ title: msg, icon: 'none' })
              reject(new Error(msg))
              return
            }
            reject(handleAuthExpired())
            return
          }
          if (payload && payload.code === 0) {
            resolve(payload)
            return
          }
          const msg = payload?.message || '请求失败'
          if (!opts.silent) uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        },
        fail: () => {
          if (!opts.silent) uni.showToast({ title: '网络异常', icon: 'none' })
          reject(new Error('网络异常'))
        },
      })
    })
  }

  get<T>(url: string, data?: Record<string, unknown>) {
    const qs = data
      ? '?' + Object.entries(data)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : ''
    return this.request<T>({ url: url + qs, method: 'GET' })
  }
  post<T>(url: string, data?: object) {
    return this.request<T>({ url, method: 'POST', data })
  }
}

export const http = new Http()
