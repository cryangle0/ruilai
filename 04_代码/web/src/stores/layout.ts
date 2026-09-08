import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const sidebarWidth = computed(() => 'var(--sidebar-width)')
  return { sidebarWidth }
})
