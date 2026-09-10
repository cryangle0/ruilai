<template>
  <view class="tabbar">
    <view class="inner">
      <view v-for="item in items" :key="item.key" class="tab" :class="{ on: current === item.key }" @click="go(item)">
        <view class="ico" :style="maskStyle(item.icon)" />
        <text>{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { ICON_MASKS, type IconName } from '@/utils/iconMasks'
const props = defineProps<{ current: string }>()
const emit = defineEmits<{ select: [string] }>()
const user = useUserStore()
type TabItem = { key: string; text: string; icon: IconName; url: string }
const items = computed<TabItem[]>(() => {
  const role = user.role
  if (role === 'SUB') return [
    { key: 'home', text: '扫码', icon: 'scan', url: '/pages/home/index' },
    { key: 'mine', text: '我的', icon: 'mine', url: '/pages/mine/index' },
  ]
  if (role === 'L2') return [
    { key: 'home', text: '首页', icon: 'home', url: '/pages/home/index' },
    { key: 'biz', text: '销售', icon: 'biz', url: '/pages/biz/index' },
    { key: 'stock', text: '库存', icon: 'stock', url: '/pages/stock/index' },
    { key: 'service', text: '售后', icon: 'service', url: '/pages/service/index' },
    { key: 'mine', text: '我的', icon: 'mine', url: '/pages/mine/index' },
  ]
  return [
    { key: 'home', text: '首页', icon: 'home', url: '/pages/home/index' },
    { key: 'biz', text: '业务', icon: 'biz', url: '/pages/biz/index' },
    { key: 'stock', text: '库存', icon: 'stock', url: '/pages/stock/index' },
    { key: 'service', text: '售后', icon: 'service', url: '/pages/service/index' },
    { key: 'mine', text: '我的', icon: 'mine', url: '/pages/mine/index' },
  ]
})
function maskStyle(name: IconName) {
  const url = `url("${ICON_MASKS[name]}")`
  return { webkitMaskImage: url, maskImage: url }
}
function go(item: { key: string; url: string }) {
  emit('select', item.key)
  if (props.current === item.key) return
  uni.switchTab({ url: item.url })
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: $rl-card;
  border-top: 1rpx solid $rl-border-soft;
  padding: 14rpx 0 calc(20rpx + env(safe-area-inset-bottom));
}
.inner {
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  min-height: 0;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5rpx;
  min-height: 68rpx;
  font-size: 20rpx;
  color: $rl-text-tertiary;
  font-weight: 500;
}
.tab.on { color: $rl-primary; font-weight: 700; }
.ico {
  width: 46rpx;
  height: 44rpx;
  background: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
</style>
