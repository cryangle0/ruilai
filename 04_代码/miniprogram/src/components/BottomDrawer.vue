<template>
  <view v-if="modelValue" class="mask" @click="close" @touchmove.stop.prevent>
    <view class="sheet" @click.stop>
      <view class="grab" />
      <view class="hd">
        <text class="ttl">{{ title }}</text>
        <text class="cancel" @click="close">取消</text>
      </view>
      <scroll-view scroll-y class="body" :show-scrollbar="false">
        <slot />
      </scroll-view>
      <view v-if="$slots.footer" class="ft">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  title?: string
}>(), { title: '' })
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
function close() { emit('update:modelValue', false) }
</script>
<style scoped lang="scss">
.mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(27, 36, 48, 0.36);
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  max-height: 86vh;
  background: #ffffff;
  border-radius: 28rpx 28rpx 0 0;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}
.grab {
  width: 72rpx;
  height: 8rpx;
  border-radius: 8rpx;
  background: #e5e5ea;
  margin: 16rpx auto 0;
}
.hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx 8rpx;
}
.ttl { font-size: 32rpx; font-weight: 800; color: #1B2430; }
.cancel { font-size: 28rpx; color: #8e8e93; padding: 8rpx 0 8rpx 24rpx; }
.body { max-height: 56vh; padding: 0 32rpx 8rpx; }
.ft { padding: 12rpx 32rpx 0; }
</style>
