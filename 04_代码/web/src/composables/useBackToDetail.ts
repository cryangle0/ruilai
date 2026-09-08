import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { routeQ } from '@/utils/detailJump'

export function useBackToDetail() {
  const route = useRoute()
  const router = useRouter()
  const back = computed(() => routeQ(route.query, 'back'))
  const backId = computed(() => routeQ(route.query, 'backId'))
  const visible = computed(() => back.value === 'l1' || back.value === 'l2')

  function go() {
    if (back.value === 'l1') {
      router.push(backId.value ? { path: '/agent/l1', query: { id: backId.value } } : '/agent/l1')
      return
    }
    if (back.value === 'l2') {
      router.push(backId.value ? { path: '/agent/l2', query: { id: backId.value } } : '/agent/l2')
    }
  }

  return { visible, go, back, backId }
}
