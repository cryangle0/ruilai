<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>SN码库</h2>
        <p>未处理激活异常的 SN 置顶 · 点击行查看生命周期/编辑</p>
      </div>
      <div class="page-actions" v-if="canManageSn">
        <el-button @click="impOpen=true">Excel导入段号</el-button>
      </div>
    </div>
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item><el-input v-model="query.sn" placeholder="SN" clearable style="width:150px" /></el-form-item>
      <el-form-item><el-input v-model="query.productName" placeholder="商品名称" clearable style="width:130px" /></el-form-item>
      <el-form-item><el-input v-model="query.productId" placeholder="商品编码" clearable style="width:160px" /></el-form-item>
      <el-form-item>
        <el-select v-model="query.l1Id" placeholder="一级" clearable filterable style="width:140px">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.l2Id" placeholder="二级" clearable filterable style="width:140px">
          <el-option v-for="a in l2s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.size" placeholder="弹力带尺码" clearable style="width:120px">
          <el-option v-for="s in BAND_SIZES" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.belt" placeholder="腰带尺码" clearable style="width:120px">
          <el-option v-for="s in BELTS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.channel" placeholder="渠道" clearable style="width:110px">
          <el-option label="分销" value="distribute" /><el-option label="直售" value="direct" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option label="原厂在库" value="warehouse" /><el-option label="一级在库" value="l1" />
          <el-option label="二级在库" value="l2" /><el-option label="已销售" value="bound" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.tag" placeholder="标签筛选" clearable style="width:120px">
          <el-option label="已冻结" value="已冻结" /><el-option label="已退货" value="已退货" /><el-option label="再入库" value="再入库" />
        </el-select>
      </el-form-item>
      <div class="date-range-filter">
        <span class="muted-label">出厂</span>
        <el-date-picker v-model="query.factoryFrom" type="date" value-format="YYYY-MM-DD" placeholder="起" style="width:130px" />
        <el-date-picker v-model="query.factoryTo" type="date" value-format="YYYY-MM-DD" placeholder="止" style="width:130px" />
      </div>
      <div class="date-range-filter">
        <span class="muted-label">销售</span>
        <el-date-picker v-model="query.soldFrom" type="date" value-format="YYYY-MM-DD" placeholder="起" style="width:130px" />
        <el-date-picker v-model="query.soldTo" type="date" value-format="YYYY-MM-DD" placeholder="止" style="width:130px" />
      </div>
      <div class="date-range-filter">
        <span class="muted-label">退货</span>
        <el-date-picker v-model="query.returnFrom" type="date" value-format="YYYY-MM-DD" placeholder="起" style="width:130px" />
        <el-date-picker v-model="query.returnTo" type="date" value-format="YYYY-MM-DD" placeholder="止" style="width:130px" />
      </div>
    </SearchPanel>
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="open">
      <el-table-column prop="sn" label="SN" width="156" show-overflow-tooltip />
      <el-table-column prop="productName" label="商品" width="148" show-overflow-tooltip />
      <el-table-column prop="sizeCode" label="尺寸" width="72" />
      <el-table-column prop="belt" label="腰带" width="96" />
      <el-table-column label="渠道" width="76">
        <template #default="{row}">
          <span v-if="row.status==='bound'" class="tag" :class="row.l2Id?'tag-blue':'tag-orange'">{{ row.l2Id ? '分销' : '直售' }}</span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="一级" min-width="132" show-overflow-tooltip><template #default="{row}">{{ nameL1(row.l1Id) }}</template></el-table-column>
      <el-table-column label="二级" min-width="132" show-overflow-tooltip><template #default="{row}">{{ nameL2(row.l2Id) }}</template></el-table-column>
      <el-table-column label="状态" width="168">
        <template #default="{row}">
          <span class="tag" :class="stTone(row.status)">{{ statusLabel(row.status) }}</span>
          <span
            v-if="row.openException"
            class="tag tag-red"
            :title="[row.openExceptionType, row.openExceptionDetail].filter(Boolean).join(' · ')"
            @click.stop="gotoEx(row.sn)"
          >异常未处理</span>
        </template>
      </el-table-column>
      <el-table-column label="标签" width="168">
        <template #default="{row}">
          <span v-for="t in visibleTags(row.tags)" :key="t" class="tag tag-orange" style="margin-right:4px">{{ t }}</span>
          <span v-if="!visibleTags(row.tags).length">—</span>
        </template>
      </el-table-column>
    </DataTableShell>

    <el-dialog v-model="dlg" :title="(editing?'编辑 SN':'SN 详情') + ' · ' + (cur.sn||'')" width="920px">
      <div class="detail-split">
        <div>
          <div class="detail-grid" style="grid-template-columns:1fr 1fr">
            <div><span>SN</span>{{ cur.sn }}</div>
            <div><span>状态</span><span class="tag" :class="stTone(cur.status)">{{ statusLabel(cur.status) }}</span>
              <div class="muted" style="margin-top:4px">仅四种：一级在库 / 二级在库 / 已销售 / 原厂在库</div>
            </div>
            <div class="span-2"><span>出厂日期</span>{{ factoryDateText(cur.sn, cur.factoryAt) }}
              <div class="muted" style="margin-top:4px">取 SN 编码中的 RLyyyyMMdd；非法编码按首次入码库日期</div>
            </div>
            <div><span>商品</span>{{ cur.productName || cur.productId }}</div>
            <div><span>弹力带</span>{{ cur.sizeCode }}</div>
            <div><span>腰带</span>{{ cur.belt || '—' }}</div>
            <div><span>一级</span>{{ nameL1(cur.l1Id) }}</div>
            <div><span>二级</span>{{ nameL2(cur.l2Id) }}</div>
            <div class="span-2"><span>标签</span>
              <span v-for="t in visibleTags(cur.tags)" :key="t" class="tag tag-orange" style="margin-right:4px">{{ t }}</span>
              <span v-if="!visibleTags(cur.tags).length">—</span>
            </div>
          </div>
          <template v-if="cust">
            <h4 style="margin-top:12px">{{ cur.prevUserJson && !cur.userJson ? '历史客户' : '客户信息' }}</h4>
            <div class="detail-grid" style="grid-template-columns:1fr 1fr">
              <div><span>姓名</span>{{ cust.name || '—' }}</div>
              <div><span>性别</span>{{ cust.gender || '—' }}</div>
              <div><span>年龄</span>{{ cust.age || '—' }}</div>
              <div><span>手机</span>{{ cust.phone || '—' }}</div>
              <div><span>归属地</span>{{ cust.phoneLoc || '—' }}</div>
              <div class="span-2"><span>地址</span>{{ cust.addr || '—' }}</div>
            </div>
          </template>
          <h4 style="margin-top:12px">情况说明</h4>
          <div v-if="editing" class="note-list">
            <div v-for="(n,i) in sitNotes" :key="'s'+i" class="note-row">
              <el-date-picker v-model="n.date" type="date" value-format="YYYY-MM-DD" placeholder="填写日期" style="width:148px" />
              <el-input v-model="n.text" placeholder="情况说明" />
            </div>
            <el-button size="small" @click="sitNotes.push(newNote())">+ 添加</el-button>
          </div>
          <div v-else class="note-read-list">
            <p v-for="(n,i) in sitNotes.filter(noteHasText)" :key="'sr'+i" class="muted"><strong>{{ n.date || '未填日期' }}</strong>　{{ n.text }}</p>
            <p v-if="!sitNotes.some(noteHasText)" class="muted">—</p>
          </div>
          <h4 style="margin-top:12px">处理说明</h4>
          <div v-if="editing" class="note-list">
            <div v-for="(n,i) in procNotes" :key="'p'+i" class="note-row">
              <el-date-picker v-model="n.date" type="date" value-format="YYYY-MM-DD" placeholder="填写日期" style="width:148px" />
              <el-input v-model="n.text" placeholder="处理说明" />
            </div>
            <el-button size="small" @click="procNotes.push(newNote())">+ 添加</el-button>
          </div>
          <div v-else class="note-read-list">
            <p v-for="(n,i) in procNotes.filter(noteHasText)" :key="'pr'+i" class="muted"><strong>{{ n.date || '未填日期' }}</strong>　{{ n.text }}</p>
            <p v-if="!procNotes.some(noteHasText)" class="muted">—</p>
          </div>
          <template v-if="editing">
            <h4 style="margin-top:12px">修改字段</h4>
            <el-form label-width="110px">
              <el-form-item label="弹力带尺码">
                <el-select v-model="edit.sizeCode" style="width:100%">
                  <el-option v-for="s in BAND_SIZES" :key="s" :label="s" :value="s" />
                </el-select>
              </el-form-item>
              <el-form-item label="腰带尺码">
                <el-select v-model="edit.belt" style="width:100%">
                  <el-option v-for="s in BELTS" :key="s" :label="s" :value="s" />
                </el-select>
              </el-form-item>
              <el-form-item label="所属一级">
                <el-select v-model="edit.l1Id" clearable style="width:100%">
                  <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
                </el-select>
              </el-form-item>
              <el-form-item class="no-wrap-label" label="所属二级（调库）">
                <el-select v-model="edit.l2Id" clearable style="width:100%">
                  <el-option v-for="a in l2s" :key="a.id" :label="a.name" :value="a.id" />
                </el-select>
              </el-form-item>
            </el-form>
            <p class="muted">保存后自动记录：谁、什么时间、改了什么。</p>
          </template>
          <p v-else class="muted" style="margin-top:8px">详情只读；点击「修改」后可编辑。</p>
        </div>
        <aside class="side-note-panel">
          <h4>完整流转（{{ (cur.events||[]).length }}）</h4>
          <div class="mini-timeline-scroll">
            <div class="mini-timeline">
              <div v-for="(e,i) in (cur.events||[])" :key="i" class="mini-tl-item">
                <div class="mini-tl-dot" />
                <div>
                  <div class="mini-tl-title">{{ e.title }}</div>
                  <div class="mini-tl-desc">{{ e.desc }}</div>
                  <div class="mini-tl-time">{{ e.time }}</div>
                </div>
              </div>
              <p v-if="!(cur.events||[]).length" class="muted">暂无事件</p>
            </div>
          </div>
        </aside>
      </div>
      <template #footer>
        <template v-if="editing">
          <el-button @click="editing=false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存修改</el-button>
        </template>
        <template v-else>
          <el-button @click="dlg=false">关闭</el-button>
          <el-button v-if="canManageSn" type="primary" @click="startEdit">修改</el-button>
          <el-button v-if="canManageSn && (cur.frozen || (cur.tags||[]).includes('已冻结'))" @click="reOpen=true">原厂在库重分配</el-button>
        </template>
      </template>
    </el-dialog>

    <el-dialog v-model="reOpen" title="已冻结 SN 重新分配" width="400px">
      <p>SN：{{ cur.sn }}</p>
      <el-form-item label="分配给一级">
        <el-select v-model="reL1" filterable style="width:100%">
          <el-option v-for="a in enabledL1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <template #footer>
        <el-button @click="reOpen=false">取消</el-button>
        <el-button type="primary" @click="doReassign">分配并解冻</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="impOpen" title="批量导入 SN 段号" width="560px">
      <div class="alert alert-info">支持 Excel（<strong>.xlsx / .xls</strong>）和 <strong>.csv</strong>，也可直接粘贴。每行一个号段（如 RL202608010001-RL202608010010）。</div>
      <el-form label-width="90px" style="margin-top:12px">
        <el-form-item label="所属一级">
          <el-select v-model="imp.l1Id" filterable style="width:100%">
            <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品">
          <el-select v-model="imp.productId" style="width:100%">
            <el-option v-for="p in kits" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="尺寸">
          <el-select v-model="imp.size" style="width:100%"><el-option v-for="s in BAND_SIZES" :key="s" :label="s" :value="s" /></el-select>
        </el-form-item>
        <el-form-item label="腰带">
          <el-select v-model="imp.belt" style="width:100%"><el-option v-for="s in BELTS" :key="s" :label="s" :value="s" /></el-select>
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            ref="segUploadRef"
            class="seg-upload"
            drag
            :auto-upload="false"
            :limit="1"
            v-model:file-list="segFileList"
            accept=".xlsx,.xls,.csv"
            :on-change="onSegUpload"
            :on-exceed="onSegExceed"
          >
            <div class="seg-upload-inner">
              <el-icon class="seg-upload-ico"><UploadFilled /></el-icon>
              <div class="seg-upload-title">将文件拖到此处，或<em>点击上传</em></div>
              <div class="seg-upload-sub">Excel .xlsx / .xls，或 .csv</div>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="段号列表"><el-input v-model="imp.text" type="textarea" :rows="8" placeholder="每行一段，可由文件填充" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="impOpen=false">取消</el-button>
        <el-button type="primary" @click="doImp">导入待入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, genFileId } from 'element-plus'
import type { UploadFile, UploadInstance, UploadRawFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { BAND_SIZES, BELTS } from '@/utils/regions'
import { extractSegLines, readSegFile } from '@/utils/snSeg'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canManageSn = computed(() => auth.hasPerm('all'))
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const route = useRoute()
const router = useRouter()
const dlg = ref(false)
const editing = ref(false)
const cur = ref<any>({})
const l1s = ref<any[]>([])
const l2s = ref<any[]>([])
const products = ref<any[]>([])
const kits = computed(() => products.value.filter((p) => p.type !== 'part'))
const enabledL1s = computed(() => l1s.value.filter((a) => a.status === '启用'))
type SnNote = { date: string; text: string }
const sitNotes = ref<SnNote[]>([])
const procNotes = ref<SnNote[]>([])
const edit = reactive<any>({ sizeCode: '', belt: '', l1Id: '', l2Id: '' })
const impOpen = ref(false)
const segUploadRef = ref<UploadInstance>()
const segFileList = ref<UploadFile[]>([])
let lastSegUid = 0
const reOpen = ref(false)
const reL1 = ref('')
const imp = reactive({ l1Id: '', productId: '', size: 'M', belt: '腰带M', text: '' })
const cust = computed(() => cur.value.userJson || cur.value.prevUserJson)

function nameL1(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '—' }
function nameL2(id?: string) { return l2s.value.find((a) => a.id === id)?.name || id || '—' }
function visibleTags(tags?: string[]) {
  return (tags || []).filter((tag) => tag !== '修理过' && tag !== '个性化')
}
function today() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}
function newNote(): SnNote {
  return { date: today(), text: '' }
}
function noteHasText(note: SnNote) {
  return !!note.text.trim()
}
function dateOnly(value?: string) {
  return value ? String(value).slice(0, 10) : '—'
}
function factoryDateText(sn?: string, factoryAt?: string) {
  const m = String(sn || '').match(/^RL(\d{4})(\d{2})(\d{2})/i)
  if (m) {
    const stamp = `${m[1]}-${m[2]}-${m[3]}`
    if (!Number.isNaN(Date.parse(`${stamp}T00:00:00`))) return stamp
  }
  return dateOnly(factoryAt)
}
function statusLabel(s: string) {
  return ({ warehouse: '原厂在库', l1: '一级在库', l2: '二级在库', bound: '已销售' } as Record<string, string>)[s] || s || '—'
}
function gotoEx(sn: string) {
  if (!sn) return
  router.push({ path: '/risk/exception', query: { sn } })
}
function stTone(s: string) {
  return s === 'bound' ? 'tag-green' : s === 'l2' ? 'tag-blue' : s === 'l1' ? 'tag-green' : 'tag-gray'
}
async function load() {
  loading.value = true
  try {
    const productKey = String(query.productId || '').trim()
    const res = await api.sns({
      page: page.value,
      pageSize: pageSize.value,
      sn: query.sn || undefined,
      productName: query.productName || undefined,
      productId: productKey || undefined,
      l1Id: query.l1Id || undefined,
      l2Id: query.l2Id || undefined,
      size: query.size || undefined,
      belt: query.belt || undefined,
      channel: query.channel || undefined,
      status: query.status || undefined,
      tag: query.tag || undefined,
      factoryFrom: query.factoryFrom || undefined,
      factoryTo: query.factoryTo || undefined,
      soldFrom: query.soldFrom || undefined,
      soldTo: query.soldTo || undefined,
      returnFrom: query.returnFrom || undefined,
      returnTo: query.returnTo || undefined,
    })
    list.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}
function reset() {
  query.sn=''; query.status=''; query.productName=''; query.productId=''; query.l1Id=''; query.l2Id=''
  query.size=''; query.belt=''; query.channel=''; query.tag=''
  query.factoryFrom=''; query.factoryTo=''; query.soldFrom=''; query.soldTo=''; query.returnFrom=''; query.returnTo=''
  resetPage(); load()
}
async function open(row: any) {
  cur.value = await api.sn(row.sn)
  editing.value = false
  sitNotes.value = notesOf('situationNotes')
  procNotes.value = notesOf('processNotes')
  dlg.value = true
}
function notesOf(key: string) {
  const extra = cur.value.extra || {}
  const arr = extra[key]
  if (!Array.isArray(arr) || !arr.length) return [newNote()]
  return arr.map((item: unknown) => {
    if (item && typeof item === 'object') {
      const note = item as Record<string, unknown>
      return { date: String(note.date || ''), text: String(note.text || '') }
    }
    return { date: '', text: String(item || '') }
  })
}
function startEdit() {
  sitNotes.value = notesOf('situationNotes')
  procNotes.value = notesOf('processNotes')
  edit.sizeCode = cur.value.sizeCode
  edit.belt = cur.value.belt
  edit.l1Id = cur.value.l1Id || ''
  edit.l2Id = cur.value.l2Id || ''
  editing.value = true
}
async function saveEdit() {
  cur.value = await api.updateSn(cur.value.sn, {
    sizeCode: edit.sizeCode, belt: edit.belt, l1Id: edit.l1Id, l2Id: edit.l2Id,
    situationNotes: sitNotes.value.filter(noteHasText),
    processNotes: procNotes.value.filter(noteHasText),
  })
  ElMessage.success('已保存')
  editing.value = false
  load()
}
async function doReassign() {
  if (!reL1.value) { ElMessage.error('请选择一级'); return }
  const l1Name = nameL1(reL1.value)
  try {
    await ElMessageBox.confirm(
      `确认将已冻结 SN「${cur.value.sn}」分配给「${l1Name}」并解除冻结？`,
      '原厂在库重分配',
      { confirmButtonText: '确认分配', type: 'warning' },
    )
  } catch { return }
  cur.value = await api.reassignSn(cur.value.sn, reL1.value)
  ElMessage.success('已分配并解冻')
  reOpen.value = false
  load()
}
async function applySegFile(file: File) {
  try {
    const raw = await readSegFile(file)
    const lines = extractSegLines(raw)
    imp.text = lines.join('\n')
    ElMessage.success(`已从 ${file.name} 识别 ${lines.length} 行`)
  } catch (e: any) {
    ElMessage.error(e?.message || '文件解析失败')
  }
}
function onSegUpload(file: UploadFile) {
  if (!file.raw || file.status === 'fail') return
  if (file.uid === lastSegUid) return
  lastSegUid = Number(file.uid) || 0
  applySegFile(file.raw)
}
function onSegExceed(files: File[]) {
  const file = files[0]
  if (!file) return
  segUploadRef.value?.clearFiles()
  const raw = file as UploadRawFile
  raw.uid = genFileId()
  segUploadRef.value?.handleStart(raw)
}
watch(impOpen, (open) => {
  if (!open) {
    segFileList.value = []
    lastSegUid = 0
  }
})
async function doImp() {
  const lines = extractSegLines(imp.text)
  if (!lines.length) { ElMessage.error('未识别到有效段号'); return }
  try {
    await ElMessageBox.confirm('确认按粘贴内容导入 SN 段号到待入库？', '导入 SN 确认', { confirmButtonText: '确认导入' })
  } catch { return }
  const rows = await api.importSnSeg({ ...imp, text: lines.join('\n') })
  ElMessage.success(`已导入 ${rows.length} 条`)
  impOpen.value = false
  load()
}
watch([page, pageSize], load)
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  products.value = (await api.products({ page: 1, pageSize: 200 })).list || []
  imp.l1Id = l1s.value[0]?.id
  imp.productId = kits.value[0]?.id
  reL1.value = imp.l1Id
  if (route.query.sn) query.sn = String(route.query.sn)
  if (route.query.l1Id) query.l1Id = String(route.query.l1Id)
  if (route.query.l2Id) query.l2Id = String(route.query.l2Id)
  if (route.query.size) query.size = String(route.query.size)
  if (route.query.belt) query.belt = String(route.query.belt)
  if (route.query.status) query.status = String(route.query.status)
  if (route.query.productId) query.productId = String(route.query.productId)
  if (route.query.productName) query.productName = String(route.query.productName)
  load()
})
</script>
<style scoped>
.muted-label { font-size: 12px; color: var(--text-3); }
.date-range-filter { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.note-list { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.note-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}
.note-row :deep(.el-date-editor) { flex: none; width: 148px !important; }
.note-row :deep(.el-input) { flex: 1 1 auto; min-width: 0; }
.note-read-list p { margin: 6px 0; }
.no-wrap-label :deep(.el-form-item__label) { white-space: nowrap; }
code { font-size: 12px; }
.muted { color: var(--text-3); font-size: 12px; }
.seg-upload { width: 100%; }
.seg-upload :deep(.el-upload) { width: 100%; display: block; }
.seg-upload :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  padding: 18px 16px;
  border: 1px dashed var(--primary-border);
  border-radius: 8px;
  background: var(--primary-tint);
}
.seg-upload :deep(.el-upload-dragger:hover),
.seg-upload :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.seg-upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.seg-upload-ico { font-size: 28px; color: var(--primary); }
.seg-upload-title { font-size: 13px; color: var(--text-2); line-height: 1.4; }
.seg-upload-title em { color: var(--primary); font-style: normal; font-weight: 600; }
.seg-upload-sub { font-size: 12px; color: var(--text-3); }
</style>
