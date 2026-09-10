<template>
  <view class="paged-state">
    <view v-if="loading" class="paged-state__panel">
      <view class="paged-state__spinner" />
      <text class="paged-state__title">{{ loadingText }}</text>
    </view>

    <view v-else-if="error" class="paged-state__panel is-error">
      <view class="paged-state__symbol">!</view>
      <text class="paged-state__title">{{ errorTitle }}</text>
      <text class="paged-state__desc">{{ error }}</text>
      <button class="paged-state__button" @click="$emit('retry')">{{ retryText }}</button>
    </view>

    <view v-else-if="empty" class="paged-state__empty-panel">
      <Empty />
      <slot name="empty-action" />
    </view>

    <template v-else>
      <slot />
      <view v-if="loadingMore" class="paged-state__footer">
        <view class="paged-state__spinner small" />
        <text>{{ loadingMoreText }}</text>
      </view>
      <view v-else-if="hasMore" class="paged-state__footer">
        <button class="paged-state__more" @click="$emit('load-more')">{{ loadMoreText }}</button>
      </view>
      <view v-else-if="showEnd" class="paged-state__footer">{{ noMoreText }}</view>
    </template>

    <view v-if="submitting" class="paged-state__submitting">
      <view class="paged-state__submit-card">
        <view class="paged-state__spinner" />
        <text>{{ submittingText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import Empty from '@/components/Empty.vue'

withDefaults(defineProps<{
  loading?: boolean
  empty?: boolean
  error?: string
  hasMore?: boolean
  loadingMore?: boolean
  submitting?: boolean
  showEnd?: boolean
  loadingText?: string
  errorTitle?: string
  retryText?: string
  loadMoreText?: string
  loadingMoreText?: string
  noMoreText?: string
  submittingText?: string
}>(), {
  loading: false,
  empty: false,
  error: '',
  hasMore: false,
  loadingMore: false,
  submitting: false,
  showEnd: false,
  loadingText: '加载中',
  errorTitle: '加载失败',
  retryText: '重新加载',
  loadMoreText: '加载更多',
  loadingMoreText: '正在加载',
  noMoreText: '没有更多了',
  submittingText: '正在提交',
})

defineEmits<{
  retry: []
  'load-more': []
}>()
</script>

<style scoped lang="scss">
@import '@/styles/theme.scss';
.paged-state { position: relative; min-height: 1rpx; }
.paged-state__empty-panel { min-height: 280rpx; text-align: center; }
.paged-state__panel {
  min-height: 280rpx;
  padding: 54rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $rl-text-3;
  text-align: center;
}
.paged-state__spinner {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 18rpx;
  border: 4rpx solid $rl-border;
  border-top-color: $rl-primary;
  border-radius: 50%;
  animation: paged-spin .8s linear infinite;
}
.paged-state__spinner.small { width: 26rpx; height: 26rpx; margin: 0; border-width: 3rpx; }
.paged-state__title { color: $rl-text-2; font-size: $rl-font-sm; font-weight: 600; }
.paged-state__desc {
  max-width: 560rpx;
  margin-top: 10rpx;
  color: $rl-text-3;
  font-size: $rl-font-xs;
  line-height: 1.5;
}
.paged-state__symbol {
  width: 56rpx;
  height: 56rpx;
  margin-bottom: 18rpx;
  border-radius: 50%;
  background: $rl-danger-bg;
  color: $rl-danger;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 700;
}
.paged-state__button,
.paged-state__more {
  min-width: 176rpx;
  height: 64rpx;
  margin-top: 22rpx;
  padding: 0 28rpx;
  border: 2rpx solid $rl-primary-border;
  border-radius: $rl-radius-md;
  background: $rl-primary-softer;
  color: $rl-primary;
  font-size: $rl-font-xs;
  font-weight: 600;
  line-height: 60rpx;
}
.paged-state__button::after,
.paged-state__more::after { border: 0; }
.paged-state__footer {
  min-height: 84rpx;
  padding: 18rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: $rl-text-3;
  font-size: $rl-font-xs;
}
.paged-state__more { margin-top: 0; }
.paged-state__submitting {
  position: fixed;
  z-index: 120;
  inset: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(27, 36, 48, .2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.paged-state__submit-card {
  min-width: 196rpx;
  padding: 28rpx 32rpx;
  border-radius: $rl-radius-lg;
  background: $rl-card;
  box-shadow: $rl-shadow-pop;
  color: $rl-text-2;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: $rl-font-sm;
}
@keyframes paged-spin { to { transform: rotate(360deg); } }
</style>
