<template>
  <view class="rl-page">
    <NavBar title="子账号" show-back />
    <view class="pad">
      <text class="desc">一级可创建仅扫码子账号，不可改单。</text>
      <button class="btn-p" @click="openCreate">创建子账号</button>
      <Empty v-if="!rows.length" text="暂无子账号" />
      <view v-for="s in rows" :key="s.id" class="row glass">
        <text>{{ s.username }} · {{ s.name }}</text>
        <button class="sm" @click="toggle(s)">{{ s.status==='启用' ? '停用' : '启用' }}</button>
      </view>
    </view>
    <BottomDrawer v-model="creating" title="创建子账号">
      <FieldRow v-model="form.username" label="登录账号" placeholder="如 hd_scan_03" />
      <FieldRow v-model="form.name" label="姓名" placeholder="仓管姓名" />
      <FieldRow v-model="form.password" label="初始密码" password placeholder="至少 4 位" />
      <template #footer>
        <button class="btn-p" @click="create">保存</button>
      </template>
    </BottomDrawer>
  </view>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import FieldRow from '@/components/FieldRow.vue'
import Empty from '@/components/Empty.vue'
import BottomDrawer from '@/components/BottomDrawer.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'

const user = useUserStore()
const rows = ref<any[]>([])
const creating = ref(false)
const form = reactive({ username: '', name: '', password: '' })

async function load() { rows.value = (await miniApi.subs()).data || [] }
onShow(() => { if (user.ensureRole(['L1'])) load() })

function openCreate() {
  form.username = ''
  form.name = ''
  form.password = ''
  creating.value = true
}

async function create() {
  if (!form.username.trim()) { uni.showToast({ title: '填写账号', icon: 'none' }); return }
  if (form.password.length < 4) { uni.showToast({ title: '初始密码至少 4 位', icon: 'none' }); return }
  await miniApi.saveSub({ username: form.username.trim(), name: form.name.trim(), password: form.password })
  creating.value = false
  load()
}
async function toggle(s: any) {
  await miniApi.subStatus(s.id, s.status === '启用' ? '停用' : '启用')
  load()
}
</script>
<style scoped>
.pad { padding: 22rpx 32rpx; }
.desc { display: block; color: #636366; margin-bottom: 12rpx; }
.row { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-radius: 20rpx; margin-bottom: 12rpx; }
.sm { font-size: 24rpx; background: rgba(26,104,215,.08); border-radius: 999rpx; }
.sm::after { border: 0; }
.btn-p { background: #1A68D7; color: #fff; border-radius: 999rpx; font-weight: 700; margin-bottom: 12rpx; }
.btn-p::after { border: 0; }
</style>
