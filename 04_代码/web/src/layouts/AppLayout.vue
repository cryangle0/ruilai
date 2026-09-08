<template>
  <div class="app-bg">
    <div class="canvas">
      <aside class="sidebar">
        <Sidebar />
      </aside>
      <div class="workspace">
        <header class="topbar">
          <HeaderBar />
          <div class="topbar-right">
            <div class="notify-wrap">
              <button type="button" class="notify-btn" aria-label="通知" @click.stop="toggleNotify">
                <svg class="bell-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                <span v-if="unread" class="bell-dot">{{ unread }}</span>
              </button>
              <div v-if="notifyOpen" class="notify-panel" @click.stop>
                <div class="notify-hd">
                  <strong>通知中心</strong>
                  <el-button size="small" @click="markAll">全部已读</el-button>
                </div>
                <button
                  v-for="n in notes"
                  :key="n.id"
                  type="button"
                  class="notify-item"
                  :class="{ unread: !n.readFlag }"
                  @click="readOne(n)"
                >
                  <div class="notify-title">{{ n.title }}</div>
                  <div class="notify-body">{{ n.body }}</div>
                  <div class="notify-meta">{{ formatDateTime(n.occurredAt) }}</div>
                </button>
                <div v-if="!notes.length" class="empty-hint" style="padding:16px">暂无通知</div>
              </div>
            </div>
            <div class="user-wrap">
              <button type="button" class="user" @click.stop="menuOpen = !menuOpen">
                <span class="user-avatar">{{ avatarText }}</span>
                <span class="user-name">{{ auth.user?.username || displayName }}</span>
                <el-icon class="user-caret"><ArrowDown /></el-icon>
              </button>
              <div v-if="menuOpen" class="user-menu" @click.stop>
                <div class="user-menu-hd">
                  <strong>{{ displayName }}</strong>
                  <span class="muted">{{ auth.user?.username || '' }}</span>
                </div>
                <button type="button" class="user-menu-item user-menu-item--danger" @click="onLogout">退出登录</button>
              </div>
            </div>
          </div>
        </header>
        <main class="content">
          <div class="content-body">
            <router-view />
          </div>
        </main>
      </div>
    </div>
    <DisablePendingDialog v-model="disableDlg" @signed="onSigned" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'
import DisablePendingDialog from '@/components/common/DisablePendingDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'
import { pendingDisableForAccount } from '@/utils/disablePending'
import { formatDateTime } from '@/utils/dates'

const DISABLE_PROMPT_KEY = 'ruilai_disable_prompted'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)
const notifyOpen = ref(false)
const notes = ref<any[]>([])
const disableDlg = ref(false)

const displayName = computed(() => auth.user?.name || auth.user?.username || '用户')
const avatarText = computed(() => displayName.value.slice(0, 1))
const unread = computed(() => notes.value.filter((n) => !n.readFlag).length)

function closePanels() {
  menuOpen.value = false
  notifyOpen.value = false
}

async function toggleNotify() {
  menuOpen.value = false
  notifyOpen.value = !notifyOpen.value
  if (notifyOpen.value) notes.value = await api.notifications()
}

async function readOne(n: any) {
  await api.readNotify(n.id)
  n.readFlag = 1
}

async function markAll() {
  await api.readAllNotify()
  notes.value.forEach((n) => { n.readFlag = 1 })
}

async function onLogout() {
  menuOpen.value = false
  await nextTick()
  try {
    await ElMessageBox.confirm('确认退出当前账号？', '退出登录', {
      confirmButtonText: '确认退出',
      cancelButtonText: '取消',
      type: 'warning',
      appendTo: document.body,
    })
  } catch {
    return
  }
  await auth.logout()
  sessionStorage.removeItem(DISABLE_PROMPT_KEY)
  router.push('/login')
}

async function maybePromptDisable() {
  if (!auth.hasPerm('all')) return
  if (sessionStorage.getItem(DISABLE_PROMPT_KEY)) return
  try {
    const p = await api.disablePending()
    const username = auth.user?.username
    const l1 = pendingDisableForAccount(p.l1, username)
    const l2 = pendingDisableForAccount(p.l2, username)
    if (l1.length || l2.length) {
      sessionStorage.setItem(DISABLE_PROMPT_KEY, '1')
      disableDlg.value = true
    }
  } catch { /* */ }
}
function onSigned() {
  maybePromptDisable()
}

onMounted(() => {
  if (auth.isLoggedIn) {
    auth.fetchMe().catch(() => {})
    api.notifications().then((list) => (notes.value = list)).catch(() => {})
    maybePromptDisable()
  }
  document.addEventListener('click', closePanels)
})
onUnmounted(() => document.removeEventListener('click', closePanels))
</script>

<style scoped>
.app-bg { height: 100vh; overflow: hidden; background: var(--bg); }
.canvas { height: 100vh; display: flex; flex-direction: row; overflow: hidden; }
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  min-height: 0;
  z-index: 40;
  overflow: hidden;
}
.workspace {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}
.topbar {
  height: var(--header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  z-index: 50;
}
.topbar-right { position: relative; display: flex; align-items: center; gap: 14px; }
.notify-wrap, .user-wrap { position: relative; }
.notify-btn {
  position: relative;
  height: 34px;
  width: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: var(--text-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  padding: 0;
}
.notify-btn:hover { background: var(--bg); }
.bell-ico { display: block; }
.bell-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  box-sizing: content-box;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-num);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  pointer-events: none;
}
.notify-panel {
  position: absolute; right: 0; top: calc(100% + 8px);
  width: min(360px, 92vw); max-height: 420px; overflow: auto;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  z-index: 80;
}
.notify-hd {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; border-bottom: 1px solid var(--border);
  position: sticky; top: 0; background: #fff;
}
.notify-item {
  display: block; width: 100%; text-align: left; border: none;
  border-bottom: 1px solid var(--divider); background: transparent; padding: 10px 12px; cursor: pointer;
}
.notify-item.unread { background: var(--primary-soft); }
.notify-title { font-size: 13px; font-weight: 700; }
.notify-body { font-size: 12px; color: var(--text-2); margin-top: 4px; line-height: 1.4; }
.notify-meta { font-size: 11px; color: var(--text-3); margin-top: 4px; }
.user {
  display: inline-flex; align-items: center; gap: 8px; height: 34px;
  padding: 4px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}
.user:hover { background: var(--bg); }
.user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--primary-soft); color: var(--primary);
  display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;
  border: 2px solid var(--primary-border);
}
.user-name { font-size: 13px; font-weight: 500; }
.user-caret { font-size: 12px; color: var(--text-3); }
.user-menu {
  position: absolute; right: 0; top: calc(100% + 8px); width: 220px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  z-index: 80; overflow: hidden;
}
.user-menu-hd { display: flex; flex-direction: column; gap: 2px; padding: 12px; border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.user-menu-hd strong { font-size: 13px; }
.user-menu-hd .muted { font-size: 12px; color: var(--text-3); }
.user-menu-item {
  display: block; width: 100%; text-align: left; border: none; background: transparent;
  padding: 10px 12px; font-size: 13px; cursor: pointer;
}
.user-menu-item:hover { background: var(--bg-soft); }
.user-menu-item--danger { color: var(--danger); font-weight: 600; }
.content { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }
.content-body {
  flex: 1; min-height: 0; padding: var(--page-padding); overflow: auto;
  display: flex; flex-direction: column;
  background: var(--bg);
}
</style>
