<template>
  <view class="rl-page">
    <NavBar title="直销激活" show-back />
    <view class="pad">
      <view v-if="step===1" class="card glass">
        <text class="tip">步骤 1/2：可连续扫描或输入多个 SN，再统一填写客户信息</text>
        <FieldRow v-model="snInput" label="SN" placeholder="输入 SN 后点“加入”" />
        <view class="sn-actions">
          <button class="ghost" @click="scanFirst">扫码加入</button>
          <button class="btn-p" :disabled="!snInput.trim()" @click="addInputSn">输入加入</button>
        </view>
        <view v-for="(item,index) in snRows" :key="item.sn" class="sn-row">
          <view><text class="sn-code">{{ item.sn }}</text><text class="sn-product">{{ item.productName || item.productId }} / {{ item.sizeCode || '—' }}</text></view>
          <text class="remove" @click="removeSn(index)">移除</text>
        </view>
        <button class="btn-p next-btn" :disabled="!snRows.length" @click="next">下一步：填写客户（{{ snRows.length }}）</button>
      </view>
      <view v-else class="card glass">
        <text class="tip">步骤 2/2：为 {{ snRows.length }} 个 SN 填写同一位客户信息</text>
        <FieldRow v-model="phone" label="客户手机" placeholder="11位手机号" type="number" :maxlength="11" />
        <text class="field-label">省 / 市 / 区</text>
        <picker mode="region" :value="region" @change="onRegion">
          <view class="region-row">
            <view class="region-box">{{ region[0] || '省 ▼' }}</view>
            <view class="region-box">{{ region[1] || '市 ▼' }}</view>
            <view class="region-box">{{ region[2] || '区 ▼' }}</view>
          </view>
        </picker>
        <view class="address-row">
          <input :value="road" placeholder="____路" @input="road=eventValue($event)" />
          <input :value="number" placeholder="____号/弄" @input="number=eventValue($event)" />
          <input :value="room" placeholder="____室" @input="room=eventValue($event)" />
        </view>
        <FieldRow v-model="name" label="姓名（选填）" />
        <view class="pick" @click="pickGender">
          <text class="lab">性别（选填）</text>
          <text>{{ gender || '未填写' }} ›</text>
        </view>
        <FieldRow v-model="age" label="年龄（选填）" type="number" />
        <FieldRow v-model="note" label="客户情况说明（选填）" />
        <text class="hint">{{ hint }}</text>
        <button class="ghost" @click="step=1">返回扫码</button>
        <button class="btn-p" @click="submit">校验并激活</button>
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
import { http } from '@/service/http'
import { scanOrPrompt } from '@/utils/scan'

const user = useUserStore()
const step = ref(1)
const snInput = ref('')
const snRows = ref<any[]>([])
const phone = ref('')
const region = ref<string[]>([])
const road = ref('')
const number = ref('')
const room = ref('')
const name = ref('')
const gender = ref('')
const age = ref('')
const note = ref('')
const cap = ref<any>({})
const gps = ref<{ lng?: number; lat?: number }>({})
const addr = computed(() => [...region.value, road.value, number.value, room.value].filter(Boolean).join(''))

const hint = computed(() => {
  const geo = cap.value.geoConfigured ? '将用定位/IP 做电子围栏' : '未配置地图 Key，可用演示地区兜底'
  const phoneTip = cap.value.phoneConfigured ? '手机归属走阿里云号码百科' : '手机归属暂用号段表（待开通云市场 AppKey）'
  return `校验：①定位须在直销围栏；②手机归属须在授权区域且与地址一致。${geo}。${phoneTip}。姓名等非必填。`
})

onLoad(async (q) => {
  if (!user.ensureRole(['L1', 'L2'])) return
  http.get('/api/support/capabilities').then((d) => { cap.value = d.data || {} }).catch(() => {})
  uni.getLocation({
    type: 'gcj02',
    success: (r) => { gps.value = { lng: r.longitude, lat: r.latitude } },
    fail: () => {},
  })
  if (q?.sn) {
    snInput.value = String(q.sn)
    await addInputSn()
  }
})

async function scanFirst() {
  try {
    snInput.value = await scanOrPrompt()
    await addInputSn()
  } catch { /* */ }
}
async function addInputSn() {
  const code = snInput.value.trim().toUpperCase()
  if (!code) { uni.showToast({ title: '请输入 SN', icon: 'none' }); return }
  if (snRows.value.some((item) => item.sn === code)) {
    uni.showToast({ title: '该 SN 已加入', icon: 'none' })
    return
  }
  const row = (await miniApi.sn(code)).data
  if (row.frozen === 1) { uni.showToast({ title: 'SN 已冻结', icon: 'none' }); return }
  snRows.value.push(row)
  snInput.value = ''
}
function removeSn(index: number) {
  snRows.value.splice(index, 1)
}
function next() {
  if (!snRows.value.length) { uni.showToast({ title: '请先加入 SN', icon: 'none' }); return }
  step.value = 2
}
function eventValue(e: any) { return String(e?.detail?.value || '') }
function onRegion(e: any) { region.value = (e.detail.value || []).map(String) }
function pickGender() {
  uni.showActionSheet({ itemList: ['未填写', '男', '女'], success: (r) => { gender.value = ['', '男', '女'][r.tapIndex] } })
}
async function submit() {
  if (!/^1[3-9]\d{9}$/.test(phone.value)) { uni.showToast({ title: '请输入正确手机号', icon: 'none' }); return }
  if (!addr.value.trim()) { uni.showToast({ title: '请填写地址', icon: 'none' }); return }
  const payload = {
    lng: gps.value.lng,
    lat: gps.value.lat,
    customer: { phone: phone.value, addr: addr.value, name: name.value, gender: gender.value, age: age.value, note: note.value },
  }
  const previews = await Promise.all(snRows.value.map((item) => miniApi.bind({ ...payload, sn: item.sn, dryRun: true })))
  const issues = [...new Set(previews.flatMap((preview) => (preview.data as any).issues || []))]
  if (issues.length) {
    const box = await uni.showModal({
      title: '存在预警，是否仍激活？',
      content: issues.join('\n') + '\n\n取消则不提交、不记异常',
      confirmText: '确认激活',
      cancelText: '取消',
    })
    if (!box.confirm) return
  }
  const results = []
  for (const item of snRows.value) {
    results.push(await miniApi.bind({ ...payload, sn: item.sn }))
  }
  const doneIssues = [...new Set(results.flatMap((res) => (res.data as any).issues || []))]
  uni.showModal({
    title: doneIssues.length ? '已激活（有预警）' : '激活成功',
    content: doneIssues.length ? doneIssues.join('\n') : `${snRows.value.length} 个 SN 已绑定客户`,
    showCancel: false,
    success: () => uni.navigateBack(),
  })
}
</script>
<style scoped lang="scss">
.pad { padding: 22rpx 32rpx; }
.card { padding: 28rpx; border-radius: 24rpx; }
.tip { display: block; color: #636366; font-size: 24rpx; margin-bottom: 12rpx; }
.hint { display: block; color: #8e8e93; font-size: 22rpx; margin: 16rpx 0; line-height: 1.5; }
.pick { display: flex; justify-content: space-between; padding: 22rpx 0; border-bottom: 1rpx solid rgba(60,60,67,.12); }
.lab { color: #8e8e93; font-size: 22rpx; }
.sn-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.sn-actions .btn-p, .sn-actions .ghost { margin-top: 16rpx; }
.sn-row { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 18rpx 4rpx; border-bottom: 1rpx solid rgba(60,60,67,.12); }
.sn-code, .sn-product { display: block; }
.sn-code { color: #1A2B4A; font-family: ui-monospace, monospace; font-size: 24rpx; }
.sn-product { margin-top: 6rpx; color: #8e8e93; font-size: 21rpx; }
.remove { flex-shrink: 0; color: #DE4B4B; font-size: 22rpx; }
.next-btn { margin-top: 28rpx; }
.field-label { display: block; margin-top: 24rpx; color: #8e8e93; font-size: 22rpx; }
.region-row, .address-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12rpx; margin-top: 12rpx; }
.region-box, .address-row input {
  height: 68rpx;
  box-sizing: border-box;
  border: 2rpx solid #E5E9F1;
  border-radius: 12rpx;
  background: #F8FAFD;
  color: #1A2B4A;
  font-size: 22rpx;
  line-height: 64rpx;
  text-align: center;
}
.address-row input { width: 100%; padding: 0 8rpx; }
.btn-p, .ghost { margin-top: 16rpx; border-radius: 999rpx; font-weight: 700; }
.btn-p { background: #1A68D7; color: #fff; }
.ghost { background: rgba(26,104,215,.08); }
.btn-p::after, .ghost::after { border: 0; }
</style>
