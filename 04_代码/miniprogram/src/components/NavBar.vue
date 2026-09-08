<template>
  <view class="navbar-wrap">
    <view class="navbar" :class="{ brand: brand, back: showBack, plain: isPlain }">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
      <view v-if="brand" class="brand-bar">
        <view class="brand-main">
          <view class="brand-logo"><text>锐</text></view>
          <view class="brand-txt">
            <text class="brand-name">锐涞小程序</text>
            <text class="brand-sub">RUI LAI MINI</text>
          </view>
        </view>
        <slot name="brand-action" />
      </view>
      <view v-else-if="!isPlain" class="nav-content">
        <view v-if="showBack" class="nav-back" @click="onBack"><view class="back-icon" /></view>
        <slot name="title"><text class="nav-title">{{ title }}</text></slot>
        <view v-if="$slots.action" class="nav-action"><slot name="action" /></view>
      </view>
    </view>
    <view class="navbar-spacer" :style="{ height: barHeight }" />
  </view>
</template>
<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
const props = withDefaults(defineProps<{ title?: string; showBack?: boolean; brand?: boolean }>(), {
  title: '',
  showBack: false,
  brand: false,
})
const NAV_H = 96
const BRAND_H = 70
const slots = useSlots()
const statusBarHeight = ref(20)
try { statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20 } catch { /* */ }
const isPlain = computed(() => !props.brand && !props.showBack && !props.title && !slots.title && !slots.action)
const contentH = computed(() => {
  if (props.brand) return BRAND_H
  if (isPlain.value) return 0
  return NAV_H
})
const barHeight = computed(() => `calc(${statusBarHeight.value}px + ${contentH.value}rpx)`)
function onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/home/index' })
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 100;
  background: $rl-card;
  border-bottom: 1rpx solid $rl-border-soft;
}
.navbar.brand,
.navbar.plain {
  background: $rl-bg;
  border-bottom: none;
}
.navbar-wrap { flex-shrink: 0; }
.navbar-spacer { width: 100%; flex-shrink: 0; }
.brand-bar {
  height: $rl-brand-content-h;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx $rl-page-gutter 0;
}
.brand-main { min-width: 0; display: flex; align-items: center; gap: 14rpx; }
.brand-logo {
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
  background: $rl-gradient-primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $rl-shadow-brand;
}
.brand-txt { display: flex; flex-direction: column; }
.brand-name { font-size: $rl-font-md; font-weight: 700; color: $rl-text; line-height: 1; }
.brand-sub { font-size: 17rpx; color: $rl-text-3; letter-spacing: 1.6rpx; margin-top: 6rpx; }
.nav-content {
  height: $rl-nav-content-h;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 $rl-page-gutter;
}
.nav-back {
  position: absolute;
  left: $rl-page-gutter;
  width: 52rpx;
  height: 52rpx;
  border-radius: $rl-radius-sm;
  background: $rl-fill-muted;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.back-icon {
  width: 26rpx;
  height: 26rpx;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231A2B4A' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 5l-7 7 7 7'/%3E%3C/svg%3E") center/100% no-repeat;
}
.nav-title {
  font-size: $rl-font-md;
  font-weight: 700;
  color: $rl-text;
  padding: 0 140rpx;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.nav-action {
  position: absolute;
  right: $rl-page-gutter;
  z-index: 1;
}
</style>
