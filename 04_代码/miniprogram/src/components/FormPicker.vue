<template>
  <view class="form-picker" :class="{ 'is-disabled': disabled, 'has-error': !!error, 'is-compact': compact }">
    <text v-if="label" class="form-picker__label">
      {{ label }}<text v-if="required" class="form-picker__required">*</text>
    </text>
    <picker
      class="form-picker__native"
      mode="selector"
      :range="labels"
      :value="selectedIndex"
      :disabled="disabled || !normalized.length"
      @change="onChange"
    >
      <view class="form-picker__box">
        <text :class="{ 'form-picker__placeholder': selectedIndex < 0 }">{{ displayText }}</text>
        <text class="form-picker__arrow">›</text>
      </view>
    </picker>
    <text v-if="hint || error" class="form-picker__hint" :class="{ error: !!error }">{{ error || hint }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type PickerValue = string | number
type PickerOption = PickerValue | { label: string; value: PickerValue; disabled?: boolean }

const props = withDefaults(defineProps<{
  modelValue?: PickerValue
  options: PickerOption[]
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  compact?: boolean
  disabledOptionText?: string
}>(), {
  placeholder: '请选择',
  disabled: false,
  required: false,
  compact: false,
  disabledOptionText: '该选项暂不可选择',
})

const emit = defineEmits<{
  'update:modelValue': [PickerValue]
  change: [PickerValue, PickerOption]
}>()

const normalized = computed(() => props.options.map((option) => (
  typeof option === 'object'
    ? option
    : { label: String(option), value: option, disabled: false }
)))
const labels = computed(() => normalized.value.map((option) => option.label))
const selectedIndex = computed(() => normalized.value.findIndex((option) => option.value === props.modelValue))
const displayText = computed(() => selectedIndex.value >= 0
  ? normalized.value[selectedIndex.value].label
  : props.placeholder)

function onChange(event: { detail: { value: string | number } }) {
  const index = Number(event.detail.value)
  const option = normalized.value[index]
  if (!option) return
  if (option.disabled) {
    uni.showToast({ title: props.disabledOptionText, icon: 'none' })
    return
  }
  emit('update:modelValue', option.value)
  emit('change', option.value, props.options[index])
}
</script>

<style scoped lang="scss">
@import '@/styles/theme.scss';
.form-picker { width: 100%; max-width: 100%; min-width: 0; }
.form-picker__native { display: block; width: 100%; max-width: 100%; }
.form-picker__label {
  display: block;
  margin-bottom: 12rpx;
  color: $rl-text-3;
  font-size: $rl-font-xs;
}
.form-picker__required { margin-left: 4rpx; color: $rl-danger; }
.form-picker__box {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 72rpx;
  padding: 0 22rpx;
  box-sizing: border-box;
  border: 2rpx solid $rl-border-strong;
  border-radius: 14rpx;
  background: $rl-fill-primary;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  overflow: hidden;
  color: $rl-text;
  font-size: 25rpx;
  font-weight: 600;
}
.form-picker__box > text:first-child {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.form-picker__placeholder { color: $rl-text-placeholder; font-weight: 400; }
.form-picker__arrow { flex: none; color: $rl-text-disabled; font-size: 34rpx; line-height: 1; }
.form-picker__hint {
  display: block;
  margin-top: 8rpx;
  color: $rl-text-3;
  font-size: 20rpx;
  line-height: 1.4;
}
.form-picker__hint.error { color: $rl-danger; }
.has-error .form-picker__box { border-color: $rl-danger-border; background: $rl-danger-bg; }
.is-disabled { opacity: .55; }
.is-compact .form-picker__box {
  height: $rl-filter-control-h;
  padding: 0 12rpx;
  border-radius: $rl-radius-sm;
  background: $rl-fill-soft;
  font-size: 22rpx;
  font-weight: 500;
}
.is-compact .form-picker__arrow { font-size: 28rpx; }
</style>
