<template>
  <view class="scan-field" :class="{ 'has-error': !!error, 'is-disabled': disabled }">
    <text v-if="label" class="scan-field__label">
      {{ label }}<text v-if="required" class="scan-field__required">*</text>
    </text>
    <view class="scan-field__control">
      <input
        class="scan-field__input"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        confirm-type="done"
        placeholder-class="scan-field__placeholder"
        @input="onInput"
        @confirm="$emit('confirm', normalizedValue)"
      />
      <view class="scan-field__divider" />
      <view class="scan-field__action" :class="{ busy: scanning }" @click="scan">
        <view class="scan-field__icon" />
        <text>{{ scanning ? '识别中' : '扫码' }}</text>
      </view>
    </view>
    <text v-if="hint || error" class="scan-field__hint" :class="{ error: !!error }">{{ error || hint }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { scanSn } from '@/utils/scan'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  uppercase?: boolean
  maxlength?: number
}>(), {
  modelValue: '',
  placeholder: '请输入或扫描 SN 码',
  disabled: false,
  required: false,
  uppercase: true,
  maxlength: 100,
})

const emit = defineEmits<{
  'update:modelValue': [string]
  scan: [string]
  confirm: [string]
  error: [unknown]
}>()

const scanning = ref(false)
const normalizedValue = computed(() => normalize(props.modelValue))

function normalize(value: string) {
  const next = String(value || '').trim()
  return props.uppercase ? next.toUpperCase() : next
}

function onInput(event: any) {
  const value = props.uppercase
    ? String(event.detail.value || '').toUpperCase()
    : String(event.detail.value || '')
  emit('update:modelValue', value)
}

async function scan() {
  if (props.disabled || scanning.value) return
  scanning.value = true
  try {
    const value = normalize(await scanSn())
    if (!value) return
    emit('update:modelValue', value)
    emit('scan', value)
  } catch (error) {
    emit('error', error)
  } finally {
    scanning.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/theme.scss';
.scan-field { width: 100%; }
.scan-field__label {
  display: block;
  margin-bottom: 12rpx;
  color: $rl-text-3;
  font-size: $rl-font-xs;
}
.scan-field__required { margin-left: 4rpx; color: $rl-danger; }
.scan-field__control {
  width: 100%;
  height: 72rpx;
  padding-left: 20rpx;
  border: 2rpx solid $rl-border;
  border-radius: 14rpx;
  background: $rl-card;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.scan-field__input {
  flex: 1;
  width: 0;
  max-width: 100%;
  height: 68rpx;
  min-height: 68rpx;
  padding: 0;
  margin: 0;
  border: 0;
  box-sizing: border-box;
  background: transparent;
  color: $rl-text;
  font-size: $rl-font-sm;
  line-height: 68rpx;
}
.scan-field__placeholder { color: $rl-text-3; }
.scan-field__divider { width: 2rpx; height: 36rpx; background: $rl-border; }
.scan-field__action {
  height: 68rpx;
  min-width: 124rpx;
  padding: 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  color: $rl-primary;
  font-size: $rl-font-xs;
  font-weight: 600;
}
.scan-field__action.busy { color: $rl-text-3; }
.scan-field__icon {
  width: 28rpx;
  height: 28rpx;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 8v8M11 8v8M15 8v8M19 8v8'/%3E%3C/svg%3E") center/contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 8v8M11 8v8M15 8v8M19 8v8'/%3E%3C/svg%3E") center/contain no-repeat;
}
.scan-field__hint {
  display: block;
  margin-top: 8rpx;
  color: $rl-text-3;
  font-size: 20rpx;
}
.scan-field__hint.error { color: $rl-danger; }
.has-error .scan-field__control { border-color: $rl-danger-border; }
.is-disabled { opacity: .55; }
</style>
