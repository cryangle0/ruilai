<template>
  <view class="rl-page">
    <NavBar title="出货扫码" show-back />
    <view class="pad">
      <view v-if="!soId">
        <text class="desc">选择进行中的销售单后扫码</text>
        <button v-if="user.role!=='SUB'" class="btn-p" @click="goCreate">创建销售单</button>
        <Empty v-if="!openSos.length" />
        <ListCard v-for="s in openSos" :key="s.id" :title="s.no" :sub="`${salesScanSummary(s).product} · ${salesScanSummary(s).progress}`" @click="pick(s.id)" />
      </view>
      <view v-else>
        <view class="card glass">
          <text class="so-no">{{ so.no }}</text>
          <text class="meta">已扫 {{ (so.scanned||[]).length }} / {{ so.planTotal || 0 }}{{ canConfirm ? '' : ' · 扫满计划后才可确认' }}</text>
        </view>
        <view class="btn-p" @click="doScan">扫描 SN</view>
        <view class="manual glass">
          <view class="field">
            <text class="lab">手动输入 SN</text>
            <input
              class="inp"
              :value="manualSn"
              placeholder="输入后加入本单"
              placeholder-class="ph"
              confirm-type="done"
              :adjust-position="true"
              :hold-keyboard="true"
              :always-embed="true"
              :cursor-spacing="32"
              data-echo="1"
              @input="onManualInput"
            />
          </view>
          <view class="btn-add" @click="doManual">输入加入</view>
        </view>
        <view v-for="sn in (so.scanned||[])" :key="sn" class="sn glass">{{ sn }}</view>
        <view v-if="canConfirm" class="btn-ok" @click="confirm">确认出货</view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Empty from '@/components/Empty.vue'
import ListCard from '@/components/ListCard.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { scanOrPrompt } from '@/utils/scan'
import { salesScanSummary } from '@/utils/miniPages'
import { inputEventValue } from '@/utils/inputValue'

const user = useUserStore()
const soId = ref('')
const so = ref<any>({})
const openSos = ref<any[]>([])
const manualSn = ref('')
const canConfirm = computed(() => {
  if (user.role === 'SUB') return false
  const n = (so.value.scanned || []).length
  const plan = Number(so.value.planTotal) || 0
  return n > 0 && (plan === 0 || n >= plan)
})

onLoad(async (q) => {
  if (!user.ensureLogin()) return
  if (user.role === 'L2') {
    uni.redirectTo({ url: '/pkg/bind/index' })
    return
  }
  if (q?.mode === 'direct') {
    uni.redirectTo({ url: '/pkg/bind/index' })
    return
  }
  if (q?.soId) {
    soId.value = q.soId
    await reload()
  } else {
    const res = await miniApi.sales({ status: 'scanning', channel: 'distribute', pageSize: 30 })
    openSos.value = res.data.list || []
  }
})

async function reload() {
  so.value = (await miniApi.sale(soId.value)).data
}
function pick(id: string) {
  soId.value = id
  reload()
}
function goCreate() { uni.navigateTo({ url: '/pkg/purchase/index?kind=sales' }) }
function onManualInput(event: unknown) {
  manualSn.value = inputEventValue(event, manualSn.value)
}
async function doScan() {
  try {
    const sn = await scanOrPrompt()
    so.value = (await miniApi.scan(soId.value, sn)).data
    uni.showToast({ title: '已扫入', icon: 'success' })
  } catch (e: any) {
    if (e?.message === 'cancel' || e?.message === 'empty') return
  }
}
async function doManual() {
  const sn = manualSn.value.trim().toUpperCase()
  if (!sn) {
    uni.showToast({ title: '请输入 SN', icon: 'none' })
    return
  }
  so.value = (await miniApi.scan(soId.value, sn)).data
  manualSn.value = ''
  uni.showToast({ title: '已加入', icon: 'success' })
}
async function confirm() {
  await miniApi.confirm(soId.value)
  uni.showToast({ title: '出货完成', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 500)
}
</script>
<style scoped lang="scss">
.pad { padding: 22rpx 32rpx; }
.desc { display: block; color: #636366; margin-bottom: 12rpx; }
.card { padding: 28rpx; border-radius: 20rpx; margin-bottom: 16rpx; }
.so-no { display: block; font-weight: 800; font-size: 32rpx; }
.meta { color: #8e8e93; }
.sn { padding: 20rpx; border-radius: 16rpx; margin-bottom: 8rpx; font-family: ui-monospace, monospace; }
.manual { margin: 0 0 18rpx; padding: 0 22rpx 20rpx; border-radius: 18rpx; }
.field { padding: 18rpx 0; border-bottom: 2rpx solid #E5E9F1; }
.lab { display: block; font-size: 22rpx; color: #9AA4B2; margin-bottom: 8rpx; }
.inp {
  display: block;
  width: 100%;
  height: 56rpx;
  min-height: 56rpx;
  padding: 0;
  margin: 0;
  color: #1A2B4A;
  font-size: 30rpx;
  line-height: 56rpx;
  background: transparent;
}
.ph { color: #9AA4B2; }
.btn-add {
  margin-top: 14rpx;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  background: rgba(26,104,215,.1);
  color: #1A68D7;
  border-radius: 14rpx;
  font-weight: 700;
}
.btn-p, .btn-ok { margin: 12rpx 0; height: 80rpx; line-height: 80rpx; text-align: center; border-radius: 999rpx; font-weight: 700; }
.btn-p { background: #1A68D7; color: #fff; }
.btn-ok { background: #1c1c1e; color: #fff; }
</style>
