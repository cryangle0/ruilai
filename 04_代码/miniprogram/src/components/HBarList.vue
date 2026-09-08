<template>
  <view v-if="!rows.length" class="empty">暂无数据</view>
  <view v-else class="bars">
    <view v-for="it in rows" :key="it.label" class="row">
      <text class="lab">{{ it.label }}</text>
      <view class="track">
        <view class="fill" :style="{ width: pct(it.value) + '%' }" />
      </view>
      <text class="val">{{ it.value }}</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue'

type BarItem = { label: string; value: number | string }
const props = withDefaults(defineProps<{ items?: BarItem[] }>(), { items: () => [] })
const rows = computed(() => (props.items || []).slice(0, 6).map((it) => ({
  label: it.label,
  value: Number(it.value) || 0,
})))
const maxV = computed(() => Math.max(1, ...rows.value.map((x) => x.value)))
function pct(v: number) {
  if (v <= 0) return 2
  return Math.max(6, Math.round((v / maxV.value) * 100))
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.bars { display: flex; flex-direction: column; gap: 18rpx; padding-top: 4rpx; }
.row { display: flex; align-items: center; gap: 16rpx; }
.lab {
  width: 148rpx;
  flex-shrink: 0;
  font-size: 22rpx;
  color: $rl-text-2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track {
  flex: 1;
  height: 20rpx;
  border-radius: 999rpx;
  background: #f1f5f4;
  border: 2rpx solid $rl-border;
  overflow: hidden;
}
.fill { height: 100%; border-radius: inherit; background: #1A68D7; }
.val { width: 48rpx; text-align: right; font-size: 24rpx; font-weight: 700; color: $rl-ink; }
.empty { text-align: center; color: $rl-text-3; font-size: 24rpx; padding: 36rpx 0; }
</style>
