<template>
  <view class="rl-page">
    <NavBar title="客户" show-back />
    <view class="pad">
      <text class="desc">{{ customerScope }} · 可搜手机/地址/SN</text>
      <SearchBar v-model="q" placeholder="搜索手机/地址/SN/姓名" />
      <Empty v-if="!filtered.length" text="暂无客户" />
      <ListCard
        v-for="r in filtered" :key="r.id"
        :title="r.name || r.phone || '未留姓名'"
        :sub="[r.gender, r.age ? `${r.age}岁` : '', r.phone].filter(Boolean).join(' · ')"
        :meta="`${r.addr || '—'} · ${(r.sns||[]).join(' ')}`"
        @click="open(r)"
      />
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import Empty from '@/components/Empty.vue'
import ListCard from '@/components/ListCard.vue'
import { useUserStore } from '@/store/user'
import { miniApi } from '@/service'

const user = useUserStore()
const customerScope = computed(() => {
  if (user.role === 'L2') return '本二级相关 C 端客户'
  if (user.role === 'ADMIN') return '平台 C 端客户'
  return '本一级体系下 C 端客户'
})
const rows = ref<any[]>([])
const q = ref('')
const filtered = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return rows.value
  return rows.value.filter((r) =>
    [r.name, r.phone, r.addr, r.phoneLoc, ...(r.sns || [])].join(' ').toLowerCase().includes(k))
})

onShow(async () => {
  if (!user.ensureRole(['L1', 'L2'])) return
  rows.value = (await miniApi.customers({ pageSize: 100 })).data.list || []
})
function open(r: any) {
  const sn = (r.sns || [])[0]
  if (sn) uni.navigateTo({ url: `/pkg/detail/index?kind=sn&id=${sn}` })
}
</script>
<style scoped>
.pad { padding: 22rpx 32rpx; }
.desc { display: block; color: #636366; font-size: 24rpx; margin-bottom: 8rpx; }
</style>
