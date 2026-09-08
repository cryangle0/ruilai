import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/service'
import type { AuthUser } from '@/service/types'
import { bindPiniaReset, isLoginPage, readToken, readUser, writeSession } from './session'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const user = ref<AuthUser | null>(null)
  const isLogin = computed(() => Boolean(token.value))
  const role = computed(() => user.value?.roleCode || '')

  bindPiniaReset(() => {
    token.value = ''
    user.value = null
  })

  function persist() {
    writeSession(token.value, user.value)
  }

  function restore() {
    token.value = readToken()
    user.value = (readUser() as AuthUser | null) || null
  }

  function clearSession() {
    token.value = ''
    user.value = null
    persist()
  }

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password)
    token.value = res.data.token
    user.value = res.data.user
    persist()
  }

  async function loginSms(phone: string, code: string) {
    const res = await authApi.smsLogin(phone, code)
    token.value = res.data.token
    user.value = res.data.user
    persist()
  }

  async function refreshMe() {
    if (!token.value) return
    const res = await authApi.me()
    user.value = res.data
    persist()
  }

  async function updateProfile(data: { name: string; phone?: string; password?: string }) {
    const res = await authApi.updateProfile(data)
    user.value = res.data
    persist()
  }

  async function logout() {
    const { confirm } = await uni.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmText: '确认退出',
      cancelText: '取消',
      confirmColor: '#e0584a',
    })
    if (!confirm) return
    clearSession()
    uni.reLaunch({ url: '/pages/login/index' })
  }

  function ensureLogin() {
    restore()
    if (token.value) return true
    if (!isLoginPage()) {
      uni.reLaunch({ url: '/pages/login/index' })
    }
    return false
  }

  function ensureRole(roles: string[]) {
    if (!ensureLogin()) return false
    if (role.value === 'ADMIN' || roles.includes(role.value)) return true
    uni.showToast({ title: '无权限', icon: 'none' })
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) uni.navigateBack()
      else uni.switchTab({ url: '/pages/home/index' })
    }, 350)
    return false
  }

  return { token, user, isLogin, role, restore, login, loginSms, refreshMe, updateProfile, logout, ensureLogin, ensureRole, clearSession }
})
