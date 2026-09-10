<script lang="ts">
export default {
  options: { virtualHost: true },
}
</script>
<template>
  <view class="field">
    <text v-if="label" class="lab">{{ label }}</text>
    <textarea
      v-if="multiline"
      class="area"
      :value="draft"
      :placeholder="placeholder"
      :maxlength="maxlength"
      placeholder-class="ph"
      :adjust-position="true"
      :auto-height="true"
      :hold-keyboard="true"
      :always-embed="true"
      :cursor-spacing="32"
      data-echo="1"
      @input="onInput($event)"
    />
    <input
      v-else
      class="inp"
      :value="draft"
      :password="password"
      :placeholder="placeholder"
      :type="type"
      :maxlength="maxlength"
      placeholder-class="ph"
      confirm-type="done"
      :adjust-position="true"
      :hold-keyboard="true"
      :always-embed="true"
      :cursor-spacing="32"
      data-echo="1"
      @input="onInput($event)"
    />
    <slot />
  </view>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { inputEventValue } from '@/utils/inputValue'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  password?: boolean
  type?: string
  maxlength?: number
  multiline?: boolean
}>(), { type: 'text', modelValue: '' })
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const draft = ref(String(props.modelValue || ''))

watch(() => props.modelValue, (value) => {
  const next = String(value || '')
  if (next !== draft.value) draft.value = next
})

function onInput(event: unknown) {
  draft.value = inputEventValue(event, draft.value)
  emit('update:modelValue', draft.value)
}
</script>
<style scoped lang="scss">
@import '@/styles/theme.scss';
.field {
  @include rl-hug-x;
  padding: 18rpx 0;
  overflow: hidden;
  border-bottom: 2rpx solid #E5E9F1;
}
.lab { display: block; font-size: 22rpx; color: #9AA4B2; margin-bottom: 8rpx; }
.inp {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 56rpx;
  min-height: 56rpx;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  color: $rl-text;
  font-size: 30rpx;
  line-height: 56rpx;
  background: transparent;
}
.ph { color: #9AA4B2; }
.area {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: 96rpx;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  color: $rl-text;
  font-size: 30rpx;
  line-height: 44rpx;
  background: transparent;
}
</style>
