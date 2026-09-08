<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>二级退货详情</h2>
        <p>{{ l2Name }} · 可改筛选区间</p>
      </div>
      <div class="page-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.l2Id" placeholder="二级代理" filterable style="width:180px" @change="() => { resetPage(); load() }">
          <el-option v-for="a in l2s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.type" placeholder="类型" clearable style="width:140px">
          <el-option label="二级退一级" value="l2_to_l1" />
          <el-option label="直售客户退货" value="user" />
          <el-option label="一级退原厂" value="l1_to_factory" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option label="待审" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已处理" value="done" />
        </el-select>
      </el-form-item>
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
      <el-table-column prop="typeLabel" label="类型" width="120" />
      <el-table-column label="理由" min-width="160">
        <template #default="{row}"><span class="tag tag-gray">{{ row.reasonType || '其他' }}</span> {{ row.reason }}</template>
      </el-table-column>
      <el-table-column label="SN" min-width="160">
        <template #default="{row}"><code>{{ (row.sns||[]).join(' ') || '—' }}</code></template>
      </el-table-column>
      <el-table-column label="状态" width="90">
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
import ReturnOrderDialog from '@/views/risk/components/ReturnOrderDialog.vue'
import KpiCards from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { dateTimeFormatter, monthStart, todayDate } from '@/utils/dates'

const route = useRoute()
const router = useRouter()
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const l2s = ref<any[]>([])
const metrics = reactive({ rangeQty: 0, histQty: 0 })
const detailOpen = ref(false)
const detailId = ref('')
query.from = monthStart()
query.to = todayDate()
const l2Name = computed(() => l2s.value.find((a) => a.id === query.l2Id)?.name || '')
const kpiItems = computed(() => [
  { key: 'range', label: '筛选区间退货', value: metrics.rangeQty, icon: 'RefreshLeft', tone: 'green' as const },
  { key: 'hist', label: '历史总量', value: metrics.histQty, icon: 'DataAnalysis', tone: 'blue' as const },
])
function rtStatus(s: string) {
  return ({ pending: '待审', approved: '已通过', done: '已处理', rejected: '已驳回' } as Record<string, string>)[s] || s
}
function goBack() {
  const id = String(query.l2Id || route.query.l2Id || '')
  router.push(id ? { path: '/agent/l2', query: { id } } : '/agent/l2')
}
async function load() {
  loading.value = true
  try {
    const res = await api.returns({
      page: page.value, pageSize: pageSize.value,
      l2Id: query.l2Id, from: query.from, to: query.to, type: query.type, status: query.status,
    })
    list.value = res.list
    total.value = res.total
    metrics.rangeQty = (res.list || []).reduce((n: number, r: any) => n + ((r.sns || []).length), 0)
    const hist = await api.returns({ page: 1, pageSize: 200, l2Id: query.l2Id, type: query.type })
    metrics.histQty = (hist.list || []).reduce((n: number, r: any) => n + ((r.sns || []).length), 0)
  } finally { loading.value = false }
}
function reset() {
  query.from = monthStart(); query.to = todayDate(); query.type = ''; query.status = ''
  resetPage(); load()
}
function openRow(row: any) { detailId.value = row.id; detailOpen.value = true }
watch([page, pageSize], load)
onMounted(async () => {
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  query.l2Id = String(route.query.l2Id || l2s.value[0]?.id || '')
  load()
})
</script>
<style scoped>
code { font-size: 12px; }
</style>
