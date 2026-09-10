<template>
  <div class="search-panel page-card" :class="{ 'is-expanded-more': moreOpen }">
    <el-form :inline="true" :model="model" class="search-form" size="default" @submit.prevent>
      <slot />
      <el-form-item v-if="hasMoreSlot" class="search-more-toggle">
        <el-button text type="primary" @click="moreOpen = !moreOpen">
          {{ moreOpen ? '收起筛选' : '更多筛选' }}
          <el-icon class="toggle-icon" :class="{ up: moreOpen }"><ArrowDown /></el-icon>
        </el-button>
      </el-form-item>
      <el-form-item class="search-actions">
        <!-- DataTableShell 会把打印/全屏 teleport 到这里，与查询同属一个操作区 -->
        <div class="search-table-tools" data-table-tools-host />
        <el-button type="primary" @click="searchNow">
          <el-icon class="search-ico"><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetNow">重置</el-button>
        <slot name="extra" />
      </el-form-item>
    </el-form>
    <el-form
      v-if="hasMoreSlot && moreOpen"
      :inline="true"
      :model="model"
      class="search-form search-form--more"
      size="default"
      @submit.prevent
    >
      <slot name="more" />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots, watch } from 'vue'
import { ArrowDown, Search } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{ model: Record<string, unknown>; collapsible?: boolean }>(),
  { collapsible: false },
)
const emit = defineEmits<{ search: []; reset: [] }>()

const slots = useSlots()
const moreOpen = ref(false)
const hasMoreSlot = computed(() => Boolean(slots.more))

const SKIP_KEYS = new Set(['page', 'pageSize'])

function snapshot(model: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(model || {})) {
    if (SKIP_KEYS.has(key)) continue
    out[key] = value
  }
  return JSON.stringify(out)
}

let timer: ReturnType<typeof setTimeout> | null = null
let lastSnap = snapshot(props.model)

function clearTimer() {
  if (!timer) return
  clearTimeout(timer)
  timer = null
}

function searchNow() {
  clearTimer()
  lastSnap = snapshot(props.model)
  emit('search')
}

function resetNow() {
  clearTimer()
  emit('reset')
  lastSnap = snapshot(props.model)
}

watch(
  () => snapshot(props.model),
  (next) => {
    if (next === lastSnap) return
    lastSnap = next
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      emit('search')
    }, 280)
  },
)

onBeforeUnmount(clearTimer)
</script>

<style scoped>
.search-panel {
  flex: 0 0 auto;
  overflow: hidden;
  position: relative;
  padding: 16px 20px 16px 24px !important;
  margin-bottom: 0;
}
.search-panel::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary);
  border-radius: 0 3px 3px 0;
}
.search-ico {
  margin-right: 4px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.search-form--more {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
}

.search-form :deep(.el-form-item__label) {
  height: var(--control-height);
  line-height: var(--control-height);
  padding-right: 6px;
  font-size: 13px;
}

.search-form :deep(.el-input__wrapper),
.search-form :deep(.el-select__wrapper) {
  min-height: var(--control-height);
}

.search-form :deep(.el-input__inner),
.search-form :deep(.el-select__placeholder),
.search-form :deep(.el-range-input) {
  font-size: 13px;
}

.search-form :deep(.el-button) {
  height: var(--control-height);
  padding: 0 12px;
}

.search-actions {
  margin-left: 0;
}

.search-actions :deep(.el-form-item__content) {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.search-table-tools {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: var(--control-height);
}

.search-table-tools:empty {
  display: none;
}

.search-table-tools :deep(.el-button) {
  height: var(--control-height);
}

/* 同页多表误挂时只保留第一组打印/全屏 */
.search-table-tools :deep(.shell-toolbar__ops + .shell-toolbar__ops) {
  display: none;
}

.search-more-toggle :deep(.el-button) {
  padding: 0 6px;
}

.toggle-icon {
  margin-left: 2px;
  transition: transform 0.15s ease;
}

.toggle-icon.up {
  transform: rotate(180deg);
}
</style>
