<template>
  <view class="mix">
    <view class="ring" :style="ringStyle">
      <view class="ring-core">
        <text class="num">{{ total }}</text>
        <text class="lab">合计</text>
      </view>
    </view>
    <view class="rows">
      <view v-for="it in items" :key="it.label" class="row">
        <view class="sw" :style="{ background: it.color || '#1A68D7' }" />
        <text class="name">{{ it.label }}</text>
        <text class="val">{{ it.value }}</text>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue'

type MixItem = { label: string; value: number | string; color?: string }
const props = withDefaults(defineProps<{ items?: MixItem[] }>(), { items: () => [] })
const palette = ['#1A68D7', '#E08A1E', '#1B9E5A', '#0EA5C8', '#7C5CF0']
const items = computed(() => (props.items || []).map((it, index) => ({
  label: it.label,
  value: Number(it.value) || 0,
  color: it.color || palette[index % palette.length],
})))
const total = computed(() => items.value.reduce((n, it) => n + it.value, 0))
const ringStyle = computed(() => {
  if (!total.value) return { background: 'conic-gradient(#E5E9F1 0 100%)' }
  let start = 0
  const stops = items.value.map((item) => {
    const end = start + item.value / total.value * 100
    const stop = `${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`
    start = end
    return stop
  })
  return { background: `conic-gradient(${stops.join(',')})` }
})
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.mix { display: flex; align-items: center; gap: 42rpx; padding: 18rpx 8rpx 8rpx; }
.ring { width: 218rpx; height: 218rpx; flex: none; padding: 34rpx; border-radius: 50%; box-shadow: inset 0 0 0 2rpx rgba(255,255,255,.5); }
.ring-core { width: 100%; height: 100%; border-radius: 50%; background: $rl-card; box-shadow: 0 4rpx 18rpx rgba(22,32,64,.10); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.num { font-size: 48rpx; font-weight: 800; line-height: 1; color: $rl-ink; }
.lab { font-size: 22rpx; color: $rl-text-3; margin-top: 8rpx; }
.rows { flex: 1; display: flex; flex-direction: column; gap: 18rpx; }
.row { display: flex; align-items: center; gap: 14rpx; }
.sw { width: 28rpx; height: 28rpx; border-radius: 8rpx; flex-shrink: 0; }
.name { flex: 1; font-size: 26rpx; color: $rl-text; }
.val { font-size: 32rpx; font-weight: 800; color: $rl-ink; }
</style>
