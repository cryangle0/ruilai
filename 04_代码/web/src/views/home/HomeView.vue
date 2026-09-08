<template>
  <div class="home-page">
    <div class="page-header home-head">
      <div>
        <h2>工作台</h2>
        <p>平台运营总览与待办</p>
      </div>
      <div class="home-head-right">
        <span class="home-clock">{{ clock }}</span>
        <button
          v-if="auth.hasPerm('exception')"
          type="button"
          class="ex-badge"
          :class="{ hot: (d.openEx || 0) > 0 }"
          @click="go(homeOpenException())"
        >
          异常 {{ d.openEx || 0 }}
        </button>
        <el-button class="home-refresh" @click="loadDash">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-skeleton v-if="loading && !ready" animated :rows="8" />
    <template v-else>
      <KpiCards :items="kpiCards" variant="stat" @select="onKpi" />

      <div class="todo-card">
        <div class="card-hd">
          <h3>待办事项</h3>
        </div>
        <div class="todo-grid">
          <button
            v-for="item in todoItems"
            :key="item.key"
            type="button"
            class="todo-tile"
            :class="`t-${item.tone}`"
            @click="item.onClick()"
          >
            <div class="tile-top">
              <span class="tile-cat" :class="item.priority">{{ item.priority === 'high' ? '高' : '中' }}</span>
              <span class="todo-ico" :class="`tone-${item.tone}`">
                <el-icon :size="15"><component :is="item.icon" /></el-icon>
              </span>
            </div>
            <div class="tile-name">{{ item.title }}</div>
            <div class="tile-foot">
              <span class="tile-count" :class="{ hot: item.count > 0 }">{{ item.count }}</span>
              <span class="tile-go">实时 ›</span>
            </div>
          </button>
        </div>
      </div>

      <div class="l1-card">
        <h3>一级代理</h3>
        <el-table :data="l1s" size="small" empty-text="暂无一级">
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column label="本月销售" width="100" align="right">
            <template #default="{ row }">{{ row.monthSalesQty ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="待审退货" width="100" align="right">
            <template #default="{ row }">
              <span :class="{ hot: row.pendingReturnCount }">{{ row.pendingReturnCount ?? 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="right">
            <template #default="{ row }">
              <button type="button" class="tbl-link" @click.stop="go(l1Sales(row.id))">销售</button>
              <button type="button" class="tbl-link" @click.stop="go(l1Return(row.id))">退货</button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>
    <DisablePendingDialog v-model="disableDlg" :mine-only="false" @signed="loadDash" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { api } from '@/api'
import DisablePendingDialog from '@/components/common/DisablePendingDialog.vue'
import KpiCards, { type KpiItem } from '@/components/common/KpiCards.vue'
import { useAuthStore } from '@/stores/auth'
import {
  homeBoundSn,
  homeL1,
  homeL2,
  homeOpenException,
  homePendingAssign,
  homePendingAudit,
  homePendingPurchase,
  homePendingReturn,
  homeSalesMonth,
  l1Return,
  l1Sales,
} from '@/utils/detailJump'

const auth = useAuthStore()

const SNAP_KEY = 'ruilai_home_kpi_snap'
const WEEK = ['日', '一', '二', '三', '四', '五', '六']

const router = useRouter()
const d = reactive<Record<string, number>>({})
const prev = reactive<Record<string, number>>({})
const disableDlg = ref(false)
const loading = ref(true)
const ready = ref(false)
const clock = ref('')
const l1s = ref<any[]>([])
let timer = 0

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function tick() {
  const now = new Date()
  clock.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${WEEK[now.getDay()]} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}
function go(to: RouteLocationRaw) {
  router.push(to)
}
function todayKey() {
  const n = new Date()
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`
}
function trendOf(key: string) {
  const now = Number(d[key] || 0)
  const hasPrev = Object.prototype.hasOwnProperty.call(prev, key)
  const before = Number(prev[key] || 0)
  if (!hasPrev) return { pct: 0, dir: 'flat' as const, hasPrev: false }
  if (before === 0) {
    if (now === 0) return { pct: 0, dir: 'flat' as const, hasPrev: true }
    return { pct: 100, dir: 'up' as const, hasPrev: true }
  }
  const delta = Math.round(((now - before) / before) * 100)
  if (delta > 0) return { pct: delta, dir: 'up' as const, hasPrev: true }
  if (delta < 0) return { pct: Math.abs(delta), dir: 'down' as const, hasPrev: true }
  return { pct: 0, dir: 'flat' as const, hasPrev: true }
}

const kpiCards = computed(() => {
  const defs = [
    { key: 'l1Count', label: '一级代理', icon: 'OfficeBuilding', tone: 'blue' as const, to: homeL1(), perm: 'all' },
    { key: 'l2Count', label: '二级代理', icon: 'Avatar', tone: 'green' as const, to: homeL2(), perm: 'l2' },
    { key: 'monthSales', label: '筛选区间销量', icon: 'TrendCharts', tone: 'purple' as const, to: homeSalesMonth(), perm: 'sales' },
    { key: 'boundSn', label: '已销售SN', icon: 'Goods', tone: 'orange' as const, to: homeBoundSn(), perm: 'stock' },
    { key: 'pendingPo', label: '待处理采购', icon: 'ShoppingCart', tone: 'amber' as const, to: homePendingPurchase(), perm: 'purchase' },
    { key: 'openEx', label: '待处理异常', icon: 'WarningFilled', tone: 'red' as const, to: homeOpenException(), perm: 'exception' },
  ].filter((c) => auth.hasPerm(c.perm))
  return defs.map((c) => {
    const t = trendOf(c.key)
    return {
      key: c.key,
      label: c.label,
      icon: c.icon,
      tone: c.tone,
      value: d[c.key] ?? 0,
      clickable: true,
      hint: t.hasPrev ? `较昨日 ${t.dir === 'down' ? '↓' : '↑'} ${t.pct}%` : '较昨日 —',
      hintDir: t.hasPrev ? t.dir : 'flat' as const,
      to: c.to,
    }
  })
})
function onKpi(item: KpiItem) {
  const hit = kpiCards.value.find((c) => c.key === item.key)
  if (hit) go(hit.to)
}

const todoItems = computed(() => [
  { key: 'pendingDisable', title: '代理停用待会签', icon: 'SwitchButton', tone: 'red', priority: 'high' as const, count: d.pendingDisable ?? 0, onClick: () => { disableDlg.value = true }, show: auth.hasPerm('all') },
  { key: 'pendingAssign', title: '待分配二级（法人）', icon: 'Timer', tone: 'blue', priority: 'mid' as const, count: d.pendingAssign ?? 0, onClick: () => go(homePendingAssign()), show: auth.hasPerm('all') },
  { key: 'pendingAudit', title: '二级审核待处理', icon: 'CircleCheck', tone: 'green', priority: 'mid' as const, count: d.pendingAudit ?? 0, onClick: () => go(homePendingAudit()), show: auth.hasPerm('all') },
  { key: 'pendingPo', title: '采购待处理/会签', icon: 'Document', tone: 'amber', priority: 'mid' as const, count: d.pendingPo ?? 0, onClick: () => go(homePendingPurchase()), show: auth.hasPerm('purchase') },
  { key: 'openEx', title: '待处理异常', icon: 'Warning', tone: 'red', priority: 'high' as const, count: d.openEx ?? 0, onClick: () => go(homeOpenException()), show: auth.hasPerm('exception') },
  { key: 'pendingReturn', title: '退货待审批', icon: 'RefreshLeft', tone: 'blue', priority: 'mid' as const, count: d.pendingReturn ?? 0, onClick: () => go(homePendingReturn()), show: auth.hasPerm('aftersale') },
].filter((t) => t.show))

function readSnap(): { day: string; values?: Record<string, number>; prevValues?: Record<string, number> | null } | null {
  try {
    const raw = localStorage.getItem(SNAP_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

async function loadDash() {
  loading.value = true
  try {
    const data = await api.dashboard()
    Object.assign(d, data)
    try {
      l1s.value = (await api.agentsL1({ page: 1, pageSize: 50 })).list || []
    } catch {
      l1s.value = []
    }
    const snap = readSnap()
    const today = todayKey()
    Object.keys(prev).forEach((k) => { delete prev[k] })
    if (snap?.day === today && snap.prevValues) {
      Object.assign(prev, snap.prevValues)
      localStorage.setItem(SNAP_KEY, JSON.stringify({ day: today, values: { ...d }, prevValues: snap.prevValues }))
    } else if (snap?.values) {
      Object.assign(prev, snap.values)
      localStorage.setItem(SNAP_KEY, JSON.stringify({ day: today, values: { ...d }, prevValues: snap.values }))
    } else {
      localStorage.setItem(SNAP_KEY, JSON.stringify({ day: today, values: { ...d }, prevValues: null }))
    }
    ready.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 1000)
  loadDash()
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 0;
}
.home-head-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.home-clock { font-size: 13px; color: var(--text-2); }
.ex-badge {
  border: 1px solid var(--color-danger-border, #F5C2C2);
  background: #fff;
  color: var(--danger);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.ex-badge.hot { background: #FCEBEB; }
.home-refresh { border-radius: 8px !important; }

.todo-card,
.l1-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}
.card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}
.todo-card h3,
.l1-card h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-strong);
}
.todo-card h3::before,
.l1-card h3::before {
  content: "";
  width: 3px;
  height: 14px;
  background: var(--primary);
  border-radius: 2px;
}
.l1-card { padding: 16px 20px 20px; }
.l1-card h3 { margin-bottom: 14px; }
.todo-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  padding: 14px 20px 20px;
}
.todo-tile {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 18px 14px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
}
.todo-tile::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
.todo-tile.t-blue::before,
.todo-tile.t-green::before { background: var(--primary); }
.todo-tile.t-amber::before { background: var(--warning); }
.todo-tile.t-red::before { background: var(--danger); }
.todo-tile:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(22, 32, 64, 0.09); }
.tile-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.tile-cat {
  font-size: 11px;
  color: var(--text-3);
  background: var(--bg);
  padding: 3px 9px;
  border-radius: 10px;
}
.tile-cat.high { background: #FCEBEB; color: #DE4B4B; }
.tile-cat.mid { background: #EAF2FD; color: #1A68D7; }
.todo-ico {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tone-red { background: #FCEBEB; color: #DE4B4B; }
.tone-blue { background: #EAF2FD; color: #1A68D7; }
.tone-green { background: #E6F6EE; color: #1B9E5A; }
.tone-amber { background: #FDF3E2; color: #E08A1E; }
.tile-name { font-size: 13px; font-weight: 500; color: var(--text-strong); }
.tile-foot { display: flex; align-items: baseline; justify-content: space-between; margin-top: 10px; }
.tile-count {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-strong);
  line-height: 1;
  font-family: var(--font-num);
}
.tile-count.hot { color: var(--danger); }
.tile-go { font-size: 11.5px; color: var(--text-3); }
.todo-tile:hover .tile-go { color: var(--primary); }
.tbl-link {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0 8px;
  height: auto;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--primary);
  cursor: pointer;
  line-height: 1.4;
}
.tbl-link:hover { color: var(--primary-hover); }
.hot { color: #dc2626; font-weight: 700; }

@media (max-width: 760px) {
  .home-head { flex-direction: column; }
  .todo-grid { grid-template-columns: 1fr; }
}
@media (min-width: 761px) and (max-width: 1180px) {
  .todo-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
