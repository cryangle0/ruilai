<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>采购单管理</h2>
        <p>一站式审核：标准/非标/配件 + 段号起止 + 双人会签即完成（下单仅一级小程序）</p>
      </div>
      <div class="page-actions">
        <BackToDetailButton />
      </div>
    </div>
    <PageTabs v-model="tab" :items="tabItems" />
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.l1Id" placeholder="全部一级" clearable filterable style="width:180px">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item><span class="muted-label">下单时间</span></el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
      </el-form-item>
    </SearchPanel>
    <KpiCards :items="kpiItems" />
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="openRow">
      <el-table-column prop="no" label="单号" width="150" />
      <el-table-column label="一级" min-width="120"><template #default="{row}">{{ nameOf(row.l1Id) }}</template></el-table-column>
      <el-table-column label="标准行" min-width="140"><template #default="{row}">{{ fmtLines(row.lines) }}</template></el-table-column>
      <el-table-column label="非标" min-width="140"><template #default="{row}">{{ fmtCustom(row.customLines) }}</template></el-table-column>
      <el-table-column label="配件" min-width="160">
        <template #default="{row}">{{ fmtParts(row.parts) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.status==='approved'?'tag-green':row.status==='pending'?'tag-orange':'tag-blue'">{{ poStatus(row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="会签" width="90">
        <template #default="{row}">{{ row.cosign?.admin1 ? '✓' : '-' }}/{{ row.cosign?.admin2 ? '✓' : '-' }}</template>
      </el-table-column>
      <el-table-column label="预警倍数异常" width="130"><template #default="{row}">{{ row.warnEx?.label || '—' }}</template></el-table-column>
      <el-table-column prop="createdAt" label="时间" width="170" :formatter="dateTimeFormatter" />
    </DataTableShell>
    <PurchaseDrawer v-model="drawer" :row="current" :l1s="l1s" @saved="load" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import PageTabs from '@/components/common/PageTabs.vue'
import PurchaseDrawer from './components/PurchaseDrawer.vue'
import BackToDetailButton from '@/components/common/BackToDetailButton.vue'
import KpiCards from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { applyListDatesWide, routeQ } from '@/utils/detailJump'
import { dateTimeFormatter } from '@/utils/dates'

const route = useRoute()
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const tab = ref('all')
const l1s = ref<any[]>([])
const products = ref<any[]>([])
const drawer = ref(false)
const current = ref<any>(null)
const counts = reactive({ all: 0, pending: 0, cosigning: 0, approved: 0 })
const metrics = reactive({ rangeQty: 0, histQty: 0 })
const kpiItems = computed(() => [
  { key: 'range', label: '筛选区间采购量', value: metrics.rangeQty, icon: 'Document', tone: 'blue' as const },
  { key: 'hist', label: '历史采购量', value: metrics.histQty, icon: 'Collection', tone: 'gray' as const },
])
const tabItems = computed(() => [
  { id: 'all', title: '全部', badge: counts.all },
  { id: 'pending', title: '待处理', badge: counts.pending },
  { id: 'cosigning', title: '会签中', badge: counts.cosigning },
  { id: 'approved', title: '已完成', badge: counts.approved },
])
function nameOf(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '—' }
function prodName(id?: string) { return products.value.find((p) => p.id === id)?.name || id || '—' }
function poStatus(s: string) {
  return ({ pending: '待处理', cosigning: '会签中', approved: '已完成', rejected: '已驳回' } as Record<string, string>)[s] || s
}
function lineQty(rows?: any[]) {
  return (rows || []).reduce((n, l) => n + (Number(l.qty) || 0), 0)
}
/** 原型 purchaseNeedQty：只要标准+非标，配件不计 SN */
function poNeedQty(p: any) { return lineQty(p.lines) + lineQty(p.customLines) }
function inRange(time: unknown, from: unknown, to: unknown) {
  const f = String(from || '')
  const t = String(to || '')
  if (!f && !t) return true
  const d = String(time || '').slice(0, 10)
  if (f && d < f) return false
  if (t && d > t) return false
  return true
}

async function load() {
  loading.value = true
  try {
    const status = tab.value === 'all' ? '' : tab.value
    const res = await api.purchases({
      page: page.value,
      pageSize: pageSize.value,
      l1Id: query.l1Id,
      from: query.from,
      to: query.to,
      status,
    })
    list.value = res.list
    total.value = res.total
    const liveRes = await api.purchases({ page: 1, pageSize: 200 })
    const live = (liveRes.list || []).filter((p: any) => p.status !== 'rejected')
    counts.all = live.length
    counts.pending = live.filter((p: any) => p.status === 'pending').length
    counts.cosigning = live.filter((p: any) => p.status === 'cosigning').length
    counts.approved = live.filter((p: any) => p.status === 'approved').length
    const poScope = live.filter((p: any) => !query.l1Id || p.l1Id === query.l1Id)
    metrics.histQty = poScope.reduce((n: number, p: any) => n + poNeedQty(p), 0)
    metrics.rangeQty = poScope.filter((p: any) => inRange(p.createdAt, query.from, query.to)).reduce((n: number, p: any) => n + poNeedQty(p), 0)
  } finally { loading.value = false }
}
function reset() {
  query.l1Id = ''; query.from = ''; query.to = ''; tab.value = 'all'
  resetPage(); load()
}
function fmtLines(lines?: any[]) {
  if (!lines?.length) return '—'
  return lines.map((l) => `${l.size || ''}×${l.qty}`).join('，')
}
function fmtCustom(lines?: any[]) {
  if (!lines?.length) return '—'
  return lines.map((l) => `${l.size || ''}+${l.belt || ''}×${l.qty}`).join('，')
}
function fmtParts(parts?: any[]) {
  if (!parts?.length) return '—'
  return parts.map((x) => `${prodName(x.partId)}/${x.spec}×${x.qty}`).join('，')
}
async function openRow(row: any) {
  current.value = await api.purchase(row.id)
  drawer.value = true
}

watch([page, pageSize], load)
watch(tab, () => { resetPage(); load() })
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  products.value = (await api.products({ page: 1, pageSize: 200 })).list || []
  if (routeQ(route.query, 'l1Id')) query.l1Id = routeQ(route.query, 'l1Id')
  if (routeQ(route.query, 'tab')) tab.value = routeQ(route.query, 'tab')
  applyListDatesWide(query, route.query)
  load()
})
</script>
<style scoped>
.muted-label { font-size: 12px; color: var(--text-3); }
</style>
