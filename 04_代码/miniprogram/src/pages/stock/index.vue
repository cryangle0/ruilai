<template>
  <view class="rl-page">
    <NavBar brand />
    <view class="page-head">
      <text class="page-title">库存</text>
      <text class="page-sub">点商品可看流水与 SN 详情 · 商品汇总与在库 SN 分开展示</text>
    </view>
    <view class="pad">
      <FormPicker v-if="user.role === 'L1'" v-model="scope" :options="scopeOptions" label="库存范围" />
      <SegBar v-model="tab" :items="segs" />
      <PagedState :loading="loading" :error="error" :empty="activeSourceEmpty" :has-more="tab === 'sn' && hasMore && !loadMoreError" :loading-more="loadingMore" :show-end="!loadMoreError" @retry="loadStock" @load-more="loadMoreSns">
        <template>
        <view class="kpis">
          <template v-if="tab === 'flow'">
            <view class="kpi glass"><Icon name="stock" :size="36" /><text>当前筛选区间库存量</text><text class="n">{{ rangeQty }}</text></view>
            <view class="kpi glass"><Icon name="biz" :size="36" /><text>库存总量</text><text class="n">{{ totalQty }}</text></view>
          </template>
          <template v-else>
            <view class="kpi glass"><Icon name="stock" :size="36" /><text>库存总量</text><text class="n">{{ totalQty }}</text></view>
            <view class="kpi glass"><Icon name="biz" :size="36" /><text>产品种类</text><text class="n">{{ filteredProducts.length }}</text></view>
          </template>
        </view>
        <view v-if="tab === 'product'">
          <SpecFilter v-model:size="size" v-model:belt="belt" />
          <view v-if="!filteredProducts.length"><Empty text="暂无汇总" /></view>
          <ListCard
            v-for="r in filteredProducts"
            :key="r.key"
            :title="r.productName"
            :sub="`${r.size} + ${r.belt || '—'}`"
            :meta="`×${r.qty}`"
            @click="openProduct(r)"
          />
        </view>
        <view v-else-if="tab === 'sn'">
          <SearchBar v-model="q" placeholder="搜 SN" />
          <SpecFilter v-model:size="size" v-model:belt="belt" />
          <view v-if="!filteredSns.length"><Empty text="无 SN" /></view>
          <ListCard
            v-for="s in sortedSns"
            :key="s.sn"
            :class="{ marked: markedSn(s.sn) }"
            :title="s.sn"
            :sub="`${s.productName || s.productId} · ${s.sizeCode}+${s.belt || '—'}`"
            @click="openSn(s.sn)"
          >
            <template #tag><StatusTag :value="s.status" :map="SN_STATUS" /></template>
            <text v-if="markedSn(s.sn)" class="ex-mark">未处理异常</text>
          </ListCard>
          <view v-if="loadMoreError" class="load-more-error">
            <text>{{ loadMoreError }}</text>
            <button @click="loadMoreSns">重试</button>
          </view>
        </view>
        <view v-else>
          <view class="filter-panel">
            <DateBar embedded v-model:from="from" v-model:to="to" />
          </view>
          <view v-if="!filteredLogs.length"><Empty text="暂无流水" /></view>
          <ListCard
            v-for="h in filteredLogs"
            :key="h.id"
            :title="formatDateTime(h.occurredAt)"
            :sub="`${prodName(h.productId)}/${h.sizeCode} ${h.delta > 0 ? '+' : ''}${h.delta}`"
            :meta="`${h.reason || ''} ${h.refNo || ''}`"
          />
        </view>
        </template>
      </PagedState>
    </view>
    <TabBar current="stock" />
  </view>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import TabBar from '@/components/TabBar.vue'
import SegBar from '@/components/SegBar.vue'
import Empty from '@/components/Empty.vue'
import ListCard from '@/components/ListCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import SearchBar from '@/components/SearchBar.vue'
import DateBar from '@/components/DateBar.vue'
import SpecFilter from '@/components/SpecFilter.vue'
import Icon from '@/components/Icon.vue'
import FormPicker from '@/components/FormPicker.vue'
import PagedState from '@/components/PagedState.vue'
import { datePresetRange, formatDateTime, inDateRange } from '@/utils/dates'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { SN_STATUS } from '@/utils/constants'
import { aggregateStockRows, fetchNextPage, isOpenException, mergePage, sortStockSns, stockExceptionSnSet } from '@/utils/miniPages'

const user = useUserStore()
const tab = ref('product')
const products = ref<any[]>([])
const sns = ref<any[]>([])
const logs = ref<any[]>([])
const l2s = ref<any[]>([])
const scope = ref<'self' | 'all' | string>('self')
const q = ref('')
const size = ref('')
const belt = ref('')
const productId = ref('')
const from = ref('')
const to = ref('')
const loading = ref(true)
const loadingMore = ref(false)
const loadMoreError = ref('')
const error = ref('')
const snPage = ref(1)
const snTotal = ref(0)
const exceptions = ref<any[]>([])

const filteredProducts = computed(() => products.value.filter((r) => {
  if (size.value && r.size !== size.value) return false
  if (belt.value && (r.belt || '') !== belt.value) return false
  return true
}))
const filteredSns = computed(() => sns.value.filter((s) => {
  if (productId.value && s.productId !== productId.value) return false
  if (size.value && s.sizeCode !== size.value) return false
  if (belt.value && (s.belt || '') !== belt.value) return false
  const k = q.value.trim().toLowerCase()
  if (k && !String(s.sn).toLowerCase().includes(k)) return false
  return true
}))
const sortedSns = computed(() => sortStockSns(filteredSns.value, exceptions.value))
const markedSns = computed(() => stockExceptionSnSet(exceptions.value))
const filteredLogs = computed(() => logs.value.filter((h) => {
  if (!inDateRange(h.occurredAt, from.value, to.value)) return false
  if (productId.value && h.productId !== productId.value) return false
  if (size.value && h.sizeCode !== size.value) return false
  return true
}))
const totalQty = computed(() => filteredProducts.value.reduce((n, r) => n + (Number(r.qty) || 0), 0))
const rangeQty = computed(() => filteredLogs.value.reduce((n, h) => {
  const d = Number(h.delta) || 0
  return n + (d > 0 ? d : 0)
}, 0))
const segs = computed(() => [
  { id: 'product', title: '商品', badge: filteredProducts.value.length || undefined },
  { id: 'sn', title: '在库SN', badge: snTotal.value || filteredSns.value.length || undefined },
  { id: 'flow', title: '库存流水', badge: filteredLogs.value.length || undefined },
])
const scopeOptions = computed(() => [
  { label: '本级仓库', value: 'self' },
  { label: '全部含下属二级', value: 'all' },
  ...l2s.value.map((a) => ({ label: a.name, value: a.id })),
])
const activeSourceEmpty = computed(() => tab.value === 'product' ? !products.value.length : tab.value === 'sn' ? !sns.value.length : !logs.value.length)
const hasMore = computed(() => sns.value.length < snTotal.value)
function stockParams() {
  if (user.role === 'L2') return { agentType: 'l2' as const }
  if (scope.value === 'all') return { agentType: 'all' as const }
  if (scope.value !== 'self') return { agentType: 'l2' as const, agentId: scope.value }
  return { agentType: 'l1' as const }
}
function snParams(page = 1) {
  const p: Record<string, unknown> = { page, pageSize: 40 }
  if (user.role === 'L2') p.status = 'l2'
  else if (scope.value === 'all') p.status = 'l1,l2'
  else if (scope.value !== 'self') { p.status = 'l2'; p.l2Id = scope.value }
  else p.status = 'l1'
  return p
}

watch(tab, (t) => {
  if (t === 'flow' && !from.value && !to.value) {
    const r = datePresetRange('month')
    from.value = r.from
    to.value = r.to
  }
})
watch(scope, () => loadStock())

onShow(async () => {
  if (!user.ensureLogin()) return
  if (user.role === 'SUB') { uni.switchTab({ url: '/pages/home/index' }); return }
  uni.hideTabBar({ animation: false })
  if (user.role === 'L1') {
    try { l2s.value = (await miniApi.agentsL2({ pageSize: 100, auditStatus: 'approved' })).data.list || [] } catch { l2s.value = [] }
  }
  await loadStock()
})
async function loadStock() {
  loading.value = true
  error.value = ''
  loadMoreError.value = ''
  snPage.value = 1
  try {
    const sp = stockParams()
    const [stockRes, snRes, logRes, exRes] = await Promise.all([
      miniApi.stock(sp),
      miniApi.sns(snParams()),
      miniApi.stockLogs(sp),
      miniApi.exceptions({ dim: 'activate', status: 'open', pageSize: 100 }),
    ])
    products.value = aggregateStockRows(stockRes.data || [])
    sns.value = snRes.data.list || []
    snTotal.value = snRes.data.total || 0
    logs.value = logRes.data || []
    exceptions.value = (exRes.data.list || []).filter(isOpenException)
  } catch (e: any) {
    error.value = e?.message || '库存数据加载失败'
  } finally {
    loading.value = false
  }
}
async function loadMoreSns() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  loadMoreError.value = ''
  try {
    const next = await fetchNextPage(snPage.value, async (page) => (await miniApi.sns(snParams(page))).data)
    const result = next.result
    sns.value = mergePage(sns.value, result.list || [], result.total || snTotal.value).list
    snTotal.value = result.total || snTotal.value
    snPage.value = next.page
  } catch (e: any) {
    loadMoreError.value = e?.message || '更多库存数据加载失败，请重试'
  } finally { loadingMore.value = false }
}
function prodName(id: string) {
  return products.value.find((r) => r.productId === id)?.productName || id
}
function openProduct(r: any) {
  const params = `id=${encodeURIComponent(r.productId || '')}&size=${encodeURIComponent(r.size || '')}&belt=${encodeURIComponent(r.belt || '')}&scope=${encodeURIComponent(String(scope.value))}`
  uni.navigateTo({ url: `/pkg/detail/index?kind=stock&${params}` })
}
function openSn(sn: string) { uni.navigateTo({ url: `/pkg/detail/index?kind=sn&id=${sn}` }) }
function markedSn(sn: string) { return markedSns.value.has(sn) }
</script>
<style scoped lang="scss">
.pad { padding: 0 32rpx 24rpx; }
.box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16rpx 0 0;
  height: 50rpx;
  padding: 0 18rpx;
  border-radius: 12rpx;
  background: #fff;
  border: 2rpx solid #E3E9F2;
  font-size: 22rpx;
}
.kpis { display: flex; gap: 12rpx; margin: 16rpx 0; }
.kpi { flex: 1; padding: 20rpx; border-radius: 20rpx; display: flex; flex-direction: column; gap: 8rpx; }
.n { display: block; font-size: 36rpx; font-weight: 800; color: #1559BC; }
.marked { border-color: $rl-danger-border; background: #FFF9F9; }
.ex-mark { display: inline-flex; margin-top: 10rpx; padding: 5rpx 12rpx; border-radius: 9rpx; background: $rl-danger-bg; color: $rl-danger; font-size: 19rpx; font-weight: 700; }
.load-more-error {
  padding: 20rpx 0;
  color: $rl-danger;
  font-size: 22rpx;
  text-align: center;
}
.load-more-error button {
  display: inline-block;
  min-width: 120rpx;
  height: 56rpx;
  margin: 12rpx 0 0 16rpx;
  padding: 0 20rpx;
  border: 2rpx solid $rl-danger-border;
  border-radius: 12rpx;
  background: $rl-danger-bg;
  color: $rl-danger;
  font-size: 21rpx;
  line-height: 52rpx;
}
.load-more-error button::after { border: 0; }
</style>
