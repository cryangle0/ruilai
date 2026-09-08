import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const baseURL = import.meta.env.VITE_API_BASE || '/ruilai-api'

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 60000,
})

http.interceptors.request.use((config) => {
  const url = String(config.url || '')
  const publicAuth = /\/api\/auth\/(login|sms-code|sms-login)/.test(url)
  if (!publicAuth) {
    const auth = useAuthStore()
    if (auth.token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${auth.token}`
    }
  }
  return config
})

type RequestConfig = AxiosRequestConfig & { silent?: boolean }

http.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload && typeof payload === 'object' && 'code' in payload) {
      if (payload.code === 0 || payload.code === 200) {
        return payload.data
      }
      const msg = payload.message || '请求失败'
      if (!(response.config as RequestConfig).silent) ElMessage.error(msg)
      return Promise.reject(new Error(msg))
    }
    return payload
  },
  (error) => {
    const status = error.response?.status
    const msg = error.response?.data?.message || error.message || '网络异常'
    const silent = Boolean((error.config as RequestConfig | undefined)?.silent)
    if (status === 401) {
      const auth = useAuthStore()
      auth.logoutLocal()
      if (!silent) ElMessage.warning('登录已过期，请重新登录')
      if (location.pathname.indexOf('/login') < 0) {
        location.href = `${import.meta.env.BASE_URL}login`.replace(/\/{2,}/g, '/')
      }
    } else if (!silent) {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  },
)

export function get<T = unknown>(url: string, config?: RequestConfig) {
  return http.get<any, T>(url, config)
}
export function post<T = unknown>(url: string, data?: unknown, config?: RequestConfig) {
  return http.post<any, T>(url, data, config)
}
export function put<T = unknown>(url: string, data?: unknown, config?: RequestConfig) {
  return http.put<any, T>(url, data, config)
}
export function del<T = unknown>(url: string, config?: RequestConfig) {
  return http.delete<any, T>(url, config)
}
