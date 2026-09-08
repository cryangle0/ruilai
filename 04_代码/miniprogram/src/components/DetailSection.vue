<template>
  <view class="detail-section" :class="{ 'is-plain': !card }">
    <view class="detail-section__head">
      <view class="detail-section__heading">
        <view class="detail-section__mark" />
        <text class="detail-section__title">{{ title }}</text>
        <text v-if="count != null" class="detail-section__count">（{{ count }}）</text>
        <slot name="caption" />
      </view>
      <view v-if="$slots.action" class="detail-section__action"><slot name="action" /></view>
    </view>
    <view class="detail-section__body"><slot /></view>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  count?: number | string
  card?: boolean
}>(), {
  card: true,
})
</script>

<style scoped lang="scss">
@import '@/styles/theme.scss';
.detail-section {
  margin-bottom: 22rpx;
  padding: 22rpx 24rpx;
  border: 2rpx solid $rl-border;
  border-radius: $rl-radius-card;
  background: $rl-card;
  box-shadow: $rl-shadow-card;
}
.detail-section.is-plain {
  margin-bottom: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.detail-section__head {
  min-height: 28rpx;
  margin-bottom: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.detail-section__heading {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.detail-section__mark {
  width: 8rpx;
  height: 26rpx;
  flex: none;
  border-radius: 4rpx;
  background: $rl-gradient-primary-vertical;
}
.detail-section__title {
  color: $rl-text;
  font-size: $rl-font-base;
  font-weight: 700;
}
.detail-section__count {
  margin-left: -8rpx;
  color: $rl-text-3;
  font-size: 20rpx;
  font-weight: 500;
}
.detail-section__action { flex: none; }
.detail-section__body { color: $rl-text; font-size: $rl-font-sm; line-height: 1.6; }
</style>
