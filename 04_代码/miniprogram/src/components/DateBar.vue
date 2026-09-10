<template>
  <view class="wrap" :class="{ embedded }">
    <view class="chips">
      <text
        v-for="p in DATE_PRESETS"
        :key="p.id"
        class="chip"
        :class="{ on: preset === p.id }"
        @click="pick(p.id)"
      >{{ p.title }}</text>
    </view>
    <view class="dates">
      <view class="pick">
        <picker mode="date" :value="from || today" :disabled="disabled" @change="onFrom">
          <view class="box">{{ from || '开始日期' }}</view>
        </picker>
      </view>
      <text class="sep">–</text>
      <view class="pick">
        <picker mode="date" :value="to || today" :disabled="disabled" @change="onTo">
          <view class="box">{{ to || '结束日期' }}</view>
        </picker>
      </view>
      <view v-if="showSn" class="sn">
        <input
          class="sn-inp"
          :value="snDraft"
          :placeholder="snPlaceholder"
          :disabled="disabled"
          placeholder-class="ph"
          confirm-type="search"
          :adjust-position="true"
          :hold-keyboard="true"
          :always-embed="true"
          :cursor-spacing="24"
          data-echo="1"
          @input="onSnInput($event)"
        />
        <view class="sn-ico" />
      </view>
      <view v-if="$slots.default" class="extra"><slot /></view>
    </view>
  </view>
</template>
<script lang="ts">
export default {
  options: { virtualHost: true },
}
</script>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { DATE_PRESETS, datePresetRange, todayDate } from '@/utils/dates'
import { inputEventValue } from '@/utils/inputValue'

const props = withDefaults(defineProps<{
  from?: string
  to?: string
  sn?: string
  showSn?: boolean
  snPlaceholder?: string
  embedded?: boolean
  disabled?: boolean
}>(), { snPlaceholder: 'SN码', embedded: false, disabled: false })
const emit = defineEmits<{
  'update:from': [string]
  'update:to': [string]
  'update:sn': [string]
}>()

const today = todayDate()
const preset = ref('all')
const snDraft = ref(String(props.sn || ''))
watch(() => props.sn, (value) => {
  const next = String(value || '')
  if (next !== snDraft.value) snDraft.value = next
})
function onSnInput(event: unknown) {
  snDraft.value = inputEventValue(event, snDraft.value)
  emit('update:sn', snDraft.value)
}

function syncPreset() {
  const from = props.from || ''
  const to = props.to || ''
  if (!from && !to) {
    preset.value = 'all'
    return
  }
  for (const p of DATE_PRESETS) {
    const r = datePresetRange(p.id)
    if (r.from === from && r.to === to) {
      preset.value = p.id
      return
    }
  }
  preset.value = 'custom'
}

onMounted(syncPreset)
watch(() => [props.from, props.to], syncPreset)

function pick(id: string) {
  if (props.disabled) return
  preset.value = id
  const r = datePresetRange(id)
  emit('update:from', r.from)
  emit('update:to', r.to)
}
function onFrom(e: any) {
  preset.value = 'custom'
  emit('update:from', e.detail.value)
}
function onTo(e: any) {
  preset.value = 'custom'
  emit('update:to', e.detail.value)
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.wrap {
  margin: 16rpx 0 8rpx;
  background: $rl-card;
  border: 2rpx solid $rl-border;
  border-radius: $rl-radius-card;
  padding: 18rpx 22rpx 20rpx;
  box-shadow: $rl-shadow-card;
}
.wrap.embedded {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}
.chips {
  display: flex;
  background: $rl-bg;
  border-radius: $rl-radius-sm;
  padding: 4rpx;
  margin-bottom: 14rpx;
}
.chip {
  flex: 1;
  text-align: center;
  padding: 9rpx 0;
  border-radius: 7rpx;
  font-size: 21rpx;
  font-weight: 500;
  color: $rl-text-2;
  background: transparent;
  border: none;
}
.chip.on {
  background: $rl-card;
  color: $rl-primary;
  font-weight: 700;
  box-shadow: $rl-shadow-control;
}
.dates {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 12rpx;
  min-height: $rl-filter-control-h;
}
.pick {
  flex: 1;
  min-width: 0;
  height: $rl-filter-control-h;
}
.pick picker {
  display: block;
  width: 100%;
  height: $rl-filter-control-h;
}
.box,
.sn {
  height: $rl-filter-control-h;
  border-radius: $rl-radius-sm;
  background: $rl-fill-soft;
  border: 2rpx solid $rl-border;
  box-sizing: border-box;
}
.box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  font-size: 22rpx;
  line-height: 46rpx;
  color: $rl-text;
  overflow: hidden;
  white-space: nowrap;
}
.sn {
  flex: 1.4;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 12rpx 0 16rpx;
}
.sn-inp {
  flex: 1;
  width: 0;
  max-width: 100%;
  height: 46rpx;
  min-height: 46rpx;
  padding: 0;
  margin: 0;
  border: none;
  color: $rl-text;
  font-size: 22rpx;
  line-height: 46rpx;
  background: transparent;
}
.ph { color: $rl-text-3; font-size: 22rpx; }
.sn-ico {
  width: 28rpx;
  height: 28rpx;
  margin-left: 8rpx;
  flex-shrink: 0;
  background: $rl-text-3;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='M16.2 16.2 21 21' stroke-linecap='round'/%3E%3C/svg%3E") center/100% no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='M16.2 16.2 21 21' stroke-linecap='round'/%3E%3C/svg%3E") center/100% no-repeat;
}
.sep {
  color: $rl-text-3;
  flex: none;
  align-self: center;
  line-height: $rl-filter-control-h;
}
.extra {
  flex: 0 1 240rpx;
  min-width: 168rpx;
  max-width: 46%;
  display: flex;
  align-items: stretch;
}
.extra :deep(.form-picker) {
  width: 100%;
  min-width: 0;
}
.extra :deep(.form-picker__box) {
  height: $rl-filter-control-h;
}
</style>
