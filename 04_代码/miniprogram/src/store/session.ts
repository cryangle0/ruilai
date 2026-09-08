import { STORAGE_KEYS } from '@/config'

type UserSnapshot = Record<string, unknown> | null

let piniaReset: (() => void) | undefined

export function bindPiniaReset(fn: () => void) {
  piniaReset = fn
}

export function readToken() {
  return String(uni.getStorageSync(STORAGE_KEYS.TOKEN) || '')
}

export function readUser(): UserSnapshot {
  return (uni.getStorageSync(STORAGE_KEYS.USER_INFO) as UserSnapshot) || null
}

export function writeSession(token: string, user: UserSnapshot) {
  if (token) uni.setStorageSync(STORAGE_KEYS.TOKEN, token)
  else uni.removeStorageSync(STORAGE_KEYS.TOKEN)
  if (user) uni.setStorageSync(STORAGE_KEYS.USER_INFO, user)
  else uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
}

export function clearSessionStorage() {
  uni.removeStorageSync(STORAGE_KEYS.TOKEN)
  uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
}

/** 同时清 storage 与 pinia，避免 401 后仍带着内存 token 跳首页 */
export function resetAuthMemory() {
  clearSessionStorage()
  piniaReset?.()
}

export function currentRoute() {
  const pages = getCurrentPages()
  const last = pages[pages.length - 1] as { route?: string } | undefined
  return last?.route || ''
}

export function isLoginPage(route = currentRoute()) {
  return String(route).includes('pages/login')
}

/** 清理失效会话并回到登录页，供普通请求与文件上传共同复用。 */
export function handleAuthExpired() {
  resetAuthMemory()
  if (!isLoginPage(currentRoute())) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
  return new Error('登录已过期')
}
