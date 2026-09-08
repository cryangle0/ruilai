<script lang="ts">
export default {
  options: { virtualHost: true },
}
</script>
<template>
  <view class="search" :class="{ compact }">
    <input
      class="inp"
      :value="modelValue"
      :placeholder="placeholder"
      placeholder-class="ph"
      confirm-type="search"
      @input="$emit('update:modelValue', ($event.detail as any).value)"
      @confirm="$emit('search')"
    />
    <view class="go" @click="$emit('search')">
      <view class="ico" />
    </view>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  compact?: boolean
}>(), { placeholder: '搜索', compact: false })
defineEmits<{ 'update:modelValue': [string]; search: [] }>()
</script>
<style scoped>
.search {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 12rpx 0 0;
  padding: 8rpx 8rpx 8rpx 20rpx;
  background: #FBFCFE;
  border: 2rpx solid #E3E9F2;
  border-radius: 12rpx;
}
.search.compact {
  margin: 0;
  height: 50rpx;
  padding: 0 6rpx 0 16rpx;
  gap: 8rpx;
  box-sizing: border-box;
}
.inp {
  flex: 1;
  width: 0;
  min-width: 0;
  max-width: 100%;
  height: 64rpx;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  font-size: 28rpx;
}
.compact .inp { height: 46rpx; line-height: 46rpx; font-size: 22rpx; }
.ph { color: #9AA4B2; }
.go {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #2B7BF0, #1A68D7);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.compact .go {
  width: 38rpx;
  height: 38rpx;
  border-radius: 10rpx;
}
.ico {
  width: 36rpx;
  height: 36rpx;
  background: #fff;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='M16.2 16.2 21 21' stroke-linecap='round'/%3E%3C/svg%3E") center/100% no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='M16.2 16.2 21 21' stroke-linecap='round'/%3E%3C/svg%3E") center/100% no-repeat;
}
.compact .ico { width: 24rpx; height: 24rpx; }
</style>
