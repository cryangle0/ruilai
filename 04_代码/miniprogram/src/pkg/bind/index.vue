<template>
  <view class="rl-page">
    <NavBar title="直销激活" show-back />
    <view class="pad">
      <view v-if="step===1" class="card glass">
        <text class="tip">步骤 1/2：先扫描 SN，校验通过后再填写客户信息</text>
        <FieldRow v-model="sn" label="SN" placeholder="扫描或录入 SN" />
        <button class="btn-p" @click="scanFirst">扫码</button>
        <button class="btn-p" :disabled="!sn" @click="next">下一步：填写客户</button>
      </view>
      <view v-else class="card glass">
        <text class="tip">步骤 2/2：填写客户 · SN {{ sn }} · {{ row.productName }}/{{ row.sizeCode }}</text>
        <FieldRow v-model="phone" label="客户手机" placeholder="11位手机号" type="number" :maxlength="11" />
        <FieldRow v-model="addr" label="地址" placeholder="尽量写到路号" />
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
const sn = ref('')
const row = ref<any>({})
const phone = ref('')
const addr = ref('')
const name = ref('')
const gender = ref('')
const age = ref('')
const note = ref('')
const cap = ref<any>({})
const gps = ref<{ lng?: number; lat?: number }>({})

const hint = computed(() => {
  const geo = cap.value.geoConfigured ? '将用定位/IP 做电子围栏' : '未配置地图 Key，可用演示地区兜底'
  const phoneTip = cap.value.phoneConfigured ? '手机归属走阿里云号码百科' : '手机归属暂用号段表（待开通云市场 AppKey）'
  return `校验：①定位须在直销围栏；②手机归属须在授权区域且与地址一致。${geo}。${phoneTip}。姓名等非必填。`
})

onLoad(() => {
  if (!user.ensureRole(['L1', 'L2'])) return
  http.get('/api/support/capabilities').then((d) => { cap.value = d.data || {} }).catch(() => {})
  uni.getLocation({
    type: 'gcj02',
    success: (r) => { gps.value = { lng: r.longitude, lat: r.latitude } },
    fail: () => {},
  })
})

async function scanFirst() {
  try { sn.value = await scanOrPrompt() } catch { /* */ }
}
async function next() {
  const code = sn.value.trim().toUpperCase()
  if (!code) { uni.showToast({ title: '请先扫 SN', icon: 'none' }); return }
  row.value = (await miniApi.sn(code)).data
  if (row.value.frozen === 1) { uni.showToast({ title: 'SN 已冻结', icon: 'none' }); return }
  sn.value = code
  step.value = 2
}
function pickGender() {
  uni.showActionSheet({ itemList: ['未填写', '男', '女'], success: (r) => { gender.value = ['', '男', '女'][r.tapIndex] } })
}
async function submit() {
  if (!/^1[3-9]\d{9}$/.test(phone.value)) { uni.showToast({ title: '请输入正确手机号', icon: 'none' }); return }
  if (!addr.value.trim()) { uni.showToast({ title: '请填写地址', icon: 'none' }); return }
  const payload = {
    sn: sn.value,
    lng: gps.value.lng,
    lat: gps.value.lat,
    customer: { phone: phone.value, addr: addr.value, name: name.value, gender: gender.value, age: age.value, note: note.value },
  }
  const preview = await miniApi.bind({ ...payload, dryRun: true })
  const issues = (preview.data as any).issues || []
  if (issues.length) {
    const box = await uni.showModal({
      title: '存在预警，是否仍激活？',
      content: issues.join('\n') + '\n\n取消则不提交、不记异常',
      confirmText: '确认激活',
      cancelText: '取消',
    })
    if (!box.confirm) return
  }
  const res = await miniApi.bind(payload)
  const doneIssues = (res.data as any).issues || []
  uni.showModal({
    title: doneIssues.length ? '已激活（有预警）' : '激活成功',
    content: doneIssues.length ? doneIssues.join('\n') : `SN ${sn.value} 已绑定客户`,
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
.btn-p, .ghost { margin-top: 16rpx; border-radius: 999rpx; font-weight: 700; }
.btn-p { background: #1A68D7; color: #fff; }
.ghost { background: rgba(26,104,215,.08); }
.btn-p::after, .ghost::after { border: 0; }
</style>
