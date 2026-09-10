<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

onLaunch(() => {
  useUserStore().restore()
})
</script>

<style lang="scss">
@import '@/styles/theme.scss';
page {
  background: $rl-bg;
  color: $rl-text;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  font-size: $rl-font-base;
  max-width: 100%;
  overflow-x: hidden;
}
::-webkit-scrollbar { width: 0; height: 0; display: none; }
view, text, button, input, textarea, picker { box-sizing: border-box; }
button, input, textarea, picker { max-width: 100%; }
button {
  margin-left: 0;
  margin-right: 0;
}
.rl-page {
  min-height: 0;
  padding-bottom: calc(128rpx + env(safe-area-inset-bottom));
  background: $rl-bg;
  max-width: 100%;
  overflow-x: hidden;
}
.rl-fit-tag,
.warn-row,
.dimension-badge,
.ex-mark {
  display: inline-flex !important;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  align-self: flex-start;
}
.rl-page--form { padding-bottom: calc(124rpx + env(safe-area-inset-bottom)); }
.rl-page__content { padding: 22rpx $rl-page-gutter 0; }
.glass {
  background: $rl-card;
  border: 2rpx solid $rl-border;
  box-shadow: $rl-shadow-card;
}
.page-head { padding: 22rpx 32rpx 0; }
.page-title { display: block; font-size: 36rpx; font-weight: 700; color: $rl-text; line-height: 1; }
.page-sub { display: block; font-size: $rl-font-xs; color: $rl-text-3; margin-top: $rl-space-1; }
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin: 16rpx 0 0;
  background: $rl-card;
  border: 2rpx solid $rl-border;
  border-radius: $rl-radius-card;
  padding: 18rpx 22rpx 20rpx;
  box-shadow: $rl-shadow-card;
}
.filter-panel + .filter-panel { margin-top: 16rpx; }
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin: 20rpx 0 0;
}
.action-tip { font-size: $rl-font-xs; color: $rl-text-2; flex: 1; }
.form-btns { display: flex; gap: 14rpx; margin: 20rpx 0 0; }
.form-btns .mini-btn,
.form-btns .ghost {
  flex: 1;
  margin: 0;
  height: 82rpx;
  line-height: 1.35;
  font-size: 21rpx;
  font-weight: 600;
  border-radius: $rl-radius-md !important;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}
.mini-page-desc {
  display: block;
  color: #8A97AD;
  font-size: 19rpx;
  line-height: 1.5;
  margin: 8rpx 0 0;
}
.btn-p, .mini-btn, .submit, .save, .btn-ok {
  max-width: 100%;
  background: $rl-gradient-primary !important;
  color: #fff !important;
  border: none !important;
  border-radius: $rl-radius-md !important;
  box-shadow: $rl-shadow-primary;
}
.btn-p::after, .mini-btn::after, .submit::after, .save::after, .btn-ok::after {
  border: 0;
}
.ghost, .sm {
  border: 2rpx solid $rl-primary-border !important;
  border-radius: $rl-radius-md !important;
  background: $rl-primary-softer !important;
  color: $rl-primary !important;
}
button.out, button.no {
  border: 2rpx solid $rl-danger-border !important;
  border-radius: $rl-radius-md !important;
}
</style>
