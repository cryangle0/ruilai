<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>一级退货详情</h2>
        <p>{{ l1Name }} · 可改筛选区间</p>
      </div>
      <div class="page-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
    <PageTabs v-model="tab" :items="tabItems" />
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.l1Id" placeholder="一级代理" filterable style="width:180px" @change="onL1Change">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="tab!=='user'">
        <el-select v-model="query.l2Id" placeholder="全部二级代理" clearable filterable style="width:180px">
          <el-option v-for="a in l2Opts" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item><span class="muted-label">退货时间</span></el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
      </el-form-item>
      <el-form-item v-if="!noAudit">
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option label="待审" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已处理" value="done" />
        </el-select>
      </el-form-item>
    </SearchPanel>
    <KpiCards :items="kpiItems" />
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="openRow">
      <el-table-column prop="no" label="单号" width="150" />
      <el-table-column prop="typeLabel" label="类型" width="120" />
      <template v-if="showCust">
        <el-table-column label="姓名" width="90"><template #default="{row}">{{ row.customer?.name || '—' }}</template></el-table-column>
        <el-table-column label="手机号" width="120"><template #default="{row}">{{ row.customer?.phone || '—' }}</template></el-table-column>
        <el-table-column label="地区" min-width="120"><template #default="{row}">{{ row.customer?.region || row.customer?.phoneLoc || '—' }}</template></el-table-column>
      </template>
      <el-table-column label="理由" min-width="160">
        <template #default="{row}"><span class="tag tag-gray">{{ row.reasonType || '其他' }}</span> {{ row.reason }}</template>
      </el-table-column>
      <el-table-column label="商品明细" min-width="160"><template #default="{row}">{{ row.productDetail || '—' }}</template></el-table-column>
      <el-table-column v-if="!noAudit" label="状态" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.status==='pending'?'tag-orange':row.status==='rejected'?'tag-red':'tag-green'">{{ rtStatus(row.status) }}</span>
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
import KpiCards from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { dateTimeFormatter, monthStart, todayDate } from '@/utils/dates'

const route = useRoute()
const router = useRouter()
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const tab = ref('all')
const l1s = ref<any[]>([])
const l2s = ref<any[]>([])
const kindCounts = reactive({ factory: 0, l2: 0, user: 0, all: 0 })
const metrics = reactive({ rangeQty: 0, histQty: 0 })
const detailOpen = ref(false)
const detailId = ref('')
query.from = monthStart()
query.to = todayDate()
const typeMap: Record<string, string> = { factory: 'l1_to_factory', l2: 'l2_to_l1', user: 'user' }
const l2Opts = computed(() => l2s.value.filter((a) => !a.pending && a.parentId === query.l1Id))
const l1Name = computed(() => l1s.value.find((a) => a.id === query.l1Id)?.name || '')
const noAudit = computed(() => tab.value === 'user' || tab.value === 'l2')
const showCust = computed(() => tab.value === 'user' || tab.value === 'all')
const kpiItems = computed(() => [
  { key: 'range', label: '筛选区间退货', value: metrics.rangeQty, icon: 'RefreshLeft', tone: 'green' as const },
  { key: 'hist', label: '历史总量', value: metrics.histQty, icon: 'DataAnalysis', tone: 'blue' as const },
])
const tabItems = computed(() => [
  { id: 'factory', title: '一级代理退原厂', badge: kindCounts.factory },
  { id: 'l2', title: '二级代理退货', badge: kindCounts.l2 },
  { id: 'user', title: '直售客户退货', badge: kindCounts.user },
  { id: 'all', title: '全部类型', badge: kindCounts.all },
])
function rtStatus(s: string) {
  return ({ pending: '待审', approved: '已通过', done: '已处理', rejected: '已驳回' } as Record<string, string>)[s] || s
}
function goBack() {
  const id = String(query.l1Id || route.query.l1Id || '')
  router.push(id ? { path: '/agent/l1', query: { id } } : '/agent/l1')
}
function onL1Change() { query.l2Id = ''; resetPage(); load() }

async function load() {
  loading.value = true
  try {
    if (tab.value === 'user') query.l2Id = ''
    const type = typeMap[tab.value] || ''
    const status = noAudit.value ? '' : String(query.status || '')
    const res = await api.returns({
      page: page.value, pageSize: pageSize.value,
      l1Id: query.l1Id, l2Id: query.l2Id, from: query.from, to: query.to, type, status,
    })
    list.value = res.list
    total.value = res.total
    const scoped = await api.returns({ page: 1, pageSize: 200, l1Id: query.l1Id, l2Id: query.l2Id, from: query.from, to: query.to })
    const rows = scoped.list || []
    kindCounts.factory = rows.filter((r: any) => r.type === 'l1_to_factory').length
    kindCounts.l2 = rows.filter((r: any) => r.type === 'l2_to_l1').length
    kindCounts.user = rows.filter((r: any) => r.type === 'user').length
    kindCounts.all = rows.length
    const shown = type ? rows.filter((r: any) => r.type === type) : rows
    metrics.rangeQty = shown.reduce((n: number, r: any) => n + ((r.sns || []).length), 0)
    const hist = await api.returns({ page: 1, pageSize: 200, l1Id: query.l1Id, type })
    metrics.histQty = (hist.list || []).reduce((n: number, r: any) => n + ((r.sns || []).length), 0)
  } finally { loading.value = false }
}
function reset() {
  query.from = monthStart(); query.to = todayDate(); query.l2Id = ''; query.status = ''
  tab.value = 'all'
  resetPage(); load()
}
function openRow(row: any) { detailId.value = row.id; detailOpen.value = true }
watch([page, pageSize], load)
watch(tab, () => { if (tab.value === 'user') query.l2Id = ''; resetPage(); load() })
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  query.l1Id = String(route.query.l1Id || l1s.value[0]?.id || '')
  load()
})
</script>
<style scoped>
.muted-label { font-size: 12px; color: var(--text-3); }
</style>
