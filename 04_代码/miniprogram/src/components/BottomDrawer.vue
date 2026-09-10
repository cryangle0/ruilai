<template>
  <view v-if="modelValue" class="mask">
    <view class="mask-dim" @click="close" @touchmove.stop.prevent />
    <view class="sheet" @click.stop>
      <view class="grab" />
      <view class="hd">
        <text class="ttl">{{ title }}</text>
        <text class="cancel" @click="close">取消</text>
      </view>
      <view class="body">
        <view class="body-inner">
          <slot />
        </view>
      </view>
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
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.mask-dim {
  flex: 1 1 auto;
  background: rgba(27, 36, 48, 0.36);
}
.sheet {
  width: 100%;
  max-width: 100%;
  max-height: 86vh;
  overflow: hidden;
  background: #ffffff;
  border-radius: 28rpx 28rpx 0 0;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
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
  gap: 16rpx;
  padding: 16rpx 32rpx 8rpx;
  max-width: 100%;
  box-sizing: border-box;
}
.ttl { min-width: 0; font-size: 32rpx; font-weight: 800; color: #1B2430; }
.cancel { flex: none; font-size: 28rpx; color: #8e8e93; padding: 8rpx 0 8rpx 24rpx; }
.body {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  height: 62vh;
  max-height: 62vh;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.body-inner {
  padding: 0 32rpx 48rpx;
  height: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.ft {
  padding: 12rpx 32rpx 0;
  max-width: 100%;
  box-sizing: border-box;
}
</style>
