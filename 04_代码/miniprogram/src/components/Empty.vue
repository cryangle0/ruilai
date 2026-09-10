<template>
  <EmptyStateContent />
</template>
<script setup lang="ts">
import EmptyStateContent from '@/components/EmptyStateContent'
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
:deep(.empty-state__content) {
  min-height: 280rpx;
  padding: 54rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  color: $rl-text-3;
  font-size: $rl-font-sm;
}
:deep(.empty-state__icon) {
  position: relative;
  width: 58rpx;
  height: 62rpx;
  margin-bottom: 8rpx;
}
:deep(.empty-state__icon-lid) {
  position: absolute;
  top: 0;
  left: 8rpx;
  width: 42rpx;
  height: 8rpx;
  border-radius: 4rpx 4rpx 2rpx 2rpx;
  background: $rl-text-3;
}
:deep(.empty-state__icon-lid::before) {
  content: '';
  position: absolute;
  top: -6rpx;
  left: 12rpx;
  width: 18rpx;
  height: 6rpx;
  border-radius: 4rpx 4rpx 0 0;
  background: $rl-text-3;
}
:deep(.empty-state__icon-bin) {
  position: absolute;
  top: 12rpx;
  left: 10rpx;
  width: 38rpx;
  height: 44rpx;
  border-radius: 2rpx 2rpx 8rpx 8rpx;
  background: $rl-text-3;
}
:deep(.empty-state__text) {
  color: $rl-text-3;
  font-size: $rl-font-sm;
}
</style>
