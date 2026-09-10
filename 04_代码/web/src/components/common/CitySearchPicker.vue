<template>
  <div class="chip-field">
    <label v-if="label" class="form-label">{{ label }}</label>
    <div class="check-head">
      <button type="button" class="check-all" :disabled="!toggleOpts.length" @click="toggleAll">{{ btnLabel }}</button>
    </div>
    <el-input v-model="q" class="city-search" :placeholder="placeholder" clearable>
      <template #prefix>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </template>
    </el-input>
    <div v-if="shown.length" class="check-group">
      <button
        v-for="item in shown"
        :key="item"
        type="button"
        class="chip"
        :class="{ on: selected.includes(item) }"
        :disabled="disabledSet.has(item) && !selected.includes(item)"
        :title="disabledSet.has(item) && !selected.includes(item) ? disabledTitle : ''"
        @click="toggle(item)"
      >{{ item }}</button>
    </div>
    <p v-else class="muted">{{ options.length ? '无匹配城市' : emptyText }}</p>
    <div v-if="selected.length" class="sel-count-wrap">
      <span class="sel-count">已选{{ selected.length }}城</span>
    </div>
    <p v-if="note" class="muted">{{ note }}</p>
    <slot />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string[]
  options: string[]
  label?: string
  allLabel?: string
  emptyText?: string
  placeholder?: string
  note?: string
  disabledOptions?: string[]
  disabledTitle?: string
}>(), {
  label: '城市',
  allLabel: '全选',
  emptyText: '暂无可选城市',
  placeholder: '输入城市名搜索后勾选',
  disabledOptions: () => [],
  disabledTitle: '不在当前代理授权范围内',
})

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const q = ref('')
const selected = computed(() => props.modelValue || [])
const disabledSet = computed(() => new Set(props.disabledOptions || []))
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return props.options.slice()
  return props.options.filter((c) => c.toLowerCase().includes(s))
})
const shown = computed(() => {
  const extra = q.value.trim()
    ? selected.value.filter((c) => props.options.includes(c) && !filtered.value.includes(c))
    : []
  return [...extra, ...filtered.value].filter((item) => selected.value.includes(item) || !disabledSet.value.has(item))
})
const toggleOpts = computed(() => (q.value.trim() ? filtered.value : props.options).filter((item) => !disabledSet.value.has(item)))
const allOn = computed(() => toggleOpts.value.length > 0 && toggleOpts.value.every((x) => selected.value.includes(x)))
const btnLabel = computed(() => q.value.trim() ? '全选搜索结果' : props.allLabel)
function toggle(item: string) {
  if (disabledSet.value.has(item) && !selected.value.includes(item)) return
  const next = selected.value.includes(item)
    ? selected.value.filter((x) => x !== item)
    : [...selected.value, item]
  emit('update:modelValue', next)
}
function toggleAll() {
  const opts = toggleOpts.value
  if (!opts.length) return
  if (allOn.value) emit('update:modelValue', selected.value.filter((c) => !opts.includes(c)))
  else emit('update:modelValue', [...new Set([...selected.value, ...opts])])
}
</script>
<style scoped>
.muted { color: var(--text-3); font-size: 12px; margin: 6px 0 0; }
.sel-count-wrap { margin-top: 9px; }
.chip:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}
</style>
