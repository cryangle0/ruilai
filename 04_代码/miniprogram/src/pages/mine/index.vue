<template>
  <view class="rl-page">
    <NavBar brand />
    <view class="page-head">
      <text class="page-title">我的</text>
    </view>
    <view class="pad">
      <PagedState v-if="loading || error" :loading="loading" :error="error" @retry="load" />
      <template v-else>
      <view class="hero glass" @click="go('/pkg/mine-profile/index')">
        <view class="avatar">{{ avatarText }}</view>
        <view class="hero-txt">
          <text class="name">{{ user.user?.name }}</text>
          <text class="meta">{{ user.user?.username }} · {{ roleLabel }}</text>
          <text class="profile-tip">查看与修改资料</text>
        </view>
        <text class="arr">›</text>
      </view>
      <view v-if="user.role==='L1'" class="cell glass" @click="go('/pkg/mine-l2/index')">
        <Icon name="agents" :size="44" />
        <view class="cell-txt"><text class="t">二级代理</text><text class="d">维护下属二级与登录账号 · {{ l2Count }} 个</text></view>
        <text class="arr">›</text>
      </view>
      <view v-if="user.role==='L1'" class="cell glass" @click="go('/pkg/mine-sub/index')">
        <Icon name="mine" :size="44" />
        <view class="cell-txt"><text class="t">子账号</text><text class="d">仅扫码权限 · {{ subCount }} 个</text></view>
        <text class="arr">›</text>
      </view>
      <view v-if="user.role!=='SUB'" class="cell glass" @click="go('/pkg/mine-customers/index')">
        <Icon name="customers" :size="44" />
        <view class="cell-txt"><text class="t">客户</text><text class="d">C 端客户信息 · {{ cuCount }} 位</text></view>
        <text class="arr">›</text>
      </view>
      <button class="logout" @click="user.logout()">退出登录</button>
      </template>
    </view>
    <TabBar current="mine" />
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import TabBar from '@/components/TabBar.vue'
import PagedState from '@/components/PagedState.vue'
import Icon from '@/components/Icon.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { ROLE_LABEL, ruilaiShareMessage } from '@/utils/constants'

const user = useUserStore()
const roleLabel = computed(() => ROLE_LABEL[user.role] || user.role)
const avatarText = computed(() => (user.user?.name || user.user?.username || '锐').slice(0, 1))
const l2Count = ref(0)
const subCount = ref(0)
const cuCount = ref(0)
const loading = ref(true)
const error = ref('')
onShareAppMessage(() => ruilaiShareMessage())

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (user.role === 'L1') {
      l2Count.value = (await miniApi.agentsL2({ pageSize: 1 })).data.total || 0
      subCount.value = ((await miniApi.subs()).data || []).length
    }
    if (user.role !== 'SUB') {
      cuCount.value = (await miniApi.customers({ pageSize: 1 })).data.total || 0
    }
  } catch (e: any) {
    error.value = e?.message || '账号数据加载失败'
  } finally {
    loading.value = false
  }
}

onShow(async () => {
  if (!user.ensureLogin()) return
  await load()
})
function go(url: string) { uni.navigateTo({ url }) }
</script>
<style scoped lang="scss">
.pad { padding: 22rpx 32rpx 24rpx; }
.hero { display: flex; align-items: center; gap: 20rpx; padding: 32rpx; border-radius: 28rpx; margin-bottom: 20rpx; }
.avatar { width: 92rpx; height: 92rpx; flex: none; border-radius: 28rpx; background: $rl-gradient-primary; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 40rpx; font-weight: 800; box-shadow: $rl-shadow-primary; }
.hero-txt { flex: 1; min-width: 0; }
.name { display: block; font-size: 40rpx; font-weight: 800; }
.meta { color: #8e8e93; font-size: 24rpx; }
.profile-tip { display: block; margin-top: 6rpx; color: $rl-primary; font-size: 20rpx; }
.cell { display: flex; align-items: center; gap: 20rpx; padding: 28rpx; border-radius: 20rpx; margin-bottom: 12rpx; }
.cell-txt { flex: 1; min-width: 0; }
.t { display: block; font-weight: 700; }
.d { font-size: 22rpx; color: #8e8e93; }
.arr { color: #c7c7cc; font-size: 36rpx; }
.logout { margin: 32rpx 0 0; height: 84rpx; border: 2rpx solid $rl-danger-border; border-radius: 16rpx; background: #fff; color: $rl-danger; font-size: 26rpx; font-weight: 700; line-height: 80rpx; }
.logout::after { border: 0; }
</style>
