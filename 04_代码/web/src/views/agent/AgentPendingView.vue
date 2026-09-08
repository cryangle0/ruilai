<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>待分配二级（仅法人）</h2>
        <p>共 {{ total }} 家 · 点击行进入详情重新绑定</p>
      </div>
    </div>
    <div class="alert alert-info">一级停用/撤区后，其下属法人二级进入待分配池，需管理员重新绑定。</div>
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="openView">
      <el-table-column prop="code" label="编码" width="120" />
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column label="原一级" min-width="140">
        <template #default="{row}">{{ nameOf(row.prevParentId) }}</template>
      </el-table-column>
      <el-table-column label="原城市" min-width="160"><template #default="{row}">{{ (row.prevAreas||[]).join('、') || '—' }}</template></el-table-column>
      <el-table-column label="状态" width="100"><template #default><span class="tag tag-orange">待分配</span></template></el-table-column>
    </DataTableShell>

    <el-dialog v-model="viewDlg" class="issue-wide-dialog" :title="cur ? `待分配详情 · ${cur.name}` : '待分配详情'" width="820px">
      <div v-if="cur" class="detail-grid" style="grid-template-columns:1fr 1fr">
        <div><span>编码</span>{{ cur.code }}</div>
        <div><span>原一级</span>{{ nameOf(cur.prevParentId) }}</div>
        <div class="span-2"><span>原城市</span>{{ (cur.prevAreas||[]).join('、') || '—' }}</div>
        <div><span>状态</span><span class="tag tag-orange">待分配</span></div>
      </div>
      <template #footer>
        <el-button @click="viewDlg=false">关闭</el-button>
        <el-button type="primary" @click="openRebind">重新绑定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rebindDlg" class="issue-wide-dialog" :title="cur ? `重新绑定 · ${cur.name}` : '重新绑定'" width="920px">
      <el-form label-width="110px">
        <el-form-item label="绑定一级">
          <el-select v-model="parentId" filterable style="width:100%">
            <el-option v-for="a in enabledL1s" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label-width="0">
          <CitySearchPicker
            v-model="areas"
            :options="ALL_CITIES"
            :disabled-options="disabledCities"
            label="授权城市（点击多选）"
            all-label="全选当前一级可售城市"
            empty-text="暂无全国城市数据"
            :note="droppedNote"
          />
          <p class="muted" style="margin-left:0">切换绑定一级后，可选城市会随一级可销售范围更新</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rebindDlg=false">取消</el-button>
        <el-button type="primary" @click="ok">绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DataTableShell from '@/components/common/DataTableShell.vue'
import CitySearchPicker from '@/components/common/CitySearchPicker.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { ALL_CITIES, citiesOf } from '@/utils/regions'

const { page, pageSize, total, loading, list } = usePager()
const l1s = ref<any[]>([])
const viewDlg = ref(false)
const rebindDlg = ref(false)
const cur = ref<any>(null)
const parentId = ref('')
const areas = ref<string[]>([])
const dropped = ref<string[]>([])
const enabledL1s = computed(() => l1s.value.filter((a) => a.status === '启用'))
const cityOpts = computed(() => {
  const l1 = l1s.value.find((a) => a.id === parentId.value)
  return citiesOf(l1?.saleAreas || l1?.mainAreas || [])
})
const disabledCities = computed(() => {
  const allowed = new Set(cityOpts.value)
  return ALL_CITIES.filter((city) => !allowed.has(city))
})
const droppedNote = computed(() => {
  const scope = '展示全国城市；不在当前一级可销售范围内的城市不可选'
  return dropped.value.length
    ? `原城市「${dropped.value.join('、')}」不在当前一级可售范围内，已取消勾选。${scope}`
    : scope
})
function nameOf(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '—' }
async function load() {
  loading.value = true
  try { const res = await api.agentsL2({ page: page.value, pageSize: pageSize.value, pending: true, type: '法人' }); list.value = res.list; total.value = res.total }
  finally { loading.value = false }
}
function openView(row: any) {
  cur.value = row
  viewDlg.value = true
}
function applyParentCities() {
  const raw = [...(cur.value?.prevAreas || cur.value?.areas || [])]
  dropped.value = raw.filter((c) => !cityOpts.value.includes(c))
  areas.value = raw.filter((c) => cityOpts.value.includes(c))
}
function openRebind() {
  const prev = cur.value?.prevParentId
  parentId.value = enabledL1s.value.some((a) => a.id === prev) ? prev : (enabledL1s.value[0]?.id || '')
  viewDlg.value = false
  rebindDlg.value = true
  applyParentCities()
}
async function ok() {
  if (!parentId.value || !areas.value.length) { ElMessage.error('请选择一级和授权城市'); return }
  const l1Name = nameOf(parentId.value)
  try {
    await ElMessageBox.confirm(
      `确认绑定到「${l1Name}」并授权 ${areas.value.length} 个围栏城市？`,
      '确认绑定二级',
      { confirmButtonText: '确认绑定', type: 'warning' },
    )
  } catch {
    return
  }
  await api.assignL2(cur.value.id, parentId.value, areas.value)
  ElMessage.success('已绑定')
  rebindDlg.value = false
  await load()
  window.dispatchEvent(new Event('ruilai:badges-changed'))
}
watch([page, pageSize], load)
watch(parentId, () => {
  if (rebindDlg.value) applyParentCities()
})
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  load()
})
</script>
<style scoped>
.muted { color: var(--text-3); font-size: 12px; margin: 0 0 0 110px; }
</style>
