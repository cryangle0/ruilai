<template>
  <view class="rl-page" :class="{ 'has-foot': hasFooter }">
    <NavBar :title="navTitle" show-back />
    <view class="pad">
      <PagedState :loading="loading" :error="error" :empty="!Object.keys(data).length" empty-text="未找到详情" @retry="load">
        <template v-if="kind==='purchase'">
          <DetailSection :title="data.no || '采购单'">
            <DetailKv :items="purchaseKv">
              <template #value-status>
                <StatusTag :value="data.status" :map="PO_STATUS" />
              </template>
            </DetailKv>
          </DetailSection>
          <DetailSection title="标准品">
            <DetailTable :columns="purchaseLineCols" :rows="purchaseStandardRows" min-width="720rpx" empty-text="无标准行" />
          </DetailSection>
          <DetailSection title="非标品">
            <DetailTable :columns="purchaseLineCols" :rows="purchaseCustomRows" min-width="720rpx" empty-text="暂无非标" />
          </DetailSection>
          <DetailSection title="配件">
            <DetailTable :columns="purchasePartCols" :rows="purchaseParts" empty-text="无配件" />
          </DetailSection>
        </template>

        <template v-else-if="kind==='sales'">
          <DetailSection :title="data.no || '销售单'">
            <DetailKv :items="salesKv">
              <template #value-channel>
                <StatusTag :value="data.channel === 'direct' ? '直售' : '分销'" :tone="data.channel === 'direct' ? 'warning' : 'info'" />
              </template>
              <template #value-status>
                <StatusTag :value="data.status" :map="SO_STATUS" />
              </template>
            </DetailKv>
          </DetailSection>
          <DetailSection title="标准品">
            <DetailTable :columns="saleProductCols" :rows="saleSections.standard" empty-text="无标准品" />
          </DetailSection>
          <DetailSection title="非标品">
            <DetailTable :columns="saleProductCols" :rows="saleSections.nonstandard" empty-text="无非标品" />
          </DetailSection>
          <DetailSection title="单品">
            <DetailTable :columns="saleProductCols" :rows="saleSections.single" empty-text="无单品" />
          </DetailSection>
          <DetailSection title="SN码" :count="saleSnRows.length">
            <DetailTable :columns="snCols" :rows="saleSnRows" min-width="680rpx" empty-text="暂无已扫 SN" />
          </DetailSection>
          <view v-if="data.status==='scanning' && user.role!=='SUB'" class="ok" @click="goScan">继续扫码</view>
        </template>

        <template v-else-if="kind==='cend'">
          <DetailSection :title="data.no || 'C端订单'">
            <DetailKv :items="cendKv">
              <template #value-status>
                <StatusTag :value="cendStatus" tone="success" />
              </template>
            </DetailKv>
          </DetailSection>
          <DetailSection title="商品明细">
            <DetailTable :columns="cendProductCols" :rows="cendProductRows" empty-text="无商品明细" />
          </DetailSection>
          <DetailSection title="SN码" :count="saleSnRows.length">
            <DetailTable :columns="snCols" :rows="saleSnRows" min-width="680rpx" empty-text="暂无 SN" />
          </DetailSection>
        </template>

        <template v-else-if="kind==='sn'">
          <DetailSection :title="data.sn || id">
            <DetailKv :items="snKv">
              <template #value-status>
                <view class="sn-status">
                  <StatusTag :value="data.status" :map="SN_STATUS" />
                  <text class="hint">仅四种：一级在库 / 二级在库 / 已销售 / 原厂在库</text>
                </view>
              </template>
            </DetailKv>
          </DetailSection>
          <DetailSection v-if="snCustomerItems.length" :title="data.prevUserJson && !data.userJson ? '历史客户' : '客户信息'">
            <DetailKv :items="snCustomerItems" />
          </DetailSection>
          <DetailSection title="情况说明">
            <view v-if="sitNotes.length" class="note-list">
              <text v-for="(n, i) in sitNotes" :key="'s'+i" class="note-line"><text class="note-date">{{ n.date || '未填日期' }}</text>{{ n.text }}</text>
            </view>
            <text v-else class="hint">暂无情况说明</text>
          </DetailSection>
          <DetailSection title="处理说明">
            <view v-if="procNotes.length" class="note-list">
              <text v-for="(n, i) in procNotes" :key="'p'+i" class="note-line"><text class="note-date">{{ n.date || '未填日期' }}</text>{{ n.text }}</text>
            </view>
            <text v-else class="hint">暂无处理说明</text>
          </DetailSection>
          <DetailSection title="完整流转" :count="events.length">
            <view v-if="events.length" class="timeline">
              <view v-for="(e, i) in events" :key="i" class="ev" :class="timelineTone(e)">
                <view class="eh-row">
                  <text v-if="timelineTone(e)==='danger'" class="ex-badge">异常</text>
                  <text class="eh">{{ e.title }}</text>
                </view>
                <text class="ed">{{ e.desc }}</text>
                <text class="et">{{ formatDateTime(e.time) }}</text>
              </view>
            </view>
            <text v-else class="hint">暂无事件</text>
          </DetailSection>
        </template>

        <template v-else-if="kind==='stock'">
          <DetailSection title="商品信息">
            <DetailKv :items="stockKv">
              <template #value-level>
                <StatusTag :value="stockLevel" dot />
              </template>
            </DetailKv>
          </DetailSection>
          <DetailSection title="流水" :count="stockLogRows.length">
            <DetailTable :columns="stockLogCols" :rows="stockLogRows" min-width="760rpx" empty-text="暂无流水" />
          </DetailSection>
          <DetailSection title="SN码" :count="stockSnRows.length">
            <text class="hint">点击SN查看详情</text>
            <DetailTable
              :columns="stockSnCols"
              :rows="stockSnRows"
              min-width="780rpx"
              empty-text="暂无 SN"
              clickable
              @row-click="onStockSnClick"
            >
              <template #cell-status="{ row }">
                <StatusTag :value="String(row.statusKey || '')" :map="SN_STATUS" dot />
              </template>
            </DetailTable>
          </DetailSection>
          <view class="detail-footer">
            <view class="footer-btn ghost" @click="closePage">关闭</view>
            <view class="footer-btn primary" @click="viewStockSns">查看在库SN</view>
          </view>
        </template>

        <template v-else-if="kind==='return'">
          <DetailSection title="基本信息">
            <DetailKv :items="returnKv">
              <template #value-type>
                <StatusTag :value="returnTypeText" tone="info" dot />
              </template>
              <template #value-reason>
                <text class="reason-text">{{ data.reasonType || '其他' }}</text>
              </template>
              <template #value-status>
                <StatusTag :value="data.status" :map="RT_STATUS" dot />
              </template>
            </DetailKv>
          </DetailSection>
          <DetailSection title="处理说明">
            <text class="plain">{{ returnProcessNote }}</text>
          </DetailSection>
          <DetailSection title="情况说明">
            <DetailTable :columns="returnSitCols" :rows="returnSitRows" empty-text="暂无情况说明" />
          </DetailSection>
          <DetailSection title="凭证图片">
            <view v-if="(data.photos||[]).length" class="photo-grid">
              <image v-for="photo in data.photos" :key="photo" :src="photo" class="proof-photo" mode="aspectFill" />
            </view>
            <view v-else class="upload-box">未上传</view>
          </DetailSection>
          <DetailSection title="客户信息">
            <DetailKv :items="returnCustomerKv" />
          </DetailSection>
          <DetailSection title="商品明细" :count="returnGoodsRows.length">
            <DetailTable :columns="returnGoodsCols" :rows="returnGoodsRows" empty-text="无商品明细" />
          </DetailSection>
          <DetailSection title="SN码" :count="returnSnRows.length">
            <DetailTable :columns="returnSnCols" :rows="returnSnRows" min-width="720rpx" empty-text="暂无 SN" />
          </DetailSection>
          <view class="detail-footer">
            <view class="footer-btn ghost" @click="closePage">关闭</view>
          </view>
        </template>

        <template v-else-if="kind==='exception'">
          <DetailSection :title="data.type || '异常详情'">
            <DetailKv :items="exceptionKv">
              <template #value-dim>
                <StatusTag :value="exceptionDim" tone="muted" />
              </template>
              <template #value-status>
                <StatusTag :value="data.status" dot />
              </template>
            </DetailKv>
          </DetailSection>
          <DetailSection title="销售客户信息">
            <DetailKv :items="exceptionCustomerKv" />
          </DetailSection>
          <DetailSection v-if="exceptionRelated.length" title="重复客户关联 SN" :count="exceptionRelated.length">
            <DetailTable
              :columns="exceptionRelatedCols"
              :rows="exceptionRelated"
              min-width="720rpx"
              clickable
              @row-click="onRelatedSnClick"
            />
          </DetailSection>
          <view v-if="exceptionCanExplain" class="explain-card">
            <view class="field">
              <input
                class="inp"
                :value="explain"
                placeholder="填写情况说明"
                placeholder-class="ph"
                confirm-type="done"
                :adjust-position="true"
                :hold-keyboard="true"
                :always-embed="true"
                :cursor-spacing="32"
                data-echo="1"
                @input="explain = eventValue($event, explain)"
              />
            </view>
            <view class="ok" @click="saveExplain">提交说明</view>
          </view>
          <view class="detail-footer">
            <view class="footer-btn ghost" @click="closePage">关闭</view>
            <view v-if="exceptionIsSn" class="footer-btn primary" @click="openSn(data.target)">看SN</view>
          </view>
        </template>
      </PagedState>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import PagedState from '@/components/PagedState.vue'
import DetailSection from '@/components/DetailSection.vue'
import DetailKv from '@/components/DetailKv.vue'
import DetailTable from '@/components/DetailTable.vue'
import StatusTag from '@/components/StatusTag.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { PO_STATUS, SO_STATUS, RT_STATUS, SN_STATUS } from '@/utils/constants'
import { formatDateTime } from '@/utils/dates'
import {
  agentDisplay,
  buildStockDetail,
  canExplainException,
  cendCustomer,
  consumeStockDraft,
  decodeQueryValue,
  peekStockDraft,
  exceptionDimLabel,
  exceptionExplainLabel,
  exceptionExplainText,
  factoryDateText,
  noteRows,
  purchaseLineRows,
  purchasePartRows,
  returnProductRows,
  returnDetailItems,
  returnTypeLabel,
  saleProductRows,
  saleProductSections,
  saveStockFilter,
  stockLevelLabel,
  stockSpecText,
  timelineTone,
  visibleSnTags,
} from '@/utils/miniPages'
import { inputEventValue } from '@/utils/inputValue'

const user = useUserStore()
const kind = ref('sales')
const id = ref('')
const data = ref<any>({})
const loading = ref(true)
const error = ref('')
const explain = ref('')
const size = ref('')
const belt = ref('')
const scope = ref('self')

const hasFooter = computed(() => ['stock', 'return', 'exception'].includes(kind.value))
const navTitle = computed(() => {
  const no = data.value.no || data.value.sn || ''
  if (kind.value === 'return' && no) return `退货单 ${no}`
  if (kind.value === 'purchase' && no) return `采购单 ${no}`
  if (kind.value === 'sales' && no) return `销售单 ${no}`
  if (kind.value === 'cend' && no) return `C端订单 ${no}`
  if (kind.value === 'sn') return no ? `SN ${no}` : 'SN 详情'
  if (kind.value === 'stock') return `库存详情 · ${data.value.productName || '商品'}`
  if (kind.value === 'exception') return data.value.type ? `异常详情 · ${data.value.type}` : '异常详情'
  return '详情'
})
const events = computed(() => (data.value.events || []) as { time: string; title: string; desc: string; type?: string }[])
function eventValue(e: unknown, fallback = '') { return inputEventValue(e, fallback) }

const purchaseLineCols = [
  { key: 'product', title: '商品', width: 160 },
  { key: 'size', title: '弹力带', width: 80, align: 'center' as const },
  { key: 'belt', title: '腰带', width: 100 },
  { key: 'qty', title: '数量', width: 70, align: 'right' as const },
  { key: 'segments', title: '号段', wrap: true, code: true },
  { key: 'segQty', title: '号段数量', width: 110, align: 'right' as const },
]
const purchasePartCols = [
  { key: 'product', title: '配件' },
  { key: 'spec', title: '规格', width: 120 },
  { key: 'qty', title: '数量', width: 80, align: 'right' as const },
]
const saleProductCols = [
  { key: 'product', title: '商品' },
  { key: 'size', title: '弹力带', width: 90, align: 'center' as const },
  { key: 'belt', title: '腰带', width: 110 },
  { key: 'plan', title: '计划', width: 80, align: 'right' as const },
  { key: 'scanned', title: '已扫', width: 80, align: 'right' as const },
]
const cendProductCols = [
  { key: 'product', title: '商品' },
  { key: 'size', title: '弹力带', width: 90, align: 'center' as const },
  { key: 'belt', title: '腰带', width: 110 },
  { key: 'plan', title: '数量', width: 80, align: 'right' as const },
]
const snCols = [
  { key: 'sn', title: 'SN', code: true, wrap: true, width: 240 },
  { key: 'size', title: '尺码', width: 80, align: 'center' as const },
  { key: 'belt', title: '腰带', width: 110 },
  { key: 'user', title: '客户', wrap: true },
]

const purchaseStandardRows = computed(() => purchaseLineRows(
  (data.value.lines || []).filter((line: any) => line.category !== 'single'),
  data.value.segments || {},
))
const purchaseCustomRows = computed(() => purchaseLineRows(data.value.customLines, data.value.segments || {}))
const purchaseParts = computed(() => purchasePartRows([
  ...(data.value.parts || []),
  ...(data.value.lines || []).filter((line: any) => line.category === 'single'),
]))
const purchaseKv = computed(() => {
  const d = data.value
  const items = [
    { key: 'l1', label: '一级', value: agentDisplay(d, 'l1') },
    { key: 'status', label: '状态', value: PO_STATUS[d.status] || d.status },
    { key: 'cosign', label: '会签', value: `${d.cosign?.admin1 ? '✓' : '-'}/${d.cosign?.admin2 ? '✓' : '-'}` },
    { key: 'time', label: '时间', value: formatDateTime(d.createdAt) },
  ]
  if (d.status === 'rejected') items.push({ key: 'reject', label: '驳回原因', value: d.rejectReason || '未填写' })
  return items
})

const salesKv = computed(() => {
  const d = data.value
  return [
    { key: 'channel', label: '渠道', value: d.channel === 'direct' ? '直售' : '分销' },
    { key: 'status', label: '状态', value: SO_STATUS[d.status] || d.status },
    { key: 'l1', label: '一级', value: agentDisplay(d, 'l1') },
    { key: 'l2', label: '二级', value: agentDisplay(d, 'l2') },
    { key: 'plan', label: '计划/已扫', value: `${(d.scanned || []).length}/${d.planTotal || 0}` },
    { key: 'time', label: '时间', value: formatDateTime(d.createdAt) },
  ]
})
const saleRows = computed(() => saleProductRows(data.value))
const saleSections = computed(() => saleProductSections(data.value))
const saleSnRows = computed(() => (data.value.snRows || []).map((row: any) => ({
  sn: row.sn,
  size: row.size || '—',
  belt: row.belt || '—',
  user: row.user || '—',
})))

const cendInfo = computed(() => cendCustomer(data.value))
const cendStatus = computed(() => {
  const d = data.value
  if (d.status === 'done' || (d.snRows || []).some((row: any) => row.status === 'bound')) return '已到货'
  return SO_STATUS[d.status] || d.status || '—'
})
const cendKv = computed(() => {
  const d = data.value
  const c = cendInfo.value
  return [
    { key: 'no', label: '订单号', value: d.no || '—' },
    { key: 'status', label: '状态', value: cendStatus.value },
    { key: 'name', label: '客户姓名', value: c.name },
    { key: 'gender', label: '性别', value: c.gender },
    { key: 'age', label: '年龄', value: c.age },
    { key: 'phone', label: '客户手机', value: c.phone },
    { key: 'region', label: '归属地', value: c.region },
    { key: 'addr', label: '地址', value: c.addr, full: true },
    { key: 'time', label: '时间', value: formatDateTime(d.createdAt) },
    { key: 'agent', label: '代理', value: agentDisplay(d, d.l2Id ? 'l2' : 'l1') },
  ]
})
const cendProductRows = computed(() => saleRows.value.map((row) => ({
  product: row.product,
  size: row.size,
  belt: row.belt,
  plan: row.plan,
})))

const snKv = computed(() => {
  const d = data.value
  const tags = visibleSnTags(d.tags)
  return [
    { key: 'sn', label: 'SN', value: d.sn || id.value, code: true },
    { key: 'status', label: '状态', value: SN_STATUS[d.status] || d.status },
    { key: 'factory', label: '出厂日期', value: factoryDateText(d.sn, d.factoryAt) },
    { key: 'product', label: '商品', value: d.productName || d.productId || '—' },
    { key: 'band', label: '弹力带', value: d.sizeCode || '—' },
    { key: 'belt', label: '腰带', value: d.belt || '—' },
    { key: 'l1', label: '一级', value: agentDisplay(d, 'l1') },
    { key: 'l2', label: '二级', value: agentDisplay(d, 'l2') },
    { key: 'tags', label: '标签', value: tags.length ? tags.join('、') : '—' },
  ]
})
const sitNotes = computed(() => noteRows(data.value.extra, 'situationNotes'))
const procNotes = computed(() => noteRows(data.value.extra, 'processNotes'))
const snCustomerItems = computed(() => {
  const d = data.value
  const cust = d.userJson || d.prevUserJson
  if (!cust) return []
  return [
    { key: 'name', label: '姓名', value: cust.name || '—' },
    { key: 'gender', label: '性别', value: cust.gender || '—' },
    { key: 'age', label: '年龄', value: cust.age || '—' },
    { key: 'phone', label: '手机', value: cust.phone || '—' },
    { key: 'region', label: '归属地', value: cust.phoneLoc || '—' },
    { key: 'addr', label: '地址', value: cust.addr || '—', full: true },
  ]
})

const stockLevel = computed(() => stockLevelLabel(data.value))
const stockKv = computed(() => {
  const d = data.value
  const tags = visibleSnTags(d.tags)
  return [
    { key: 'product', label: '商品', value: d.productName || d.productId || id.value },
    { key: 'spec', label: '规格', value: stockSpecText(d.size || size.value, d.belt || belt.value) },
    { key: 'l1', label: '一级代理名称', value: agentDisplay(d, 'l1') },
    { key: 'l2', label: '二级代理名称', value: agentDisplay(d, 'l2') },
    { key: 'qty', label: '数量', value: String(d.qty != null ? d.qty : 0), tone: 'primary' as const },
    { key: 'level', label: '层级', value: stockLevel.value },
    { key: 'tags', label: '标签', value: tags.length ? tags.join('、') : '—', full: true },
  ]
})
const stockLogCols = [
  { key: 'time', title: '时间', width: 220 },
  { key: 'agent', title: '代理', width: 160 },
  { key: 'delta', title: '变动', width: 80, align: 'right' as const },
  { key: 'reason', title: '原因', width: 160 },
  { key: 'ref', title: '单号', code: true, width: 160 },
]
const stockLogRows = computed(() => (data.value.logs || []).map((row: any) => ({
  time: formatDateTime(row.occurredAt),
  agent: row.agentName || (row.agentType === 'l2' ? row.agentId : data.value.l1Name) || row.agentId || '—',
  delta: `${Number(row.delta) > 0 ? '+' : ''}${row.delta}`,
  reason: row.reason || '—',
  ref: row.refNo || '—',
})))
const stockSnCols = [
  { key: 'sn', title: 'SN', code: true, wrap: true, width: 240 },
  { key: 'spec', title: '规格', width: 140 },
  { key: 'status', title: '状态', width: 130 },
  { key: 'tags', title: '标签', width: 120 },
  { key: 'action', title: '', width: 80, tone: 'primary' as const },
]
const stockSnRows = computed(() => (data.value.snRows || []).map((row: any) => {
  const tags = visibleSnTags(row.tags)
  return {
    sn: row.sn,
    spec: stockSpecText(row.sizeCode || row.size || size.value, row.belt || belt.value),
    status: SN_STATUS[row.status] || row.status || '—',
    statusKey: row.status || '',
    tags: tags.length ? tags.join('、') : '—',
    action: '详情',
  }
}))

const returnTypeText = computed(() => returnTypeLabel(data.value.type, data.value.typeLabel))
const returnProcessNote = computed(() => data.value.processNote
  || (data.value.status === 'rejected' ? '退货申请已驳回'
    : data.value.status === 'done' || data.value.status === 'approved' ? '退货申请已通过并完成入库'
      : '等待审核处理'))
const returnKv = computed(() => returnDetailItems(data.value, formatDateTime))
const returnSitCols = [
  { key: 'sn', title: 'SN', code: true, wrap: true },
  { key: 'situation', title: '情况说明', wrap: true },
]
const returnSitRows = computed(() => (data.value.snDetail || []).map((row: any) => ({
  sn: row.sn,
  situation: row.situation || '—',
})))
const returnCustomerKv = computed(() => {
  const c = data.value.customer || {}
  return [
    { key: 'name', label: '姓名', value: c.name || '—' },
    { key: 'phone', label: '手机号', value: c.phone || '—' },
    { key: 'region', label: '地区', value: c.phoneLoc || c.region || c.addr || c.address || '—', full: true },
  ]
})
const returnGoodsCols = [
  { key: 'product', title: '商品名称' },
  { key: 'spec', title: '规格', width: 160 },
  { key: 'qty', title: '数量', width: 80, align: 'right' as const },
]
const returnGoodsRows = computed(() => returnProductRows(data.value.snDetail))
const returnSnCols = [
  { key: 'sn', title: 'SN', code: true, wrap: true, width: 240 },
  { key: 'product', title: '商品名称', wrap: true },
  { key: 'spec', title: '规格', width: 140 },
  { key: 'status', title: '状态', width: 150, wrap: true },
]
const returnSnRows = computed(() => (data.value.snDetail || []).map((row: any) => ({
  sn: row.sn,
  product: row.productName || '—',
  spec: row.spec || stockSpecText(row.size, row.belt),
  status: SN_STATUS[row.status] || row.status || '—',
})))

const exceptionDim = computed(() => exceptionDimLabel(data.value))
const exceptionCanExplain = computed(() => canExplainException(data.value))
const exceptionIsSn = computed(() => String(data.value.target || '').startsWith('RL'))
const exceptionKv = computed(() => {
  const d = data.value
  const extra = d.extra || {}
  const items = [
    { key: 'time', label: '时间', value: formatDateTime(d.occurredAt || d.createdAt) },
    { key: 'dim', label: '维度', value: exceptionDim.value },
    { key: 'l1', label: '一级代理', value: extra.l1Name || extra.l1Id || '—' },
    { key: 'l2', label: '二级代理', value: extra.l2Name || extra.l2Id || '—' },
    { key: 'target', label: '对象', value: d.target || '—', code: true },
    { key: 'status', label: '状态', value: d.status },
    { key: 'detail', label: '详情', value: d.detail || '—', full: true },
    { key: 'explain', label: exceptionExplainLabel(d), value: exceptionExplainText(d) || '—', full: true },
  ]
  return items
})
const exceptionCustomerKv = computed(() => {
  const customer = data.value.extra?.customer || {}
  return [
    { key: 'name', label: '姓名', value: customer.name || '—' },
    { key: 'gender', label: '性别', value: customer.gender || '—' },
    { key: 'phone', label: '电话', value: customer.phone || data.value.dupPhone || '—' },
  ]
})
const exceptionRelatedCols = [
  { key: 'sn', title: 'SN', code: true, wrap: true, width: 220 },
  { key: 'name', title: '姓名', width: 100 },
  { key: 'gender', title: '性别', width: 70 },
  { key: 'phone', title: '电话', width: 160 },
  { key: 'addr', title: '地址', wrap: true },
]
const exceptionRelated = computed(() => (data.value.extra?.relatedSns || []).map((row: any) => ({
  sn: row.sn,
  name: row.name || '—',
  gender: row.gender || '—',
  phone: row.phone || '—',
  addr: row.addr || row.address || '—',
})))

onLoad(async (q) => {
  if (!user.ensureLogin()) return
  kind.value = q?.kind || 'sales'
  id.value = decodeQueryValue(q?.id)
  size.value = decodeQueryValue(q?.size)
  belt.value = decodeQueryValue(q?.belt)
  scope.value = decodeQueryValue(q?.scope) || 'self'
  if (kind.value === 'stock') {
    const draft = peekStockDraft() || {}
    if (!id.value) id.value = String(draft.productId || '')
    if (!size.value) size.value = String(draft.size || '')
    if (!belt.value) belt.value = String(draft.belt || '')
    if (!scope.value || scope.value === 'self') scope.value = String(draft.scope || scope.value || 'self')
    data.value = { ...draft }
    id.value = decodeQueryValue(id.value)
    size.value = decodeQueryValue(size.value)
    belt.value = decodeQueryValue(belt.value)
  }
  await load()
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (kind.value === 'stock') {
      const params: Record<string, unknown> = { productId: id.value, size: size.value, belt: belt.value }
      if (user.role === 'L2') params.agentType = 'l2'
      else if (scope.value === 'all') params.agentType = 'all'
      else if (scope.value === 'self') params.agentType = 'l1'
      else { params.agentType = 'l2'; params.agentId = scope.value }
      const snParams: Record<string, unknown> = {
        pageSize: 100, productId: id.value, size: size.value, belt: belt.value,
      }
      if (user.role === 'L2') snParams.status = 'l2'
      else if (scope.value === 'all') snParams.status = 'l1,l2'
      else if (scope.value === 'self') snParams.status = 'l1'
      else { snParams.status = 'l2'; snParams.l2Id = scope.value }
      const [stockRes, snRes, logRes] = await Promise.all([
        miniApi.stock(params),
        miniApi.sns(snParams),
        miniApi.stockLogs(params),
      ])
      data.value = buildStockDetail(
        { productId: id.value, size: size.value, belt: belt.value },
        stockRes.data || [],
        snRes.data.list || [],
        logRes.data || [],
        data.value,
      )
      consumeStockDraft()
    } else if (kind.value === 'purchase') data.value = (await miniApi.purchase(id.value)).data
    else if (kind.value === 'return') data.value = (await miniApi.returnOne(id.value)).data
    else if (kind.value === 'exception') data.value = (await miniApi.exception(id.value)).data
    else if (kind.value === 'sn') data.value = (await miniApi.sn(id.value)).data
    else data.value = (await miniApi.sale(id.value)).data
  } catch (e: any) {
    if (kind.value !== 'stock' || !Object.keys(data.value).length) data.value = {}
    error.value = e?.message || '详情加载失败'
  } finally { loading.value = false }
}

async function saveExplain() {
  if (!explain.value.trim()) {
    uni.showToast({ title: '请填写说明', icon: 'none' })
    return
  }
  await miniApi.explainEx(id.value, explain.value.trim())
  uni.showToast({ title: '已提交', icon: 'success' })
  load()
}
function goScan() { uni.navigateTo({ url: `/pkg/scan/index?mode=ship&soId=${id.value}` }) }
function openSn(sn: string) { uni.navigateTo({ url: `/pkg/detail/index?kind=sn&id=${encodeURIComponent(sn)}` }) }
function closePage() { uni.navigateBack() }
function viewStockSns() {
  saveStockFilter({
    tab: 'sn',
    productId: id.value,
    size: size.value,
    belt: belt.value,
    scope: scope.value,
  })
  uni.switchTab({ url: '/pages/stock/index' })
}
function onStockSnClick(row: Record<string, unknown>) {
  if (row.sn) openSn(String(row.sn))
}
function onRelatedSnClick(row: Record<string, unknown>) {
  if (row.sn) openSn(String(row.sn))
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.pad { padding: 22rpx 32rpx 32rpx; }
.has-foot .pad { padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); }
.ops { margin-top: 24rpx; }
.field { padding: 8rpx 0 16rpx; }
.inp {
  display: block;
  width: 100%;
  height: 56rpx;
  color: #1A2B4A;
  font-size: 30rpx;
  line-height: 56rpx;
  background: transparent;
  border-bottom: 2rpx solid #E5E9F1;
}
.ph { color: #9AA4B2; }
.ok, .no { border-radius: 16rpx; font-weight: 700; margin-top: 12rpx; height: 84rpx; line-height: 84rpx; text-align: center; }
.ok { background: linear-gradient(135deg, #2B7BF0, #1A68D7); color: #fff; }
.no { background: #F4F6FA; color: #5B6472; }
.timeline { position: relative; padding-left: 28rpx; }
.timeline::before {
  content: "";
  position: absolute;
  left: 6rpx;
  top: 10rpx;
  bottom: 10rpx;
  width: 2rpx;
  background: #C5CDD8;
}
.ev { position: relative; padding: 0 0 28rpx 8rpx; }
.ev:last-child { padding-bottom: 0; }
.ev::before {
  content: "";
  position: absolute;
  left: -28rpx;
  top: 8rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #fff;
  border: 4rpx solid $rl-success;
  box-sizing: border-box;
  z-index: 1;
}
.ev.warn::before { border-color: $rl-warning; }
.ev.danger::before { border-color: $rl-danger; }
.eh-row { display: flex; align-items: center; gap: 10rpx; flex-wrap: wrap; }
.eh { font-weight: 700; color: #1A2B4A; font-size: 26rpx; }
.ed { display: block; margin-top: 6rpx; font-size: 22rpx; color: #7A879C; line-height: 1.5; word-break: keep-all; overflow-wrap: anywhere; }
.et { display: block; margin-top: 6rpx; font-size: 20rpx; color: #9AA6BA; }
.ex-badge {
  display: inline-flex;
  align-items: center;
  height: 32rpx;
  padding: 0 12rpx;
  border-radius: 999rpx;
  background: $rl-danger-bg;
  color: $rl-danger;
  font-size: 18rpx;
  font-weight: 700;
}
.hint { display: block; color: #8A97AD; font-size: 20rpx; line-height: 1.5; margin-bottom: 8rpx; }
.sn-status { display: flex; flex-direction: column; align-items: flex-start; gap: 8rpx; }
.note-list { display: flex; flex-direction: column; gap: 12rpx; }
.note-line { display: block; color: #5B6472; font-size: 23rpx; line-height: 1.55; }
.note-date { font-weight: 700; color: #1A2B4A; margin-right: 12rpx; }
.plain { display: block; color: #1A2B4A; font-size: 23rpx; line-height: 1.6; }
.reason-text { display: block; color: $rl-warning; font-size: 25rpx; font-weight: 600; }
.reason-sub { display: block; margin-top: 8rpx; color: $rl-warning; font-size: 21rpx; font-weight: 600; }
.photo-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.proof-photo { width: 180rpx; height: 150rpx; border-radius: 12rpx; background: #F4F6FA; }
.upload-box {
  height: 92rpx;
  border: 2rpx dashed #D7E3F7;
  border-radius: 14rpx;
  background: #F7FAFE;
  color: #9AA6BA;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.plus { color: $rl-success; font-weight: 700; }
.explain-card {
  margin-bottom: 22rpx;
  padding: 22rpx 24rpx;
  border: 2rpx solid $rl-border;
  border-radius: 20rpx;
  background: #fff;
}
.detail-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 2rpx solid #EDF1F7;
}
.footer-btn {
  flex: 1;
  height: 84rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 84rpx;
  text-align: center;
}
.footer-btn.ghost { background: #F4F6FA; color: #5B6472; border: 2rpx solid #E3E9F2; }
.footer-btn.primary {
  background: linear-gradient(135deg, #2B7BF0, #1A68D7);
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(26, 104, 215, 0.32);
}
</style>
