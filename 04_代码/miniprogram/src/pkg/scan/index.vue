<template>
  <view class="rl-page">
    <NavBar title="出货扫码" show-back />
    <view class="pad">
      <view v-if="!soId">
        <text class="desc">选择进行中的销售单后扫码</text>
        <button v-if="user.role!=='SUB'" class="btn-p" @click="goCreate">创建销售单</button>
        <Empty v-if="!openSos.length" text="暂无进行中出货单" />
        <ListCard v-for="s in openSos" :key="s.id" :title="s.no" :sub="`${(s.scanned||[]).length}/${s.planTotal||0}`" @click="pick(s.id)" />
      </view>
      <view v-else>
        <view class="card glass">
          <text class="no">{{ so.no }}</text>
          <text class="meta">已扫 {{ (so.scanned||[]).length }} / {{ so.planTotal || 0 }}{{ canConfirm ? '' : ' · 扫满计划后才可确认' }}</text>
        </view>
        <button class="btn-p" @click="doScan">扫描 SN</button>
        <view v-for="sn in (so.scanned||[])" :key="sn" class="sn glass">{{ sn }}</view>
        <button v-if="canConfirm" class="btn-ok" @click="confirm">确认出货</button>
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

const user = useUserStore()
const soId = ref('')
const so = ref<any>({})
const openSos = ref<any[]>([])
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
async function doScan() {
  try {
    const sn = await scanOrPrompt()
    so.value = (await miniApi.scan(soId.value, sn)).data
    uni.showToast({ title: '已扫入', icon: 'success' })
  } catch (e: any) {
    if (e?.message === 'cancel' || e?.message === 'empty') return
  }
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
.no { display: block; font-weight: 800; font-size: 32rpx; }
.meta { color: #8e8e93; }
.sn { padding: 20rpx; border-radius: 16rpx; margin-bottom: 8rpx; font-family: ui-monospace, monospace; }
.btn-p, .btn-ok { margin: 12rpx 0; border-radius: 999rpx; font-weight: 700; }
.btn-p { background: #1A68D7; color: #fff; }
.btn-ok { background: #1c1c1e; color: #fff; }
.btn-p::after, .btn-ok::after { border: 0; }
</style>
