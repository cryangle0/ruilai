<template>
  <view class="rl-page">
    <NavBar title="二级代理" show-back />
    <view class="pad">
      <text class="desc">维护下属二级信息与登录账号；新建后进入平台「二级审核」。</text>
      <button class="btn-p" @click="openCreate">创建二级代理</button>
      <SearchBar v-model="q" placeholder="搜索名称/编码/城市" />
      <Empty v-if="!filtered.length" text="暂无二级代理，点上方创建" />
      <view v-for="a in filtered" :key="a.id" class="card glass">
        <view class="hd">
          <view>
            <text class="n">{{ a.name }}</text>
            <text class="m">{{ a.code }} · {{ a.type }} · {{ (a.areas||[]).join('、') || '未设城市' }}</text>
          </view>
          <StatusTag :value="a.auditStatus === 'pending' ? 'pending' : a.status" :map="{ pending: '待审核', 启用: '启用', 停用: '停用', approved: '已通过' }" />
        </view>
        <view class="ops">
          <button v-if="a.auditStatus === 'approved'" class="sm" @click="toggle(a)">{{ a.status==='启用' ? '停用' : '启用' }}</button>
          <button class="sm danger" @click="remove(a)">删除</button>
        </view>
      </view>
    </view>
    <BottomDrawer v-model="creating" title="创建二级代理">
      <FieldRow v-model="form.name" label="名称" placeholder="门店/公司名" />
      <view class="pick" @click="form.type = form.type==='法人' ? '个人' : '法人'">
        <text class="lab">类型</text><text>{{ form.type }} ›</text>
      </view>
      <FieldRow v-model="form.areas" label="城市（逗号分隔）" :placeholder="areaHint" />
      <FieldRow v-model="form.loginUsername" label="登录账号" placeholder="agent_xx" />
      <FieldRow v-model="form.loginPassword" label="初始密码" password placeholder="至少 4 位" />
      <button class="ghost" @click="pickProtocol">上传合作协议{{ protocolUrl ? '（已选）' : '' }}</button>
      <template #footer>
        <button class="btn-p" @click="create">提交审核</button>
      </template>
    </BottomDrawer>
  </view>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import FieldRow from '@/components/FieldRow.vue'
import SearchBar from '@/components/SearchBar.vue'
import Empty from '@/components/Empty.vue'
import StatusTag from '@/components/StatusTag.vue'
import BottomDrawer from '@/components/BottomDrawer.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { API_BASE_URL, STORAGE_KEYS } from '@/config'

const user = useUserStore()
const rows = ref<any[]>([])
const q = ref('')
const creating = ref(false)
const form = reactive({ name: '', type: '法人', areas: '', loginUsername: '', loginPassword: '' })
const protocolUrl = ref('')
const allowedCities = ref<string[]>([])
const areaHint = computed(() => allowedCities.value.length ? `须在 ${allowedCities.value.slice(0, 4).join('、')} 等范围内` : '杭州市')
const filtered = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return rows.value
  return rows.value.filter((a) => [a.name, a.code, a.type, ...(a.areas || [])].join(' ').toLowerCase().includes(k))
})

async function load() {
  rows.value = (await miniApi.agentsL2({ pageSize: 100 })).data.list || []
}
onShow(() => { if (user.ensureRole(['L1'])) { load(); loadParent() } })

function openCreate() {
  form.name = ''
  form.type = '法人'
  form.areas = ''
  form.loginUsername = ''
  form.loginPassword = ''
  protocolUrl.value = ''
  creating.value = true
}

async function loadParent() {
  const id = user.user?.agentId
  if (!id) return
  try {
    const a = (await miniApi.agentL1(id)).data
    allowedCities.value = a.directAreas || []
    if (!allowedCities.value.length && Array.isArray(a.saleAreas)) {
      allowedCities.value = a.saleAreas
    }
  } catch { allowedCities.value = [] }
}

async function pickProtocol() {
  const choose = await uni.chooseImage({ count: 1 })
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
        if (body.code === 0 && body.data?.url) {
          protocolUrl.value = body.data.url
          uni.showToast({ title: '协议已上传', icon: 'success' })
        } else uni.showToast({ title: body.message || '上传失败', icon: 'none' })
      } catch {
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    },
    fail: () => uni.showToast({ title: '上传失败', icon: 'none' }),
  })
}

async function create() {
  if (!form.name.trim()) { uni.showToast({ title: '请填写名称', icon: 'none' }); return }
  if (!form.loginUsername.trim()) { uni.showToast({ title: '请填写登录账号', icon: 'none' }); return }
  if (form.loginPassword.length < 4) { uni.showToast({ title: '初始密码至少 4 位', icon: 'none' }); return }
  const areas = form.areas.split(/[,，\s]+/).filter(Boolean)
  if (allowedCities.value.length && areas.some((c) => !allowedCities.value.some((a) => a.includes(c.replace(/市$/, '')) || c.includes(a.replace(/市$/, ''))))) {
    uni.showToast({ title: '城市须在一级授权范围内', icon: 'none' }); return
  }
  await miniApi.saveL2({
    name: form.name.trim(),
    type: form.type,
    areas,
    extra: {
      loginUsername: form.loginUsername.trim(),
      loginPassword: form.loginPassword,
      ...(protocolUrl.value ? { protocolUrl: protocolUrl.value } : {}),
    },
  })
  uni.showToast({ title: '已提交审核', icon: 'success' })
  creating.value = false
  load()
}
async function toggle(a: any) {
  await miniApi.l2Status(a.id, a.status === '启用' ? '停用' : '启用')
  load()
}
async function remove(a: any) {
  const { confirm } = await uni.showModal({ title: '删除二级', content: `确定删除 ${a.name}？` })
  if (!confirm) return
  await miniApi.deleteL2(a.id)
  load()
}
</script>
<style scoped>
.pad { padding: 22rpx 32rpx; }
.desc { display: block; color: #636366; font-size: 24rpx; margin-bottom: 12rpx; }
.card { padding: 24rpx; border-radius: 20rpx; margin-bottom: 12rpx; }
.hd { display: flex; justify-content: space-between; gap: 12rpx; }
.n { display: block; font-weight: 700; }
.m { font-size: 22rpx; color: #8e8e93; }
.ops { display: flex; gap: 12rpx; margin-top: 12rpx; }
.sm { flex: 1; font-size: 24rpx; background: rgba(26,104,215,.08); border-radius: 999rpx; }
.sm.danger { background: rgba(224,88,74,.1); color: #e0584a; }
.sm::after { border: 0; }
.pick { display: flex; justify-content: space-between; padding: 18rpx 0; border-bottom: 1rpx solid rgba(60,60,67,.12); }
.lab { color: #8e8e93; font-size: 22rpx; }
.btn-p { background: #1A68D7; color: #fff; border-radius: 999rpx; font-weight: 700; margin-bottom: 12rpx; }
.btn-p::after { border: 0; }
.ghost { margin-top: 12rpx; background: rgba(26,104,215,.08); border-radius: 999rpx; font-weight: 700; }
.ghost::after { border: 0; }
</style>
