<template>
  <div class="kpi-grid" :class="`is-${variant}`" :style="gridStyle">
    <component
      :is="item.clickable ? 'button' : 'div'"
      v-for="item in items"
      :key="item.key"
      :type="item.clickable ? 'button' : undefined"
      class="kpi"
      :class="[`kpi--${item.tone || 'blue'}`, `is-${variant}`, { 'is-static': !item.clickable }]"
      @click="item.clickable ? $emit('select', item) : undefined"
    >
      <template v-if="variant === 'stat'">
        <span class="stat-cornor" />
        <div class="stat-top">
          <div class="kpi-ico">
            <el-icon :size="18"><component :is="item.icon || 'TrendCharts'" /></el-icon>
          </div>
          <span v-if="item.hint" class="stat-badge">{{ item.hint }}</span>
        </div>
        <div class="kpi-label">{{ item.label }}</div>
        <div class="kpi-value">{{ item.value }}</div>
      </template>
      <template v-else>
        <div class="kpi-label">{{ item.label }}</div>
        <div class="kpi-value">{{ item.value }}</div>
        <div v-if="item.hint" class="kpi-trend" :class="item.hintDir || 'flat'">{{ item.hint }}</div>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type KpiTone = 'blue' | 'green' | 'purple' | 'orange' | 'amber' | 'red' | 'gray'
export type KpiVariant = 'stat' | 'sm' | 'bar'
export type KpiItem = {
  key: string
  label: string
  value: string | number
  icon?: string
  tone?: KpiTone
  hint?: string
  hintDir?: 'up' | 'down' | 'flat'
  clickable?: boolean
}

const props = withDefaults(
  defineProps<{ items: KpiItem[]; columns?: number; variant?: KpiVariant }>(),
  { columns: 0, variant: 'sm' },
)

defineEmits<{ select: [KpiItem] }>()

const gridStyle = computed(() => {
  const len = props.items.length
  const n = props.columns || 0
  if (props.variant === 'stat') {
    const cols = n || Math.min(6, Math.max(len, 1))
    return { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
  }
  if (props.variant === 'bar') {
    const cols = n || Math.min(7, Math.max(len, 1))
    return { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
  }
  if (n > 0) return { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }
  if (len === 2) return { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
  if (len === 3 || len === 6) return { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
  if (len === 4 || len === 5) return { gridTemplateColumns: `repeat(${len}, minmax(0, 1fr))` }
  return { gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
})
</script>

<style scoped>
.kpi-grid {
  display: grid;
  gap: 16px;
}
.kpi-grid.is-sm,
.kpi-grid.is-bar { gap: 14px; }
.kpi {
  position: relative;
  overflow: hidden;
  text-align: left;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  box-shadow: var(--shadow-card);
  font-family: inherit;
  width: 100%;
  color: inherit;
  appearance: none;
  box-sizing: border-box;
}
.kpi.is-static { cursor: default; }
.kpi:not(.is-static) { cursor: pointer; }
.kpi:not(.is-static):hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22, 32, 64, 0.09); }

.kpi.is-stat {
  padding: 18px 18px 16px;
  min-height: 0;
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.kpi-ico {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi--blue .kpi-ico,
.kpi--purple .kpi-ico { background: #EAF2FD; color: #1A68D7; }
.kpi--green .kpi-ico { background: #E6F6EE; color: #1B9E5A; }
.kpi--orange .kpi-ico,
.kpi--amber .kpi-ico { background: #FDF3E2; color: #E08A1E; }
.kpi--red .kpi-ico { background: #FCEBEB; color: #DE4B4B; }
.kpi--gray .kpi-ico { background: #F3F5F9; color: #5B6472; }
.stat-badge {
  font-size: 11px;
  color: var(--text-3);
  padding: 3px 8px;
  background: var(--bg);
  border-radius: 12px;
  max-width: 58%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kpi.is-stat .kpi-label { font-size: 12.5px; color: var(--text-2); font-weight: 500; }
.kpi.is-stat .kpi-value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: .3px;
  font-family: var(--font-num);
  color: var(--text-strong);
}
.stat-cornor {
  position: absolute;
  right: -22px;
  bottom: -22px;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  opacity: .06;
  background: var(--primary);
  pointer-events: none;
}
.kpi--amber .stat-cornor,
.kpi--orange .stat-cornor { background: var(--warning); }
.kpi--red .stat-cornor { background: var(--danger); }

.kpi.is-sm {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  min-height: 0;
}
.kpi.is-sm .kpi-label { font-size: 13px; color: var(--text-2); font-weight: 500; }
.kpi.is-sm .kpi-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  font-family: var(--font-num);
  color: var(--text-strong);
}
.kpi.is-sm .kpi-trend {
  width: 100%;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-3);
}

.kpi.is-bar {
  padding: 14px 16px 13px;
}
.kpi.is-bar::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(90deg, #1A68D7, #2B7BF0);
}
.kpi--orange.is-bar::before,
.kpi--amber.is-bar::before { background: linear-gradient(90deg, #F5A623, #F7B84B); }
.kpi--green.is-bar::before { background: linear-gradient(90deg, #1B9E5A, #34D399); }
.kpi--red.is-bar::before { background: linear-gradient(90deg, #DE4B4B, #F08080); }
.kpi--purple.is-bar::before { background: linear-gradient(90deg, #0EA5C8, #35C9F0); }
.kpi.is-bar .kpi-label {
  font-size: 12px;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi.is-bar .kpi-label::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 8px rgba(26, 104, 215, 0.55);
}
.kpi--orange.is-bar .kpi-label::before,
.kpi--amber.is-bar .kpi-label::before { background: #F5A623; box-shadow: 0 0 8px rgba(245, 166, 35, 0.55); }
.kpi--green.is-bar .kpi-label::before { background: #1B9E5A; box-shadow: 0 0 8px rgba(27, 158, 90, 0.45); }
.kpi--red.is-bar .kpi-label::before { background: #DE4B4B; box-shadow: 0 0 8px rgba(222, 75, 75, 0.45); }
.kpi--purple.is-bar .kpi-label::before { background: #0EA5C8; box-shadow: 0 0 8px rgba(14, 165, 200, 0.55); }
.kpi.is-bar .kpi-value {
  margin-top: 8px;
  font-size: 25px;
  font-weight: 700;
  line-height: 1;
  font-family: var(--font-num);
  color: var(--text-strong);
}
.kpi.is-bar .kpi-trend { margin-top: 6px; font-size: 11px; color: var(--text-3); }
.kpi-trend.up { color: #1B9E5A; }
.kpi-trend.down { color: #DE4B4B; }

@media (max-width: 1280px) {
  .kpi-grid.is-stat { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  .kpi-grid.is-bar { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
}
@media (max-width: 1100px) {
  .kpi-grid.is-sm { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
}
@media (max-width: 760px) {
  .kpi-grid.is-stat,
  .kpi-grid.is-sm,
  .kpi-grid.is-bar { grid-template-columns: 1fr !important; }
}
</style>
