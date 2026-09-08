<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>返货管理</h2>
        <p>列表含 SN · 统计可点进详情</p>
      </div>
      <div class="page-actions">
        <BackToDetailButton />
        <el-button @click="router.push('/risk/stats')">数据统计</el-button>
      </div>
    </div>
    <PageTabs v-model="kind" :items="kindItems" />
    <PageTabs v-if="showAuditUi" v-model="statusTab" :items="statusItems" size="pill" />
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.l1Id" placeholder="全部一级" clearable filterable style="width:160px">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="showL2Filter">
        <el-select v-model="query.l2Id" placeholder="全部二级" clearable filterable style="width:160px">
          <el-option v-for="a in l2Opts" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.reasonType" placeholder="退货理由" clearable style="width:140px">
          <el-option v-for="r in RETURN_REASONS" :key="r.type" :label="r.label" :value="r.type" />
        </el-select>
      </el-form-item>
      <el-form-item><span class="muted-label">退货时间</span></el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
      </el-form-item>
    </SearchPanel>
    <KpiCards :items="kpiItems" @select="onKpi" />
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="openRow">
      <el-table-column prop="no" label="单号" width="150" />
      <el-table-column label="SN码" min-width="140">
        <template #default="{row}"><code>{{ (row.sns||[]).join(' ') || '—' }}</code></template>
      </el-table-column>
      <el-table-column label="商品明细" min-width="160"><template #default="{row}">{{ row.productDetail || '—' }}</template></el-table-column>
      <el-table-column prop="typeLabel" label="类型" width="120" />
      <el-table-column prop="fromName" label="来源" min-width="120" />
      <template v-if="kind==='user'">
        <el-table-column label="姓名" width="90"><template #default="{row}">{{ row.customer?.name || '—' }}</template></el-table-column>
        <el-table-column label="手机号" width="120"><template #default="{row}">{{ row.customer?.phone || '—' }}</template></el-table-column>
        <el-table-column label="地区" min-width="120"><template #default="{row}">{{ row.customer?.region || row.customer?.phoneLoc || '—' }}</template></el-table-column>
      </template>
      <el-table-column label="理由" min-width="160">
        <template #default="{row}"><span class="tag tag-gray">{{ row.reasonType || '其他' }}</span> {{ row.reason }}</template>
      </el-table-column>
      <el-table-column v-if="showAuditUi" label="状态" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.status==='pending'?'tag-orange':row.status==='rejected'?'tag-red':'tag-green'">
            {{ rtStatus(row.status) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="170" :formatter="dateTimeFormatter" />
    </DataTableShell>

    <ReturnOrderDialog v-model="detailOpen" :id="detailId" @saved="load" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import PageTabs from '@/components/common/PageTabs.vue'
import ReturnOrderDialog from '@/views/risk/components/ReturnOrderDialog.vue'
import BackToDetailButton from '@/components/common/BackToDetailButton.vue'
import KpiCards, { type KpiItem } from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { RETURN_REASONS } from '@/utils/format'
import { applyListDates, routeQ } from '@/utils/detailJump'
import { dateTimeFormatter, monthStart, todayDate } from '@/utils/dates'

const KIND_ALIAS: Record<string, string> = {
  factory: 'l1_to_factory',
  l2: 'l2_to_l1',
  l1_to_factory: 'l1_to_factory',
  l2_to_l1: 'l2_to_l1',
  user: 'user',
  all: 'all',
}

const route = useRoute()
const router = useRouter()
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const kind = ref('l1_to_factory')
const statusTab = ref('all')
const l1s = ref<any[]>([])
const l2s = ref<any[]>([])
const kindCounts = reactive({ factory: 0, factoryPending: 0, l2: 0, user: 0, all: 0 })
const metrics = reactive({ rangeQty: 0, histQty: 0, pending: 0 })
const detailOpen = ref(false)
const detailId = ref('')
const showAuditUi = computed(() => kind.value !== 'user' && kind.value !== 'l2_to_l1')
const showL2Filter = computed(() => kind.value !== 'user' && kind.value !== 'l1_to_factory')
const l2Opts = computed(() => {
  const all = l2s.value || []
  if (!query.l1Id) return all
  return all.filter((a: any) => a.parentId === query.l1Id)
})
const kindItems = computed(() => [
  { id: 'l1_to_factory', title: '一级代理退原厂', badge: kindCounts.factoryPending || null },
  { id: 'l2_to_l1', title: '二级代理退货' },
  { id: 'user', title: '终端退货' },
  { id: 'all', title: '全部类型' },
])
const kpiItems = computed(() => {
  const items: KpiItem[] = [
    { key: 'range', label: '筛选区间退货件数', value: metrics.rangeQty, icon: 'RefreshLeft', tone: 'green' },
    { key: 'hist', label: '历史退货件数', value: metrics.histQty, icon: 'DataAnalysis', tone: 'blue' },
  ]
  if (showAuditUi.value) {
    items.push({ key: 'pending', label: '待审单', value: metrics.pending, icon: 'Timer', tone: 'amber', clickable: true })
  }
  return items
})
function onKpi(item: KpiItem) {
  if (item.key === 'pending') statusTab.value = 'pending'
}
const statusItems = computed(() => [
  { id: 'all', title: '全部' },
  { id: 'pending', title: '待审核' },
  { id: 'done', title: '已通过' },
  { id: 'rejected', title: '已驳回' },
])
function rtStatus(s: string) {
  return ({ pending: '待审核', approved: '已通过', done: '已通过', rejected: '已驳回' } as Record<string, string>)[s] || s
}

function listQuery() {
  const l2Id = kind.value === 'user' ? '' : query.l2Id
  return {
    l1Id: query.l1Id,
    l2Id,
    reasonType: query.reasonType,
    from: query.from,
    to: query.to,
    type: kind.value === 'all' ? '' : kind.value,
    status: showAuditUi.value && statusTab.value !== 'all' ? statusTab.value : '',
  }
}

async function load() {
  loading.value = true
  try {
    if (query.l2Id && query.l1Id && !l2Opts.value.some((a: any) => a.id === query.l2Id)) {
      query.l2Id = ''
    }
    const q = listQuery()
    const res = await api.returns({ page: page.value, pageSize: pageSize.value, ...q })
    list.value = res.list
    total.value = res.total
    const scoped = await api.returns({
      page: 1,
      pageSize: 200,
      l1Id: q.l1Id,
      l2Id: q.l2Id,
      from: q.from,
      to: q.to,
      reasonType: q.reasonType,
    })
    const rows = scoped.list || []
    kindCounts.factory = rows.filter((r: any) => r.type === 'l1_to_factory').length
    kindCounts.factoryPending = rows.filter((r: any) => r.type === 'l1_to_factory' && r.status === 'pending').length
    kindCounts.l2 = rows.filter((r: any) => r.type === 'l2_to_l1').length
    kindCounts.user = rows.filter((r: any) => r.type === 'user').length
    kindCounts.all = rows.length
    const shown = kind.value === 'all' ? rows : rows.filter((r: any) => r.type === kind.value)
    metrics.rangeQty = shown.reduce((n: number, r: any) => n + ((r.sns || []).length), 0)
    metrics.pending = shown.filter((r: any) => r.status === 'pending').length
    const hist = await api.returns({
      page: 1,
      pageSize: 200,
      l1Id: q.l1Id,
      l2Id: q.l2Id,
      type: q.type,
    })
    metrics.histQty = (hist.list || []).reduce((n: number, r: any) => n + ((r.sns || []).length), 0)
  } finally { loading.value = false }
}
function reset() {
  query.l1Id = ''; query.l2Id = ''; query.reasonType = ''
  query.from = monthStart(); query.to = todayDate()
  kind.value = 'l1_to_factory'; statusTab.value = 'all'
  resetPage(); load()
}
function openRow(row: any) {
  detailId.value = row.id
  detailOpen.value = true
}
const ready = ref(false)
watch([page, pageSize], () => { if (ready.value) load() })
watch(kind, (k) => {
  if (!ready.value) return
  if (k === 'user' || k === 'l2_to_l1') statusTab.value = 'all'
  resetPage()
  load()
})
watch(statusTab, () => { if (ready.value) { resetPage(); load() } })
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  if (routeQ(route.query, 'l1Id')) query.l1Id = routeQ(route.query, 'l1Id')
  if (routeQ(route.query, 'l2Id')) query.l2Id = routeQ(route.query, 'l2Id')
  if (query.l2Id && !query.l1Id) {
    const l2 = l2s.value.find((a: any) => a.id === query.l2Id)
    if (l2?.parentId) query.l1Id = l2.parentId
  }
  const kindQ = KIND_ALIAS[routeQ(route.query, 'kind')]
  if (kindQ) kind.value = kindQ
  const statusQ = routeQ(route.query, 'status')
  if (statusQ && statusQ !== 'all') statusTab.value = statusQ
  if (!showAuditUi.value) statusTab.value = 'all'
  applyListDates(query, route.query)
  ready.value = true
  load()
})
</script>
<style scoped>
.muted-label, .muted { font-size: 12px; color: var(--text-3); }
h4 { margin: 14px 0 8px; font-size: 13px; }
code { font-size: 12px; }
</style>
