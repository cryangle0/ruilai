<template>
  <view class="rl-page">
    <NavBar brand />
    <view class="page-head">
      <text class="page-title">售后</text>
      <text class="page-sub">退货与异常查看</text>
    </view>
    <view class="pad">
      <SegBar v-model="tab" :items="mainSegs" />
      <template v-if="tab === 'return'">
        <view v-if="user.role === 'L2'" class="form-btns">
          <button class="ghost" @click="goForm('user')">填写终端退货单</button>
        </view>
        <view v-else class="form-btns">
          <button class="ghost" @click="goForm('l2_to_l1')">填写二级退一级</button>
          <button class="ghost" @click="goForm('user')">填写终端退货单</button>
          <button class="ghost" @click="goForm('l1_to_factory')">申请退原厂</button>
        </view>
        <view class="filter-panel">
          <SegBar v-if="user.role === 'L1'" variant="seg" v-model="rtType" :items="rtTypeSegs" />
          <SegBar v-if="showRtStatus" variant="seg" v-model="rtStatus" :items="rtStatusSegs" />
          <DateBar embedded v-model:from="from" v-model:to="to" v-model:sn="sn" show-sn />
        </view>
      </template>
      <template v-else>
        <view class="filter-panel">
          <SegBar variant="seg" v-model="exDim" :items="exSegs" />
          <FormPicker
            v-if="user.role === 'L1'"
            v-model="deepL2"
            :options="l2Options"
            label="二级代理"
          />
          <DateBar embedded v-model:from="from" v-model:to="to" v-model:sn="sn" show-sn />
        </view>
      </template>
      <PagedState
        :loading="loading"
        :error="error"
        :empty="tab === 'return' ? !allRt.length : !allEx.length"
        :has-more="hasMore"
        :loading-more="loadingMore"
        show-end
        @retry="reload"
        @load-more="loadMore"
      >
        <Empty v-if="!rows.length" text="当前筛选暂无记录" />
        <template v-if="tab === 'return'">
          <ListCard v-for="r in rows" :key="r.id" :class="{ pending: r.status === 'pending' }" :title="r.no" :sub="r.reason || r.desc || '暂无说明'" :meta="(r.sns || []).join(' ') || '暂无 SN'" @click="open('return', r.id)">
            <template #tag><StatusTag :value="r.status" :map="RT_STATUS" /></template>
            <view class="return-meta"><text class="type-chip">{{ returnType(r) }}</text><text class="reason-chip">{{ r.reasonType || '其他' }}</text></view>
          </ListCard>
        </template>
        <template v-else>
          <ListCard v-for="r in rows" :key="r.id" :class="{ pending: isExOpen(r) }" :title="r.type" :sub="r.target" :meta="r.detail" @click="open('exception', r.id)">
            <template #tag><StatusTag :value="r.status" :tone="isExOpen(r) ? 'danger' : undefined" /></template>
            <text class="dimension-badge">{{ dimensionLabel(r) }}</text>
          </ListCard>
        </template>
      </PagedState>
    </view>
    <TabBar current="service" />
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
import FormPicker from '@/components/FormPicker.vue'
import PagedState from '@/components/PagedState.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { RT_STATUS } from '@/utils/constants'
import { matchesQuery } from '@/utils/dates'
import { consumeNavigationIntent, createRefreshCycleCache, exceptionApiDimension, exceptionCountForTab, exceptionDimension, mergePage } from '@/utils/miniPages'

const user = useUserStore()
const tab = ref('return')
const rtType = ref('l2_to_l1')
const rtStatus = ref('all')
const exDim = ref('activate-direct')
const from = ref('')
const to = ref('')
const sn = ref('')
const allRt = ref<any[]>([])
const allEx = ref<any[]>([])
const badgeCounts = ref<Record<string, number>>({})
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const page = ref(1)
const total = ref(0)
const deepL2 = ref('')
const l2s = ref<any[]>([])
const hasMore = computed(() => tab.value === 'return'
  && !sn.value.trim()
  && allRt.value.length < total.value)

const showRtStatus = computed(() => user.role === 'L1' && rtType.value === 'l1_to_factory')
const rtTypeSegs = computed(() => [
  { id: 'l2_to_l1', title: '二级退一级' },
  { id: 'user', title: '终端退货' },
  { id: 'l1_to_factory', title: '退原厂' },
])
const factoryList = computed(() => allRt.value.filter((r) => r.type === 'l1_to_factory'))
const stN = (st: string) => factoryList.value.filter((r) => r.status === st).length
const rtStatusSegs = computed(() => [
  { id: 'all', title: '全部' },
  { id: 'pending', title: '待审核', badge: stN('pending') || undefined },
  { id: 'done', title: '已通过' },
  { id: 'rejected', title: '已驳回' },
])
const l2Options = computed(() => [
  { label: '全部二级代理', value: '' },
  ...l2s.value.map((agent) => ({ label: agent.name, value: agent.id })),
])
function isExOpen(e: any) {
  return ['待处理', '会签中', 'pending', 'cosigning'].includes(e.status)
}
function dimOf(tabId: string) {
  return exceptionApiDimension(tabId)
}
const openEx = computed(() => exceptionCountForTab(badgeCounts.value, 'all'))
const mainSegs = computed(() => [
  { id: 'return', title: '退货' },
  { id: 'exception', title: '异常', badge: openEx.value || undefined },
])
const exN = (tabId: string) => exceptionCountForTab(badgeCounts.value, tabId)
const exSegs = computed(() => [
  { id: 'activate-direct', title: '直售激活', badge: exN('activate-direct') || undefined },
  { id: 'activate-dist', title: '分销激活', badge: exN('activate-dist') || undefined },
  { id: 'stock', title: '销售库存', badge: exN('stock') || undefined },
])
const rows = computed(() => {
  if (tab.value === 'return') {
    let list = allRt.value
    if (user.role === 'L1') list = list.filter((r) => r.type === rtType.value)
    if (showRtStatus.value && rtStatus.value !== 'all') list = list.filter((r) => r.status === rtStatus.value)
    return list
      .filter((r) => matchesQuery([r.no, ...(r.sns || [])], sn.value))
      .slice()
      .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'))
  }
  return allEx.value
    .filter((e) => exceptionDimension(e) === exDim.value)
    .filter((e) => matchesQuery([e.type, e.target, e.detail], sn.value))
    .slice()
    .sort((a, b) => Number(isExOpen(b)) - Number(isExOpen(a)))
})

const showRequests = createRefreshCycleCache()
type RequestCache = typeof showRequests
function requestInCycle<T>(cache: RequestCache | undefined, key: string, loader: () => Promise<T>) {
  return cache ? cache.run(key, loader) : loader()
}
function queryKey(path: string, params: Record<string, unknown>) {
  return `${path}?${Object.entries(params).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => `${key}=${value}`).join('&')}`
}

async function load(append = false, cache?: RequestCache) {
  if (user.role === 'SUB') { uni.switchTab({ url: '/pages/home/index' }); return }
  if (append) loadingMore.value = true
  else { loading.value = true; page.value = 1; error.value = '' }
  try {
    if (tab.value === 'return') {
      const pageSize = 30
      const fetchPage = async (requestPage: number, requestSize: number) => {
        const params = {
          page: requestPage,
          pageSize: requestSize,
          status: showRtStatus.value && rtStatus.value !== 'all' ? rtStatus.value : undefined,
          type: user.role === 'L1' ? rtType.value : undefined,
          from: from.value,
          to: to.value,
          l2Id: deepL2.value || undefined,
          sn: sn.value.trim() || undefined,
        }
        return requestInCycle(cache, queryKey('/api/returns', params), async () => (await miniApi.returns(params)).data)
      }
      const result = await fetchPage(sn.value.trim() ? 1 : page.value, pageSize)
      total.value = result.total || 0
      allRt.value = append ? mergePage(allRt.value, result.list || [], total.value).list : (result.list || [])
    } else {
      const params = {
        page: 1,
        pageSize: 100,
        dim: dimOf(exDim.value),
        from: from.value,
        to: to.value,
        l2Id: deepL2.value || undefined,
        sn: sn.value.trim() || undefined,
      }
      const result = await requestInCycle(cache, queryKey('/api/exceptions', params), async () => (await miniApi.exceptions(params)).data)
      total.value = result.total || 0
      allEx.value = result.list || []
    }
  } catch (e: any) {
    if (append) {
      if (page.value > 1) page.value -= 1
      uni.showToast({ title: e?.message || '加载更多失败', icon: 'none' })
    } else {
      error.value = e?.message || '售后数据加载失败'
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}
function reload() {
  if (tab.value === 'return') allRt.value = []
  else allEx.value = []
  load(false)
}
function loadMore() { if (!hasMore.value || loadingMore.value) return; page.value += 1; load(true) }
let suppressWatch = false
let snTimer: ReturnType<typeof setTimeout> | undefined
let showCycle = 0
watch([tab, rtType, rtStatus, exDim, deepL2, from, to], () => { if (!suppressWatch) reload() })
watch(sn, () => {
  if (suppressWatch) return
  if (snTimer) clearTimeout(snTimer)
  snTimer = setTimeout(reload, 300)
})
onShow(async () => {
  if (!user.ensureLogin()) return
  const cycle = ++showCycle
  suppressWatch = true
  if (user.role === 'L2' && exDim.value === 'activate-direct') exDim.value = 'activate-dist'
  const intent = consumeNavigationIntent('service')
  if (intent) {
    tab.value = intent.tab === 'exception' ? 'exception' : 'return'
    from.value = intent.from || ''
    to.value = intent.to || ''
    deepL2.value = intent.l2Id || ''
    if (intent.dimension) exDim.value = intent.dimension
    if (intent.status) rtStatus.value = intent.status
  }
  uni.hideTabBar({ animation: false })
  if (user.role === 'L1') {
    try {
      l2s.value = (await miniApi.agentsL2({ pageSize: 100, auditStatus: 'approved' })).data.list || []
    } catch {
      l2s.value = []
    }
  }
  showRequests.begin()
  const badgeParams = { from: from.value, to: to.value, l2Id: deepL2.value || undefined }
  const badgeRequest = requestInCycle(
    showRequests,
    queryKey('/api/exceptions/counts', badgeParams),
    async () => (await miniApi.exceptionCounts(badgeParams)).data,
  ).then((result) => { if (cycle === showCycle) badgeCounts.value = result || {} })
    .catch(() => { if (cycle === showCycle) badgeCounts.value = {} })
  await nextTick()
  suppressWatch = false
  if (tab.value === 'return') allRt.value = []
  else allEx.value = []
  await Promise.all([badgeRequest, load(false, showRequests)])
})
function goForm(type: string) { uni.navigateTo({ url: `/pkg/return-form/index?type=${type}` }) }
function open(kind: string, id: string) { uni.navigateTo({ url: `/pkg/detail/index?kind=${kind}&id=${id}` }) }
function returnType(r: any) {
  const labels: Record<string, string> = { l2_to_l1: '二级退一级', user: '终端退货', l1_to_factory: '退原厂' }
  return r.typeLabel || labels[String(r.type || '')] || r.type || '退货'
}
function dimensionLabel(r: any) {
  const labels: Record<string, string> = { 'activate-direct': '直售激活', 'activate-dist': '分销激活', stock: '销售库存', scan: '扫码异常' }
  return labels[exceptionDimension(r)] || '异常'
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.pad { padding: 0 32rpx 24rpx; }
.pending { border-color: $rl-danger-border; background: #FFF9F9; }
.return-meta { display: flex; gap: 10rpx; margin-top: 10rpx; }
.type-chip, .reason-chip, .dimension-badge { display: inline-flex; align-items: center; padding: 5rpx 12rpx; border-radius: 9rpx; font-size: 19rpx; font-weight: 600; }
.type-chip { color: $rl-primary; background: $rl-primary-soft; }
.reason-chip { color: $rl-text-2; background: $rl-bg; }
.dimension-badge { margin-top: 10rpx; color: $rl-danger; background: $rl-danger-bg; }
</style>

