<template>
  <view class="detail-table">
    <scroll-view v-if="rows.length" scroll-x class="detail-table__scroll">
      <view class="detail-table__body" :style="{ minWidth }">
        <view class="detail-table__row detail-table__head">
          <text
            v-for="column in columns"
            :key="column.key"
            class="detail-table__cell"
            :class="`align-${column.align || 'left'}`"
            :style="cellStyle(column)"
          >{{ column.title }}</text>
        </view>
        <view
          v-for="(row, rowIndex) in rows"
          :key="rowId(row, rowIndex)"
          class="detail-table__row"
          :class="{ clickable }"
          :hover-class="clickable ? 'detail-table__row--pressed' : 'none'"
          @click="select(row, rowIndex)"
        >
          <view
            v-for="column in columns"
            :key="column.key"
            class="detail-table__cell detail-table__value"
            :class="[`align-${column.align || 'left'}`, column.tone || '', { code: column.code, wrap: column.wrap }]"
            :style="cellStyle(column)"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :row-index="rowIndex"
              :column="column"
              :value="row[column.key]"
            >{{ display(row[column.key], column.emptyText) }}</slot>
          </view>
        </view>
      </view>
    </scroll-view>
    <Empty v-else />
  </view>
</template>

<script setup lang="ts">
import Empty from '@/components/Empty.vue'

type TableValue = string | number | boolean | null | undefined
type TableRow = Record<string, TableValue>
type TableColumn = {
  key: string
  title: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  code?: boolean
  wrap?: boolean
  tone?: 'primary' | 'success' | 'danger' | 'muted'
  emptyText?: string
}

const props = withDefaults(defineProps<{
  columns: TableColumn[]
  rows: TableRow[]
  rowKey?: string
  minWidth?: string
  clickable?: boolean
}>(), {
  minWidth: '100%',
  clickable: false,
})

const emit = defineEmits<{ 'row-click': [TableRow, number] }>()

function rowId(row: TableRow, rowIndex: number) {
  if (!props.rowKey) return String(rowIndex)
  const value = row[props.rowKey]
  return String(value === null || value === undefined ? rowIndex : value)
}

function display(value: TableValue, emptyText?: string) {
  if (value === null || value === undefined || value === '') return emptyText || '—'
  return String(value)
}

function cellStyle(column: TableColumn) {
  if (column.width === undefined) return { flex: '1 1 0', width: '0' }
  const width = typeof column.width === 'number' ? `${column.width}rpx` : column.width
  return { flex: `0 0 ${width}`, width }
}

function select(row: TableRow, index: number) {
  if (props.clickable) emit('row-click', row, index)
}
</script>

<style scoped lang="scss">
@import '@/styles/theme.scss';
.detail-table { width: 100%; overflow: hidden; }
.detail-table__scroll { width: 100%; }
.detail-table__body { display: flex; flex-direction: column; }
.detail-table__row {
  display: flex;
  min-height: 58rpx;
  border-bottom: 2rpx solid $rl-fill-note;
}
.detail-table__row:last-child { border-bottom: 0; }
.detail-table__row--pressed { background: $rl-fill-soft; }
.detail-table__cell {
  min-width: 0;
  padding: 16rpx 6rpx;
  color: $rl-text-placeholder;
  font-size: 19rpx;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-table__value { color: $rl-text; font-size: 21rpx; }
.detail-table__value.code { font-family: Consolas, 'SFMono-Regular', monospace; font-size: 20rpx; }
.detail-table__value.primary { color: $rl-primary; font-weight: 600; }
.detail-table__value.success { color: $rl-success; font-weight: 700; }
.detail-table__value.danger { color: $rl-danger; font-weight: 600; }
.detail-table__value.muted { color: $rl-text-disabled; }
.detail-table__cell.wrap {
  white-space: normal;
  overflow: visible;
  word-break: keep-all;
  overflow-wrap: anywhere;
}
.align-center { text-align: center; }
.align-right { text-align: right; }
</style>
