<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>二级审核</h2>
        <p>点击行进入详情，审核操作在详情内</p>
      </div>
    </div>
    <PageTabs v-model="tab" :items="tabItems" />
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item><el-input v-model="query.l1" placeholder="搜索一级代理名称" clearable style="width:200px" /></el-form-item>
      <el-form-item>
        <el-select v-model="query.type" placeholder="类型" clearable style="width:110px">
          <el-option label="法人" value="法人" /><el-option label="个人" value="个人" />
        </el-select>
      </el-form-item>
    </SearchPanel>
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="open">
      <el-table-column prop="code" label="编码" width="120" />
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column prop="type" label="类型" width="80" />
      <el-table-column label="申请一级" min-width="140">
        <template #default="{row}">{{ row.parentName || nameOf(row.parentId) }}</template>
      </el-table-column>
      <el-table-column label="城市" min-width="160"><template #default="{row}">{{ (row.areas||[]).join('、') }}</template></el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{row}">
          <span class="tag" :class="row.auditStatus==='pending'?'tag-orange':row.auditStatus==='rejected'?'tag-red':'tag-green'">
            {{ row.auditStatus==='pending'?'待审核':row.auditStatus==='rejected'?'已驳回':'已通过' }}
          </span>
        </template>
      </el-table-column>
    </DataTableShell>
    <el-dialog v-model="dlg" class="issue-wide-dialog" :title="cur ? `二级审核详情 · ${cur.name}` : '二级审核详情'" width="900px">
      <div v-if="cur" class="detail-grid" style="grid-template-columns:1fr 1fr">
        <div><span>编码</span>{{ cur.code }}</div>
        <div><span>类型</span>{{ cur.type }}</div>
        <div><span>申请一级</span>{{ cur.parentName || nameOf(cur.parentId) }}</div>
        <div class="span-2"><span>城市</span>{{ (cur.areas||[]).join('、') }}</div>
        <div><span>登录账号</span>{{ cur.loginUsername || '—' }}</div>
        <div><span>状态</span>
          <span class="tag" :class="cur.auditStatus==='pending'?'tag-orange':cur.auditStatus==='rejected'?'tag-red':'tag-green'">
            {{ cur.auditStatus==='pending'?'待审核':cur.auditStatus==='rejected'?'已驳回':'已通过' }}
          </span>
        </div>
      </div>
      <template v-if="cur?.type === '法人'">
        <h4 style="margin-top:12px">企业信息</h4>
        <div class="detail-grid" style="grid-template-columns:1fr 1fr">
          <div class="span-2"><span>企业名称</span>{{ cur.ent?.company || '—' }}</div>
          <div><span>信用代码</span>{{ cur.ent?.creditCode || '—' }}</div>
          <div><span>法人</span>{{ cur.ent?.legal || '—' }}</div>
          <div><span>电话</span>{{ cur.ent?.phone || '—' }}</div>
          <div class="span-2"><span>地址</span>{{ cur.ent?.addr || '—' }}</div>
          <div class="span-2"><span>合作协议</span><a v-if="cur.extra?.protocolUrl" :href="cur.extra.protocolUrl" target="_blank">查看文件</a><template v-else>—</template></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="dlg=false">关闭</el-button>
        <template v-if="cur?.auditStatus==='pending'">
          <el-button type="primary" @click="audit(true)">通过</el-button>
          <el-button type="danger" @click="audit(false)">驳回</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import DataTableShell from '@/components/common/DataTableShell.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import PageTabs from '@/components/common/PageTabs.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'

const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const tab = ref('pending')
const counts = ref({ pending: 0, approved: 0, rejected: 0 })
const l1s = ref<any[]>([])
const dlg = ref(false)
const cur = ref<any>(null)
const tabItems = computed(() => [
  { id: 'pending', title: '待审核', badge: counts.value.pending || undefined },
  { id: 'approved', title: '已通过' },
  { id: 'rejected', title: '已驳回' },
  { id: 'all', title: '全部' },
])
function nameOf(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '—' }

async function loadCounts() {
  const [p, a, r] = await Promise.all([
    api.agentsL2({ page: 1, pageSize: 1, auditStatus: 'pending' }),
    api.agentsL2({ page: 1, pageSize: 1, auditStatus: 'approved', pending: false }),
    api.agentsL2({ page: 1, pageSize: 1, auditStatus: 'rejected' }),
  ])
  counts.value = { pending: p.total, approved: a.total, rejected: r.total }
}
function l1IdsMatching(q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return [] as string[]
  return l1s.value.filter((a) => String(a.name || '').toLowerCase().includes(s)).map((a) => a.id)
}

async function load() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value, type: query.type }
    if (tab.value !== 'all') params.auditStatus = tab.value
    if (tab.value === 'approved') params.pending = false
    const l1q = String(query.l1 || '')
    if (l1q.trim()) {
      const ids = l1IdsMatching(l1q)
      if (!ids.length) {
        list.value = []
        total.value = 0
        await loadCounts()
        return
      }
      params.page = 1
      params.pageSize = 200
      const res = await api.agentsL2(params)
      const idSet = new Set(ids)
      const filtered = (res.list || []).filter((row: any) => idSet.has(row.parentId) || idSet.has(row.prevParentId))
      list.value = filtered
      total.value = filtered.length
      await loadCounts()
      return
    }
    const res = await api.agentsL2(params)
    list.value = res.list
    total.value = res.total
    await loadCounts()
  } finally { loading.value = false }
}
function reset() { query.l1 = ''; query.type = ''; resetPage(); load() }
function open(row: any) {
  cur.value = row
  dlg.value = true
  api.agentL2(row.id).then((d) => { cur.value = d }).catch(() => {})
}
async function audit(pass: boolean) {
  const name = cur.value?.name || ''
  try {
    if (pass) {
      await ElMessageBox.confirm(`确认通过二级代理「${name}」的审核？`, '二级审核通过', { confirmButtonText: '确认通过', type: 'success' })
    } else {
      await ElMessageBox.confirm(`确认驳回二级代理「${name}」？`, '二级审核驳回', { confirmButtonText: '确认驳回', type: 'warning' })
    }
  } catch {
    return
  }
  await api.auditL2(cur.value.id, pass)
  dlg.value = false
  await load()
  window.dispatchEvent(new Event('ruilai:badges-changed'))
}
watch([page, pageSize], load)
watch(tab, () => { resetPage(); load() })
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  load()
})
</script>
