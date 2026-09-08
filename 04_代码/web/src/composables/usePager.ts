import { reactive, ref } from 'vue'

export function usePager() {
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const loading = ref(false)
  const list = ref<any[]>([])
  const query = reactive<Record<string, unknown>>({})

  function resetPage() {
    page.value = 1
  }

  return { page, pageSize, total, loading, list, query, resetPage }
}
