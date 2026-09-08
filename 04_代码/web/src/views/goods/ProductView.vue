<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>商品库</h2>
        <p>套件 / 单品（有SN）；套件可勾选随售单品</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="open(undefined, 'kit')">新建套件</el-button>
        <el-button type="primary" @click="open(undefined, 'single')">新建单品</el-button>
      </div>
    </div>
    <PageTabs v-model="tab" :items="tabItems" />
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item><el-input v-model="query.keyword" placeholder="搜索编码/名称/组件" clearable style="width:220px" /></el-form-item>
    </SearchPanel>
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="(r:any)=>open(r)">
      <el-table-column prop="code" label="编码" width="140" />
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column label="类型" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.type==='kit'?'tag-orange':row.type==='single'?'tag-blue':'tag-gray'">{{ typeLabel(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="组件/规格" min-width="200"><template #default="{row}">{{ compsText(row) }}</template></el-table-column>
      <el-table-column label="标品组合" min-width="200"><template #default="{row}">{{ comboSummary(row) }}</template></el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click.stop="open(row)">修改</el-button>
          <el-button size="small" type="danger" plain @click.stop="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </DataTableShell>
    <el-dialog v-model="dlg" class="kit-form-dlg" :title="form.id ? `修改商品 · ${form.name || ''}` : `新建${typeLabel(form.type)}`" width="900px">
      <el-form label-width="96px">
        <el-form-item label="商品编号"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="商品名称"><el-input v-model="form.name" :placeholder="form.type==='single'?'如：护膝单品':'如：弹力带+腰带套件'" /></el-form-item>
        <el-form-item v-if="!(creatingKit)" label="说明"><el-input v-model="form.note" /></el-form-item>
        <template v-if="form.type==='kit'">
          <el-form-item v-if="form.id" label="可随售单品">
            <div class="perm-check-grid">
              <label v-for="p in singles" :key="p.id" class="perm-check">
                <el-checkbox :model-value="bundleOn(p.id)" @change="(v:boolean)=>toggleBundle(p.id, v)" />
                <span>{{ p.name }}</span>
                <code>{{ p.code || p.id }}</code>
              </label>
              <span v-if="!singles.length" class="muted">暂无单品，请先新建单品</span>
            </div>
            <p class="muted" style="margin-top:6px">勾选后，下销售单时可按规格加购这些单品（各自扫 SN）。</p>
          </el-form-item>
          <div v-if="!creatingKit" class="alert alert-info" style="margin:0 0 12px">可配置多个组件：先命名并<strong>勾选尺码</strong>，下方「标准套件组合」会按已选尺码<strong>自动生成全部组合</strong>。</div>
          <div v-for="(c, ci) in comps" :key="c.id" class="kit-comp">
            <el-form-item v-if="!creatingKit" :label="`组件 ${ci+1} 名称`">
              <div class="line">
                <el-input v-model="c.name" placeholder="如：腰带 / 袜子 / 包装" />
                <el-button v-if="comps.length>2" size="small" @click="comps.splice(ci,1)">删除组件</el-button>
              </div>
            </el-form-item>
            <el-form-item v-else>
              <div style="font-weight:600">{{ ci===0 ? '组件1弹力带' : ci===1 ? '组件2腰带' : `组件${ci+1}` }}尺码</div>
            </el-form-item>
            <el-form-item :label="creatingKit ? '' : '尺码池'">
              <div class="size-config-row">
                <el-button size="small" :class="{ 'select-all-btn': true, on: allOn(c.pool, c.sizes) }" @click="toggleAll(c)">
                  {{ allOn(c.pool, c.sizes) ? '取消全选' : '全选' }}
                </el-button>
                <div v-if="c.pool.length" class="chips size-chips">
                  <button v-for="s in c.pool" :key="s" type="button" class="chip" :class="{ on: c.sizes.includes(s) }" @click="toggleSize(c, s)">{{ s }}</button>
                </div>
                <span v-else class="muted">暂无尺码</span>
                <el-input v-model="c._add" class="size-add-input" placeholder="新增尺码，如 42号 / M" @keyup.enter="addSize(c)" />
                <el-button size="small" type="primary" @click="addSize(c)">+ 添加尺码</el-button>
              </div>
            </el-form-item>
          </div>
          <el-button v-if="!creatingKit" size="small" @click="addComp">+ 添加组件</el-button>
          <el-form-item label="标品组合" style="margin-top:12px">
            <el-button size="small" @click="refreshStd">刷新标品组合</el-button>
            <el-table :data="stdCombos" size="small" border style="width:100%;margin-top:8px">
              <el-table-column label="档位" width="90">
                <template #default="{row}"><el-input v-model="row.grade" /></template>
              </el-table-column>
              <el-table-column v-for="c in comps" :key="c.id" :label="c.name" min-width="110">
                <template #default="{row}">
                  <el-select v-model="row.picks[c.id]" style="width:100%">
                    <el-option v-for="s in c.sizes" :key="s" :label="s" :value="s" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="组合说明" min-width="140">
                <template #default="{row}">{{ comboLabel(row) }}</template>
              </el-table-column>
              <el-table-column width="70">
                <template #default="{ $index }"><el-button text type="danger" @click="stdCombos.splice($index,1)">删</el-button></template>
              </el-table-column>
            </el-table>
          </el-form-item>
        </template>
        <template v-else-if="form.type==='single'">
          <div class="alert alert-info">单品：仅维护尺码规格，下单按尺码数量；生成 SN，无双组件/标品组合。</div>
          <el-form-item label="规格尺码">
            <div class="size-config-row">
              <el-button size="small" :class="{ 'select-all-btn': true, on: allOn(sizePool, sizesSel) }" @click="toggleAllSizes">
                {{ allOn(sizePool, sizesSel) ? '取消全选' : '全选' }}
              </el-button>
              <div v-if="sizePool.length" class="chips size-chips">
                <button v-for="s in sizePool" :key="s" type="button" class="chip" :class="{ on: sizesSel.includes(s) }" @click="togglePsize(s)">{{ s }}</button>
              </div>
              <span v-else class="muted">暂无尺码</span>
              <el-input v-model="sizeAdd" class="size-add-input" placeholder="新增尺码，如 XL / 42号" @keyup.enter="addPsize" />
              <el-button size="small" type="primary" @click="addPsize">+ 添加尺码</el-button>
            </div>
          </el-form-item>
        </template>
        <el-form-item v-else label="规格">
          <el-input v-model="sizeText" placeholder="逗号分隔，如 S,M,L" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg=false">取消</el-button>
        <el-button type="primary" @click="save">{{ form.id ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import PageTabs from '@/components/common/PageTabs.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { STANDARD_KITS } from '@/utils/regions'
import { comboLabelOf, comboPart, productCompsText } from '@/utils/format'

const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const dlg = ref(false)
const form = ref<any>({})
const comps = ref<any[]>([])
const stdCombos = ref<any[]>([])
const sizeText = ref('')
const sizePool = ref<string[]>([])
const sizesSel = ref<string[]>([])
const sizeAdd = ref('')
const singles = ref<any[]>([])
const tab = ref('all')
const counts = ref({ all: 0, kit: 0, single: 0 })
const tabItems = computed(() => [
  { id: 'all', title: '全部', badge: counts.value.all },
  { id: 'kit', title: '套件', badge: counts.value.kit },
  { id: 'single', title: '单品', badge: counts.value.single },
])
const creatingKit = computed(() => !form.value.id && form.value.type === 'kit')

function typeLabel(t: string) {
  return t === 'kit' ? '套件' : t === 'single' ? '单品' : '配件'
}
function comboSummary(row: any) {
  if (row.type !== 'kit') return row.type === 'single' ? '按尺码' : '—'
  const std = row.extra?.stdCombos || []
  if (!std.length) return '—'
  return std.map((k: any) => {
    if (k.label) return k.label
    return k.grade ? `${k.grade}·${k.key || ''}` : (k.key || '—')
  }).join('、')
}
function compsText(row: any) {
  return productCompsText(row)
}
function comboLabel(row: any) {
  return comboLabelOf(comps.value, row)
}
function allOn(pool: string[], selected: string[]) {
  return !!pool?.length && pool.every((s) => selected.includes(s))
}
function toggleSize(c: any, s: string) {
  const i = c.sizes.indexOf(s)
  if (i >= 0) c.sizes.splice(i, 1)
  else c.sizes.push(s)
}
function toggleAll(c: any) {
  c.sizes = allOn(c.pool, c.sizes) ? [] : [...c.pool]
}
function togglePsize(s: string) {
  const i = sizesSel.value.indexOf(s)
  if (i >= 0) sizesSel.value.splice(i, 1)
  else sizesSel.value.push(s)
}
function toggleAllSizes() {
  sizesSel.value = allOn(sizePool.value, sizesSel.value) ? [] : [...sizePool.value]
}
function bundleOn(id: string) {
  return (form.value.extra?.bundleSingles || []).includes(id)
}
function toggleBundle(id: string, on: boolean) {
  const extra = form.value.extra || (form.value.extra = {})
  const set = new Set(extra.bundleSingles || [])
  if (on) set.add(id)
  else set.delete(id)
  extra.bundleSingles = [...set]
}

async function load() {
  loading.value = true
  try {
    query.type = tab.value === 'all' ? '' : tab.value
    const res = await api.products({ page: page.value, pageSize: pageSize.value, ...query })
    list.value = res.list
    total.value = res.total
    const [all, kit, single] = await Promise.all([
      api.products({ page: 1, pageSize: 1 }),
      api.products({ page: 1, pageSize: 1, type: 'kit' }),
      api.products({ page: 1, pageSize: 1, type: 'single' }),
    ])
    counts.value = { all: all.total, kit: kit.total, single: single.total }
    singles.value = (await api.products({ page: 1, pageSize: 200, type: 'single' })).list || []
  } finally { loading.value = false }
}
function reset() { query.keyword=''; resetPage(); load() }
function open(row?: any, ptype?: string) {
  form.value = row ? JSON.parse(JSON.stringify(row)) : { type: ptype || 'kit', status: '上架', extra: {} }
  const extra = form.value.extra || {}
  if (form.value.type === 'kit') {
    if (!row) {
      comps.value = [
        { id: 'c0', name: '弹力带', pool: [], sizes: [], _add: '' },
        { id: 'c1', name: '腰带', pool: [], sizes: [], _add: '' },
      ]
      stdCombos.value = []
    } else {
      comps.value = extra.components?.length
        ? extra.components.map((c: any) => ({ ...c, pool: [...(c.pool || c.sizes || [])], sizes: [...(c.sizes || [])], _add: '' }))
        : [
            { id: 'c0', name: extra.compAName || '腰带', pool: extra.belts || ['腰带S','腰带M','腰带L'], sizes: extra.belts || ['腰带S','腰带M','腰带L'], _add: '' },
            { id: 'c1', name: extra.compBName || '弹力带', pool: extra.sizes || ['SS','S','M','L','LL'], sizes: extra.sizes || ['SS','S','M','L','LL'], _add: '' },
          ]
      stdCombos.value = (extra.stdCombos || []).map((k: any) => ({
        ...k,
        picks: k.picks || { [comps.value[0]?.id]: k.belt, [comps.value[1]?.id]: k.size },
      }))
      if (!stdCombos.value.length) refreshStd()
    }
  } else if (form.value.type === 'single') {
    sizePool.value = [...(extra.sizePool || extra.sizes || [])]
    sizesSel.value = [...(extra.sizes || extra.sizePool || [])]
    sizeAdd.value = ''
  } else {
    sizeText.value = (extra.sizes || extra.sizePool || []).join(',')
  }
  dlg.value = true
}
function addSize(c: any) {
  const v = String(c._add || '').trim()
  if (!v) return
  if (!c.pool.includes(v)) c.pool.push(v)
  if (!c.sizes.includes(v)) c.sizes.push(v)
  c._add = ''
}
function addPsize() {
  const v = String(sizeAdd.value || '').trim()
  if (!v) return
  if (!sizePool.value.includes(v)) sizePool.value.push(v)
  if (!sizesSel.value.includes(v)) sizesSel.value.push(v)
  sizeAdd.value = ''
}
function addComp() {
  const i = comps.value.length
  comps.value.push({ id: 'c' + i, name: '组件' + (i + 1), pool: [], sizes: [], _add: '' })
}
function refreshStd() {
  const a = comps.value[0]
  const b = comps.value[1]
  if (!a || !b) { stdCombos.value = []; return }
  const classic = /腰带/.test(a.name) && /弹力带/.test(b.name)
  if (classic) {
    stdCombos.value = STANDARD_KITS.filter((k) => a.sizes.includes(k.belt) && b.sizes.includes(k.size)).map((k) => ({
      ...k,
      picks: { [a.id]: k.belt, [b.id]: k.size },
    }))
    return
  }
  const out: any[] = []
  for (const sa of a.sizes) for (const sb of b.sizes) {
    out.push({ grade: '', belt: sa, size: sb, picks: { [a.id]: sa, [b.id]: sb }, label: `${comboPart(a.name, sa)}+${comboPart(b.name, sb)}` })
  }
  stdCombos.value = out.slice(0, 48)
}
async function save() {
  const extra: any = { ...(form.value.extra || {}) }
  if (form.value.type === 'kit') {
    extra.components = comps.value.map(({ _add, ...c }) => c)
    extra.compAName = comps.value[0]?.name
    extra.compBName = comps.value[1]?.name
    extra.belts = comps.value[0]?.sizes || []
    extra.sizes = comps.value[1]?.sizes || []
    extra.stdCombos = stdCombos.value.map((k) => ({
      ...k,
      belt: k.picks?.[comps.value[0]?.id] || k.belt,
      size: k.picks?.[comps.value[1]?.id] || k.size,
      label: comboLabel(k),
    }))
  } else if (form.value.type === 'single') {
    extra.sizePool = [...sizePool.value]
    extra.sizes = [...sizesSel.value]
  } else {
    extra.sizes = sizeText.value.split(/[,，\s]+/).filter(Boolean)
    extra.sizePool = extra.sizes
  }
  form.value.extra = extra
  await api.saveProduct(form.value)
  ElMessage.success('已保存')
  dlg.value = false
  load()
}
async function remove(row: any) {
  await ElMessageBox.confirm(`删除商品「${row.name}」？`, '确认', { type: 'warning' })
  await api.deleteProduct(row.id)
  ElMessage.success('已删除')
  load()
}
watch([page, pageSize], load)
watch(tab, () => { resetPage(); load() })
onMounted(load)
</script>
<style scoped>
.muted { color: var(--text-3); font-size: 12px; }
.size-config-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
.size-chips {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.size-add-input { width: 220px; }
</style>
