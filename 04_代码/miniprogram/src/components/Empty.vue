<template>
  <view class="empty">
    <Icon name="empty" :size="72" color="#9AA4B2" />
    <text>{{ text }}</text>
  </view>
</template>
<script setup lang="ts">
import Icon from '@/components/Icon.vue'
withDefaults(defineProps<{ text?: string }>(), { text: '暂无数据' })
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.empty {
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
</style>
