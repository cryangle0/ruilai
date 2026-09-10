<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>库存管理</h2>
        <p>按商品/代理/规格汇总；详情可看流水与 SN，SN 可跳转码库</p>
      </div>
      <div class="page-actions">
        <BackToDetailButton />
      </div>
    </div>
    <PageTabs v-model="tab" :items="tabItems" />
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.agentType" placeholder="全部层级" clearable style="width:120px">
          <el-option label="一级" value="l1" /><el-option label="二级" value="l2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.agentId" placeholder="全部代理" clearable filterable style="width:180px">
          <el-option v-for="a in agents" :key="a.id" :label="a.label" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.productId" placeholder="商品" clearable filterable style="width:160px">
          <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.size" placeholder="弹力带尺码" clearable style="width:130px">
          <el-option v-for="s in BAND_SIZES" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.belt" placeholder="腰带尺码" clearable style="width:130px">
          <el-option v-for="s in BELTS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="tab==='sn'"><el-input v-model="query.sn" placeholder="SN" clearable style="width:160px" /></el-form-item>
      <template v-if="tab==='flow'">
        <el-form-item>
          <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
        </el-form-item>
      </template>
    </SearchPanel>
    <KpiCards :items="kpiItems" />
    <DataTableShell v-if="tab==='summary'" :data="list" :loading="loading" :total="list.length" :show-pagination="false" @row-click="openStock">
      <template #toolbar><div class="table-caption">产品种类数（{{ list.length }}）</div></template>
      <el-table-column prop="productName" label="商品" min-width="160" />
      <el-table-column prop="l1Name" label="一级代理名称" min-width="120" />
      <el-table-column prop="l2Name" label="二级代理名称" min-width="120" />
      <el-table-column label="规格" width="140">
        <template #default="{row}">{{ stockSpecText(row.size, row.belt) }}</template>
      </el-table-column>
      <el-table-column prop="qty" label="数量" width="80" align="right" />
    </DataTableShell>
    <DataTableShell v-else-if="tab==='sn'" :data="sns" :loading="loading" :total="snTotal" v-model:page="snPage" v-model:pageSize="snPageSize" @row-click="openSn">
      <el-table-column prop="sn" label="SN" min-width="160" />
      <el-table-column prop="productName" label="商品" min-width="140" />
      <el-table-column label="一级代理名称" min-width="120"><template #default="{row}">{{ nameL1(row.l1Id) }}</template></el-table-column>
      <el-table-column label="二级代理名称" min-width="120"><template #default="{row}">{{ nameL2(row.l2Id) }}</template></el-table-column>
      <el-table-column label="规格" width="120"><template #default="{row}">{{ stockSpecText(row.sizeCode, row.belt) }}</template></el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.status==='bound'?'tag-green':row.status==='l2'?'tag-blue':'tag-gray'">{{ statusLabel(row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="120"><template #default="{row}">{{ (row.tags||[]).join('、') || '—' }}</template></el-table-column>
    </DataTableShell>
    <DataTableShell v-else :data="visibleLogs" :loading="loading" :total="visibleLogs.length" :show-pagination="false">
      <el-table-column prop="occurredAt" label="时间" width="170" :formatter="dateTimeFormatter" />
      <el-table-column label="代理" min-width="120"><template #default="{row}">{{ agentLabel(row) }}</template></el-table-column>
      <el-table-column label="商品" min-width="140"><template #default="{row}">{{ productNameOf(row.productId) }}/{{ row.sizeCode }}</template></el-table-column>
      <el-table-column prop="delta" label="变动" width="80">
        <template #default="{row}">{{ row.delta>0 ? '+'+row.delta : row.delta }}</template>
      </el-table-column>
      <el-table-column prop="reason" label="原因" min-width="140" />
      <el-table-column prop="refNo" label="单号" width="140" />
    </DataTableShell>

    <el-dialog v-model="stockOpen" :title="stockRow ? `库存详情 · ${stockRow.productName}` : '库存详情'" width="720px">
      <template v-if="stockRow">
        <div class="detail-grid">
          <div><span>商品</span>{{ stockRow.productName }}</div>
          <div><span>规格</span>{{ stockSpecText(stockRow.size, stockRow.belt) }}</div>
          <div><span>一级代理名称</span>{{ stockRow.l1Name }}</div>
          <div><span>二级代理名称</span>{{ stockRow.l2Name || '—' }}</div>
          <div><span>数量</span><strong>{{ stockRow.qty }}</strong></div>
          <div><span>层级</span><span class="tag" :class="stockRow.agentType==='l2'?'tag-blue':'tag-green'">{{ stockRow.agentType==='l2'?'二级在库':'一级在库' }}</span></div>
          <div v-if="(stockRow.tags||[]).length" class="span-2"><span>标签</span>{{ (stockRow.tags||[]).join('、') }}</div>
        </div>
        <h4>流水（{{ rowLogs.length }}）</h4>
        <el-table :data="rowLogs" size="small" border>
          <el-table-column prop="occurredAt" label="时间" width="170" :formatter="dateTimeFormatter" />
          <el-table-column label="代理" min-width="100"><template #default="{row}">{{ agentLabel(row) }}</template></el-table-column>
          <el-table-column prop="delta" label="变动" width="70">
            <template #default="{row}">{{ row.delta>0 ? '+'+row.delta : row.delta }}</template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" />
          <el-table-column prop="refNo" label="单号" width="120" />
        </el-table>
        <h4>SN码（{{ (stockRow.sns||[]).length }}）</h4>
        <p class="muted">点击 SN 跳转码库并按该码筛选</p>
        <el-table :data="rowSns" size="small" border @row-click="openSn">
          <el-table-column prop="sn" label="SN" min-width="150">
            <template #default="{row}"><el-button text type="primary" @click.stop="openSn(row)">{{ row.sn }}</el-button></template>
          </el-table-column>
          <el-table-column label="规格" width="130"><template #default="{row}">{{ stockSpecText(row.sizeCode || stockRow.size, row.belt || stockRow.belt) }}</template></el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{row}"><span class="tag" :class="snStatusTone(row.status)">{{ snStatusLabel(row.status) }}</span></template>
          </el-table-column>
          <el-table-column label="标签"><template #default="{row}">{{ (row.tags||[]).join('、') || '—' }}</template></el-table-column>
          <el-table-column width="80"><template #default="{row}"><el-button size="small" @click.stop="openSn(row)">详情</el-button></template></el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button @click="stockOpen=false">关闭</el-button>
        <el-button v-if="stockRow" type="primary" @click="gotoSnLib">在 SN 码库查看</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import PageTabs from '@/components/common/PageTabs.vue'
import BackToDetailButton from '@/components/common/BackToDetailButton.vue'
import KpiCards from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { BAND_SIZES, BELTS } from '@/utils/regions'
import { snStatusLabel, snStatusTone, stockSpecText } from '@/utils/format'
import { applyListDates, routeQ } from '@/utils/detailJump'
import { dateTimeFormatter, monthStart, todayDate } from '@/utils/dates'

const route = useRoute()
const router = useRouter()
const tab = ref('summary')
const query = ref<Record<string, string>>({ agentType: '', agentId: '', productId: '', size: '', belt: '', sn: '', from: '', to: '' })
const list = ref<any[]>([])
const logs = ref<any[]>([])
const sns = ref<any[]>([])
const snTotal = ref(0)
const snPage = ref(1)
const snPageSize = ref(20)
const products = ref<any[]>([])
const l1s = ref<any[]>([])
const l2s = ref<any[]>([])
const loading = ref(false)
const stockOpen = ref(false)
const stockRow = ref<any>(null)
const rowSns = ref<any[]>([])
const detailLogs = ref<any[]>([])
const ingesting = ref(true)

/** 对齐原型 stockRowLogs：二级行附带一级「销售转入/退货/出库」 */
function stockRowLogsOf(row: any, src: any[]) {
  return (src || []).filter((h: any) => {
    if (h.productId !== row.productId) return false
    const hSize = h.sizeCode || h.size
    if (hSize && row.size && hSize !== row.size) return false
    if (row.agentType === 'l1') return h.agentType === 'l1' && h.agentId === row.l1Id
    const reason = String(h.reason || '')
    return (h.agentType === 'l2' && h.agentId === row.l2Id)
      || (h.agentType === 'l1' && h.agentId === row.l1Id && /销售转入|退货|出库/.test(reason))
  }).slice(0, 40)
}
const rowLogs = computed(() => {
  const r = stockRow.value
  if (!r) return []
  return stockRowLogsOf(r, detailLogs.value.length ? detailLogs.value : logs.value)
})
const visibleLogs = computed(() => {
  const from = query.value.from
  const to = query.value.to
  return logs.value.filter((h) => {
    const t = String(h.occurredAt || '').slice(0, 10)
    if (from && t < from) return false
    if (to && t > to) return false
    return true
  })
})
const totalQty = computed(() => list.value.reduce((n, r) => n + (Number(r.qty) || 0), 0))
const rangeQty = computed(() => visibleLogs.value.reduce((n, h) => n + Math.abs(Number(h.delta) || 0), 0))
const kpiItems = computed(() => {
  if (tab.value === 'flow') {
    return [
      { key: 'range', label: '当前筛选区间库存量', value: rangeQty.value, icon: 'TrendCharts', tone: 'green' as const },
      { key: 'total', label: '库存总量', value: totalQty.value, icon: 'Box', tone: 'purple' as const },
    ]
  }
  return [
    { key: 'total', label: '库存总量', value: totalQty.value, icon: 'Box', tone: 'purple' as const },
    { key: 'kinds', label: '产品种类数', value: list.value.length, icon: 'Grid', tone: 'gray' as const },
  ]
})
const tabItems = computed(() => [
  { id: 'summary', title: '产品种类数' },
  { id: 'sn', title: 'SN 列表' },
  { id: 'flow', title: '库存流水' },
])
const agents = computed(() => {
  if (query.value.agentType === 'l2') return l2s.value.map((a) => ({ id: a.id, label: a.name }))
  if (query.value.agentType === 'l1') return l1s.value.map((a) => ({ id: a.id, label: a.name }))
  return [
    ...l1s.value.map((a) => ({ id: a.id, label: `一级 · ${a.name}` })),
    ...l2s.value.map((a) => ({ id: a.id, label: `二级 · ${a.name}` })),
  ]
})
function nameL1(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '—' }
function nameL2(id?: string) { return l2s.value.find((a) => a.id === id)?.name || id || '—' }
function productNameOf(id?: string) { return products.value.find((p) => p.id === id)?.name || id || '—' }
function agentLabel(row: any) {
  return row.agentType === 'l2' ? nameL2(row.agentId) : nameL1(row.agentId)
}
function statusLabel(s: string) {
  return snStatusLabel(s)
}
async function openStock(row: any) {
  stockRow.value = row
  stockOpen.value = true
  const [snRes, allLogs] = await Promise.all([
    api.sns({
      page: 1, pageSize: 200,
      productId: row.productId,
      l1Id: row.l1Id, l2Id: row.l2Id,
      size: row.size, belt: row.belt,
      status: row.agentType === 'l2' ? 'l2' : 'l1',
    }),
    api.stockLogs(),
  ])
  detailLogs.value = allLogs || []
  const want = new Set(row.sns || [])
  rowSns.value = (snRes.list || []).filter((s: any) => !want.size || want.has(s.sn))
  if (!rowSns.value.length && (row.sns || []).length) {
    rowSns.value = (row.sns || []).map((sn: string) => ({ sn, sizeCode: row.size, belt: row.belt, status: row.agentType, tags: [] }))
  }
}
function gotoSnLib() {
  const r = stockRow.value
  if (!r) return
  router.push({
    path: '/goods/sn',
    query: {
      productId: r.productId || '',
      l1Id: r.l1Id || '',
      l2Id: r.l2Id || '',
      size: r.size || '',
      belt: r.belt || '',
      status: r.agentType === 'l2' ? 'l2' : 'l1',
    },
  })
}

async function load() {
  loading.value = true
  try {
    const q = query.value
    list.value = await api.stock({ agentType: q.agentType, agentId: q.agentId, productId: q.productId, size: q.size, belt: q.belt })
    logs.value = await api.stockLogs({
      ...(q.agentId ? { agentId: q.agentId } : {}),
      ...(q.agentType ? { agentType: q.agentType } : {}),
    })
    const snStatus = q.agentType === 'l2' ? 'l2' : (q.agentType === 'l1' ? 'l1' : '')
    const snRes = await api.sns({
      page: snPage.value,
      pageSize: snPageSize.value,
      sn: q.sn,
      productId: q.productId,
      l1Id: q.agentType === 'l1' ? q.agentId : '',
      l2Id: q.agentType === 'l2' ? q.agentId : '',
      status: snStatus,
      size: q.size,
      belt: q.belt,
    })
    sns.value = snRes.list
    snTotal.value = snRes.total
  } finally { loading.value = false }
}
function reset() {
  query.value = { agentType: '', agentId: '', productId: '', size: '', belt: '', sn: '', from: monthStart(), to: todayDate() }
  snPage.value = 1
  load()
}
function openSn(row: any) {
  router.push({ path: '/goods/sn', query: { sn: row.sn } })
}
watch(() => query.value.agentType, () => {
  if (ingesting.value) return
  query.value.agentId = ''
})
watch(tab, load)
watch([snPage, snPageSize], () => { if (tab.value === 'sn') load() })
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  products.value = (await api.products({ page: 1, pageSize: 200 })).list || []
  if (routeQ(route.query, 'tab')) tab.value = routeQ(route.query, 'tab')
  if (routeQ(route.query, 'agentType')) query.value.agentType = routeQ(route.query, 'agentType')
  await nextTick()
  if (routeQ(route.query, 'agentId')) query.value.agentId = routeQ(route.query, 'agentId')
  applyListDates(query.value, route.query)
  ingesting.value = false
  load()
})
</script>
<style scoped>
h4 { margin: 14px 0 8px; font-size: 13px; }
.muted { color: var(--text-3); font-size: 12px; margin: 0 0 8px; }
</style>
