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
      <view class="field">
        <text class="lab">登录账号</text>
        <input class="inp" :value="form.username" placeholder="如 hd_scan_03" placeholder-class="ph" confirm-type="done" :adjust-position="true" :hold-keyboard="true" :always-embed="true" :cursor-spacing="32" data-echo="1" @input="form.username = eventValue($event, form.username)" />
      </view>
      <view class="field">
        <text class="lab">姓名</text>
        <input class="inp" :value="form.name" placeholder="仓管姓名" placeholder-class="ph" confirm-type="done" :adjust-position="true" :hold-keyboard="true" :always-embed="true" :cursor-spacing="32" data-echo="1" @input="form.name = eventValue($event, form.name)" />
      </view>
      <view class="field">
        <text class="lab">初始密码</text>
        <text class="rule">密码规则：至少 6 位</text>
        <input class="inp" :value="form.password" password placeholder="至少 6 位" placeholder-class="ph" confirm-type="done" :adjust-position="true" :hold-keyboard="true" :always-embed="true" :cursor-spacing="32" data-echo="1" @input="form.password = eventValue($event, form.password)" />
      </view>
      <template #footer>
        <view class="btn-p" @click="create">保存</view>
      </template>
    </BottomDrawer>
  </view>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import Empty from '@/components/Empty.vue'
import BottomDrawer from '@/components/BottomDrawer.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'
import { inputEventValue } from '@/utils/inputValue'

const user = useUserStore()
const rows = ref<any[]>([])
const creating = ref(false)
const form = reactive({ username: '', name: '', password: '' })
function eventValue(e: unknown, fallback = '') { return inputEventValue(e, fallback) }

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
  if (form.password.length < 6) { uni.showToast({ title: '初始密码至少 6 位', icon: 'none' }); return }
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
.btn-p { background: #1A68D7; color: #fff; border-radius: 999rpx; font-weight: 700; margin-bottom: 12rpx; height: 80rpx; line-height: 80rpx; text-align: center; }
.field { padding: 18rpx 0; border-bottom: 1rpx solid rgba(60,60,67,.12); }
.lab { display: block; color: #8e8e93; font-size: 22rpx; }
.rule { display: block; margin-top: 8rpx; color: #8e8e93; font-size: 22rpx; }
.inp {
  display: block;
  width: 100%;
  height: 56rpx;
  margin-top: 8rpx;
  color: #1A2B4A;
  font-size: 30rpx;
  line-height: 56rpx;
  background: transparent;
}
.ph { color: #9AA4B2; }
</style>
