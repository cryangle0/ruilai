<template>
  <view class="rl-page">
    <NavBar :title="title" show-back />
    <view class="pad">
      <view class="card glass">
        <view v-if="needL2" class="pick" @click="pickL2">
          <text class="lab">退货二级</text>
          <text>{{ l2Name || '请选择' }} ›</text>
        </view>
        <view class="sn-input-block">
          <text class="lab">SN（支持多个，逗号、空格或换行分隔）</text>
          <textarea
            class="sn-textarea"
            :value="snsText"
            placeholder="输入 SN，或连续扫码加入"
            placeholder-class="ph"
            :auto-height="true"
            :adjust-position="true"
            :hold-keyboard="true"
            :always-embed="true"
            :cursor-spacing="32"
            data-echo="1"
            @input="snsText = eventValue($event, snsText)"
          />
          <view class="sn-toolbar">
            <text>已加入 {{ sns.length }} 个</text>
            <view class="scan-btn" @click="scanAdd">扫码加入</view>
          </view>
          <view v-if="sns.length" class="sn-chips">
            <view v-for="sn in sns" :key="sn" class="sn-chip">
              <text>{{ sn }}</text><text class="sn-remove" @click="removeSn(sn)">×</text>
            </view>
          </view>
        </view>
        <text v-if="snInfo" class="sn-info">{{ snInfo }}</text>
        <view class="pick" @click="pickReason">
          <text class="lab">退货原因</text>
          <text>{{ reasonType }} ›</text>
        </view>
        <view class="field">
          <text class="lab">说明</text>
          <textarea
            class="area"
            :value="reason"
            placeholder="可手写补充"
            placeholder-class="ph"
            :auto-height="true"
            :adjust-position="true"
            :hold-keyboard="true"
            :always-embed="true"
            :cursor-spacing="32"
            data-echo="1"
            @input="reason = eventValue($event, reason)"
          />
        </view>
        <view class="ghost" @click="pickPhoto">上传退货凭证</view>
        <image v-for="(u, i) in photos" :key="i" :src="u" class="photo" mode="aspectFill" />
        <view class="btn-p" @click="submit">提交退货单</view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { scanOrPrompt } from '@/utils/scan'
import { API_BASE_URL, STORAGE_KEYS } from '@/config'
import { inputEventValue } from '@/utils/inputValue'

const REASONS = ['质量问题', '尺码不符', '客户退货', '外观损坏', '其他']
const user = useUserStore()
const type = ref('user')
const snsText = ref('')
const reasonType = ref('客户退货')
const reason = ref('')
const photos = ref<string[]>([])
const snInfo = ref('')
const l2s = ref<any[]>([])
const l2Id = ref('')
const l2Name = ref('')
const needL2 = computed(() => type.value === 'l2_to_l1' && user.role === 'L1')
const sns = computed(() => [...new Set(
  snsText.value.split(/[,，\s]+/).map((item) => item.trim().toUpperCase()).filter(Boolean),
)])
const title = computed(() => ({
  user: '终端退货单',
  l2_to_l1: '二级退一级',
  l1_to_factory: '申请退原厂',
}[type.value] || '退货'))

onLoad(async (q) => {
  if (!user.ensureLogin()) return
  type.value = q?.type || 'user'
  if (user.role === 'SUB') {
    user.ensureRole(['L1', 'L2'])
    return
  }
  if (user.role === 'L2' && type.value === 'l1_to_factory') {
    uni.showToast({ title: '二级不可退原厂', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 350)
    return
  }
  if (needL2.value) {
    l2s.value = (await miniApi.agentsL2({ pageSize: 50, auditStatus: 'approved' })).data.list || []
  }
})
function eventValue(e: unknown, fallback = '') { return inputEventValue(e, fallback) }
function pickL2() {
  const names = l2s.value.map((a) => a.name)
  if (!names.length) { uni.showToast({ title: '暂无已通过二级', icon: 'none' }); return }
  uni.showActionSheet({ itemList: names, success: (r) => {
    l2Id.value = l2s.value[r.tapIndex].id
    l2Name.value = l2s.value[r.tapIndex].name
  } })
}

async function scanAdd() {
  try {
    const sn = await scanOrPrompt()
    if (!sns.value.includes(sn.toUpperCase())) {
      snsText.value = [...sns.value, sn.toUpperCase()].join('\n')
    }
    try {
      const row = (await miniApi.sn(sn)).data
      snInfo.value = `${row.productName || row.productId || sn} / ${row.sizeCode || ''} + ${row.belt || '—'}`
    } catch {
      snInfo.value = sn
    }
  } catch { /* */ }
}
function removeSn(sn: string) {
  snsText.value = sns.value.filter((item) => item !== sn).join('\n')
}
function pickReason() {
  uni.showActionSheet({ itemList: REASONS, success: (r) => { reasonType.value = REASONS[r.tapIndex] } })
}
async function pickPhoto() {
  const choose = await uni.chooseImage({ count: 3 })
  const path = choose.tempFilePaths?.[0]
  if (!path) return
  uni.uploadFile({
    url: API_BASE_URL + '/api/upload',
    filePath: path,
    name: 'file',
    header: { Authorization: `Bearer ${uni.getStorageSync(STORAGE_KEYS.TOKEN) || ''}` },
    success: (res) => {
      try {
        const body = JSON.parse(res.data as string)
        if (body.code === 0 && body.data?.url) photos.value.push(body.data.url)
        else uni.showToast({ title: body.message || '上传失败', icon: 'none' })
      } catch {
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    },
    fail: () => uni.showToast({ title: '上传失败', icon: 'none' }),
  })
}
async function submit() {
  if (!sns.value.length) { uni.showToast({ title: '请填写 SN', icon: 'none' }); return }
  if (needL2.value && !l2Id.value) { uni.showToast({ title: '请选择退货二级', icon: 'none' }); return }
  await miniApi.createReturn({
    type: type.value,
    sns: sns.value,
    reasonType: reasonType.value,
    reason: reason.value,
    photos: photos.value,
    ...(needL2.value ? { fromId: l2Id.value, fromName: l2Name.value } : {}),
  })
  uni.showToast({ title: '已提交', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 400)
}
</script>
<style scoped>
.pad { padding: 22rpx 32rpx; }
.card { padding: 28rpx; border-radius: 24rpx; }
.pick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 22rpx 0;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  border-bottom: 1rpx solid rgba(60,60,67,.12);
}
.lab { color: #8e8e93; font-size: 22rpx; }
.field { padding: 18rpx 0; border-bottom: 2rpx solid #E5E9F1; }
.area {
  display: block;
  width: 100%;
  min-height: 96rpx;
  padding: 0;
  margin: 0;
  color: #1A2B4A;
  font-size: 30rpx;
  line-height: 44rpx;
  background: transparent;
}
.ph { color: #9AA4B2; }
.btn-p, .ghost {
  margin-top: 16rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 999rpx;
  font-weight: 700;
  font-size: 30rpx;
}
.btn-p { background: #1A68D7; color: #fff; }
.ghost { background: rgba(26,104,215,.08); color: #1A68D7; }
.sn-info { display: block; color: #636366; font-size: 22rpx; margin: 8rpx 0 4rpx; }
.sn-input-block { padding: 18rpx 0; border-bottom: 2rpx solid #E5E9F1; }
.sn-textarea { width: 100%; min-height: 112rpx; margin-top: 12rpx; padding: 14rpx; box-sizing: border-box; border: 2rpx solid #DDE6F2; border-radius: 14rpx; color: #1A2B4A; font-size: 26rpx; line-height: 1.5; background: #fff; }
.sn-toolbar { display: flex; align-items: center; justify-content: space-between; margin-top: 12rpx; color: #7A879C; font-size: 21rpx; }
.scan-btn {
  min-width: 150rpx;
  height: 58rpx;
  margin: 0;
  border: 2rpx solid #BFD4F2;
  border-radius: 12rpx;
  background: #F5F9FF;
  color: #1A68D7;
  font-size: 22rpx;
  line-height: 58rpx;
  text-align: center;
}
.sn-chips { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 14rpx; }
.sn-chip { display: flex; align-items: center; gap: 10rpx; padding: 8rpx 12rpx; border-radius: 10rpx; background: #EAF2FD; color: #1A68D7; font-size: 21rpx; }
.sn-remove { color: #DE4B4B; font-size: 28rpx; line-height: 1; }
.photo { width: 160rpx; height: 160rpx; border-radius: 16rpx; margin: 12rpx 12rpx 0 0; }
</style>
