<template>
  <div class="page">
    <template v-if="!detail">
      <div class="page-header is-compact">
        <div>
          <h2>一级代理商</h2>
          <p>点击行查看详情（编辑/停用/销售/退货在详情内）</p>
        </div>
        <div class="page-actions">
          <el-button type="primary" @click="openCreate">新建一级</el-button>
        </div>
      </div>
      <SearchPanel :model="query" @search="load" @reset="reset">
        <el-form-item><el-input v-model="query.name" placeholder="搜索名称/编码" clearable style="width:180px" /></el-form-item>
        <el-form-item><el-input v-model="query.region" placeholder="搜索区域" clearable style="width:160px" /></el-form-item>
        <el-form-item>
          <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
            <el-option label="启用" value="启用" /><el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
      </SearchPanel>
      <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize" @row-click="(r:any)=>openDetail(r)">
        <el-table-column prop="code" label="编码" width="110" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="contact" label="联系人" width="90" />
        <el-table-column label="主授权区域" min-width="120"><template #default="{row}">{{ join(row.mainAreas) }}</template></el-table-column>
        <el-table-column label="可销售范围" min-width="120"><template #default="{row}">{{ join(row.saleAreas) }}</template></el-table-column>
        <el-table-column label="直销范围" min-width="120"><template #default="{row}">{{ join(row.directAreas) }}</template></el-table-column>
        <el-table-column label="状态" min-width="188">
          <template #default="{row}">
            <div class="status-stack">
              <div class="status-tags">
                <span class="tag" :class="row.status==='启用'?'tag-green':'tag-gray'">{{ row.status }}</span>
                <span v-if="pendingDisable(row)" class="tag tag-orange">停用待会签</span>
              </div>
              <div class="status-metrics">
                <span :class="{ hot: row.exCount }">异常数 {{ row.exCount || 0 }}</span>
                <span :class="{ hot: row.pendingPoCount }">采购待处理 {{ row.pendingPoCount || 0 }}</span>
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
          <h2>一级代理详情</h2>
          <p>{{ detail.name }}</p>
        </div>
        <div class="page-actions">
          <el-button @click="closeDetail">返回列表</el-button>
        </div>
      </div>
      <div class="page-card">
        <div class="detail-grid">
          <div><span>编码</span>{{ detail.code }}</div>
          <div><span>联系人</span>{{ detail.contact }}</div>
          <div><span>账号登录名称</span>{{ detail.loginUsername || '—' }}</div>
          <div><span>密码</span>{{ detail.loginPassword || 'demo' }}</div>
          <div><span>主授权</span>{{ join(detail.mainAreas) }}</div>
          <div><span>可销售</span>{{ join(detail.saleAreas) }}</div>
          <div><span>直销城市</span>{{ join(detail.directAreas) }}</div>
          <div><span>状态</span><span class="tag" :class="detail.status==='启用'?'tag-green':'tag-gray'">{{ detail.status }}</span></div>
          <div><span>预警倍数</span>{{ detail.warnMultiplier || 1.5 }}</div>
          <div><span>报警粒度</span><span class="tag" :class="detail.warnMode==='soft'?'tag-gray':'tag-orange'">{{ detail.warnMode==='soft'?'软报警':'严格' }}</span></div>
          <div><span>本月采购量</span><strong class="num">{{ detail.monthPurchaseQty ?? 0 }}</strong></div>
          <div><span>本月销售量</span><strong class="num">{{ detail.monthSalesQty ?? 0 }}</strong></div>
          <div><span>当前库存总数</span><strong class="num">{{ detail.stockQty ?? 0 }}</strong></div>
        </div>
        <h4 style="margin-top:16px">企业信息</h4>
        <div class="detail-grid">
          <div><span>公司</span>{{ detail.ent?.company || '—' }}</div>
          <div><span>信用代码</span>{{ detail.ent?.creditCode || '—' }}</div>
          <div><span>法人</span>{{ detail.ent?.legal || '—' }}</div>
          <div><span>电话</span>{{ detail.ent?.phone || detail.phone || '—' }}</div>
          <div class="span-2"><span>地址</span>{{ detail.ent?.addr || '—' }}</div>
        </div>
      </div>
      <div class="page-card">
        <div class="page-actions">
          <el-button @click="openEdit(detail)">编辑</el-button>
          <el-button type="primary" @click="$router.push(l1Purchase(detail.id))">采购</el-button>
          <el-button type="primary" @click="$router.push(l1Sales(detail.id))">销售</el-button>
          <el-button type="primary" @click="$router.push(l1Return(detail.id))">退货</el-button>
          <el-button type="primary" @click="$router.push(l1Stock(detail.id))">库存</el-button>
          <el-button :type="detail.exCount ? 'danger' : 'default'" @click="$router.push(l1Exception(detail.id, { hist: true }))">异常{{ detail.exCount ? ' ' + detail.exCount : '' }}</el-button>
          <el-button @click="$router.push(l1Purchase(detail.id, { tab: 'pending', hist: true }))">采购待处理{{ detail.pendingPoCount ? ' ' + detail.pendingPoCount : '' }}</el-button>
          <el-button @click="$router.push(l1Return(detail.id, { kind: 'l1_to_factory', status: 'pending', hist: true }))">售后待处理{{ detail.pendingReturnCount ? ' ' + detail.pendingReturnCount : '' }}</el-button>
          <el-button v-if="detail.status!=='停用'" type="danger" plain @click="disable">{{ pendingDisable(detail) ? '确认停用会签' : '停用会签' }}</el-button>
          <el-button v-else type="primary" @click="enable">启用</el-button>
        </div>
      </div>
    </template>

    <el-dialog
      v-model="dlg"
      class="kit-form-dlg"
      overlay-class="kit-form-overlay"
      :title="form.id ? '编辑一级代理' : '新建一级代理'"
      width="1040px"
      destroy-on-close
    >
      <div class="form-sec">
        <div class="form-sec-title">基本信息</div>
        <div class="form-grid form-grid-3">
          <div class="form-item">
            <label class="form-label">名称</label>
            <el-input v-model="form.name" />
          </div>
          <div class="form-item">
            <label class="form-label">联系人</label>
            <el-input v-model="form.contact" />
          </div>
          <div class="form-item">
            <label class="form-label">登录用户名</label>
            <el-input v-model="form.loginUsername" placeholder="如 agent_xx" />
          </div>
          <div class="form-item">
            <label class="form-label">登录密码</label>
            <el-input v-model="form.loginPassword" placeholder="明文保存，用于演示登录" />
          </div>
          <div class="form-item">
            <label class="form-label">预警倍数</label>
            <el-input-number v-model="form.warnMultiplier" :min="1" :max="9" :step="0.1" controls-position="right" />
          </div>
          <div class="form-item">
            <label class="form-label">报警粒度</label>
            <el-select v-model="form.warnMode" style="width:100%">
              <el-option label="严格（强制处理）" value="strict" />
              <el-option label="软报警（仅记录）" value="soft" />
            </el-select>
          </div>
          <div class="form-item">
            <label class="form-label">企业名称</label>
            <el-input v-model="form.ent.company" />
          </div>
          <div class="form-item">
            <label class="form-label">信用代码</label>
            <el-input v-model="form.ent.creditCode" />
          </div>
          <div class="form-item">
            <label class="form-label">法人</label>
            <el-input v-model="form.ent.legal" />
          </div>
          <div class="form-item">
            <label class="form-label">电话</label>
            <el-input v-model="form.ent.phone" />
          </div>
          <div class="form-item span-2">
            <label class="form-label">地址</label>
            <el-input v-model="form.ent.addr" />
          </div>
        </div>
      </div>
      <div class="form-sec">
        <div class="form-sec-title">授权范围</div>
        <ChipSelect v-model="form.mainAreas" :items="PROVINCES" :occupied="occupiedMain" label="主授权区域（多选）" all-label="全选全国" />
        <ChipSelect v-model="form.saleAreas" :items="PROVINCES" label="可销售范围" all-label="全选" />
        <CitySearchPicker
          v-model="form.directAreas"
          :options="directCityOpts"
          label="直销范围（城市）"
          all-label="全选当前可售城市"
          empty-text="请先选择可销售范围，再搜索/全选直销城市"
        />
      </div>
      <template #footer>
        <el-button @click="dlg=false">取消</el-button>
        <el-button type="primary" @click="save">{{ form.id ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import ChipSelect from '@/components/common/ChipSelect.vue'
import CitySearchPicker from '@/components/common/CitySearchPicker.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { PROVINCES, citiesOf } from '@/utils/regions'
import { l1Exception, l1Purchase, l1Return, l1Sales, l1Stock } from '@/utils/detailJump'

const route = useRoute()
const router = useRouter()
const { page, pageSize, total, loading, list, query, resetPage } = usePager()
const dlg = ref(false)
const form = ref<any>({ ent: {} })
const detail = ref<any>(null)
const allL1s = ref<any[]>([])
const directCityOpts = computed(() => citiesOf(form.value.saleAreas || form.value.mainAreas || []))
const occupiedMain = computed(() => {
  const set = new Set<string>()
  allL1s.value.filter((a) => a.id !== form.value.id && a.status === '启用').forEach((a) => {
    (a.mainAreas || []).forEach((r: string) => set.add(r))
  })
  return [...set]
})

function join(arr?: string[]) { return (arr || []).join('、') || '—' }
function customMult(row: any) {
  const n = Number(row.warnMultiplier)
  if (!n || n === 1.5) return ''
  return `${n}×`
}
function pendingDisable(row: any) {
  const c = row.disableCosign || {}
  return row.status !== '停用' && (c.admin1 || c.admin2) && !(c.admin1 && c.admin2)
}

async function load() {
  loading.value = true
  try {
    const res = await api.agentsL1({ page: page.value, pageSize: pageSize.value, ...query })
    list.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}
function reset() { query.name = ''; query.status = ''; query.region = ''; resetPage(); load() }
async function openDetail(row: any) {
  await router.push({ path: '/agent/l1', query: { id: row.id } })
}
function closeDetail() {
  router.push('/agent/l1')
}
function openCreate() {
  form.value = { status: '启用', warnMode: 'strict', warnMultiplier: 1.5, mainAreas: [], saleAreas: [], directAreas: [], ent: {}, loginUsername: '', loginPassword: 'demo' }
  dlg.value = true
}
function openEdit(row: any) {
  form.value = {
    ...row,
    mainAreas: [...(row.mainAreas||[])],
    saleAreas: [...(row.saleAreas||[])],
    directAreas: [...(row.directAreas||[])],
    ent: { ...(row.ent || {}) },
    loginUsername: row.loginUsername || '',
    loginPassword: row.loginPassword || 'demo',
  }
  dlg.value = true
}
async function save() {
  const saved: any = await api.saveL1(form.value)
  dlg.value = false
  allL1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  if (detail.value) detail.value = await api.agentL1(saved.id || detail.value.id)
  load()
}
async function disable() {
  const row = await api.disableL1(detail.value.id) as any
  detail.value = row
  ElMessage.success(row.status === '停用' ? '双人会签完成，已停用' : '已签字，等待另一管理员')
  load()
}
async function enable() {
  await api.setL1Status(detail.value.id, '启用')
  ElMessage.success('已启用')
  detail.value = await api.agentL1(detail.value.id)
  load()
}
watch([page, pageSize], load)
watch(() => form.value.saleAreas, () => {
  const allow = new Set(directCityOpts.value)
  form.value.directAreas = (form.value.directAreas || []).filter((c: string) => allow.has(c))
})
watch(() => route.query.id, async (id) => {
  if (id) detail.value = await api.agentL1(String(id))
  else detail.value = null
}, { immediate: true })
onMounted(async () => {
  allL1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  load()
})
</script>
