<template>
  <view class="sk">
    <view v-if="hero" class="sk-hero glass" />
    <view v-if="cards" class="sk-row">
      <view v-for="i in cards" :key="'c'+i" class="sk-card glass" />
    </view>
    <view v-for="i in rows" :key="'l'+i" class="sk-line glass" />
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ rows?: number; cards?: number; hero?: boolean }>(), {
  rows: 5,
  cards: 0,
  hero: false,
})
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.sk { padding: 8rpx 0 24rpx; }
.sk-hero { height: 180rpx; border-radius: $rl-radius-lg; margin-bottom: 16rpx; }
.sk-row { display: flex; gap: 12rpx; margin-bottom: 16rpx; }
.sk-card { flex: 1; height: 120rpx; border-radius: $rl-radius-card; }
.sk-line {
  height: 120rpx;
  border-radius: $rl-radius-card;
  margin-bottom: 12rpx;
  opacity: .85;
}
.sk-hero, .sk-card, .sk-line {
  position: relative;
  overflow: hidden;
}
.sk-hero::after, .sk-card::after, .sk-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .7), transparent);
  animation: shine 1.2s ease-in-out infinite;
}
@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
