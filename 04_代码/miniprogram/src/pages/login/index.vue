<template>
  <scroll-view class="login" scroll-y enable-flex>
    <NavBar title="" />
    <view class="login-body">
      <view class="brand">
        <view class="logo-wrap"><image class="logo" src="/static/logo/logo.png" mode="aspectFit" /></view>
        <text class="name">锐涞经销商</text>
        <text class="slogan">渠道授权 · SN 进销存 · 异常风控</text>
      </view>
      <view class="form">
        <text class="form-title">账号登录</text>
        <text class="form-sub">欢迎回来，请使用经销商账号登录</text>
        <view class="field">
          <view class="f-icon user" />
          <input v-model="username" class="f-input" placeholder="代理 ID / 账号" placeholder-class="ph" />
        </view>
        <view class="field">
          <view class="f-icon key" />
          <input v-model="password" class="f-input" password placeholder="请输入密码" placeholder-class="ph" />
        </view>
        <view class="agree" @click="agreed = !agreed">
          <view class="cbx" :class="{ on: agreed }" />
          <text class="agree-text">我已阅读并同意</text>
          <text class="link" @click.stop="openPolicy('agreement')">《用户协议》</text>
          <text class="agree-text">和</text>
          <text class="link" @click.stop="openPolicy('privacy')">《隐私政策》</text>
        </view>
        <button class="submit" hover-class="none" :loading="loading" :disabled="loading" @click="onLogin">登录</button>
      </view>
    </view>
  </scroll-view>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import { useUserStore } from '@/store/user'
import { ruilaiShareMessage } from '@/utils/constants'

const user = useUserStore()
const username = ref('')
const password = ref('')
const agreed = ref(false)
const loading = ref(false)
const jumping = ref(false)
onShareAppMessage(() => ruilaiShareMessage())

function goHome() {
  if (jumping.value) return
  jumping.value = true
  uni.switchTab({
    url: '/pages/home/index',
    complete: () => { jumping.value = false },
  })
}

onShow(() => {
  if (loading.value || jumping.value) return
  user.restore()
  if (user.isLogin) goHome()
})

function ensureAgreed() {
  if (agreed.value) return true
  uni.showToast({ title: '请先阅读并勾选协议', icon: 'none' })
  return false
}

async function onLogin() {
  if (!ensureAgreed()) return
  if (!username.value.trim()) { uni.showToast({ title: '请输入账号', icon: 'none' }); return }
  if (password.value.length < 4) { uni.showToast({ title: '请输入密码', icon: 'none' }); return }
  loading.value = true
  try {
    await user.login(username.value.trim(), password.value)
    afterLogin()
  } catch {
    /* http 已 toast */
  } finally { loading.value = false }
}

function afterLogin() {
  user.restore()
  if (!user.isLogin) {
    uni.showToast({ title: '登录状态未写入，请重试', icon: 'none' })
    return
  }
  uni.showToast({ title: '登录成功', icon: 'success' })
  goHome()
}
function openPolicy(type: string) { uni.navigateTo({ url: `/pkg/policy/index?type=${type}` }) }
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.login {
  min-height: 100vh;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: linear-gradient(160deg, #EAF2FD 0%, #F3F5F9 44%, #F3F5F9 100%);
}
.login-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 1080rpx;
  padding-top: 24rpx;
  padding-bottom: env(safe-area-inset-bottom);
}
.brand { display: flex; flex-direction: column; align-items: center; padding: 0 60rpx 40rpx; }
.logo-wrap { width: 142rpx; height: 142rpx; padding: 12rpx; border-radius: 38rpx; background: $rl-gradient-primary; box-shadow: $rl-shadow-primary; }
.logo { width: 118rpx; height: 118rpx; border-radius: 28rpx; }
.name { font-size: 46rpx; font-weight: 800; color: $rl-ink; margin-top: 12rpx; }
.slogan { font-size: 26rpx; color: $rl-text-2; margin-top: 12rpx; }
.form { margin: 0 48rpx; padding: 40rpx 40rpx 46rpx; border: 2rpx solid $rl-border; border-radius: 28rpx; background: #fff; box-shadow: $rl-shadow-pop; }
.form-title { display: block; color: $rl-text; font-size: 34rpx; font-weight: 800; }
.form-sub { display: block; margin: 8rpx 0 16rpx; color: $rl-text-3; font-size: 22rpx; }
.field { display: flex; align-items: center; height: 96rpx; border-bottom: 2rpx solid #E5E9F1; }
.f-icon { width: 40rpx; height: 40rpx; margin-right: 18rpx; background: no-repeat center/100%; }
.f-icon.user { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231A68D7' stroke-width='2'%3E%3Ccircle cx='12' cy='8' r='3.5'/%3E%3Cpath d='M5.5 19.5a6.5 6.5 0 0 1 13 0'/%3E%3C/svg%3E"); }
.f-icon.key { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231A68D7' stroke-width='2'%3E%3Ccircle cx='7.5' cy='15.5' r='4'/%3E%3Cpath d='M10.3 12.7 20 3m-4 4 3 3'/%3E%3C/svg%3E"); }
.f-input { flex: 1; font-size: 30rpx; }
.ph { color: #9AA4B2; }
.submit { width: 100%; margin-top: 48rpx; background: $rl-gradient-primary; color: #fff; border-radius: 16rpx; font-size: 32rpx; font-weight: 700; height: 96rpx; line-height: 96rpx; box-shadow: $rl-shadow-primary; }
.submit::after { border: 0; }
.agree { display: flex; align-items: center; flex-wrap: wrap; gap: 8rpx; margin-top: 36rpx; }
.cbx { width: 28rpx; height: 28rpx; border: 2rpx solid #D6DCE8; border-radius: 6rpx; }
.cbx.on {
  border-color: $rl-primary-deep;
  background-color: $rl-primary;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M5 12.5 10 17.5 19 7'/%3E%3C/svg%3E");
  background-size: 20rpx 20rpx;
  background-repeat: no-repeat;
  background-position: center;
}
.agree-text, .link { font-size: 22rpx; color: $rl-text-3; }
.link { color: $rl-primary-deep; }
</style>
<style lang="scss">
page { height: 100%; }
</style>
