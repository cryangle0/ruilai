<template>
  <view class="rl-icon" :style="boxStyle" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { ICON_MASKS, type IconName } from '@/utils/iconMasks'

const props = withDefaults(defineProps<{
  name: IconName
  size?: number
  color?: string
}>(), { size: 40, color: '#1A68D7' })

const boxStyle = computed(() => {
  const url = `url("${ICON_MASKS[props.name]}")`
  return {
    width: `${props.size}rpx`,
    height: `${props.size}rpx`,
    background: props.color,
    webkitMaskImage: url,
    maskImage: url,
  }
})
</script>
<style scoped>
.rl-icon {
  flex-shrink: 0;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
</style>
