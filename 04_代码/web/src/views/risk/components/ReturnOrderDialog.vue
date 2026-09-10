<template>
  <el-dialog :model-value="modelValue" :title="cur?.no ? `退货单 ${cur.no}` : '退货单'" width="780px" @update:model-value="emit('update:modelValue', $event)">
    <template v-if="cur">
      <div class="detail-split">
        <div>
          <div class="detail-grid">
            <div><span>类型</span>{{ cur.typeLabel || cur.type }}</div>
            <div><span>理由</span><span class="tag tag-gray">{{ cur.reasonType || '' }}</span> {{ cur.reason }}</div>
            <div><span>来源</span>{{ cur.fromName || '—' }}</div>
            <div><span>状态</span><span class="tag" :class="cur.status==='pending'?'tag-orange':cur.status==='rejected'?'tag-red':'tag-green'">{{ rtStatus(cur.status) }}</span></div>
            <div><span>时间</span>{{ formatDateTime(cur.createdAt) }}</div>
          </div>
          <h4>情况说明（来自 SN，与处理说明区分）</h4>
          <el-table :data="cur.snDetail || []" size="small" border>
            <el-table-column prop="sn" label="SN" width="160"><template #default="{row}"><code>{{ row.sn }}</code></template></el-table-column>
            <el-table-column prop="situation" label="情况说明"><template #default="{row}">{{ row.situation || '—' }}</template></el-table-column>
          </el-table>
          <h4>凭证图片</h4>
          <div class="photo-row" v-if="(cur.photos||[]).length">
            <img v-for="(u,i) in cur.photos" :key="i" :src="u" alt="凭证" />
          </div>
          <p v-else class="muted">暂无图片</p>
          <h4>客户信息</h4>
          <div class="detail-grid">
            <div><span>姓名</span>{{ cur.customer?.name || '—' }}</div>
            <div><span>手机号</span>{{ cur.customer?.phone || '—' }}</div>
            <div><span>地区</span>{{ cur.customer?.region || cur.customer?.phoneLoc || '—' }}</div>
          </div>
          <h4>商品明细</h4>
          <el-table :data="productRows" size="small" border>
            <el-table-column prop="name" label="商品名称" />
            <el-table-column prop="spec" label="规格" />
            <el-table-column prop="qty" label="数量" width="70" />
          </el-table>
          <h4>SN码（{{ (cur.snDetail||[]).length }}）</h4>
          <el-table :data="cur.snDetail || []" size="small" border>
            <el-table-column prop="sn" label="SN" min-width="140"><template #default="{row}"><code>{{ row.sn }}</code></template></el-table-column>
            <el-table-column prop="productName" label="商品名称" />
            <el-table-column prop="spec" label="规格" />
            <el-table-column label="状态" width="90">
              <template #default="{row}">{{ snStatusLabel(row.status) }}</template>
            </el-table-column>
          </el-table>
        </div>
        <aside class="side-note-panel">
          <h4>处理说明</h4>
          <div class="side-note-body">{{ cur.processNote || '暂无处理说明' }}</div>
          <el-input v-if="canAudit" v-model="processNote" type="textarea" :rows="3" placeholder="填写处理说明" style="margin-top:8px" />
        </aside>
      </div>
    </template>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
      <template v-if="canAudit">
        <el-button type="primary" @click="decide(true)">通过</el-button>
        <el-button type="danger" plain @click="decide(false)">驳回</el-button>
      </template>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api'
import { snStatusLabel } from '@/utils/format'
import { formatDateTime } from '@/utils/dates'

const props = defineProps<{ modelValue: boolean; id?: string }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [] }>()
const cur = ref<any>(null)
const processNote = ref('')
const canAudit = computed(() => cur.value?.type === 'l1_to_factory' && cur.value?.status === 'pending')
const productRows = computed(() => {
  const map = new Map<string, { name: string; spec: string; qty: number }>()
  for (const r of cur.value?.snDetail || []) {
    const k = `${r.productName}_${r.spec}`
    const g = map.get(k) || { name: r.productName || r.sn, spec: r.spec || '—', qty: 0 }
    g.qty += 1
    map.set(k, g)
  }
  return [...map.values()]
})
function rtStatus(s: string) {
  return ({ pending: '待审核', approved: '已通过', done: '已通过', rejected: '已驳回' } as Record<string, string>)[s] || s
}
watch(() => [props.modelValue, props.id], async () => {
  if (!props.modelValue || !props.id) return
  cur.value = await api.returnOrder(props.id)
  processNote.value = cur.value?.processNote || ''
}, { immediate: true })
async function decide(pass: boolean) {
  if (!cur.value) return
  try {
    await ElMessageBox.confirm(
      pass ? `确认通过退货单「${cur.value.no}」？` : `确认驳回退货单「${cur.value.no}」？`,
      pass ? '确认通过' : '确认驳回',
      { type: pass ? 'success' : 'warning', confirmButtonText: pass ? '通过' : '驳回' },
    )
  } catch {
    return
  }
  await api.decideReturn(cur.value.id, pass, processNote.value)
  ElMessage.success(pass ? '已通过' : '已驳回')
  emit('update:modelValue', false)
  emit('saved')
}
</script>
<style scoped>
h4 { margin: 14px 0 8px; font-size: 13px; }
code, .muted { font-size: 12px; }
.muted { color: var(--text-3); }
</style>
