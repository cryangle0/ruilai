<template>
  <div class="tabs page-tabs-card" :class="{ 'tabs-sm': size === 'pill' }">
    <button
      v-for="item in items"
      :key="String(item.id)"
      type="button"
      class="tab"
      :class="{ active: modelValue === item.id }"
      @click="$emit('update:modelValue', item.id)"
    >
      {{ item.title }}
      <span v-if="item.badge != null && (item.badge !== 0 || item.showZero)" class="menu-badge">{{ item.badge }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    items: { id: string; title: string; badge?: number | null; showZero?: boolean }[]
    size?: 'line' | 'pill'
  }>(),
  { size: 'line' },
)
defineEmits<{ 'update:modelValue': [string] }>()
</script>
