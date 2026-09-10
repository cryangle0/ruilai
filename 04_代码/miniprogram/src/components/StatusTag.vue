<template>
  <text class="tag" :class="[tone, { 'has-dot': dot }]">{{ text }}</text>
</template>
<script setup lang="ts">
import { computed } from 'vue'
type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'muted'

const props = defineProps<{
  value?: string
  map?: Record<string, string>
  tone?: StatusTone
  dot?: boolean
}>()

const STATUS_TONES: Record<string, StatusTone> = {
  approved: 'success',
  done: 'success',
  completed: 'success',
  bound: 'success',
  '已完成': 'success',
  '已处理': 'success',
  '已通过': 'success',
  '已激活': 'success',
  '启用': 'success',
  '上架': 'success',
  pending: 'warning',
  cosigning: 'warning',
  scanning: 'warning',
  '待处理': 'warning',
  '待出货': 'warning',
  '待审核': 'warning',
  '会签中': 'warning',
  '扫码中': 'warning',
  rejected: 'danger',
  failed: 'danger',
  '停用': 'danger',
  '已冻结': 'danger',
  '已驳回': 'danger',
  l1: 'info',
  l2: 'info',
  '一级在库': 'info',
  '二级在库': 'info',
  warehouse: 'muted',
  '原厂仓': 'muted',
  '原厂在库': 'muted',
  '已销售': 'success',
}

const text = computed(() => (props.map && props.value ? props.map[props.value] : props.value) || '—')
const tone = computed(() => {
  if (props.tone) return props.tone
  const raw = String(props.value || '').trim().toLowerCase()
  const display = text.value.trim().toLowerCase()
  return STATUS_TONES[raw] || STATUS_TONES[display] || 'muted'
})
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.tag {
  display: inline-flex;
  align-items: center;
  gap: 0;
  height: 34rpx;
  max-width: 100%;
  flex: none;
  align-self: flex-start;
  box-sizing: border-box;
  padding: 0 14rpx;
  border-radius: $rl-radius-sm;
  font-size: 20rpx;
  font-weight: 600;
  white-space: nowrap;
}
.tag.has-dot { gap: 6rpx; }
.tag.has-dot::before {
  content: "";
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: currentColor;
}
.success { background: $rl-success-bg; color: $rl-success; }
.warning { background: $rl-warning-bg; color: $rl-warning; }
.danger { background: $rl-danger-bg; color: $rl-danger; }
.info { background: $rl-info-bg; color: $rl-info; }
.muted { background: $rl-fill-segment; color: $rl-text-secondary; }
</style>
