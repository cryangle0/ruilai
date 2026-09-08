<template>
  <div class="header-bar">
    <span>首页</span>
    <span class="sep">/</span>
    <strong>{{ title }}</strong>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => {
  const last = [...route.matched].reverse().find((m) => m.meta?.title)
  return last ? String(last.meta.title) : '页面'
})
</script>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-3);
}
.sep { color: var(--text-4); }
strong { color: var(--text); font-weight: 500; }
</style>
