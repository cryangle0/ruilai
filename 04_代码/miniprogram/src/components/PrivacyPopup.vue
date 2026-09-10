<template>
  <view v-if="show" class="mask">
    <view class="box glass" @click.stop>
      <text class="t">隐私保护提示</text>
      <text class="b">我们将按《隐私政策》处理账号、扫码与位置信息，用于经销授权与激活校验。登录前请完整阅读《用户协议》和《隐私政策》。</text>
      <view class="links">
        <text class="link" @click="open('agreement')">《用户协议》</text>
        <text class="link" @click="open('privacy')">《隐私政策》</text>
      </view>
      <button
        class="ok"
        open-type="agreePrivacyAuthorization"
        @agreeprivacyauthorization="onAgreePrivacyAuthorization"
        @click="onAgreeButtonClick"
      >同意并继续</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ agree: [] }>()
const show = ref(!uni.getStorageSync('rl_privacy_ok'))

const supportsPrivacyAuthorization = typeof uni.canIUse === 'function'
  && uni.canIUse('button.open-type.agreePrivacyAuthorization')

function saveAgreement() {
  uni.setStorageSync('rl_privacy_ok', 1)
  show.value = false
  emit('agree')
}

function onAgreePrivacyAuthorization(event: { detail?: { errMsg?: string } }) {
  if (event.detail?.errMsg === 'agreePrivacyAuthorization:ok') {
    saveAgreement()
    return
  }
  uni.showToast({ title: '需同意隐私授权后继续', icon: 'none' })
}

function onAgreeButtonClick() {
  // 老版本开发者工具不触发隐私授权事件；按钮点击本身仍是明确的同意操作。
  if (!supportsPrivacyAuthorization) saveAgreement()
}

function open(type: string) {
  uni.navigateTo({ url: `/pkg/policy/index?type=${type}` })
}
</script>
<style scoped lang="scss">
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 300; display: flex; align-items: flex-end; }
.box { margin: 40rpx; padding: 40rpx; border-radius: 28rpx; }
.t { font-size: 32rpx; font-weight: 700; display: block; }
.b { display: block; margin: 16rpx 0 16rpx; color: #636366; font-size: 26rpx; line-height: 1.6; }
.links { display: flex; gap: 24rpx; margin-bottom: 28rpx; }
.link { color: #1559BC; font-size: 26rpx; font-weight: 700; }
.ok { background: #1A68D7; color: #fff; border-radius: 16rpx; }
.ok::after { border: 0; }
</style>
