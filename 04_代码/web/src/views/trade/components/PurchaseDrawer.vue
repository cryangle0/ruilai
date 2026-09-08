<template>
  <el-dialog v-model="visible" :title="title" width="860px" destroy-on-close @closed="mode='view'">
    <template v-if="form && form.id && mode==='view'">
      <div class="detail-grid" style="grid-template-columns:1fr 1fr 1fr 1fr">
        <div><span>一级</span>{{ l1Name(form.l1Id) }}</div>
        <div><span>状态</span>{{ poStatus(form.status) }}</div>
        <div><span>会签</span>{{ form.cosign?.admin1 ? '✓' : '-' }}/{{ form.cosign?.admin2 ? '✓' : '-' }}</div>
        <div><span>时间</span>{{ formatDateTime(form.createdAt) }}</div>
        <div v-if="form.status==='rejected'" class="span-2"><span>驳回原因</span>{{ form.rejectReason || '未填写' }}</div>
      </div>
      <h4>标准品</h4>
      <el-table :data="form.lines||[]" size="small" border show-summary :summary-method="lineSummary">
        <el-table-column label="商品" min-width="140"><template #default="{row}">{{ prodName(row.productId) }}</template></el-table-column>
        <el-table-column prop="size" label="弹力带" width="80" />
        <el-table-column prop="belt" label="腰带" width="90" />
        <el-table-column prop="qty" label="数量" width="70" />
        <el-table-column label="号段"><template #default="{row}">{{ segsOf(row).join('；') || '—' }}</template></el-table-column>
        <el-table-column label="号段数量" width="90"><template #default="{row}">{{ segsQty(row) }}</template></el-table-column>
      </el-table>
      <h4>非标品</h4>
      <el-table :data="form.customLines||[]" size="small" border show-summary :summary-method="lineSummary">
        <el-table-column label="商品" min-width="140"><template #default="{row}">{{ prodName(row.productId) }}</template></el-table-column>
        <el-table-column prop="size" label="弹力带" width="80" />
        <el-table-column prop="belt" label="腰带" width="90" />
        <el-table-column prop="qty" label="数量" width="70" />
        <el-table-column label="号段"><template #default="{row}">{{ segsOf(row).join('；') || '—' }}</template></el-table-column>
        <el-table-column label="号段数量" width="90"><template #default="{row}">{{ segsQty(row) }}</template></el-table-column>
      </el-table>
      <h4>单品</h4>
      <el-table :data="form.parts||[]" size="small" border>
        <el-table-column label="单品"><template #default="{row}">{{ prodName(row.partId) }}</template></el-table-column>
        <el-table-column prop="spec" label="规格" /><el-table-column prop="qty" label="数量" width="80" />
      </el-table>
    </template>
    <template v-else-if="form && form.id && mode==='audit'">
      <div class="alert alert-info">段号数量须等于标准+非标总数；单品不计 SN，可单独成单。两位管理员会签通过后立即完成。号段若已发给其他代理或已售出则判异常；已退回原厂的 SN 可再次出给代理（含原代理）。</div>
      <h4>标准品</h4>
      <div v-for="(line, i) in form.lines" :key="'l'+i" class="audit-line">
        <div class="audit-prod">{{ prodName(line.productId) }} · {{ line.size }}+{{ line.belt }} × {{ line.qty }}</div>
        <div v-for="(seg, si) in segsArr(line)" :key="si" class="segment-row">
          <el-input v-model="seg.from" placeholder="起始 SN" @input="touch" />
          <span class="muted">—</span>
          <el-input v-model="seg.to" placeholder="结束 SN" @input="touch" />
          <span class="num muted">{{ segCountOf(seg) }}</span>
          <span v-if="segmentError(seg)" class="seg-error">需完整SN</span>
          <el-button size="small" @click="addSeg(line)">+</el-button>
        </div>
      </div>
      <h4>非标品 <el-button size="small" @click="addCustomLine">+ 加行</el-button></h4>
      <div v-for="(line, i) in form.customLines" :key="'c'+i" class="audit-line">
        <div class="custom-spec-row">
          <el-select v-model="line.productId" filterable placeholder="商品" @focus="rememberLineKey(line)" @change="onCustomProduct(line)">
            <el-option v-for="p in customProducts" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="line.size" placeholder="弹力带" @focus="rememberLineKey(line)" @change="moveLineSegments(line)">
            <el-option v-for="size in sizeOptions(line)" :key="size" :label="size" :value="size" />
          </el-select>
          <el-select v-model="line.belt" placeholder="腰带" @focus="rememberLineKey(line)" @change="moveLineSegments(line)">
            <el-option v-for="belt in beltOptions(line)" :key="belt" :label="belt" :value="belt" />
          </el-select>
          <el-input-number v-model="line.qty" :min="0" size="small" @change="touch" />
        </div>
        <div v-for="(seg, si) in segsArr(line)" :key="si" class="segment-row">
          <el-input v-model="seg.from" placeholder="起始 SN" @input="touch" />
          <span class="muted">—</span>
          <el-input v-model="seg.to" placeholder="结束 SN" @input="touch" />
          <span class="num muted">{{ segCountOf(seg) }}</span>
          <span v-if="segmentError(seg)" class="seg-error">需完整SN</span>
          <el-button size="small" @click="addSeg(line)">+</el-button>
        </div>
      </div>
      <h4>单品（无 SN）</h4>
      <div v-for="(pt, i) in form.parts" :key="'p'+i" class="segment-row">
        <el-select v-model="pt.partId" filterable placeholder="单品" style="width:160px">
          <el-option v-for="p in partProducts" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-input v-model="pt.spec" placeholder="规格" style="width:100px" />
        <el-input-number v-model="pt.qty" :min="0" size="small" @change="touch" />
      </div>
      <div class="audit-match-live">
        需求 SN：<strong class="num">{{ needQty }}</strong>
        　已填段号：<strong class="num">{{ gotQty }}</strong>
        　<span class="tag" :class="match ? 'tag-green' : 'tag-orange'">{{ match ? '数量匹配' : '数量不匹配' }}</span>
      </div>
      <p style="margin-top:8px">会签：管理员1 {{ form.cosign?.admin1 ? '✓' : '○' }}　管理员2 {{ form.cosign?.admin2 ? '✓' : '○' }}</p>
    </template>
    <template v-else-if="form">
      <el-form label-width="108px">
        <el-form-item label="一级代理">
          <el-select v-model="form.l1Id" filterable style="width:100%">
            <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <p class="muted">后台以审核为主；下单仅一级小程序。此处仅演示补单。</p>
    </template>
    <template #footer>
      <el-button @click="visible=false">{{ form?.id && mode==='view' ? '关闭' : '取消' }}</el-button>
      <template v-if="form?.id && mode==='view' && (form.status==='pending' || form.status==='cosigning')">
        <el-button v-if="canCosign" type="primary" @click="mode='audit'">去审核</el-button>
      </template>
      <template v-else-if="form?.id && mode==='audit'">
        <el-button type="danger" plain @click="remove">删除</el-button>
        <el-button type="primary" :disabled="!match" @click="cosign">确认（会签）</el-button>
        <el-button type="danger" plain @click="reject">驳回</el-button>
      </template>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api'
import { formatDateTime } from '@/utils/dates'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canCosign = computed(() => auth.hasPerm('all'))
const props = defineProps<{ modelValue: boolean; row?: any; l1s: any[] }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: []; closed: [] }>()
const visible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const form = ref<any>(null)
const mode = ref<'view' | 'audit'>('view')
const products = ref<any[]>([])
const segDraft = ref<Record<string, { from: string; to: string }[]>>({})
const tick = ref(0)
function touch() { tick.value++ }
const title = computed(() => {
  if (!form.value?.id) return '新建采购'
  return mode.value === 'audit' ? `审核采购单 ${form.value.no}` : `采购单 ${form.value.no}`
})
const partProducts = computed(() => products.value.filter((p) => p.type === 'part'))
const customProducts = computed(() => products.value.filter((p) => p.type !== 'part'))
function l1Name(id?: string) { return props.l1s.find((a) => a.id === id)?.name || id || '—' }
function prodName(id?: string) { return products.value.find((p) => p.id === id)?.name || id || '—' }
function poStatus(s: string) {
  return ({ pending: '待处理', cosigning: '会签中', approved: '已完成', rejected: '已驳回' } as Record<string, string>)[s] || s
}
function lineKey(line: any) { return `${line.productId}_${line.size}_${line.belt || ''}` }
function productOf(id?: string) { return products.value.find((p) => p.id === id) }
function componentSizes(product: any, name: RegExp) {
  const components = product?.extra?.components || []
  const component = components.find((item: any) => name.test(String(item.name || '')))
  return component?.pool || component?.sizes || []
}
function sizeOptions(line: any) {
  const product = productOf(line.productId)
  return product?.extra?.sizes || product?.extra?.sizePool || componentSizes(product, /弹力带/) || []
}
function beltOptions(line: any) {
  const product = productOf(line.productId)
  return product?.extra?.belts || componentSizes(product, /腰带/) || []
}
function rememberLineKey(line: any) {
  line._previousSegmentKey = lineKey(line)
}
function moveLineSegments(line: any) {
  const previous = line._previousSegmentKey
  const next = lineKey(line)
  if (previous && previous !== next && segDraft.value[previous]) {
    segDraft.value[next] = segDraft.value[previous]
    delete segDraft.value[previous]
  }
  line._previousSegmentKey = next
  touch()
}
function onCustomProduct(line: any) {
  const sizes = sizeOptions(line)
  const belts = beltOptions(line)
  if (!sizes.includes(line.size)) line.size = sizes[0] || ''
  if (!belts.includes(line.belt)) line.belt = belts[0] || ''
  moveLineSegments(line)
}
function addCustomLine() {
  const product = customProducts.value[0]
  const line: any = { productId: product?.id || '', size: '', belt: '', qty: 1 }
  const sizes = sizeOptions(line)
  const belts = beltOptions(line)
  line.size = sizes[0] || ''
  line.belt = belts[0] || ''
  form.value.customLines.push(line)
  touch()
}
function segsOf(line: any) {
  const segs = form.value?.segments || {}
  return segs[lineKey(line)] || []
}
function segCount(s: string) {
  const bits = String(s || '').split('-')
  const from = (bits[0] || '').trim().toUpperCase()
  const to = (bits.length > 1 ? bits.slice(1).join('-') : from).trim().toUpperCase()
  if (!from) return 0
  if (!/^RL\d{5,}$/.test(from) || !/^RL\d{5,}$/.test(to)) return 0
  const prefix = from.slice(0, -4)
  if (!to.startsWith(prefix) || to.length !== from.length) return 0
  const a = Number(from.slice(-4))
  const b = Number(to.slice(-4))
  if (!Number.isInteger(a) || !Number.isInteger(b) || b < a || b - a > 5000) return 0
  return b - a + 1
}
function segmentError(seg: { from: string; to: string }) {
  return !!(seg.from || seg.to) && segCountOf(seg) === 0
}
function segsQty(line: any) {
  return segsOf(line).reduce((n: number, s: string) => n + segCount(s), 0)
}
function segsArr(line: any) {
  const k = lineKey(line)
  if (!segDraft.value[k]) {
    const raw = segsOf(line)
    segDraft.value[k] = raw.length ? raw.map((s: string) => {
      const bits = String(s).split('-')
      return { from: bits[0] || '', to: bits.slice(1).join('-') || '' }
    }) : [{ from: '', to: '' }]
  }
  return segDraft.value[k]
}
function segCountOf(seg: { from: string; to: string }) {
  void tick.value
  return segCount(seg.to ? `${seg.from}-${seg.to}` : seg.from)
}
function addSeg(line: any) { segsArr(line).push({ from: '', to: '' }); touch() }
function segmentsPayload() {
  const out: Record<string, string[]> = {}
  for (const [k, arr] of Object.entries(segDraft.value)) {
    out[k] = arr.map((s) => s.to ? `${s.from}-${s.to}` : s.from).filter(Boolean)
  }
  return out
}
function lineQty(rows?: any[]) {
  return (rows || []).reduce((n, l) => n + (Number(l.qty) || 0), 0)
}
const needQty = computed(() => {
  void tick.value
  return lineQty(form.value?.lines) + lineQty(form.value?.customLines)
})
const gotQty = computed(() => {
  void tick.value
  let n = 0
  for (const arr of Object.values(segDraft.value)) {
    for (const s of arr) n += segCount(s.to ? `${s.from}-${s.to}` : s.from)
  }
  return n
})
const match = computed(() => {
  void tick.value
  const partsOk = (form.value?.parts || []).some((x: any) => Number(x.qty) > 0)
  if (needQty.value === 0) return partsOk && gotQty.value === 0
  return gotQty.value === needQty.value
})
function lineSummary({ columns, data }: { columns: any[]; data: any[] }) {
  const sums: string[] = []
  columns.forEach((col: any, i: number) => {
    if (i === 0) { sums[i] = '总计'; return }
    if (col.label === '数量') sums[i] = String(lineQty(data))
    else if (col.label === '号段数量') sums[i] = String(data.reduce((n, r) => n + segsQty(r), 0))
    else if (col.label === '号段') sums[i] = '号段总计'
    else sums[i] = ''
  })
  return sums
}
watch(() => mode.value, (m) => {
  if (m === 'audit' && form.value) {
    for (const line of [...(form.value.lines || []), ...(form.value.customLines || [])]) segsArr(line)
    touch()
  }
})
watch(() => [props.modelValue, props.row], async () => {
  if (!props.modelValue) return
  mode.value = 'view'
  segDraft.value = {}
  tick.value = 0
  if (!products.value.length) {
    products.value = (await api.products({ page: 1, pageSize: 200 })).list || []
  }
  if (props.row?.id) {
    form.value = {
      ...props.row,
      lines: (props.row.lines || []).map((line: any) => ({ ...line })),
      customLines: (props.row.customLines || []).map((line: any) => ({ ...line })),
      parts: (props.row.parts || []).map((part: any) => ({ ...part })),
    }
  } else {
    form.value = { l1Id: props.l1s[0]?.id, lines: [], customLines: [], parts: [] }
  }
}, { immediate: true })
async function cosign() {
  if (!match.value) {
    ElMessage.error(`段号数量须等于标准+非标总数（需求 ${needQty.value}，已填 ${gotQty.value}）`)
    return
  }
  await ElMessageBox.confirm('确认会签并入库？号段数量须与明细一致。', '会签确认', { type: 'warning' })
  const customLines = form.value.customLines.map(({ productId, size, belt, qty }: any) => ({ productId, size, belt, qty }))
  await api.cosign(form.value.id, segmentsPayload(), customLines)
  ElMessage.success('会签已提交')
  emit('saved'); visible.value = false
}
async function reject() {
  const { value } = await ElMessageBox.prompt('请填写驳回原因', '驳回采购', {
    confirmButtonText: '驳回',
    cancelButtonText: '取消',
    inputPlaceholder: '原因',
    type: 'warning',
  })
  await api.rejectPurchase(form.value.id, String(value || '').trim())
  ElMessage.success('已驳回')
  emit('saved'); visible.value = false
}
async function remove() {
  await ElMessageBox.confirm('删除该采购单？', '确认', { type: 'warning' })
  await api.deletePurchase(form.value.id)
  ElMessage.success('已删除')
  emit('saved'); visible.value = false
}
</script>
<style scoped>
h4 { margin: 14px 0 8px; font-size: 13px; }
.audit-line { border: 1px solid var(--border); border-radius: 8px; padding: 8px; margin-bottom: 8px; }
.audit-prod { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
.custom-spec-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) minmax(110px, 1fr) minmax(110px, 1fr) auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.segment-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.muted { color: var(--text-3); font-size: 12px; }
.audit-match-live { margin-top: 10px; font-size: 13px; }
.num { font-variant-numeric: tabular-nums; }
.seg-error { color: var(--danger); font-size: 11px; white-space: nowrap; }
</style>
