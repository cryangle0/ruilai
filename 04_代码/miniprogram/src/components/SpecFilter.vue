<template>
  <view class="specs">
    <picker :range="sizeOpts" :value="sizeIdx" @change="onSize">
      <text class="box">{{ size || '弹力带' }}</text>
    </picker>
    <picker :range="beltOpts" :value="beltIdx" @change="onBelt">
      <text class="box">{{ belt || '腰带' }}</text>
    </picker>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { BAND_SIZES, BELTS } from '@/utils/constants'

const props = defineProps<{ size?: string; belt?: string }>()
const emit = defineEmits<{ 'update:size': [string]; 'update:belt': [string] }>()

const sizeOpts = ['弹力带', ...BAND_SIZES]
const beltOpts = ['腰带', ...BELTS]
const sizeIdx = computed(() => Math.max(0, sizeOpts.indexOf(props.size || '弹力带')))
const beltIdx = computed(() => Math.max(0, beltOpts.indexOf(props.belt || '腰带')))

function onSize(e: any) {
  const v = sizeOpts[Number(e.detail.value)] || '弹力带'
  emit('update:size', v === '弹力带' ? '' : v)
}
function onBelt(e: any) {
  const v = beltOpts[Number(e.detail.value)] || '腰带'
  emit('update:belt', v === '腰带' ? '' : v)
}
</script>
<style scoped>
.specs { display: flex; gap: 12rpx; margin: 16rpx 0 0; }
.box {
  display: flex;
  align-items: center;
  min-width: 220rpx;
  height: 50rpx;
  padding: 0 18rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  background: #FBFCFE;
  border: 2rpx solid #E3E9F2;
  color: #1A2B4A;
}
</style>
