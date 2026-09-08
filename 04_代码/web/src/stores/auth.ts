import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, type AuthUser } from '@/api'
import { filterMenus, menuConfig, canAccessPath, hasPerm as permOf } from '@/config/menu'

const TOKEN_KEY = 'ruilai_token'
const USER_KEY = 'ruilai_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<AuthUser | null>(readUser())
  const isLoggedIn = computed(() => Boolean(token.value))
  const roleCode = computed(() => user.value?.roleCode || '')
  const permissions = computed(() => {
    const raw = user.value?.permissions
    return Array.isArray(raw) ? raw.map(String) : []
  })
  const menus = computed(() => filterMenus(menuConfig, roleCode.value, permissions.value))

  function hasPerm(perm: string) {
    return permOf(permissions.value, perm)
  }

  function canAccess(path: string) {
    return canAccessPath(path, roleCode.value, permissions.value)
  }

  function readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  }

  function persist() {
    if (token.value) localStorage.setItem(TOKEN_KEY, token.value)
    else localStorage.removeItem(TOKEN_KEY)
    if (user.value) localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    else localStorage.removeItem(USER_KEY)
  }

  async function login(username: string, password: string) {
    const result = await authApi.login({ username, password, client: 'web' })
    token.value = result.token
    user.value = result.user
    persist()
    return result
  }

  async function fetchMe() {
    if (!token.value) return null
    user.value = await authApi.me()
    persist()
    return user.value
  }

  function logoutLocal() {
    token.value = ''
    user.value = null
    persist()
  }

  async function logout() {
    try {
      if (token.value) await authApi.logout()
    } finally {
      logoutLocal()
    }
  }

  return { token, user, isLoggedIn, roleCode, permissions, menus, hasPerm, canAccess, login, fetchMe, logout, logoutLocal }
})
