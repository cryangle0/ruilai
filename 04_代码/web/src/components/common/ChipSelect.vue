<template>
  <div class="chip-field">
    <label v-if="label" class="form-label">{{ label }}</label>
    <div class="check-head">
      <button type="button" class="check-all" @click="toggleAll">{{ allLabel }}</button>
    </div>
    <div class="check-group">
      <button
        v-for="item in items"
        :key="item"
        type="button"
        class="chip"
        :class="{ on: selected.includes(item), occ: occupiedSet.has(item) }"
        @click="toggle(item)"
      >{{ item }}<span v-if="occupiedSet.has(item)" class="occ-mark">(占用)</span></button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string[]
  items: string[]
  occupied?: string[]
  label?: string
  allLabel?: string
}>(), { occupied: () => [], allLabel: '全选' })

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const selected = computed(() => props.modelValue || [])
const occupiedSet = computed(() => new Set(props.occupied || []))
function isOccupied(item: string) {
  return occupiedSet.value.has(item) && !selected.value.includes(item)
}
const available = computed(() => props.items.filter((x) => !isOccupied(x)))
const allOn = computed(() => available.value.length > 0 && available.value.every((x) => selected.value.includes(x)))
function toggle(item: string) {
  if (isOccupied(item)) return
  const next = selected.value.includes(item)
    ? selected.value.filter((x) => x !== item)
    : [...selected.value, item]
  emit('update:modelValue', next)
}
function toggleAll() {
  emit('update:modelValue', allOn.value ? selected.value.filter((x) => !available.value.includes(x)) : [...available.value])
}
</script>
