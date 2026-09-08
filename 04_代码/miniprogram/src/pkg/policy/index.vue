<template>
  <view class="rl-page policy">
    <NavBar :title="doc.title" show-back />
    <scroll-view scroll-y class="sc">
      <view class="pad">
        <view class="card glass">
          <text class="h1">{{ doc.title }}</text>
          <text class="meta">生效日期 {{ doc.effectiveAt }} · 最近更新 {{ doc.updatedAt }}</text>
          <text class="p">{{ doc.intro }}</text>
          <block v-for="sec in doc.sections" :key="sec.heading">
            <text class="h2">{{ sec.heading }}</text>
            <text v-for="(para, i) in sec.paragraphs" :key="sec.heading + i" class="p">{{ para }}</text>
            <view v-if="sec.bullets && sec.bullets.length" class="ul">
              <text v-for="(b, i) in sec.bullets" :key="i" class="li">· {{ b }}</text>
            </view>
          </block>
          <text class="foot">{{ doc.footer }}</text>
          <text class="switch" @click="openOther">{{ otherLabel }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import { getPolicy, type PolicyKind } from '@/legal/policies'

const kind = ref<PolicyKind>('agreement')
const doc = computed(() => getPolicy(kind.value))
const otherLabel = computed(() => (kind.value === 'privacy' ? '阅读《用户协议》' : '阅读《隐私政策》'))

onLoad((q) => {
  kind.value = q?.type === 'privacy' ? 'privacy' : 'agreement'
})

function openOther() {
  const next = kind.value === 'privacy' ? 'agreement' : 'privacy'
  uni.redirectTo({ url: `/pkg/policy/index?type=${next}` })
}
</script>
<style scoped>
.policy { padding-bottom: 0; display: flex; flex-direction: column; height: 100vh; }
.sc { flex: 1; height: 0; }
.pad { padding: 22rpx 32rpx 48rpx; }
.card { padding: 36rpx 32rpx 48rpx; border-radius: 24rpx; }
.h1 { display: block; font-weight: 800; font-size: 40rpx; margin-bottom: 12rpx; }
.meta { display: block; color: #8e8e93; font-size: 22rpx; margin-bottom: 24rpx; }
.h2 { display: block; font-weight: 700; font-size: 30rpx; margin: 36rpx 0 12rpx; }
.p { display: block; color: #3a3a3c; font-size: 26rpx; line-height: 1.75; margin-bottom: 16rpx; }
.ul { margin-bottom: 12rpx; }
.li { display: block; color: #3a3a3c; font-size: 26rpx; line-height: 1.7; margin-bottom: 10rpx; padding-left: 8rpx; }
.foot { display: block; color: #8e8e93; font-size: 22rpx; margin-top: 28rpx; line-height: 1.6; }
.switch { display: block; margin-top: 24rpx; color: #1559BC; font-size: 26rpx; font-weight: 700; }
</style>
