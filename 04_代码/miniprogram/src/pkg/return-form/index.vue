<template>
  <view class="rl-page">
    <NavBar :title="title" show-back />
    <view class="pad">
      <view class="card glass">
        <view v-if="needL2" class="pick" @click="pickL2">
          <text class="lab">退货二级</text>
          <text>{{ l2Name || '请选择' }} ›</text>
        </view>
        <FieldRow v-model="snsText" label="SN（逗号或空格分隔）" placeholder="RL..." />
        <button class="ghost" @click="scanAdd">扫入 SN</button>
        <text v-if="snInfo" class="sn-info">{{ snInfo }}</text>
        <view class="pick" @click="pickReason">
          <text class="lab">退货原因</text>
          <text>{{ reasonType }} ›</text>
        </view>
        <FieldRow v-model="reason" label="说明" placeholder="可手写补充" />
        <button class="ghost" @click="pickPhoto">上传退货凭证</button>
        <image v-for="(u, i) in photos" :key="i" :src="u" class="photo" mode="aspectFill" />
        <button class="btn-p" @click="submit">提交退货单</button>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import FieldRow from '@/components/FieldRow.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { scanOrPrompt } from '@/utils/scan'
import { API_BASE_URL, STORAGE_KEYS } from '@/config'

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
    const cur = snsText.value.trim()
    snsText.value = cur ? `${cur} ${sn}` : sn
    try {
      const row = (await miniApi.sn(sn)).data
      snInfo.value = `${row.productName || row.productId || sn} / ${row.sizeCode || ''} + ${row.belt || '—'}`
    } catch {
      snInfo.value = sn
    }
  } catch { /* */ }
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
  const sns = snsText.value.split(/[,，\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean)
  if (!sns.length) { uni.showToast({ title: '请填写 SN', icon: 'none' }); return }
  if (needL2.value && !l2Id.value) { uni.showToast({ title: '请选择退货二级', icon: 'none' }); return }
  await miniApi.createReturn({
    type: type.value,
    sns,
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
.pick { display: flex; justify-content: space-between; padding: 22rpx 0; border-bottom: 1rpx solid rgba(60,60,67,.12); }
.lab { color: #8e8e93; font-size: 22rpx; }
.btn-p, .ghost { margin-top: 16rpx; border-radius: 999rpx; font-weight: 700; }
.btn-p { background: #1A68D7; color: #fff; }
.ghost { background: rgba(26,104,215,.08); }
.sn-info { display: block; color: #636366; font-size: 22rpx; margin: 8rpx 0 4rpx; }
.btn-p::after, .ghost::after { border: 0; }
.photo { width: 160rpx; height: 160rpx; border-radius: 16rpx; margin: 12rpx 12rpx 0 0; }
</style>
