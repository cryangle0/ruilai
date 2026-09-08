<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>数据统计</h2>
        <p>采购 / 销售 / 在库 · 可按一二级与日期筛选</p>
      </div>
    </div>
    <SearchPanel :model="query" @search="load" @reset="reset">
      <el-form-item>
        <el-select v-model="query.l1Id" placeholder="全部一级代理" clearable filterable style="width:180px">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.l2Id" placeholder="全部二级代理" clearable filterable style="width:180px">
          <el-option v-for="a in l2s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
      </el-form-item>
    </SearchPanel>
    <p class="muted">{{ scopeHint }} · 所选日期为统计区间；历史为累计；在库为当前快照</p>
    <div class="dash">
      <KpiCards :items="kpiItems" variant="bar" @select="onKpi" />
      <div class="dash-grid">
        <section class="dash-panel dash-panel--wide">
          <header class="dash-panel-hd"><h3>采购 / 销售趋势</h3><span>按日</span></header>
          <LineChart :labels="st.dayLabels || []" :purchase="st.trendPurchase || []" :sales="st.trendSales || []" />
        </section>
        <section class="dash-panel">
          <header class="dash-panel-hd"><h3>{{ query.l2Id ? '本级销售构成' : '销售渠道' }}</h3><span>区间</span></header>
          <Donut :items="st.channelPie || []" />
        </section>
        <section class="dash-panel">
          <header class="dash-panel-hd">
            <h3>{{ query.l2Id ? 'SN 状态' : (query.l1Id ? '下属二级销量' : '一级代理销量榜') }}</h3>
            <span>区间</span>
          </header>
          <Donut v-if="query.l2Id" :items="st.snStatus || []" />
          <HBars v-else :items="(query.l1Id ? st.l2Rank : st.l1Rank) || []" />
        </section>
        <section v-if="!query.l2Id" class="dash-panel">
          <header class="dash-panel-hd"><h3>SN 状态分布</h3><span>当前范围</span></header>
          <Donut :items="st.snStatus || []" />
        </section>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import SearchPanel from '@/components/common/SearchPanel.vue'
import KpiCards, { type KpiItem } from '@/components/common/KpiCards.vue'
import { api } from '@/api'
import { monthStart, todayDate } from '@/utils/dates'
import { statsToPurchase, statsToSales, statsToStock, statsToException, statsToReturn } from '@/utils/detailJump'

const router = useRouter()
const st = reactive<Record<string, any>>({})
const query = reactive<Record<string, string>>({ l1Id: '', l2Id: '', from: monthStart(), to: todayDate() })
const l1s = ref<any[]>([])
const l2s = ref<any[]>([])
const scopeHint = computed(() => {
  const l2 = l2s.value.find((a) => a.id === query.l2Id)
  const l1 = l1s.value.find((a) => a.id === query.l1Id)
  if (l2) return `当前：${l2.name}（仅该二级）`
  if (l1) return `当前：${l1.name}（本级及下属二级在库）`
  return '当前：全部一级 / 二级'
})
function scope() {
  return {
    l1Id: query.l1Id || undefined,
    l2Id: query.l2Id || undefined,
    from: query.from,
    to: query.to,
  }
}
function go(to: RouteLocationRaw) {
  router.push(to)
}
const kpiItems = computed(() => [
  { key: 'purchaseRange', label: '区间采购数', value: st.purchaseRange ?? 0, icon: 'Document', tone: 'blue' as const, clickable: true },
  { key: 'purchaseAll', label: '累计采购数', value: st.purchaseAll ?? 0, icon: 'Collection', tone: 'purple' as const, clickable: true },
  { key: 'directRange', label: '区间直售数', value: st.directRange ?? 0, icon: 'TrendCharts', tone: 'orange' as const, clickable: true },
  { key: 'directAll', label: '累计直售数', value: st.directAll ?? 0, icon: 'DataAnalysis', tone: 'amber' as const, clickable: true },
  { key: 'distRange', label: '区间分销数', value: st.distRange ?? 0, icon: 'Share', tone: 'green' as const, clickable: true },
  { key: 'distAll', label: '累计分销数', value: st.distAll ?? 0, icon: 'Connection', tone: 'green' as const, clickable: true },
  { key: 'actRange', label: '区间激活数', value: st.actRange ?? 0, icon: 'CircleCheck', tone: 'orange' as const, clickable: true },
  { key: 'actAll', label: '累计激活数', value: st.actAll ?? 0, icon: 'Finished', tone: 'amber' as const, clickable: true },
  { key: 'returnRange', label: '区间退货数', value: st.returnRange ?? 0, icon: 'RefreshLeft', tone: 'red' as const, clickable: true },
  { key: 'returnAll', label: '累计退货数', value: st.returnAll ?? 0, icon: 'RefreshLeft', tone: 'red' as const, clickable: true },
  { key: 'stock', label: '当前在库数量', value: st.stock ?? 0, icon: 'Box', tone: 'purple' as const, clickable: true },
])
function onKpi(item: KpiItem) {
  const s = scope()
  if (item.key === 'purchaseRange') go(statsToPurchase(s, false))
  else if (item.key === 'purchaseAll') go(statsToPurchase(s, true))
  else if (item.key === 'directRange') go(statsToSales('direct', s, false))
  else if (item.key === 'directAll') go(statsToSales('direct', s, true))
  else if (item.key === 'distRange') go(statsToSales('distribute', s, false))
  else if (item.key === 'distAll') go(statsToSales('distribute', s, true))
  else if (item.key === 'actRange') go(statsToException(s, false))
  else if (item.key === 'actAll') go(statsToException(s, true))
  else if (item.key === 'returnRange') go(statsToReturn(s, false))
  else if (item.key === 'returnAll') go(statsToReturn(s, true))
  else if (item.key === 'stock') go(statsToStock(s))
}

async function load() {
  Object.assign(st, await api.stats({ ...query }))
  if (query.l1Id) {
    l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, parentId: query.l1Id, auditStatus: 'approved' })).list || []
  }
}
function reset() {
  query.l1Id = ''; query.l2Id = ''; query.from = monthStart(); query.to = todayDate()
  load()
}

const LineChart = defineComponent({
  props: { labels: { type: Array, default: () => [] }, purchase: { type: Array, default: () => [] }, sales: { type: Array, default: () => [] } },
  setup(props) {
    return () => {
      const labels = props.labels as string[]
      const series = [
        { name: '采购', color: '#1A68D7', values: props.purchase as number[] },
        { name: '销售', color: '#F5A623', values: props.sales as number[] },
      ]
      const W = 640; const H = 220; const pad = { l: 36, r: 16, t: 18, b: 32 }
      const iw = W - pad.l - pad.r; const ih = H - pad.t - pad.b
      const maxV = Math.max(1, ...series.flatMap((s) => s.values.map(Number)))
      const n = Math.max(1, labels.length - 1)
      const xAt = (i: number) => pad.l + (labels.length <= 1 ? iw / 2 : (i / n) * iw)
      const yAt = (v: number) => pad.t + ih - (v / maxV) * ih
      if (!labels.length) return h('div', { class: 'empty-hint' }, '暂无趋势')
      const paths = series.map((s) => {
        const pts = s.values.map((v, i) => `${xAt(i)},${yAt(Number(v) || 0)}`).join(' ')
        const area = `${xAt(0)},${pad.t + ih} ${pts} ${xAt(s.values.length - 1)},${pad.t + ih}`
        return [
          h('polygon', { points: area, fill: `${s.color}22` }),
          h('polyline', { points: pts, fill: 'none', stroke: s.color, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
          ...s.values.map((v, i) => h('circle', { cx: xAt(i), cy: yAt(Number(v) || 0), r: 3, fill: s.color })),
        ]
      })
      const yTicks = [0, 0.5, 1].map((t) => {
        const v = Math.round(maxV * t)
        const y = yAt(v)
        return [
          h('line', { x1: pad.l, y1: y, x2: W - pad.r, y2: y, stroke: '#e7eeec' }),
          h('text', { x: pad.l - 6, y: y + 3, 'text-anchor': 'end', class: 'dash-svg-label' }, String(v)),
        ]
      })
      const step = labels.length > 10 ? Math.ceil(labels.length / 8) : 1
      const xLabs = labels.map((lb, i) => (i % step === 0 || i === labels.length - 1)
        ? h('text', { x: xAt(i), y: H - 8, 'text-anchor': 'middle', class: 'dash-svg-label' }, lb)
        : null)
      return h('div', { class: 'dash-chart' }, [
        h('svg', { viewBox: `0 0 ${W} ${H}`, class: 'dash-svg', role: 'img' }, [...yTicks.flat(), ...paths.flat(), ...xLabs]),
        h('div', { class: 'dash-legend' }, series.map((s) => h('span', [h('i', { style: { background: s.color } }), s.name]))),
      ])
    }
  },
})

const Donut = defineComponent({
  props: { items: { type: Array, default: () => [] } },
  setup(props) {
    return () => {
      const items = (props.items as { label: string; value: number; color: string }[]) || []
      const data = items.filter((x) => x.value > 0)
      const total = data.reduce((n, x) => n + x.value, 0) || 1
      const R = 54; const r = 34; const cx = 70; const cy = 70
      let ang = -Math.PI / 2
      const arcs = (data.length ? data : [{ label: '空', value: 1, color: '#334155' }]).map((it) => {
        const sweep = (it.value / total) * Math.PI * 2
        const a0 = ang; const a1 = ang + sweep; ang = a1
        const large = sweep > Math.PI ? 1 : 0
        const x0 = cx + R * Math.cos(a0); const y0 = cy + R * Math.sin(a0)
        const x1 = cx + R * Math.cos(a1); const y1 = cy + R * Math.sin(a1)
        const xi0 = cx + r * Math.cos(a1); const yi0 = cy + r * Math.sin(a1)
        const xi1 = cx + r * Math.cos(a0); const yi1 = cy + r * Math.sin(a0)
        const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`
        return h('path', { d, fill: it.color || '#1A68D7' }, [h('title', `${it.label} ${it.value}`)])
      })
      const sum = data.reduce((n, x) => n + x.value, 0)
      return h('div', { class: 'dash-donut' }, [
        h('svg', { viewBox: '0 0 140 140', class: 'dash-svg dash-svg--donut' }, [
          ...arcs,
          h('text', { x: 70, y: 66, 'text-anchor': 'middle', class: 'dash-svg-center num' }, String(sum)),
          h('text', { x: 70, y: 84, 'text-anchor': 'middle', class: 'dash-svg-label' }, '合计'),
        ]),
        h('div', { class: 'dash-donut-legend' }, items.map((it) => h('div', { class: 'dash-donut-row' }, [
          h('span', [h('i', { style: { background: it.color } }), it.label]),
          h('strong', { class: 'num' }, String(it.value)),
        ]))),
      ])
    }
  },
})

const HBars = defineComponent({
  props: { items: { type: Array, default: () => [] } },
  setup(props) {
    return () => {
      const rows = ((props.items as { label: string; value: number }[]) || []).slice(0, 6)
      const maxV = Math.max(1, ...rows.map((x) => x.value))
      if (!rows.length) return h('div', { class: 'empty-hint' }, '暂无数据')
      return h('div', { class: 'dash-hbars' }, rows.map((it) => {
        const pct = Math.max(4, Math.round((it.value / maxV) * 100))
        return h('div', { class: 'dash-hbar' }, [
          h('span', { class: 'dash-hbar-label', title: it.label }, it.label),
          h('div', { class: 'dash-hbar-track' }, [h('div', { class: 'dash-hbar-fill', style: { width: `${pct}%`, background: '#1A68D7' } })]),
          h('strong', { class: 'dash-hbar-val num' }, String(it.value)),
        ])
      }))
    }
  },
})

watch(() => query.l1Id, async () => {
  query.l2Id = ''
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, parentId: query.l1Id || undefined, auditStatus: 'approved' })).list || []
})
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 200, auditStatus: 'approved' })).list || []
  load()
})
</script>
<style scoped>
.muted { margin: 0 0 10px; font-size: 12px; color: var(--text-3); }
</style>
