<template>
  <view class="rl-page profile">
    <NavBar title="个人资料" show-back />
    <view class="pad">
      <view class="card glass">
        <view class="ro">
          <text class="lab">登录账号</text>
          <text class="val">{{ user.user?.username || '—' }}</text>
        </view>
        <view class="ro">
          <text class="lab">角色</text>
          <text class="val">{{ roleLabel }}</text>
        </view>
        <view class="field">
          <text class="lab">显示名称</text>
          <input
            class="inp"
            :value="name"
            placeholder="名称"
            placeholder-class="ph"
            confirm-type="done"
            :adjust-position="true"
            :hold-keyboard="true"
            :always-embed="true"
            :cursor-spacing="32"
            data-echo="1"
            @input="name = eventValue($event, name)"
          />
        </view>
        <view class="field">
          <text class="lab">手机号</text>
          <input
            class="inp"
            :value="phone"
            type="number"
            :maxlength="11"
            placeholder="11 位手机号"
            placeholder-class="ph"
            confirm-type="done"
            :adjust-position="true"
            :hold-keyboard="true"
            :always-embed="true"
            :cursor-spacing="32"
            data-echo="1"
            @input="phone = eventValue($event, phone)"
          />
        </view>
        <view class="field">
          <text class="lab">新密码（不改请留空）</text>
          <input
            class="inp"
            :value="password"
            password
            placeholder="至少 4 位"
            placeholder-class="ph"
            confirm-type="done"
            :adjust-position="true"
            :hold-keyboard="true"
            :always-embed="true"
            :cursor-spacing="32"
            data-echo="1"
            @input="password = eventValue($event, password)"
          />
        </view>
        <view class="save" :class="{ busy: saving }" @click="save">{{ saving ? '保存中' : '保存' }}</view>
      </view>
    </view>
    <view class="logout-bar">
      <view class="out" @click="user.logout()">退出登录</view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import { useUserStore } from '@/store/user'
import { ROLE_LABEL } from '@/utils/constants'
import { inputEventValue } from '@/utils/inputValue'

const user = useUserStore()
const name = ref('')
const phone = ref('')
const password = ref('')
const saving = ref(false)
const roleLabel = computed(() => ROLE_LABEL[user.role] || user.role)
function eventValue(e: unknown, fallback = '') { return inputEventValue(e, fallback) }

onShow(async () => {
  if (!user.ensureLogin()) return
  await user.refreshMe()
  name.value = user.user?.name || ''
  phone.value = user.user?.phone || ''
  password.value = ''
})

async function save() {
  if (saving.value) return
  const n = name.value.trim()
  if (!n) { uni.showToast({ title: '请填写显示名称', icon: 'none' }); return }
  const p = phone.value.trim()
  if (p && !/^1[3-9]\d{9}$/.test(p)) { uni.showToast({ title: '请输入正确手机号', icon: 'none' }); return }
  if (password.value && password.value.length < 4) { uni.showToast({ title: '新密码至少 4 位', icon: 'none' }); return }
  saving.value = true
  try {
    await user.updateProfile({
      name: n,
      phone: p,
      password: password.value || undefined,
    })
    password.value = ''
    uni.showToast({ title: '已保存', icon: 'success' })
  } finally {
    saving.value = false
  }
}
</script>
<style scoped lang="scss">
.profile { padding-bottom: calc(168rpx + env(safe-area-inset-bottom)); }
.pad { padding: 22rpx 32rpx; }
.card { padding: 28rpx; border-radius: 24rpx; }
.ro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid rgba(60, 60, 67, 0.12);
}
.lab { font-size: 22rpx; color: #9AA4B2; }
.val { font-size: 30rpx; color: #1B2430; }
.field { padding: 18rpx 0; border-bottom: 1rpx solid rgba(60, 60, 67, 0.12); }
.inp {
  display: block;
  width: 100%;
  height: 56rpx;
  margin-top: 8rpx;
  color: #1B2430;
  font-size: 30rpx;
  line-height: 56rpx;
  background: transparent;
}
.ph { color: #9AA4B2; }
.save {
  margin-top: 32rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: #1A68D7;
  color: #fff;
  border-radius: 16rpx;
  font-weight: 700;
}
.save.busy { opacity: .65; }
.logout-bar {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  z-index: 20;
}
.out {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: #FCEBEB;
  color: #DE4B4B;
  border-radius: 16rpx;
  font-weight: 700;
}
</style>
