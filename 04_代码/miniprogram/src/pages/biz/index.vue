<template>
  <view class="rl-page">
    <NavBar brand />
    <view class="page-head">
      <text class="page-title">{{ user.role === 'L2' ? '销售' : '业务' }}</text>
      <text class="page-sub">{{ pageDesc }}</text>
    </view>
    <view class="pad">
      <SegBar v-model="tab" :items="segs" />
      <view v-if="tab === 'purchase'" class="action-row">
        <text class="action-tip">发起采购申请（标准/非标/配件）</text>
        <button class="mini-btn" @click="goForm('purchase')">新建采购申请</button>
      </view>
      <view v-if="tab === 'sales' && user.role !== 'L2'" class="action-row">
        <text class="action-tip" />
        <button class="mini-btn" @click="goForm('sales')">创建销售单</button>
      </view>
      <view v-if="tab === 'sales' && user.role === 'L2'" class="alert glass">本级销售记录（点开详情看商品与 SN）</view>
      <view v-if="tab === 'cend'" class="mini-page-desc">C 端客户订单（直销激活 / 用户绑定）</view>
      <view class="filter-panel">
        <SegBar v-if="tab === 'purchase'" variant="seg" v-model="poStatus" :items="poSegs" />
        <DateBar embedded v-model:from="from" v-model:to="to" v-model:sn="sn" show-sn />
      </view>
      <PagedState
        :loading="loading"
        :error="error"
        :empty="!all.length"
        :has-more="hasMore"
        :loading-more="loadingMore"
        show-end
        @retry="reload"
        @load-more="loadMore"
      >
        <Empty v-if="!rows.length" text="当前筛选暂无单据" />
        <ListCard
          v-for="r in rows" :key="r.id"
          :class="{ emphasized: isPending(r) }"
          :title="r.no"
          :sub="lineText(r)"
          :meta="formatDateTime(r.createdAt)"
          @click="open(r)"
        >
          <template #tag>
            <StatusTag :value="r.status" :map="tab === 'purchase' ? PO_STATUS : SO_STATUS" />
          </template>
          <view v-if="tab !== 'purchase'" class="detail-row"><text class="chip">{{ channelText(r) }}</text><text>{{ scanProgress(r) }}</text></view>
          <view v-if="warnText(r)" class="warn-row">{{ warnText(r) }}</view>
          <text class="sn-row">{{ snText(r) }}</text>
        </ListCard>
      </PagedState>
    </view>
    <TabBar current="biz" />
  </view>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import TabBar from '@/components/TabBar.vue'
import SegBar from '@/components/SegBar.vue'
import Empty from '@/components/Empty.vue'
import ListCard from '@/components/ListCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import DateBar from '@/components/DateBar.vue'
import PagedState from '@/components/PagedState.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { PO_STATUS, SO_STATUS } from '@/utils/constants'
import { formatDateTime, matchesQuery } from '@/utils/dates'
import { compactSnRanges, consumeNavigationIntent, mergePage, purchaseSegmentText, statusBadge } from '@/utils/miniPages'

const user = useUserStore()
const tab = ref('purchase')
const poStatus = ref('all')
const from = ref('')
const to = ref('')
const sn = ref('')
const all = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const page = ref(1)
const total = ref(0)
const hasMore = computed(() => !sn.value.trim() && all.value.length < total.value)
const pageDesc = computed(() => {
  if (user.role === 'L2') return '分销到货 / C端客户订单'
  return '采购 / 销售 / C端客户订单'
})
const segs = computed(() => {
  if (user.role === 'L2') return [{ id: 'sales', title: '分销到货' }, { id: 'cend', title: 'C端订单' }]
  return [{ id: 'purchase', title: '采购' }, { id: 'sales', title: '销售' }, { id: 'cend', title: 'C端订单' }]
})
const poCounts = computed(() => {
  const list = all.value
  const n = (st: string) => list.filter((p) => p.status === st).length
  return { all: total.value || list.length, pending: n('pending'), cosigning: n('cosigning'), approved: n('approved'), rejected: n('rejected') }
})
const poSegs = computed(() => [
  { id: 'all', title: '全部' },
  { id: 'pending', title: '待处理', badge: statusBadge('pending', poCounts.value.pending, ['pending', 'cosigning']) },
  { id: 'cosigning', title: '会签中', badge: statusBadge('cosigning', poCounts.value.cosigning, ['pending', 'cosigning']) },
  { id: 'approved', title: '已完成' },
  { id: 'rejected', title: '已驳回' },
])
const rows = computed(() => {
  let list = all.value
  if (tab.value === 'purchase' && poStatus.value !== 'all') {
    list = list.filter((p) => p.status === poStatus.value)
  }
  return list
    .filter((r) => matchesQuery(hay(r), sn.value))
    .slice()
    .sort((a, b) => Number(Boolean(b.warnEx?.open)) - Number(Boolean(a.warnEx?.open))
      || Number(isPending(b)) - Number(isPending(a)))
})

function hay(r: any) {
  return [
    r.no,
    r.productDetail,
    ...(r.sns || []),
    ...(r.scanned || []),
    r.customer?.phone,
    r.customer?.addr,
    ...(r.lines || []).flatMap((l: any) => [l.productId, l.size, l.belt]),
  ]
}

async function load(append = false) {
  if (user.role === 'SUB') { uni.switchTab({ url: '/pages/home/index' }); return }
  if (append) loadingMore.value = true
  else { loading.value = true; page.value = 1; error.value = '' }
  try {
    const queryPage = sn.value.trim() ? 1 : page.value
    const pageSize = 30
    const fetchPage = async (requestPage: number, requestSize: number) => tab.value === 'purchase'
      ? (await miniApi.purchases({
        page: requestPage,
        pageSize: requestSize,
        status: poStatus.value === 'all' ? undefined : poStatus.value,
        from: from.value,
        to: to.value,
        sn: sn.value.trim() || undefined,
      })).data
      : (await miniApi.sales({
        page: requestPage,
        pageSize: requestSize,
        channel: tab.value === 'cend' ? 'direct' : 'distribute',
        from: from.value,
        to: to.value,
        l2Id: activeL2(),
        sn: sn.value.trim() || undefined,
      })).data
    const result = await fetchPage(queryPage, pageSize)
    total.value = result.total || 0
    all.value = append ? mergePage(all.value, result.list || [], total.value).list : (result.list || [])
  } catch (e: any) {
    if (append) {
      if (page.value > 1) page.value -= 1
      uni.showToast({ title: e?.message || '加载更多失败', icon: 'none' })
    } else {
      error.value = e?.message || '业务数据加载失败'
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}
function reload() { all.value = []; load(false) }
function loadMore() { if (!hasMore.value || loadingMore.value) return; page.value += 1; load(true) }
let suppressWatch = false
let snTimer: ReturnType<typeof setTimeout> | undefined
watch([tab, poStatus, from, to], () => { if (!suppressWatch) reload() })
watch(sn, () => {
  if (suppressWatch) return
  if (snTimer) clearTimeout(snTimer)
  snTimer = setTimeout(reload, 300)
})
onShow(async () => {
  if (!user.ensureLogin()) return
  suppressWatch = true
  if (user.role === 'L2' && tab.value === 'purchase') tab.value = 'sales'
  const intent = consumeNavigationIntent('biz')
  if (intent) {
    tab.value = segs.value.some((item) => item.id === intent.tab) ? intent.tab : segs.value[0].id
    from.value = intent.from || ''
    to.value = intent.to || ''
    deepL2.value = intent.l2Id || ''
    if (intent.status) poStatus.value = intent.status
  }
  uni.hideTabBar({ animation: false })
  await nextTick()
  suppressWatch = false
  reload()
})

const deepL2 = ref('')
function activeL2() { return user.role === 'L2' ? undefined : (deepL2.value || undefined) }

function lineText(r: any) {
  const name = r.productName || r.productId || '商品'
  if (r.productDetail) return r.productDetail
  if (r.lines) return (r.lines as any[]).map((l) => `${l.productName || l.productId || name}/${l.size}×${l.qty}`).join('，')
  if (r.planBySize) {
    return Object.entries(r.planBySize).map(([size, qty]) => `${name}/${size}×${qty}`).join('，')
  }
  if (r.channel === 'direct') return r.customer?.phone || 'C端激活'
  return `${(r.scanned || []).length}/${r.planTotal || 0}`
}
function isPending(r: any) { return ['pending', 'cosigning', 'scanning'].includes(r.status) || r.warnEx?.open === true }
function channelText(r: any) { return r.channel === 'direct' ? '直售' : user.role === 'L2' ? '分销到货' : '分销' }
function scanProgress(r: any) { return `${(r.scanned || []).length}/${r.planTotal || 0}` }
function warnText(r: any) {
  if (!r.warnEx) return ''
  if (typeof r.warnEx === 'object' && r.warnEx.has === false) return ''
  return typeof r.warnEx === 'string' ? r.warnEx : (r.warnEx.label || r.warnEx.message || '预警倍数异常 · 未处理')
}
function snText(r: any) {
  if (tab.value === 'purchase') return purchaseSegmentText(r)
  const ranges = compactSnRanges(r.scanned || r.sns || [])
  return ranges.length ? `号段：${ranges.join('、')}` : '暂无号段'
}
function goForm(kind: string) { uni.navigateTo({ url: `/pkg/purchase/index?kind=${kind}` }) }
function open(r: any) {
  const kind = tab.value === 'purchase' ? 'purchase' : tab.value === 'cend' ? 'cend' : 'sales'
  uni.navigateTo({ url: `/pkg/detail/index?kind=${kind}&id=${r.id}` })
}
</script>
<style scoped lang="scss">
.pad { padding: 0 32rpx 24rpx; }
.alert { padding: 16rpx 20rpx; border-radius: 16rpx; margin: 12rpx 0 0; font-size: 24rpx; color: #636366; }
.mini-btn {
  background: linear-gradient(135deg, #2B7BF0, #1A68D7);
  color: #fff;
  border-radius: 13rpx;
  font-size: 23rpx;
  font-weight: 600;
  padding: 14rpx 28rpx;
  margin: 0;
  line-height: 1.2;
}
.mini-btn::after { border: 0; }
.emphasized { border-color: #F6DCB0; background: #FFFBF4; }
.detail-row { display: flex; align-items: center; gap: 14rpx; margin-top: 10rpx; color: #5B6472; font-size: 21rpx; }
.chip { padding: 4rpx 12rpx; border-radius: 9rpx; background: #EAF2FD; color: #1A68D7; font-weight: 600; }
.warn-row { margin-top: 10rpx; padding: 8rpx 12rpx; border-radius: 9rpx; background: #FCEBEB; color: #DE4B4B; font-size: 20rpx; font-weight: 600; }
.sn-row { display: block; margin-top: 12rpx; color: #7A879C; font-size: 20rpx; line-height: 1.55; word-break: break-all; }
</style>
