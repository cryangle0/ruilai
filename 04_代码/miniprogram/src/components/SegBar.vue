<template>
  <view class="seg" :class="'is-' + variant">
    <view
      v-for="it in items"
      :key="it.id"
      class="btn"
      :class="{ on: modelValue === it.id, disabled: it.disabled }"
      :data-seg="it.id"
      @click="select(it)"
    >
      <text>{{ it.title }}</text>
      <view v-if="it.badge != null" class="badge">{{ it.badge }}</view>
    </view>
  </view>
</template>
<script setup lang="ts">
type SegItem = { id: string; title: string; badge?: number | string; disabled?: boolean }
withDefaults(
  defineProps<{
    modelValue: string
    items: SegItem[]
    variant?: 'line' | 'seg'
  }>(),
  { variant: 'line' },
)
const emit = defineEmits<{
  'update:modelValue': [string]
  change: [string]
}>()
function select(item: SegItem) {
  if (item.disabled) return
  emit('update:modelValue', item.id)
  emit('change', item.id)
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.seg.is-line {
  display: flex;
  gap: 8rpx;
  padding: 20rpx 4rpx 0;
  border-bottom: 2rpx solid $rl-border;
  background: transparent;
}
.seg.is-line .btn {
  flex: none;
  text-align: center;
  padding: 12rpx 22rpx 16rpx 14rpx;
  font-size: 27rpx;
  color: $rl-text-secondary;
  font-weight: 500;
  position: relative;
}
.seg.is-line .btn.on {
  color: $rl-primary;
  font-weight: 700;
}
.seg.is-line .btn.on::after {
  content: "";
  position: absolute;
  left: 16rpx;
  right: 16rpx;
  bottom: -2rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: $rl-gradient-primary-horizontal;
  box-shadow: $rl-shadow-primary;
}
.seg.is-line .badge {
  @include rl-corner-badge;
  transform: translate(20%, -20%);
}

.seg.is-seg {
  display: flex;
  width: 100%;
  flex: none;
  background: $rl-fill-segment;
  border-radius: $rl-radius-sm;
  padding: 4rpx;
}
.seg.is-seg .btn {
  flex: 1;
  text-align: center;
  padding: 9rpx 0;
  font-size: 21rpx;
  color: $rl-text-secondary;
  border-radius: 7rpx;
  position: relative;
  white-space: nowrap;
}
.btn.disabled { opacity: .45; }
.seg.is-seg .btn.on {
  background: $rl-card;
  color: $rl-primary;
  font-weight: 700;
  box-shadow: 0 2rpx 6rpx rgba(22, 32, 64, 0.08);
}
.seg.is-seg .badge {
  @include rl-corner-badge;
  top: 2rpx;
  right: 2rpx;
}
</style>
