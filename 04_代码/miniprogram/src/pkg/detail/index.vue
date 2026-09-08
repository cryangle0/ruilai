<template>
  <view class="rl-page">
    <NavBar title="详情" show-back />
    <view class="pad">
      <PagedState :loading="loading" :error="error" :empty="!Object.keys(data).length" empty-text="未找到详情" @retry="load">
      <view class="card glass">
        <text class="h">{{ title }}</text>
        <view class="fields">
          <view v-for="row in fields" :key="row.k" class="kv">
            <text class="k">{{ row.k }}</text>
            <text class="v">{{ row.v }}</text>
          </view>
        </view>
        <view v-if="kind==='exception'" class="ops">
          <FieldRow v-model="explain" placeholder="填写情况说明" />
          <button class="ok" @click="saveExplain">提交说明</button>
        </view>
        <button v-if="kind==='sales' && data.status==='scanning' && user.role!=='SUB'" class="ok" @click="goScan">继续扫码</button>
        <view v-if="kind==='stock'" class="detail-section">
          <text class="h2">在库 SN（{{ (data.snRows||[]).length }}）</text>
          <view v-for="row in (data.snRows||[])" :key="row.sn" class="detail-line" @click="openSn(row.sn)">
            <text>{{ row.sn }}</text><text>{{ row.sizeCode || '—' }} / {{ row.belt || '—' }} ›</text>
          </view>
          <text class="h2 flow-title">库存流水</text>
          <view v-for="row in (data.logs||[])" :key="row.id" class="detail-line">
            <text>{{ formatDateTime(row.occurredAt) }}</text><text>{{ row.delta > 0 ? '+' : '' }}{{ row.delta }} · {{ row.reason }}</text>
          </view>
        </view>
        <view v-if="kind==='sn' && events.length" class="timeline">
          <text class="h2">流转时间线</text>
          <view v-for="(e, i) in events" :key="i" class="ev">
            <text class="et">{{ formatDateTime(e.time) }}</text>
            <text class="eh">{{ e.title }}</text>
            <text class="ed">{{ e.desc }}</text>
          </view>
        </view>
      </view>
      </PagedState>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import FieldRow from '@/components/FieldRow.vue'
import PagedState from '@/components/PagedState.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { PO_STATUS, SO_STATUS, RT_STATUS, SN_STATUS } from '@/utils/constants'
import { formatDateTime } from '@/utils/dates'
import { aggregateStockRows, compactSnRanges, purchaseSegmentText } from '@/utils/miniPages'

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

const title = computed(() => data.value.no || data.value.sn || data.value.productName || data.value.type || '详情')
const events = computed(() => (data.value.events || []) as { time: string; title: string; desc: string }[])
const fields = computed(() => {
  const d = data.value
  if (kind.value === 'stock') {
    return [
      { k: '商品', v: d.productName || d.productId || id.value },
      { k: '规格', v: `${d.size || size.value || '—'} + ${d.belt || belt.value || '—'}` },
      { k: '库存数量', v: String(d.qty ?? 0) },
      { k: '库存范围', v: scope.value === 'all' ? '全部含下属二级' : scope.value === 'self' ? '本级仓库' : '指定二级仓库' },
    ]
  }
  if (kind.value === 'purchase') {
    return [
      { k: '状态', v: PO_STATUS[d.status] || d.status },
      { k: '采购单号', v: d.no || '—' },
      { k: '一级代理', v: d.l1Name || d.l1Id || '—' },
      { k: '标准商品', v: lineSummary(d.lines) },
      { k: '非标商品', v: lineSummary(d.customLines) },
      { k: '单品/配件', v: lineSummary(d.parts) },
      { k: 'SN号段', v: purchaseSegmentText(d).replace(/^号段：/, '') },
      { k: '驳回原因', v: d.rejectReason || '—' },
      { k: '时间', v: formatDateTime(d.createdAt) },
    ]
  }
  if (kind.value === 'sales' || kind.value === 'cend') {
    return [
      { k: '状态', v: SO_STATUS[d.status] || d.status },
      { k: '渠道', v: d.channel === 'direct' ? '直售' : '分销' },
      { k: '二级', v: d.l2Id || '—' },
      { k: '计划', v: `${(d.scanned||[]).length}/${d.planTotal || 0}` },
      { k: '商品明细', v: d.productDetail || (d.snRows || []).map((r: any) => `${r.productName || r.sn}/${r.size || ''}`).join('，') || '—' },
      { k: 'SN号段', v: compactSnRanges(d.scanned || []).join('、') || '—' },
      { k: '客户', v: d.customer ? `${d.customer.phone || ''} ${d.customer.addr || ''}` : '—' },
      { k: '时间', v: formatDateTime(d.createdAt) },
    ]
  }
  if (kind.value === 'return') {
    return [
      { k: '类型', v: d.typeLabel || d.type },
      { k: '状态', v: RT_STATUS[d.status] || d.status },
      { k: '原因', v: `${d.reasonType || ''} ${d.reason || ''}` },
      { k: '商品明细', v: d.productDetail || '—' },
      { k: 'SN', v: (d.sns || []).join(' ') },
      { k: '处理说明', v: d.processNote || '—' },
      { k: '时间', v: formatDateTime(d.createdAt) },
    ]
  }
  if (kind.value === 'exception') {
    return [
      { k: '类型', v: d.type },
      { k: '对象', v: d.target },
      { k: '详情', v: d.detail },
      { k: '状态', v: d.status },
      { k: '一级说明', v: d.explainTxt || '—' },
      { k: '二级说明', v: d.explainL2 || '—' },
      { k: '时间', v: formatDateTime(d.occurredAt || d.createdAt) },
    ]
  }
  return [
    { k: 'SN', v: d.sn || id.value },
    { k: '商品', v: d.productName || d.productId },
    { k: '规格', v: `${d.sizeCode || ''} + ${d.belt || ''}` },
    { k: '状态', v: SN_STATUS[d.status] || d.status },
    { k: '出厂日期', v: formatDateTime(d.factoryAt) },
    { k: '一级', v: d.l1Id || '—' },
    { k: '二级', v: d.l2Id || '—' },
    { k: '客户', v: snCustomer(d) },
  ]
})

function lineSummary(lines: any) {
  if (!Array.isArray(lines) || !lines.length) return '—'
  return lines.map((line: any) =>
    `${line.productName || line.name || line.productId || line.partId || '商品'}`
    + `${line.size ? `/${line.size}` : ''}×${line.qty || 0}`).join('，')
}

function snCustomer(d: any) {
  const tags: string[] = d.tags || []
  const returned = tags.includes('已退货') || d.status !== 'bound'
  if (returned) {
    const prev = d.prevUserJson
    return prev ? `已退货（原 ${prev.phone || ''}）` : '—'
  }
  return d.userJson ? `${d.userJson.phone || ''} ${d.userJson.addr || ''}` : '—'
}

onLoad(async (q) => {
  if (!user.ensureLogin()) return
  kind.value = q?.kind || 'sales'
  id.value = q?.id || ''
  size.value = q?.size || ''
  belt.value = q?.belt || ''
  scope.value = q?.scope || 'self'
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
      const rows = aggregateStockRows(stockRes.data || [])
      const summary = rows.find((row) => row.productId === id.value
        && row.size === size.value && row.belt === belt.value) || {}
      data.value = {
        ...summary,
        snRows: (snRes.data.list || []).filter((row: any) => row.productId === id.value
          && (!size.value || row.sizeCode === size.value) && (!belt.value || row.belt === belt.value)),
        logs: (logRes.data || []).filter((row: any) => row.productId === id.value
          && (!size.value || row.sizeCode === size.value)),
      }
    } else if (kind.value === 'purchase') data.value = (await miniApi.purchase(id.value)).data
    else if (kind.value === 'return') data.value = (await miniApi.returnOne(id.value)).data
    else if (kind.value === 'exception') data.value = (await miniApi.exception(id.value)).data
    else if (kind.value === 'sn') data.value = (await miniApi.sn(id.value)).data
    else data.value = (await miniApi.sale(id.value)).data
  } catch (e: any) {
    data.value = {}
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
</script>
<style scoped>
.pad { padding: 22rpx 32rpx; }
.card { padding: 22rpx 24rpx; border-radius: 20rpx; }
.h {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 26rpx;
  font-weight: 700;
  margin-bottom: 18rpx;
}
.h::before {
  content: "";
  width: 8rpx;
  height: 26rpx;
  border-radius: 4rpx;
  background: linear-gradient(180deg, #2B7BF0, #1A68D7);
}
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx 20rpx; }
.kv { display: flex; flex-direction: column; gap: 7rpx; padding: 0; }
.k { color: #9AA6BA; font-size: 20rpx; flex-shrink: 0; }
.v { text-align: left; font-size: 25rpx; color: #1A2B4A; font-weight: 600; word-break: break-all; }
.muted { color: #8e8e93; padding: 40rpx; text-align: center; }
.ops { margin-top: 24rpx; }
.ok, .no { border-radius: 16rpx; font-weight: 700; margin-top: 12rpx; height: 84rpx; line-height: 84rpx; }
.ok { background: linear-gradient(135deg, #2B7BF0, #1A68D7); color: #fff; }
.no { background: #F4F6FA; color: #5B6472; }
.ok::after, .no::after { border: 0; }
.timeline { margin-top: 28rpx; }
.h2 { display: block; font-weight: 700; margin-bottom: 12rpx; }
.ev { position: relative; margin-left: 12rpx; padding: 0 0 24rpx 30rpx; border-left: 2rpx solid #DDE6F2; }
.ev::before { content: ""; position: absolute; left: -8rpx; top: 4rpx; width: 14rpx; height: 14rpx; border-radius: 50%; background: #1A68D7; border: 3rpx solid #EAF2FD; }
.et { display: block; font-size: 22rpx; color: #8e8e93; }
.eh { font-weight: 600; }
.ed { display: block; font-size: 24rpx; color: #636366; }
.detail-section { margin-top: 28rpx; }
.detail-line { display: flex; justify-content: space-between; gap: 18rpx; padding: 18rpx 0; border-bottom: 1rpx solid #EEF1F6; color: #5B6472; font-size: 22rpx; }
.flow-title { margin-top: 26rpx; }
</style>
