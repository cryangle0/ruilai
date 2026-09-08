<template>
  <view class="detail-kv" :class="[`columns-${columns}`, { divided }]">
    <view
      v-for="(item, index) in items"
      :key="item.key || `${item.label}-${index}`"
      class="detail-kv__item"
      :class="{ full: item.full }"
    >
      <text class="detail-kv__label">{{ item.label }}</text>
      <slot :name="`value-${item.key}`" :item="item" :value="item.value" :index="index">
        <text
          class="detail-kv__value"
          :class="[item.tone || 'default', { code: item.code }]"
          selectable
        >{{ display(item.value) }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
type DetailKvValue = string | number | boolean | null | undefined
type DetailKvItem = {
  key?: string
  label: string
  value?: DetailKvValue
  full?: boolean
  code?: boolean
  tone?: 'default' | 'secondary' | 'primary' | 'success' | 'danger'
}

const props = withDefaults(defineProps<{
  items: DetailKvItem[]
  columns?: 1 | 2 | 3
  emptyText?: string
  divided?: boolean
}>(), {
  columns: 2,
  emptyText: '—',
  divided: false,
})

function display(value: DetailKvValue) {
  if (value === null || value === undefined || value === '') return props.emptyText
  return String(value)
}
</script>

<style scoped lang="scss">
@import '@/styles/theme.scss';
.detail-kv {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22rpx 18rpx;
}
.detail-kv.columns-1 { grid-template-columns: minmax(0, 1fr); }
.detail-kv.columns-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.detail-kv__item { min-width: 0; display: flex; flex-direction: column; gap: 8rpx; }
.detail-kv__item.full { grid-column: 1 / -1; }
.detail-kv.divided .detail-kv__item {
  padding-bottom: 18rpx;
  border-bottom: 2rpx solid $rl-fill-note;
}
.detail-kv__label { color: $rl-text-placeholder; font-size: 20rpx; line-height: 1.35; }
.detail-kv__value {
  color: $rl-text;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.detail-kv__value.secondary { color: $rl-text-secondary; font-weight: 400; }
.detail-kv__value.primary { color: $rl-primary; }
.detail-kv__value.success { color: $rl-success; }
.detail-kv__value.danger { color: $rl-danger; }
.detail-kv__value.code {
  font-family: Consolas, 'SFMono-Regular', monospace;
  font-size: 23rpx;
  word-break: break-all;
}
</style>
