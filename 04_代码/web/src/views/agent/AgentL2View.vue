<template>
  <div class="page">
    <template v-if="!detail">
      <div class="page-header is-compact">
        <div>
          <h2>二级代理商</h2>
          <p>点击行进入详情（含解绑/改绑/围栏）；报警倍数与粒度在详情/编辑中单独设置，不继承一级</p>
        </div>
      </div>
      <SearchPanel :model="query" @search="load" @reset="reset">
        <el-form-item><el-input v-model="query.name" placeholder="搜索" clearable style="width:160px" /></el-form-item>
        <el-form-item>
          <el-select v-model="query.parentId" placeholder="所属一级" clearable filterable style="width:180px">
            <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item><el-input v-model="query.region" placeholder="所属地域/城市" clearable style="width:160px" /></el-form-item>
        <el-form-item>
          <el-select v-model="query.type" placeholder="类型" clearable style="width:110px">
            <el-option label="法人" value="法人" /><el-option label="个人" value="个人" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.status" placeholder="状态" clearable style="width:110px">
            <el-option label="启用" value="启用" /><el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
      </SearchPanel>
      <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="(r:any)=>openDetail(r)" @selection-change="onSel">
        <template #toolbar>
          <el-button type="warning" plain :disabled="!selected.length" @click="muteSelected">异常不报警（{{ selected.length }}）</el-button>
        </template>
        <el-table-column type="selection" width="42" />
        <el-table-column prop="code" label="编码" width="110" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="类型" width="80">
          <template #default="{row}"><span class="tag" :class="row.type==='法人'?'tag-blue':'tag-gray'">{{ row.type }}</span></template>
        </el-table-column>
        <el-table-column label="所属一级" min-width="120">
          <template #default="{row}">{{ row.parentName || nameOf(row.parentId) }}</template>
        </el-table-column>
        <el-table-column label="授权城市" min-width="140"><template #default="{row}">{{ (row.areas||[]).join('、') || '—' }}</template></el-table-column>
        <el-table-column label="状态" width="150">
          <template #default="{row}">
            <div class="status-stack">
              <div class="status-tags">
                <span class="tag" :class="row.status==='启用'?'tag-green':'tag-gray'">{{ row.status }}</span>
              </div>
              <div class="status-metrics">
                <span :class="{ hot: row.exCount }">异常数 {{ row.exCount || 0 }}</span>
                <span :class="{ hot: row.pendingPoCount }">采购待审核 {{ row.pendingPoCount || 0 }}</span>
                <span :class="{ hot: row.pendingReturnCount }">售后待处理 {{ row.pendingReturnCount || 0 }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="本月采购量" width="100" align="right"><template #default="{row}">{{ row.monthPurchaseQty ?? 0 }}</template></el-table-column>
        <el-table-column label="本月销售量" width="100" align="right"><template #default="{row}">{{ row.monthSalesQty ?? 0 }}</template></el-table-column>
        <el-table-column label="当前库存总数" width="110" align="right"><template #default="{row}">{{ row.stockQty ?? 0 }}</template></el-table-column>
        <el-table-column label="自定义倍数" width="100">
          <template #default="{row}">
            <span v-if="customMult(row)" class="tag tag-orange">{{ customMult(row) }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </DataTableShell>
    </template>

    <template v-else>
      <div class="page-header is-compact">
        <div>
          <h2>二级代理详情</h2>
          <p>{{ detail.name }}</p>
        </div>
        <div class="page-actions"><el-button @click="closeDetail">返回列表</el-button></div>
      </div>
      <div class="page-card">
        <div class="detail-grid">
          <div><span>编码</span>{{ detail.code }}</div>
          <div><span>类型</span>{{ detail.type }}</div>
          <div><span>账号登录名称</span>{{ detail.loginUsername || '—' }}</div>
          <div><span>密码</span>{{ detail.loginPassword || 'demo' }}</div>
          <div><span>所属一级</span>{{ detail.parentName || nameOf(detail.parentId) }}</div>
          <div class="span-2"><span>城市</span>{{ (detail.areas||[]).join('、') || '—' }}</div>
          <div><span>状态</span>
            <span class="tag" :class="detail.status==='启用'?'tag-green':'tag-gray'">{{ detail.status }}</span>
            <span v-if="pendingDisable(detail)" class="tag tag-orange">停用待会签</span>
          </div>
          <div><span>预警倍数</span>{{ detail.warnMultiplier || 1.5 }}</div>
          <div><span>报警粒度</span>{{ detail.warnMode === 'soft' ? '软报警' : detail.warnMode === 'off' || detail.extra?.exNoAlarm ? '不报警' : '严格' }}</div>
          <div><span>本月采购量</span><strong class="num">{{ detail.monthPurchaseQty ?? 0 }}</strong></div>
          <div><span>本月销售量</span><strong class="num">{{ detail.monthSalesQty ?? 0 }}</strong></div>
          <div><span>当前库存总数</span><strong class="num">{{ detail.stockQty ?? 0 }}</strong></div>
        </div>
        <template v-if="detail.type === '法人'">
          <h4 style="margin-top:16px">企业信息</h4>
          <div class="detail-grid">
            <div class="span-2"><span>企业名称</span>{{ detail.ent?.company || '—' }}</div>
            <div><span>信用代码</span>{{ detail.ent?.creditCode || '—' }}</div>
            <div><span>法人</span>{{ detail.ent?.legal || '—' }}</div>
            <div><span>电话</span>{{ detail.ent?.phone || '—' }}</div>
            <div class="span-2"><span>地址</span>{{ detail.ent?.addr || '—' }}</div>
            <div class="span-2"><span>合作协议</span><a v-if="detail.extra?.protocolUrl" :href="detail.extra.protocolUrl" target="_blank">查看文件</a><template v-else>—</template></div>
          </div>
        </template>
      </div>
      <div class="page-card">
        <div class="page-actions">
          <el-button @click="openEdit(detail)">编辑</el-button>
          <el-button type="primary" @click="$router.push(l2Purchase(detail.id, detail.parentId))">采购</el-button>
          <el-button type="primary" @click="$router.push(l2Sales(detail.id, detail.parentId))">销售</el-button>
          <el-button type="primary" @click="$router.push(l2Return(detail.id, detail.parentId))">退货</el-button>
          <el-button type="primary" @click="$router.push(l2Stock(detail.id))">库存</el-button>
          <el-button :type="detail.exCount ? 'danger' : 'default'" @click="$router.push(l2Exception(detail.id, detail.parentId, { hist: true }))">异常{{ detail.exCount ? ' ' + detail.exCount : '' }}</el-button>
          <el-button v-if="canDisable && detail.status!=='停用'" type="danger" plain @click="disable">{{ pendingDisable(detail) ? '确认停用会签' : '停用' }}</el-button>
          <el-button v-else-if="canDisable && detail.status==='停用'" type="primary" @click="setStatus('启用')">启用</el-button>
        </div>
      </div>
    </template>

    <el-dialog v-model="dlg" class="kit-form-dlg" title="编辑二级代理" width="1040px" destroy-on-close>
      <div class="form-sec">
        <div class="form-sec-title">基本信息</div>
        <div class="form-grid form-grid-3">
          <div class="form-item"><label class="form-label">名称</label><el-input v-model="form.name" /></div>
          <div class="form-item"><label class="form-label">类型</label><el-input :model-value="form.type" readonly /></div>
          <div class="form-item">
            <label class="form-label">所属一级（更改绑定）</label>
            <el-select v-model="form.parentId" filterable style="width:100%">
              <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
            </el-select>
          </div>
          <div class="form-item"><label class="form-label">登录用户名</label><el-input v-model="form.loginUsername" /></div>
          <div class="form-item"><label class="form-label">登录密码</label><el-input v-model="form.loginPassword" type="password" show-password placeholder="至少 6 位" /></div>
          <div class="form-item"><label class="form-label">预警倍数</label><el-input-number v-model="form.warnMultiplier" :min="1" :max="9" :step="0.1" controls-position="right" /></div>
          <div class="form-item">
            <label class="form-label">报警粒度</label>
            <el-select v-model="form.warnMode" style="width:100%">
              <el-option label="严格（强制处理）" value="strict" />
              <el-option label="软报警（仅记录）" value="soft" />
              <el-option label="异常不报警" value="off" />
            </el-select>
          </div>
        </div>
      </div>
      <div v-if="form.type==='法人'" class="form-sec">
        <div class="form-sec-title">企业信息</div>
        <div class="form-grid form-grid-3">
          <div class="form-item"><label class="form-label">企业名称</label><el-input v-model="form.ent.company" /></div>
          <div class="form-item"><label class="form-label">信用代码</label><el-input v-model="form.ent.creditCode" /></div>
          <div class="form-item"><label class="form-label">法人</label><el-input v-model="form.ent.legal" /></div>
          <div class="form-item"><label class="form-label">电话</label><el-input v-model="form.ent.phone" /></div>
          <div class="form-item span-2"><label class="form-label">地址</label><el-input v-model="form.ent.addr" /></div>
        </div>
      </div>
      <div class="form-sec">
        <div class="form-sec-title">授权范围</div>
        <CitySearchPicker
          v-model="form.areas"
          :options="cityOpts"
          label="围栏城市"
          all-label="全选当前一级可售城市"
          empty-text="该一级暂无可售城市，请先在一级详情维护可销售范围"
        />
      </div>
      <template #footer>
        <el-button @click="dlg=false">取消</el-button>
        <el-button v-if="form.type==='法人' && form.parentId" type="danger" plain @click="unbind">解绑法人</el-button>
        <el-button type="primary" @click="save">保存</el-button>
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
import CitySearchPicker from '@/components/common/CitySearchPicker.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { citiesOf } from '@/utils/regions'
import { l2Exception, l2Purchase, l2Return, l2Sales, l2Stock } from '@/utils/detailJump'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canDisable = computed(() => auth.hasPerm('all'))
const route = useRoute()
const router = useRouter()

const { page, pageSize, total, loading, list, query, resetPage } = usePager()
query.auditStatus = 'approved'
const dlg = ref(false)
const form = ref<any>({})
const detail = ref<any>(null)
const selected = ref<any[]>([])
const l1s = ref<any[]>([])
const cityOpts = computed(() => {
  const l1 = l1s.value.find((a) => a.id === form.value.parentId)
  return citiesOf(l1?.saleAreas || l1?.mainAreas || [])
})

function nameOf(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '—' }
function customMult(row: any) {
  const n = Number(row.warnMultiplier)
  if (!n || n === 1.5) return ''
  return `${n}×`
}

function pendingDisable(row: any) {
  const c = row.disableCosign || {}
  return row.status !== '停用' && (c.admin1 || c.admin2) && !(c.admin1 && c.admin2)
}
function onSel(rows: unknown[]) {
  selected.value = (rows || []) as any[]
}
async function muteSelected() {
  const ids = selected.value.map((r) => r.id).filter(Boolean)
  if (!ids.length) return
  await ElMessageBox.confirm(`将 ${ids.length} 个二级设为异常不报警？库存预警不再推待处理。`, '异常不报警', { type: 'warning' })
  await api.muteL2Alarm(ids, true)
  ElMessage.success('已设置异常不报警')
  selected.value = []
  load()
}
async function load() {
  loading.value = true
  try {
    const res = await api.agentsL2({ page: page.value, pageSize: pageSize.value, pending: false, ...query })
    list.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}
function reset() {
  query.name = ''; query.auditStatus = 'approved'; query.parentId = ''; query.region = ''; query.type = ''; query.status = ''
  resetPage(); load()
}
async function openDetail(row: any) {
  await router.push({ path: '/agent/l2', query: { id: row.id } })
}
function closeDetail() {
  router.push('/agent/l2')
}
function openCreate() {
  form.value = { type: '法人', status: '启用', warnMode: 'strict', warnMultiplier: 1.5, areas: [], ent: {}, loginUsername: '', loginPassword: 'demo' }
  dlg.value = true
}
function openEdit(row: any) {
  form.value = {
    ...row,
    areas: [...(row.areas || [])],
    ent: { ...(row.ent || {}) },
    loginUsername: row.loginUsername || '',
    loginPassword: row.loginPassword || 'demo',
  }
  dlg.value = true
}
async function save() {
  if (form.value.loginPassword && form.value.loginPassword !== detail.value?.loginPassword && form.value.loginPassword.length < 6) {
    ElMessage.error('登录密码至少 6 位')
    return
  }
  const saved: any = await api.saveL2({ ...form.value })
  ElMessage.success('已保存'); dlg.value = false
  if (detail.value) detail.value = await api.agentL2(saved.id || detail.value.id)
  load()
}
async function unbind() {
  await ElMessageBox.confirm('确认解绑该法人二级？将进入待分配池。', '解绑确认', { type: 'warning' })
  const row: any = await api.unbindL2(form.value.id)
  ElMessage.success('已解绑，进入待分配')
  dlg.value = false
  detail.value = row
  load()
}
async function disable() {
  const row: any = await api.disableL2(detail.value.id)
  detail.value = row
  ElMessage.success(row.status === '停用' ? '双人会签完成，已停用' : '已签字，等待另一管理员')
  load()
}
async function setStatus(status: string) {
  await api.setL2Status(detail.value.id, status)
  ElMessage.success(status)
  detail.value = await api.agentL2(detail.value.id)
  load()
}
watch([page, pageSize], load)
watch(() => form.value.parentId, () => {
  const allow = new Set(cityOpts.value)
  form.value.areas = (form.value.areas || []).filter((c: string) => allow.has(c))
})
watch(() => route.query.id, async (id) => {
  if (id) detail.value = await api.agentL2(String(id))
  else detail.value = null
}, { immediate: true })
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  load()
})
</script>
