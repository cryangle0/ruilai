<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>销售客户</h2>
        <p>点击行看详情（编辑 / 删除在详情内）</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新建客户</el-button>
      </div>
    </div>
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.l1Id" placeholder="全部一级" clearable filterable style="width:160px">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.l2Id" placeholder="全部二级" clearable filterable style="width:160px">
          <el-option v-for="a in l2s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.channel" placeholder="全部渠道" clearable style="width:130px">
          <el-option label="直售客户" value="direct" />
          <el-option label="分销客户" value="distribute" />
        </el-select>
      </el-form-item>
      <el-form-item><span class="muted-label">销售时间</span></el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
      </el-form-item>
      <el-form-item><el-input v-model="query.sn" placeholder="SN" clearable style="width:140px" /></el-form-item>
      <el-form-item><el-input v-model="query.phone" placeholder="手机/姓名" clearable style="width:140px" /></el-form-item>
      <el-form-item><el-input v-model="query.addr" placeholder="地址" clearable style="width:160px" /></el-form-item>
      <el-form-item>
        <el-select v-model="query.mark" placeholder="标记" clearable style="width:130px">
          <el-option label="重复手机号" value="phone" />
          <el-option label="重复地址" value="addr" />
        </el-select>
      </el-form-item>
    </SearchPanel>
    <KpiCards :items="kpiItems" />
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="(r:any)=>openView(r)">
      <el-table-column prop="orderNo" label="单号" min-width="150" />
      <el-table-column label="SN" min-width="160">
        <template #default="{row}"><code>{{ (row.sns||[]).join(' ') || '—' }}</code></template>
      </el-table-column>
      <el-table-column label="商品" min-width="140"><template #default="{row}">{{ (row.products||[]).join('，') || '—' }}</template></el-table-column>
      <el-table-column prop="name" label="姓名" width="90" />
      <el-table-column label="一级代理" width="110"><template #default="{row}">{{ nameL1(row.l1Id) }}</template></el-table-column>
      <el-table-column label="二级代理" width="110"><template #default="{row}">{{ nameL2(row.l2Id) }}</template></el-table-column>
      <el-table-column prop="gender" label="性别" width="70" />
      <el-table-column prop="age" label="年龄" width="70" />
      <el-table-column prop="phone" label="手机" width="120" />
      <el-table-column prop="phoneLoc" label="归属地" width="80" />
      <el-table-column prop="addr" label="地址" min-width="180" />
      <el-table-column label="标记" width="140">
        <template #default="{row}">
          <span v-if="row.dupPhone" class="tag tag-orange">重复手机号</span>
          <span v-if="row.dupAddr" class="tag tag-orange">重复地址</span>
          <span v-if="!row.dupPhone && !row.dupAddr">—</span>
        </template>
      </el-table-column>
    </DataTableShell>

    <el-dialog v-model="viewOpen" :title="form.phone || form.name ? `客户详情 · ${form.phone || form.name}` : '客户详情'" width="720px">
      <div class="detail-grid">
        <div><span>单号</span>{{ form.orderNo || '—' }}</div>
        <div><span>姓名</span>{{ form.name || '—' }}</div>
        <div><span>性别</span>{{ form.gender || '—' }}</div>
        <div><span>年龄</span>{{ form.age || '—' }}</div>
        <div><span>手机</span>{{ form.phone || '—' }}</div>
        <div><span>归属地</span>{{ form.phoneLoc || '—' }}</div>
        <div><span>一级代理</span>{{ nameL1(form.l1Id) }}</div>
        <div><span>二级代理</span>{{ nameL2(form.l2Id) }}</div>
        <div><span>标记</span>
          <span v-if="form.dupPhone" class="tag tag-orange">重复手机号</span>
          <span v-if="form.dupAddr" class="tag tag-orange">重复地址</span>
          <span v-if="!form.dupPhone && !form.dupAddr">—</span>
        </div>
        <div class="span-2"><span>地址</span>{{ form.addr || '—' }}</div>
        <div class="span-2"><span>备注</span>{{ form.note || '—' }}</div>
        <div><span>创建</span>{{ formatDateTime(form.createdAt) }}</div>
        <div><span>更新</span>{{ formatDateTime(form.updatedAt) }}</div>
      </div>
      <h4>商品明细</h4>
      <el-table :data="custProducts" size="small" border>
        <el-table-column prop="name" label="商品" /><el-table-column prop="spec" label="规格" /><el-table-column prop="qty" label="数量" width="70" />
      </el-table>
      <h4>关联 SN（{{ (form.sns||[]).length }}）</h4>
      <el-table :data="form.snRows || []" size="small" border>
        <el-table-column prop="sn" label="SN" min-width="140"><template #default="{row}"><code>{{ row.sn }}</code></template></el-table-column>
        <el-table-column prop="productName" label="商品" />
        <el-table-column label="规格" width="120"><template #default="{row}">{{ stockSpecText(row.size, row.belt) }}</template></el-table-column>
        <el-table-column label="状态" width="90"><template #default="{row}">{{ snStatusLabel(row.status) }}</template></el-table-column>
        <el-table-column width="80"><template #default="{row}"><el-button size="small" @click="gotoSn(row.sn)">详情</el-button></template></el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="viewOpen=false">关闭</el-button>
        <el-button @click="openEdit">编辑</el-button>
        <el-button type="danger" plain @click="remove">删除</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editOpen" :title="form.id ? `编辑客户 · ${form.phone || form.name || ''}` : '新建客户'" width="520px" @close="cancelEdit">
      <el-form label-width="96px">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.gender" clearable style="width:100%">
            <el-option label="男" value="男" /><el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄"><el-input v-model="form.age" placeholder="如 32" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="归属地"><el-input v-model="form.phoneLoc" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.addr" /></el-form-item>
        <el-form-item label="关联 SN"><el-input v-model="snsText" placeholder="逗号分隔" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="save">{{ form.id ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import KpiCards from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { snStatusLabel, stockSpecText } from '@/utils/format'
import { formatDateTime, monthStart, todayDate } from '@/utils/dates'

const route = useRoute()
const router = useRouter()
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const viewOpen = ref(false)
const editOpen = ref(false)
const form = ref<any>({})
const snsText = ref('')
const l1s = ref<any[]>([])
const l2s = ref<any[]>([])
const rangeQty = ref(0)
const histQty = ref(0)
let editSnap: any = null
let savedOk = false
const kpiItems = computed(() => [
  { key: 'range', label: '筛选区间销量', value: rangeQty.value, icon: 'TrendCharts', tone: 'green' as const },
  { key: 'hist', label: '历史销量', value: histQty.value, icon: 'User', tone: 'blue' as const },
])
const custProducts = computed(() => {
  const map = new Map<string, { name: string; spec: string; qty: number }>()
  for (const s of form.value.snRows || []) {
    const spec = stockSpecText(s.size, s.belt)
    const k = `${s.productName}_${spec}`
    const g = map.get(k) || { name: s.productName || '—', spec, qty: 0 }
    g.qty += 1
    map.set(k, g)
  }
  return [...map.values()]
})
function nameL1(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '—' }
function nameL2(id?: string) { return l2s.value.find((a) => a.id === id)?.name || id || '—' }

async function load() {
  loading.value = true
  try {
    const res = await api.customers({ page: page.value, pageSize: pageSize.value, ...query })
    list.value = res.list
    total.value = res.total
    rangeQty.value = Number(res.rangeQty) || 0
    histQty.value = Number(res.histQty) || 0
  } finally { loading.value = false }
}
function reset() {
  query.keyword = ''; query.l1Id = ''; query.l2Id = ''; query.sn = ''; query.phone = ''; query.addr = ''; query.mark = ''; query.channel = ''
  query.from = monthStart(); query.to = todayDate()
  resetPage(); load()
}
function openView(row: any) {
  form.value = JSON.parse(JSON.stringify(row))
  viewOpen.value = true
}
function openCreate() {
  editSnap = null
  savedOk = false
  form.value = {}
  snsText.value = ''
  editOpen.value = true
}
function openEdit() {
  savedOk = false
  editSnap = JSON.parse(JSON.stringify(form.value))
  snsText.value = (form.value.sns || []).join(',')
  viewOpen.value = false
  editOpen.value = true
}
function cancelEdit() {
  if (!editOpen.value) return
  if (!savedOk && editSnap) form.value = JSON.parse(JSON.stringify(editSnap))
  savedOk = false
  editOpen.value = false
}
function gotoSn(sn: string) {
  router.push({ path: '/goods/sn', query: { sn } })
}
async function save() {
  form.value.sns = snsText.value.split(/[,，\s]+/).filter(Boolean)
  await api.saveCustomer(form.value)
  ElMessage.success('已保存')
  savedOk = true
  editOpen.value = false
  load()
}
async function remove() {
  await ElMessageBox.confirm('删除该客户？', '确认')
  await api.deleteCustomer(form.value.id)
  viewOpen.value = false
  load()
}
watch([page, pageSize], load)
onMounted(async () => {
  query.from = query.from || monthStart()
  query.to = query.to || todayDate()
  if (route.query.phone) query.phone = String(route.query.phone)
  if (route.query.sn) query.sn = String(route.query.sn)
  if (route.query.l1Id) query.l1Id = String(route.query.l1Id)
  if (route.query.l2Id) query.l2Id = String(route.query.l2Id)
  if (route.query.channel) query.channel = String(route.query.channel)
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  load()
})
</script>
<style scoped>
.muted-label { font-size: 12px; color: var(--text-3); }
h4 { margin: 14px 0 8px; font-size: 13px; }
code { font-size: 12px; }
</style>
