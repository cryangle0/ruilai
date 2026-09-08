<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>销售单管理</h2>
        <p>{{ query.l1Id ? nameOf(String(query.l1Id)) + ' · 可改筛选区间' : '分销 / 直售合一 · 可改筛选区间' }}</p>
      </div>
      <div class="page-actions">
        <BackToDetailButton />
      </div>
    </div>
    <PageTabs v-model="channelTab" :items="tabItems" />
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.l1Id" placeholder="全部一级" clearable filterable style="width:160px">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="channelTab!=='direct'">
        <el-select v-model="query.l2Id" placeholder="所有二级" clearable filterable style="width:160px">
          <el-option v-for="a in l2s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option label="扫码中" value="scanning" /><el-option label="已完成" value="done" />
        </el-select>
      </el-form-item>
    </SearchPanel>
    <KpiCards :items="kpiItems" />
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="openRow">
      <el-table-column prop="no" label="单号" width="150" />
      <el-table-column label="渠道" width="80">
        <template #default="{row}">
          <span class="tag" :class="row.channel==='direct'?'tag-orange':'tag-blue'">{{ row.channel==='direct'?'直售':'分销' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="l1Name" label="一级" min-width="120" />
      <template v-if="channelTab==='direct'">
        <el-table-column label="姓名" width="90"><template #default="{row}">{{ row.customer?.name || '—' }}</template></el-table-column>
        <el-table-column label="手机号" width="120"><template #default="{row}">{{ row.customer?.phone || '—' }}</template></el-table-column>
        <el-table-column label="地区" min-width="120"><template #default="{row}">{{ row.customer?.region || row.customer?.phoneLoc || row.customer?.addr || '—' }}</template></el-table-column>
      </template>
      <el-table-column v-else label="二级/客户" min-width="120">
        <template #default="{row}">{{ row.channel==='direct' ? (row.customer?.name || 'C端直销') : (row.l2Name || row.l2Id) }}</template>
      </el-table-column>
      <el-table-column prop="productDetail" label="商品明细" min-width="160" />
      <el-table-column label="已扫/计划" width="100">
        <template #default="{row}">{{ (row.scanned||[]).length }}/{{ row.planTotal||0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.status==='done'?'tag-green':'tag-orange'">{{ row.status==='done'?'已完成':'扫码中' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预警倍数异常" width="140">
        <template #default="{row}">{{ row.warnEx?.label || '—' }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="170" :formatter="dateTimeFormatter" />
    </DataTableShell>

    <el-dialog v-model="detailOpen" :title="detail?.no ? `销售单 ${detail.no}` : '销售单'" width="720px">
      <template v-if="detail">
        <div class="detail-grid">
          <div><span>渠道</span><span class="tag" :class="detail.channel==='direct'?'tag-orange':'tag-blue'">{{ detail.channel==='direct'?'直售':'分销' }}</span></div>
          <div><span>状态</span><span class="tag" :class="detail.status==='done'?'tag-green':'tag-orange'">{{ detail.status==='done'?'已完成':'扫码中' }}</span></div>
          <div><span>一级</span>{{ detail.l1Name || '—' }}</div>
          <div><span>二级</span>{{ detail.l2Name || '—' }}</div>
          <template v-if="detail.channel==='direct'">
            <div><span>姓名</span>{{ detail.customer?.name || '—' }}</div>
            <div><span>手机号</span>{{ detail.customer?.phone || '—' }}</div>
            <div><span>地区</span>{{ detail.customer?.region || detail.customer?.phoneLoc || detail.customer?.addr || '—' }}</div>
          </template>
          <div><span>计划/已扫</span>{{ (detail.scanned||[]).length }}/{{ detail.planTotal||0 }}</div>
          <div><span>时间</span>{{ formatDateTime(detail.createdAt) }}</div>
        </div>
        <h4>商品明细</h4>
        <el-table :data="productRows" size="small" border>
          <el-table-column prop="productName" label="商品" min-width="140" />
          <el-table-column prop="size" label="弹力带" width="80" />
          <el-table-column prop="belt" label="腰带" width="90" />
          <el-table-column prop="plan" label="计划" width="70" align="right" />
          <el-table-column prop="scanned" label="已扫" width="70" align="right" />
        </el-table>
        <h4>SN码（{{ (detail.snRows||detail.scanned||[]).length }}）</h4>
        <el-table :data="detail.snRows || []" size="small" border>
          <el-table-column prop="sn" label="SN" min-width="150"><template #default="{row}"><code>{{ row.sn }}</code></template></el-table-column>
          <el-table-column prop="size" label="尺码" width="80" />
          <el-table-column prop="belt" label="腰带" width="90" />
          <el-table-column prop="user" label="客户" min-width="160" />
        </el-table>
      </template>
      <template #footer>
        <el-button @click="detailOpen=false">关闭</el-button>
        <el-button v-if="detail?.channel==='direct'" type="primary" plain @click="goCustomers">查看客户</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import PageTabs from '@/components/common/PageTabs.vue'
import BackToDetailButton from '@/components/common/BackToDetailButton.vue'
import KpiCards from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { applyListDates, routeQ, statsToCustomers } from '@/utils/detailJump'
import { dateTimeFormatter, formatDateTime, monthStart, todayDate } from '@/utils/dates'

const route = useRoute()
const router = useRouter()
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const channelTab = ref('all')
const l1s = ref<any[]>([])
const l2s = ref<any[]>([])
const summary = reactive<Record<string, number>>({})
const detailOpen = ref(false)
const detail = ref<any>(null)
const kpiItems = computed(() => [
  { key: 'range', label: '筛选区间销量', value: summary.rangeQty ?? 0, icon: 'TrendCharts', tone: 'green' as const },
  { key: 'hist', label: '历史销量', value: summary.histQty ?? 0, icon: 'DataAnalysis', tone: 'blue' as const },
])
const tabItems = computed(() => [
  { id: 'distribute', title: '分销', badge: summary.distN || 0 },
  { id: 'direct', title: '直售', badge: summary.dirN || 0 },
  { id: 'all', title: '全部', badge: (summary.distN || 0) + (summary.dirN || 0) },
])
const productRows = computed(() => {
  const s = detail.value
  if (!s) return []
  const scanned = s.snRows || []
  const lines = s.lines || []
  const parts = (s.parts || []).map((p: any) => ({
    productName: `${p.partName || p.partId || '配件'}（配件）`,
    size: '—',
    belt: p.spec || '—',
    plan: p.qty || 0,
    scanned: '—',
  }))
  if (lines.length) {
    return [
      ...lines.map((l: any) => ({
        productName: s.productName || l.productName || l.productId || '—',
        size: l.size,
        belt: l.belt || '—',
        plan: l.qty || 0,
        scanned: scanned.filter((x: any) => x.size === l.size && (!l.belt || x.belt === l.belt)).length,
      })),
      ...parts,
    ]
  }
  const plan = s.planBySize || {}
  return [
    ...Object.keys(plan).map((size) => ({
      productName: s.productName || s.productId || '—',
      size,
      belt: scanned.find((x: any) => x.size === size)?.belt || '—',
      plan: Number(plan[size] || 0),
      scanned: scanned.filter((x: any) => x.size === size).length,
    })),
    ...parts,
  ]
})
function nameOf(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '' }

async function load() {
  loading.value = true
  try {
    query.channel = channelTab.value === 'all' ? '' : channelTab.value
    const l2Id = channelTab.value === 'direct' ? '' : query.l2Id
    const [res, sum] = await Promise.all([
      api.sales({ page: page.value, pageSize: pageSize.value, ...query, l2Id }),
      api.salesSummary({ l1Id: query.l1Id, from: query.from, to: query.to }),
    ])
    list.value = res.list
    total.value = res.total
    Object.assign(summary, sum)
    if (query.l1Id) {
      l2s.value = (await api.agentsL2({ page: 1, pageSize: 100, parentId: query.l1Id, auditStatus: 'approved' })).list || []
    }
  } finally { loading.value = false }
}
function reset() {
  channelTab.value = 'all'
  query.status = ''; query.l1Id = ''; query.l2Id = ''
  query.from = monthStart(); query.to = todayDate()
  resetPage(); load()
}
async function openRow(row: any) {
  detail.value = await api.sale(row.id)
  detailOpen.value = true
}
function goCustomers() {
  const d = detail.value || {}
  router.push(statsToCustomers({
    l1Id: d.l1Id,
    l2Id: d.l2Id,
  }, 'direct'))
}
watch([page, pageSize], load)
watch(channelTab, () => { resetPage(); load() })
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  if (routeQ(route.query, 'l1Id')) query.l1Id = routeQ(route.query, 'l1Id')
  if (routeQ(route.query, 'l2Id')) query.l2Id = routeQ(route.query, 'l2Id')
  if (routeQ(route.query, 'tab')) channelTab.value = routeQ(route.query, 'tab')
  applyListDates(query, route.query)
  load()
})
</script>
<style scoped>
h4 { margin: 14px 0 8px; font-size: 13px; }
code { font-size: 12px; }
</style>
