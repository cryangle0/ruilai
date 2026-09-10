<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>异常管理</h2>
        <p>直售激活 / 分销激活 / 销售库存 · 待处理加粗</p>
      </div>
      <div class="page-actions">
        <BackToDetailButton />
        <el-button v-if="canConfigEx" @click="openRules">异常标准配置</el-button>
      </div>
    </div>
    <PageTabs v-model="dimTab" :items="tabItems" />
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.l1Id" placeholder="关联一级" clearable filterable style="width:160px">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="dimTab!=='activate-direct'">
        <el-select v-model="query.l2Id" placeholder="关联二级" clearable filterable style="width:160px">
          <el-option v-for="a in l2s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item><span class="muted-label">报警时间</span></el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
      </el-form-item>
      <el-form-item><span class="muted-label">SN</span></el-form-item>
      <el-form-item>
        <el-input v-model="query.sn" placeholder="SN" clearable style="width:180px" />
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option v-for="s in statusOpts" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
    </SearchPanel>
    <KpiCards :items="kpiItems" />
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" :row-class-name="rowClass" @row-click="openRow">
      <el-table-column prop="occurredAt" label="时间" width="170" :formatter="dateTimeFormatter" />
      <el-table-column label="类型" width="160">
        <template #default="{row}">
          {{ row.type }}
          <span v-if="row.extra?.warnMode==='off'" class="tag tag-gray">不报警</span>
          <span v-else-if="row.extra?.warnMode==='soft'" class="tag tag-gray">软</span>
        </template>
      </el-table-column>
      <el-table-column label="一级代理" min-width="110"><template #default="{row}">{{ row.extra?.l1Name || '—' }}</template></el-table-column>
      <el-table-column label="二级代理" min-width="110"><template #default="{row}">{{ dimTab==='activate-direct' ? '—' : (row.extra?.l2Name || '—') }}</template></el-table-column>
      <el-table-column prop="target" label="对象" min-width="120" />
      <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip>
        <template #default="{row}">{{ displayDetail(row.detail) }}</template>
      </el-table-column>
      <el-table-column :label="explainLabel" min-width="120">
        <template #default="{row}">{{ clip((row.explainTxt || row.explainL2 || '')) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.status==='待处理'||row.status==='会签中'?'tag-orange':'tag-green'">{{ row.status }}</span>
        </template>
      </el-table-column>
    </DataTableShell>

    <el-dialog v-model="detailOpen" :title="cur ? `异常详情 · ${cur.type}` : '异常详情'" width="720px">
      <template v-if="cur">
        <div class="detail-grid">
          <div><span>时间</span>{{ formatDateTime(cur.occurredAt) }}</div>
          <div><span>维度</span>{{ dimLabel }}</div>
          <div><span>一级代理</span>{{ cur.extra?.l1Name || '—' }}</div>
          <div><span>二级代理</span>{{ dimTab==='activate-direct' ? '—' : (cur.extra?.l2Name || '—') }}</div>
          <div><span>对象</span>{{ cur.target }}</div>
          <div><span>状态</span><span class="tag" :class="isOpen(cur)?'tag-orange':'tag-green'">{{ cur.status }}</span></div>
          <div class="span-2"><span>详情</span>{{ displayDetail(cur.detail) }}</div>
          <div class="span-2"><span>{{ explainLabel }}</span>{{ cur.explainTxt || cur.explainL2 || '—' }}</div>
        </div>
        <template v-if="cur.extra?.customer">
          <h4>销售客户信息</h4>
          <div class="detail-grid">
            <div><span>姓名</span>{{ cur.extra.customer.name || '—' }}</div>
            <div><span>性别</span>{{ cur.extra.customer.gender || '—' }}</div>
            <div><span>电话</span>{{ cur.extra.customer.phone || '—' }}</div>
          </div>
        </template>
        <template v-if="(cur.extra?.relatedSns||[]).length">
          <h4>重复客户关联 SN</h4>
          <el-table :data="cur.extra.relatedSns" size="small" border @row-click="(r:any)=>gotoSn(r.sn)">
            <el-table-column prop="sn" label="SN" /><el-table-column prop="name" label="姓名" />
            <el-table-column prop="gender" label="性别" width="70" /><el-table-column prop="phone" label="电话" />
            <el-table-column prop="addr" label="地址" />
          </el-table>
        </template>
        <el-form v-if="isOpen(cur)" label-width="80px" style="margin-top:12px">
          <el-form-item :label="explainLabel"><el-input v-model="explainText" type="textarea" :rows="2" /></el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="detailOpen=false">关闭</el-button>
        <el-button v-if="isSn" @click="gotoSn(cur.target)">看SN</el-button>
        <el-button v-if="isDupCust" @click="viewDup">查看重复</el-button>
        <el-button v-if="cur && isOpen(cur)" type="primary" @click="handle">处理</el-button>
        <el-button v-if="cur && isOpen(cur)" type="danger" plain @click="remove">删除</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rulesOpen" class="issue-wide-dialog" title="异常标准配置" width="560px" @close="closeRules">
      <p class="hint">全局倍数针对所有一/二级。一级分销给二级不触发库存异常；二级可单独设严格/软报警。</p>
      <p class="hint">第三方：IP/围栏 {{ cap.geoConfigured ? cap.geoProvider : '未配置 Key（离线/提示）' }} · 号码归属 {{ cap.phoneConfigured ? '阿里云' : '离线号段兜底' }}</p>
      <p class="hint">立即扫描会按当前全局倍数重新检查代理库存并生成待处理异常，不会修改库存数量。</p>
      <el-form label-width="120px">
        <el-form-item label="全局倍数"><el-input-number v-model="rules.multiplier" :min="0.5" :max="9" :step="0.1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeRules">取消</el-button>
        <el-button @click="scanStock">立即按当前标准扫描库存</el-button>
        <el-button type="primary" @click="saveRules">保存标准</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="leaveOpen" title="离开异常详情" width="480px" :close-on-click-modal="false">
      <p>当前筛选仍有 <strong>{{ leaveIds.length }}</strong> 条<strong>待处理</strong>异常。</p>
      <p class="hint">选择「已处理并离开」后不再加粗提醒；选择「暂不处理」则保持粗体，其他管理员仍可见。</p>
      <template #footer>
        <el-button @click="leaveStay">取消</el-button>
        <el-button @click="leaveSkip">暂不处理，离开</el-button>
        <el-button type="primary" @click="leaveDone">已处理并离开</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import PageTabs from '@/components/common/PageTabs.vue'
import BackToDetailButton from '@/components/common/BackToDetailButton.vue'
import KpiCards, { type KpiItem } from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { applyListDates, routeQ } from '@/utils/detailJump'
import { dateTimeFormatter, formatDateTime, monthStart, todayDate } from '@/utils/dates'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canConfigEx = computed(() => auth.hasPerm('all'))
const route = useRoute()
const router = useRouter()
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const dimTab = ref('activate-direct')
const counts = reactive<Record<string, number>>({})
const rules = reactive<Record<string, any>>({ multiplier: 1.5, overOrderRatio: 1, stockTurnover: 1.5 })
const cap = reactive<Record<string, any>>({})
const rulesOpen = ref(false)
const detailOpen = ref(false)
const leaveOpen = ref(false)
const leaveIds = ref<string[]>([])
const skipLeave = ref(false)
const ingesting = ref(true)
let pendingTo: string | null = null
let rulesSnap: Record<string, any> = {}
const cur = ref<any>(null)
const explainText = ref('')
const l1s = ref<any[]>([])
const l2s = ref<any[]>([])
const tabItems = computed(() => [
  { id: 'activate-direct', title: '直售激活异常', badge: counts['activate-direct'] || undefined },
  { id: 'activate-dist', title: '分销激活异常', badge: counts['activate-dist'] || undefined },
  { id: 'stock', title: '销售库存异常', badge: counts.stock || undefined },
])
const statusOpts = computed(() => dimTab.value === 'stock' ? ['待处理', '已处理'] : ['待处理', '已完成'])
/** 原型 exceptionExplainLabel：分销=二级解释，其余=一级解释 */
const explainLabel = computed(() => dimTab.value === 'activate-dist' ? '二级解释' : '一级解释')
/** 原型 currentAgentWarnMultiplier：当前筛范围内代理倍数去重，不唯一则 '-' */
const curMultText = computed(() => {
  const vals: number[] = []
  const add = (a: any) => {
    if (!a) return
    const n = Number(a.warnMultiplier || 1.5)
    if (n) vals.push(n)
  }
  if (query.l2Id) add(l2s.value.find((a: any) => a.id === query.l2Id))
  else if (query.l1Id) {
    add(l1s.value.find((a: any) => a.id === query.l1Id))
    l2s.value.filter((a: any) => a.parentId === query.l1Id).forEach(add)
  } else {
    l1s.value.forEach(add)
    l2s.value.forEach(add)
  }
  const uniq = [...new Set(vals)]
  if (uniq.length !== 1) return '-'
  return `${uniq[0]}×`
})
const kpiItems = computed(() => {
  const items: KpiItem[] = [
    { key: 'filter', label: '当前筛选', value: total.value, icon: 'Filter', tone: 'blue' },
    { key: 'hist', label: '本维历史总量', value: counts.hist || 0, icon: 'DataAnalysis', tone: 'gray' },
    { key: 'open', label: '待处理(当前筛)', value: counts.open || 0, icon: 'Warning', tone: 'amber' },
  ]
  if (dimTab.value === 'stock') {
    items.push(
      { key: 'std', label: '标准预警倍数', value: `${rules.multiplier ?? 1.5}×`, icon: 'Odometer', tone: 'purple' },
      { key: 'cur', label: '当前预警倍数', value: curMultText.value, icon: 'Histogram', tone: 'red' },
    )
  }
  return items
})
const dimLabel = computed(() => ({ 'activate-direct': '直售激活', 'activate-dist': '分销激活', stock: '销售库存' } as Record<string, string>)[dimTab.value] || dimTab.value)
const isSn = computed(() => String(cur.value?.target || '').startsWith('RL'))
const isDupCust = computed(() => /客户信息重复/.test(String(cur.value?.type || '')))
function isOpen(row: any) { return row?.status === '待处理' || row?.status === '会签中' }
function displayDetail(detail?: string) {
  return String(detail || '').replace(/^异常销售预警：/, '') || '—'
}
function rowClass({ row }: { row: any }) { return isOpen(row) ? 'ex-bold' : '' }
function clip(s: string) { return s.length > 8 ? s.slice(0, 8) + '…' : (s || '—') }

async function load() {
  loading.value = true
  try {
    query.dim = dimTab.value
    const [res, c] = await Promise.all([
      api.exceptions({
        page: page.value, pageSize: pageSize.value,
        dim: query.sn ? undefined : query.dim, status: query.status, type: query.type,
        l1Id: query.l1Id, l2Id: query.l2Id,
        from: query.sn ? undefined : query.from, to: query.sn ? undefined : query.to,
        sn: query.sn || undefined,
      }),
      api.exceptionCounts({
        l1Id: query.l1Id, l2Id: query.l2Id, from: query.from, to: query.to,
      }),
    ])
    list.value = res.list; total.value = res.total
    Object.assign(counts, c)
    counts.hist = res.total
    counts.open = counts[dimTab.value] || 0
    const openEx = (counts['activate-direct'] || 0) + (counts['activate-dist'] || 0) + (counts.stock || 0)
    window.dispatchEvent(new CustomEvent('ruilai:badges-changed', { detail: { openEx } }))
  } finally { loading.value = false }
}
function reset() {
  query.status = ''; query.l1Id = ''; query.l2Id = ''; query.sn = ''
  query.from = monthStart(); query.to = todayDate()
  resetPage(); load()
}
async function openRow(row: any) {
  cur.value = await api.exception(row.id)
  explainText.value = cur.value?.explainTxt || cur.value?.explainL2 || ''
  detailOpen.value = true
}
function gotoSn(sn: string) {
  router.push({ path: '/goods/sn', query: { sn } })
}
function viewDup() {
  const phone = cur.value?.extra?.customer?.phone || ''
  const sn = (cur.value?.extra?.relatedSns || [])[0]?.sn || ''
  if (phone) router.push({ path: '/risk/customers', query: { phone } })
  else if (sn) router.push({ path: '/goods/sn', query: { sn } })
}
async function handle() {
  if (explainText.value && cur.value) {
    await api.explainEx(cur.value.id, explainText.value)
  }
  await api.handleEx(cur.value.id)
  ElMessage.success('已处理')
  detailOpen.value = false
  load()
}
async function remove() {
  await ElMessageBox.confirm('删除该异常记录？', '确认', { type: 'warning' })
  await api.deleteEx(cur.value.id)
  ElMessage.success('已删除')
  detailOpen.value = false
  load()
}
async function openRules() {
  Object.assign(rules, await api.exceptionRules())
  Object.assign(cap, await api.capabilities())
  rulesSnap = { ...rules }
  rulesOpen.value = true
}
function closeRules() {
  Object.assign(rules, rulesSnap)
  rulesOpen.value = false
}
async function saveRules() {
  Object.assign(rules, await api.saveExceptionRules({ ...rules }))
  rulesSnap = { ...rules }
  ElMessage.success('已保存'); rulesOpen.value = false
}
async function scanStock() {
  await api.scanStockWarn()
  ElMessage.success('已扫描'); load()
}
watch([page, pageSize], () => { if (!ingesting.value) load() })
watch(dimTab, () => {
  if (ingesting.value) return
  if (dimTab.value === 'activate-direct') query.l2Id = ''
  query.status = ''
  resetPage()
  load()
})
async function fetchOpenIds() {
  if (query.status && !['待处理', '会签中'].includes(String(query.status))) return []
  const res = await api.exceptions({
    page: 1, pageSize: 200,
    dim: dimTab.value, status: '待处理', type: query.type,
    l1Id: query.l1Id, l2Id: query.l2Id, from: query.from, to: query.to,
  })
  return (res.list || []).filter((r: any) => isOpen(r)).map((r: any) => r.id)
}
onBeforeRouteLeave(async (to) => {
  if (skipLeave.value) return true
  if (to.path.startsWith('/goods/sn') || to.path.startsWith('/risk/customers')) return true
  const ids = await fetchOpenIds()
  if (!ids.length) return true
  leaveIds.value = ids
  pendingTo = to.fullPath
  leaveOpen.value = true
  return false
})
function leaveStay() {
  leaveOpen.value = false
  pendingTo = null
}
function leaveSkip() {
  skipLeave.value = true
  leaveOpen.value = false
  const go = pendingTo
  pendingTo = null
  if (go) router.push(go)
}
async function leaveDone() {
  for (const id of leaveIds.value) {
    await api.handleEx(id)
  }
  ElMessage.success(`已标记处理 ${leaveIds.value.length} 条`)
  skipLeave.value = true
  leaveOpen.value = false
  const go = pendingTo
  pendingTo = null
  if (go) router.push(go)
}
onMounted(async () => {
  ingesting.value = true
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  Object.assign(rules, await api.exceptionRules().catch(() => ({})))
  rulesSnap = { ...rules }
  if (routeQ(route.query, 'tab')) dimTab.value = routeQ(route.query, 'tab')
  await nextTick()
  if (routeQ(route.query, 'sn')) query.sn = routeQ(route.query, 'sn')
  if (routeQ(route.query, 'l1Id')) query.l1Id = routeQ(route.query, 'l1Id')
  if (routeQ(route.query, 'l2Id')) query.l2Id = routeQ(route.query, 'l2Id')
  if (routeQ(route.query, 'type')) query.type = routeQ(route.query, 'type')
  applyListDates(query, route.query)
  ingesting.value = false
  load()
})
</script>
<style scoped>
.hint { color: var(--text-2); font-size: 13px; margin: 0 0 12px; line-height: 1.5; }
.muted-label { font-size: 12px; color: var(--text-3); }
.extra-tag { margin-left: 8px; color: var(--text-2); font-size: 12px; }
h4 { margin: 14px 0 8px; font-size: 13px; }
</style>
