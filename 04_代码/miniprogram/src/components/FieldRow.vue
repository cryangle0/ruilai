<template>
  <view class="field">
    <text v-if="label" class="lab">{{ label }}</text>
    <input
      class="inp"
      :value="modelValue"
      :password="password"
      :placeholder="placeholder"
      :type="type"
      :maxlength="maxlength"
      placeholder-class="ph"
      @input="$emit('update:modelValue', ($event.detail as any).value)"
    />
    <slot />
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  password?: boolean
  type?: string
  maxlength?: number
}>(), { type: 'text' })
defineEmits<{ 'update:modelValue': [string] }>()
</script>
<style scoped lang="scss">
.field { padding: 18rpx 0; border-bottom: 2rpx solid #E5E9F1; }
.lab { display: block; font-size: 22rpx; color: #9AA4B2; margin-bottom: 8rpx; }
.inp {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 56rpx;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  font-size: 30rpx;
}
.ph { color: #9AA4B2; }
</style>
