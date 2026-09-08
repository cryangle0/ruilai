<template>
  <view
    class="item glass"
    :class="{ disabled }"
    :hover-class="disabled ? 'none' : 'item--pressed'"
    hover-stay-time="80"
    @click="onClick"
  >
    <view class="hd">
      <text class="title">{{ title }}</text>
      <slot name="tag" />
    </view>
    <slot name="sub"><text v-if="sub" class="sub">{{ sub }}</text></slot>
    <slot name="meta"><text v-if="meta" class="meta">{{ meta }}</text></slot>
    <slot />
  </view>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{ title: string; sub?: string; meta?: string; disabled?: boolean }>(), {
  disabled: false,
})
const emit = defineEmits<{ click: [] }>()
function onClick() {
  if (!props.disabled) emit('click')
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.item { padding: 20rpx 24rpx 18rpx; border-radius: $rl-radius-card; margin-top: $rl-space-2; transition: opacity .15s ease; }
.item--pressed { opacity: .72; }
.item.disabled { opacity: .5; }
.hd { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.title { min-width: 0; font-weight: 600; font-size: 25rpx; color: $rl-primary; letter-spacing: .4rpx; word-break: break-all; }
.sub, .meta { display: block; margin-top: $rl-space-1; color: $rl-text; font-size: $rl-font-sm; line-height: 1.5; word-break: break-all; }
.meta { color: $rl-text-tertiary; font-size: 20rpx; }
</style>
