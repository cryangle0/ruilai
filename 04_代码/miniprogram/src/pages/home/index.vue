<template>
  <view class="rl-page">
    <NavBar v-if="user.role === 'SUB'" title="销售扫码" />
    <NavBar v-else brand />
    <view class="pad">
      <PagedState
        v-if="loading || error"
        :loading="loading"
        :error="error"
        @retry="loadAll"
      />
      <template v-else-if="user.role === 'SUB'">
        <text class="mini-page-desc">子账号仅可扫码出货，不可改单</text>
        <button class="btn-p" @click="goScanSo()">出货扫码</button>
        <view v-if="!openSos.length"><Empty text="暂无进行中出货单" /></view>
        <ListCard
          v-for="s in openSos" :key="s.id"
          :title="s.no"
          :sub="`${(s.scanned||[]).length}/${s.planTotal || 0}`"
          @click="goScanSo(s.id)"
        >
          <view class="progress"><view class="progress-in" :style="{ width: progress(s) }" /></view>
        </ListCard>
      </template>
      <template v-else>
        <view class="hero">
          <view class="wave" />
          <view class="wave2" />
          <text class="hello">{{ greet }}</text>
          <text class="who">{{ user.user?.name }}</text>
          <text class="role">{{ roleLabel }}</text>
          <text class="sub">{{ user.role === 'L2' ? '本级经营概览 · 可按区间筛选' : '本级及下属二级概览 · 可按区间筛选' }}</text>
        </view>
        <SegBar v-model="panel" :items="homeSegs" />
        <view v-if="panel === 'dash'">
          <view class="filter-panel">
            <DateBar embedded v-model:from="from" v-model:to="to">
              <FormPicker
                v-if="user.role === 'L1'"
                :compact="true"
                v-model="childL2"
                :options="l2Options"
                placeholder="全部下属二级"
              />
            </DateBar>
          </view>
          <text class="hint">{{ scopeHint }} · {{ rangeHint }}</text>
          <view class="pair">
            <view class="kpi glass" data-kpi="purchase" @click="goKpi('purchase')">
              <view v-if="home.pendingPo" class="badge">{{ home.pendingPo }}</view>
              <text class="k">{{ user.role === 'L2' || childL2 ? '到货采购' : '采购统计' }}</text>
              <view class="duo"><text>区间 <text class="n">{{ home.purchaseRange || 0 }}</text></text><text>累计 <text class="n">{{ home.purchaseAll || 0 }}</text></text></view>
            </view>
            <view class="kpi glass" data-kpi="sales" @click="goKpi('sales')">
              <text class="k">{{ user.role === 'L2' || childL2 ? 'C端销售' : '销售统计' }}</text>
              <view class="duo"><text>区间 <text class="n">{{ home.salesRange || 0 }}</text></text><text>累计 <text class="n">{{ home.salesAll || 0 }}</text></text></view>
            </view>
          </view>
          <view v-if="user.role === 'L1' && !childL2" class="pair">
            <view class="kpi glass" data-kpi="dist" @click="goKpi('dist')">
              <text class="k">区间分销</text>
              <view class="duo"><text>区间 <text class="n">{{ home.distRange || 0 }}</text></text><text>累计 <text class="n">{{ home.distAll || 0 }}</text></text></view>
            </view>
            <view class="kpi glass" data-kpi="direct" @click="goKpi('direct')">
              <text class="k">区间直售</text>
              <view class="duo"><text>区间 <text class="n">{{ home.directRange || 0 }}</text></text><text>累计 <text class="n">{{ home.directAll || 0 }}</text></text></view>
            </view>
          </view>
          <view class="pair">
            <view class="kpi glass" data-kpi="return" @click="goKpi('return')">
              <view v-if="home.pendingReturn" class="badge">{{ home.pendingReturn }}</view>
              <text class="k">退货</text>
              <view class="duo"><text>区间 <text class="n">{{ home.returnRange || 0 }}</text></text><text>累计 <text class="n">{{ home.returnAll || 0 }}</text></text></view>
            </view>
            <view class="kpi glass" data-kpi="activation" @click="goKpi('activation')">
              <text class="k">激活绑定</text>
              <view class="duo"><text>区间 <text class="n">{{ home.actRange || 0 }}</text></text><text>累计 <text class="n">{{ home.actAll || 0 }}</text></text></view>
            </view>
          </view>
          <view class="stock glass" @click="goTab('/pages/stock/index')">
            <view>
              <text class="k">当前在库</text>
              <text class="hint">{{ stockHint }} · 实时快照</text>
            </view>
            <view class="stock-value"><text class="n big">{{ home.stockQty || 0 }}</text><text v-if="home.scanningSo" class="todo">进行中 {{ home.scanningSo }}</text></view>
          </view>
          <view class="chart glass">
            <SegBar variant="seg" v-model="chartTab" :items="chartSegs" />
            <swiper class="chart-swiper" :current="chartIndex" @change="onChartSwipe">
              <swiper-item v-for="item in chartSegs" :key="item.id">
                <view class="chart-slide">
                  <view class="chart-hd">
                    <text class="t">{{ chartTitleOf(item.id) }}</text>
                    <text class="s">{{ item.id === 'trend' ? trendGrain : item.id === 'stock' ? '当前 SN' : '按区间' }}</text>
                  </view>
                  <TrendLine v-if="item.id === 'trend'" :labels="dayLabels" :purchase="trendPurchase" :sales="trendSales" />
                  <ChannelMix v-else-if="item.id === 'channel' || item.id === 'stock'" :items="item.id === 'stock' ? stockMix : channelPie" />
                  <HBarList v-else-if="item.id === 'product'" :items="productBars" />
                  <HBarList v-else :items="l2Rank" />
                </view>
              </swiper-item>
            </swiper>
          </view>
        </view>
        <view v-else>
          <view v-if="user.role === 'L2'" class="alert glass">出库不适用（二级不发货给下级）· 本页仅做直销激活</view>
          <text v-else class="mini-page-desc">出货扫码 / 直销激活</text>
          <view class="modes">
            <view v-if="user.role !== 'L2'" class="mode glass" :class="{ on: scanMode==='ship' }" @click="scanMode='ship'">
              <Icon name="scan" :size="40" />
              <text class="mt">出货扫码</text><text class="ms">分销给二级</text>
            </view>
            <view class="mode glass" :class="{ on: scanMode==='direct' }" @click="scanMode='direct'">
              <Icon name="customers" :size="40" />
              <text class="mt">直销激活</text><text class="ms">先扫码再填客户</text>
            </view>
          </view>
          <button v-if="scanMode==='direct'" class="btn-p" @click="goBind">扫描 SN 激活</button>
          <template v-else>
            <button class="btn-p" @click="goCreateSo">创建销售单</button>
            <view v-if="!openSos.length"><Empty text="暂无进行中出货单" /></view>
            <ListCard
              v-for="s in openSos" :key="s.id"
              :title="s.no"
              :sub="salesScanSummary(s).product"
              @click="goScanSo(s.id)"
            >
              <view class="scan-progress-row">
                <text>扫描进度</text>
                <text>{{ salesScanSummary(s).progress }}</text>
              </view>
              <view class="progress"><view class="progress-in" :style="{ width: progress(s) }" /></view>
            </ListCard>
          </template>
        </view>
      </template>
    </view>
    <TabBar current="home" />
  </view>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import TabBar from '@/components/TabBar.vue'
import SegBar from '@/components/SegBar.vue'
import Empty from '@/components/Empty.vue'
import ListCard from '@/components/ListCard.vue'
import Icon from '@/components/Icon.vue'
import DateBar from '@/components/DateBar.vue'
import FormPicker from '@/components/FormPicker.vue'
import PagedState from '@/components/PagedState.vue'
import TrendLine from '@/components/TrendLine.vue'
import ChannelMix from '@/components/ChannelMix.vue'
import HBarList from '@/components/HBarList.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { greetingText, ROLE_LABEL, ruilaiShareMessage } from '@/utils/constants'
import { datePresetRange } from '@/utils/dates'
import { createNavigationIntent, salesScanSummary } from '@/utils/miniPages'

const month = datePresetRange('month')
const user = useUserStore()
onShareAppMessage(() => ruilaiShareMessage())
const home = ref<Record<string, any>>({})
const openSos = ref<any[]>([])
const panel = ref('dash')
const scanMode = ref('ship')
const loading = ref(true)
const error = ref('')
const from = ref(month.from)
const to = ref(month.to)
const childL2 = ref('')
const l2s = ref<any[]>([])
const greet = computed(() => greetingText())
const roleLabel = computed(() => ROLE_LABEL[user.role] || user.role)
const l2Options = computed(() => [
  { label: '全部下属二级', value: '' },
  ...l2s.value.map((a) => ({ label: a.name, value: a.id })),
])
const scopeHint = computed(() => {
  if (user.role === 'L2') return '仅本级'
  if (childL2.value) {
    const a = l2s.value.find((x) => x.id === childL2.value)
    return a ? `下属 ${a.name}` : '下属二级'
  }
  return '本级及下属二级'
})
const stockHint = computed(() => {
  if (user.role === 'L2') return '仅本级仓库'
  if (childL2.value) {
    const a = l2s.value.find((x) => x.id === childL2.value)
    return a ? `${a.name}仓库` : '该二级仓库'
  }
  return '仅本级仓库（不含下属二级）'
})
const rangeHint = computed(() => {
  if (!from.value && !to.value) return '全部'
  return from.value === to.value ? from.value : `${from.value} ~ ${to.value}`
})
const dayLabels = computed(() => home.value.dayLabels || [])
const trendPurchase = computed(() => home.value.trendPurchase || [])
const trendSales = computed(() => home.value.trendSales || [])
const trendGrain = computed(() => home.value.trendGrain || '按日')
const channelPie = computed(() => home.value.channelPie || [])
const productBars = computed(() => home.value.productBars || [])
const l2Rank = computed(() => home.value.l2Rank || [])
const showL2Rank = computed(() => user.role === 'L1' && !childL2.value)
const channelTitle = computed(() => (user.role === 'L2' || childL2.value) ? '到货 / C端' : '分销 / 直售')
const stockMix = computed(() => home.value.snStatus || [])
const chartTab = ref('trend')
const homeSegs = computed(() => [
  { id: 'dash', title: '数据' },
  { id: 'scan', title: '扫码' },
])
const chartSegs = computed(() => [
  { id: 'trend', title: '趋势' },
  { id: 'channel', title: '渠道' },
  { id: 'product', title: '商品' },
  showL2Rank.value
    ? { id: 'l2', title: '二级排行' }
    : (stockMix.value.length ? { id: 'stock', title: '库存构成' } : null),
].filter(Boolean) as Array<{ id: string; title: string }>)
const chartIndex = computed(() => Math.max(0, chartSegs.value.findIndex((item) => item.id === chartTab.value)))
function chartTitleOf(tab: string) {
  return ({
  trend: '采购 / 销售趋势',
  channel: channelTitle.value,
  product: '商品销量',
  l2: '下属二级销量',
  stock: '库存构成',
  } as Record<string, string>)[tab] || '经营图表'
}
function onChartSwipe(e: any) {
  chartTab.value = chartSegs.value[Number(e.detail.current)]?.id || 'trend'
}

async function loadDash() {
  loading.value = true
  error.value = ''
  try {
    home.value = (await miniApi.home({ from: from.value, to: to.value, l2Id: childL2.value || undefined })).data || {}
  } catch (e: any) {
    error.value = e?.message || '首页数据加载失败'
  }
  loading.value = false
}

async function loadAll() {
  if (user.role === 'SUB') {
    loading.value = true
    error.value = ''
    try {
      const res = await miniApi.sales({ status: 'scanning', channel: 'distribute', pageSize: 100 })
      openSos.value = res.data.list || []
    } catch (e: any) {
      openSos.value = []
      error.value = e?.message || '扫码单据加载失败'
    } finally { loading.value = false }
    return
  }
  if (user.role === 'L1') {
    try { l2s.value = (await miniApi.agentsL2({ pageSize: 100 })).data.list || [] } catch { l2s.value = [] }
  }
  await loadDash()
  try {
    const res = await miniApi.sales({ status: 'scanning', channel: 'distribute', pageSize: 100 })
    openSos.value = res.data.list || []
  } catch (e: any) {
    openSos.value = []
    error.value ||= e?.message || '进行中销售单加载失败'
  }
}

onShow(async () => {
  if (!user.ensureLogin()) return
  if (user.role === 'L2') scanMode.value = 'direct'
  await loadAll()
})
watch([from, to, childL2], () => {
  if (user.role === 'SUB') return
  loadDash()
})

function goTab(url: string) { uni.switchTab({ url }) }
function goKpi(kind: string) {
  if (kind === 'return') {
    createNavigationIntent({ target: 'service', tab: 'return', from: from.value, to: to.value, l2Id: childL2.value })
    goTab('/pages/service/index')
    return
  }
  if (kind === 'activation') {
    createNavigationIntent({ target: 'service', tab: 'exception', dimension: user.role === 'L2' ? 'activate-dist' : 'activate-direct', from: from.value, to: to.value, l2Id: childL2.value })
    goTab('/pages/service/index')
    return
  }
  const tab = kind === 'direct' || ((user.role === 'L2' || childL2.value) && kind === 'sales') ? 'cend' : kind === 'purchase' && (user.role === 'L2' || childL2.value) ? 'sales' : kind === 'purchase' ? 'purchase' : 'sales'
  createNavigationIntent({ target: 'biz', tab, from: from.value, to: to.value, l2Id: childL2.value })
  goTab('/pages/biz/index')
}
function progress(s: any) {
  const total = Number(s.planTotal) || 0
  return `${total ? Math.min(100, ((s.scanned || []).length / total) * 100) : 0}%`
}
function goScanSo(id?: string) {
  uni.navigateTo({ url: `/pkg/scan/index?mode=ship${id ? `&soId=${id}` : ''}` })
}
function goBind() { uni.navigateTo({ url: '/pkg/bind/index' }) }
function goCreateSo() { uni.navigateTo({ url: '/pkg/purchase/index?kind=sales' }) }
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.rl-page { min-height: 0; padding-bottom: calc(128rpx + env(safe-area-inset-bottom)); }
.pad { padding: 0 32rpx 8rpx; }
.hero {
  position: relative;
  overflow: hidden;
  padding: 28rpx 36rpx 30rpx;
  border-radius: 26rpx;
  margin: 22rpx 0 0;
  background: linear-gradient(135deg, #1A68D7 0%, #2B7BF0 58%, #54A0F8 100%);
  color: #fff;
}
.wave {
  position: absolute;
  right: -30rpx;
  bottom: -46rpx;
  width: 280rpx;
  height: 280rpx;
  border-radius: 36% 64% 55% 45% / 52% 42% 58% 48%;
  background: rgba(255,255,255,.08);
  transform: rotate(24deg);
}
.wave2 {
  position: absolute;
  right: 120rpx;
  bottom: -90rpx;
  width: 240rpx;
  height: 240rpx;
  border-radius: 44% 56% 48% 52% / 58% 48% 52% 42%;
  background: rgba(255,255,255,.06);
  transform: rotate(-18deg);
}
.hello { position: relative; z-index: 1; font-size: 24rpx; color: rgba(255,255,255,.82); }
.who { position: relative; z-index: 1; display: block; font-size: 44rpx; font-weight: 700; margin-top: 10rpx; color: #fff; }
.role { position: relative; z-index: 1; display: inline-flex; margin: 10rpx 0 4rpx; padding: 4rpx 12rpx; border-radius: 999rpx; background: rgba(255,255,255,.16); color: #fff; font-size: 20rpx; }
.sub { position: relative; z-index: 1; font-size: 22rpx; color: rgba(255,255,255,.78); }
.filter-panel { margin-top: 18rpx; padding: 20rpx 22rpx; border: 2rpx solid $rl-border; border-radius: 20rpx; background: #fff; box-shadow: $rl-shadow-card; }
.hint { display: block; font-size: 20rpx; color: #8A97AD; margin: 16rpx 4rpx 0; }
.box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  height: 50rpx;
  padding: 0 18rpx;
  border-radius: 12rpx;
  background: #FBFCFE;
  border: 2rpx solid #E3E9F2;
  font-size: 22rpx;
  color: #1A2B4A;
}
.pair { display: flex; gap: 16rpx; margin-top: 16rpx; }
.kpi { flex: 1; padding: 18rpx 22rpx; border-radius: 20rpx; position: relative; overflow: visible; }
.badge {
  @include rl-corner-badge;
  top: 8rpx;
  right: 8rpx;
  min-width: 28rpx;
  height: 28rpx;
  border-radius: 14rpx;
  font-size: 16rpx;
  line-height: 28rpx;
}
.k {
  display: flex;
  align-items: center;
  gap: 9rpx;
  font-size: 22rpx;
  color: #7A879C;
  font-weight: 500;
  margin-bottom: 0;
}
.k::before {
  content: "";
  width: 10rpx;
  height: 10rpx;
  border-radius: 3rpx;
  background: #1A68D7;
  flex-shrink: 0;
}
.duo { display: flex; margin-top: 14rpx; font-size: 18rpx; color: #9AA6BA; }
.duo > text { flex: 1; }
.duo > text + text { border-left: 2rpx solid #EEF1F6; padding-left: 22rpx; }
.n { display: block; font-size: 38rpx; font-weight: 700; color: #1A2B4A; margin-top: 4rpx; line-height: 1; }
.chart { padding: 18rpx 22rpx 20rpx; border-radius: 20rpx; margin-top: 16rpx; }
.chart-swiper { height: 430rpx; margin-top: 16rpx; }
.chart-slide { height: 100%; overflow: hidden; }
.chart-hd { display: flex; justify-content: space-between; align-items: baseline; gap: 12rpx; margin-bottom: 16rpx; }
.chart-hd .t { font-size: 25rpx; font-weight: 700; color: #1A2B4A; }
.chart-hd .s { font-size: 19rpx; color: #8A97AD; }
.stock { display: flex; justify-content: space-between; align-items: center; padding: 22rpx 26rpx; border-radius: 20rpx; margin-top: 16rpx; }
.stock .k { font-size: 25rpx; font-weight: 700; color: #1A2B4A; }
.stock .k::before { display: none; }
.stock .hint { margin: 7rpx 0 0; }
.big { font-size: 54rpx; color: #1A68D7; }
.stock-value { display: flex; flex-direction: column; align-items: flex-end; gap: 6rpx; }
.todo { color: $rl-warning; font-size: 20rpx; font-weight: 600; }
.alert { padding: 20rpx; border-radius: 16rpx; margin: 16rpx 0; color: $rl-text-2; font-size: 24rpx; }
.modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24rpx; margin: 24rpx 0 30rpx; }
.mode { min-width: 0; padding: 30rpx 28rpx; border-radius: 20rpx; display: flex; flex-direction: column; gap: 10rpx; }
.mode.on { border-color: $rl-primary; background: #F5F9FF; }
.mt { display: block; font-weight: 700; }
.ms { font-size: 22rpx; color: $rl-text-3; }
.btn-p { margin: 20rpx 0 28rpx; background: $rl-primary; color: #fff; border-radius: 16rpx; font-weight: 700; }
.btn-p::after { border: 0; }
.scan-progress-row { display: flex; justify-content: space-between; margin-top: 16rpx; color: $rl-text-2; font-size: 21rpx; }
.progress { height: 12rpx; margin-top: 16rpx; overflow: hidden; border-radius: 6rpx; background: #EEF2F8; }
.progress-in { height: 100%; border-radius: 6rpx; background: $rl-gradient-primary; }
</style>
