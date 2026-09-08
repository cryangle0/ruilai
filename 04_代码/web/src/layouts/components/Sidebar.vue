<template>
  <div class="sidebar-root">
    <div class="brand" role="link" tabindex="0" @click="$router.push('/home')">
      <div class="brand-logo" aria-hidden="true">锐</div>
      <div>
        <div class="brand-name">锐涞经销商管理系统</div>
        <div class="brand-sub">RUI LAI DEALER SYSTEM</div>
      </div>
    </div>
    <div class="sidebar-scroll">
      <template v-for="group in menus" :key="group.key">
        <div class="nav-group-title">{{ group.title }}</div>
        <button
          v-for="item in group.children"
          :key="item.key"
          type="button"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="go(item.path)"
        >
          <el-icon class="icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.title }}</span>
          <span v-if="badgeOf(item)" class="menu-badge">{{ badgeOf(item) }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'
import type { MenuItem } from '@/config/menu'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menus = computed(() => auth.menus)
const badges = reactive<Record<string, number>>({})

function isActive(path?: string) {
  if (!path) return false
  return route.path === path || route.path.startsWith(path + '/')
}
function go(path?: string) {
  if (path) router.push(path)
}
function badgeOf(item: MenuItem) {
  if (!item.badgeKey) return 0
  return badges[item.badgeKey] || 0
}

async function loadBadges() {
  try {
    const d = await api.dashboard()
    Object.assign(badges, d)
  } catch { /* */ }
  try {
    const b = await api.badges()
    Object.assign(badges, b)
  } catch { /* */ }
}
function onBadgesChanged() {
  loadBadges()
}

watch(() => route.fullPath, loadBadges)
onMounted(() => {
  window.addEventListener('ruilai:badges-changed', onBadgesChanged)
  loadBadges()
})
onUnmounted(() => window.removeEventListener('ruilai:badges-changed', onBadgesChanged))
</script>

<style scoped>
.sidebar-root {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  color: var(--text-1, var(--text));
  border-right: 1px solid var(--border);
  padding: 20px 12px 16px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--grad-primary);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 14px rgba(26, 104, 215, 0.35);
}
.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1, var(--text));
  letter-spacing: 0.2px;
  line-height: 1.25;
}
.brand-sub {
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: 1px;
}
.sidebar-scroll {
  flex: 1;
  overflow: auto;
  padding: 14px 0 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.sidebar-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
.nav-group-title {
  padding: 0 10px;
  margin-bottom: 6px;
  margin-top: 12px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-3);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav-group-title::before {
  content: "";
  width: 3px;
  height: 10px;
  background: var(--primary);
  border-radius: 2px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 2px;
  height: auto;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  position: relative;
}
.nav-item:hover {
  background: #F5F7FB;
  color: var(--text);
}
.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
  box-shadow: none;
}
.nav-item.active::before {
  content: "";
  position: absolute;
  left: -12px;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: var(--primary);
  border-radius: 0 3px 3px 0;
}
.nav-item .icon { width: 18px; font-size: 16px; flex-shrink: 0; }
.nav-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nav-item .menu-badge { margin-left: auto; }
.nav-item.active .menu-badge { background: var(--danger); color: #fff; }
</style>
