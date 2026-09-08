import { createRouter, createWebHistory, type LocationQuery, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

function q1(query: LocationQuery, key: string) {
  const v = query[key]
  if (v == null) return ''
  return String(Array.isArray(v) ? v[0] : v)
}

function returnHubRedirect(query: LocationQuery, back: 'l1' | 'l2') {
  const idKey = back === 'l1' ? 'l1Id' : 'l2Id'
  const id = q1(query, idKey)
  return {
    path: '/risk/return',
    query: {
      ...query,
      kind: q1(query, 'kind') || 'all',
      back: q1(query, 'back') || back,
      backId: q1(query, 'backId') || id,
    },
  }
}

const AppLayout = () => import('@/layouts/AppLayout.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { public: true, title: '登录' },
  },
  {
    path: '/legal/:type',
    name: 'legal',
    component: () => import('@/views/legal/PolicyView.vue'),
    meta: { public: true, title: '法律条款' },
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/home',
    children: [
      { path: 'home', name: 'home', component: () => import('@/views/home/HomeView.vue'), meta: { title: '工作台' } },
      { path: 'agent/l1/returns', redirect: (to) => returnHubRedirect(to.query, 'l1') },
      { path: 'agent/l2/returns', redirect: (to) => returnHubRedirect(to.query, 'l2') },
      { path: 'agent/l1', component: () => import('@/views/agent/AgentL1View.vue'), meta: { title: '一级代理商' } },
      { path: 'agent/l2', component: () => import('@/views/agent/AgentL2View.vue'), meta: { title: '二级代理商' } },
      { path: 'agent/audit', component: () => import('@/views/agent/AgentAuditView.vue'), meta: { title: '二级审核' } },
      { path: 'agent/pending', component: () => import('@/views/agent/AgentPendingView.vue'), meta: { title: '待分配(法人)' } },
      { path: 'goods/sn', component: () => import('@/views/goods/SnView.vue'), meta: { title: 'SN码库' } },
      { path: 'goods/product', component: () => import('@/views/goods/ProductView.vue'), meta: { title: '商品库' } },
      { path: 'trade/purchase', component: () => import('@/views/trade/PurchaseView.vue'), meta: { title: '采购单管理' } },
      { path: 'trade/sales', component: () => import('@/views/trade/SalesView.vue'), meta: { title: '销售单管理' } },
      { path: 'trade/stock', component: () => import('@/views/trade/StockView.vue'), meta: { title: '库存管理' } },
      { path: 'risk/return', component: () => import('@/views/risk/ReturnView.vue'), meta: { title: '返货管理' } },
      { path: 'risk/exception', component: () => import('@/views/risk/ExceptionView.vue'), meta: { title: '异常管理' } },
      { path: 'risk/customers', component: () => import('@/views/risk/CustomerView.vue'), meta: { title: '销售客户' } },
      { path: 'risk/stats', component: () => import('@/views/risk/StatsView.vue'), meta: { title: '数据统计' } },
      { path: 'system/roles', component: () => import('@/views/system/RoleView.vue'), meta: { title: '角色与权限' } },
      { path: 'system/logs', component: () => import('@/views/system/LogView.vue'), meta: { title: '操作日志' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory('/ruilai/'),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isLoggedIn) return { path: '/login', query: { redirect: to.fullPath } }
  if (!auth.canAccess(to.path)) {
    return { path: '/home' }
  }
  return true
})

export default router
