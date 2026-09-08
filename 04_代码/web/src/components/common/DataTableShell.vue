<template>
  <div class="data-table-shell-host">
    <div class="data-table-shell page-card table-wrap">
      <div v-if="$slots.toolbar" class="shell-toolbar">
        <slot name="toolbar" />
      </div>
      <el-skeleton v-if="loading && !data.length" animated :rows="8" class="shell-skeleton" />
      <el-table
        v-else
        v-loading="loading"
        :data="data"
        size="small"
        style="width: 100%"
        :class="{ 'is-row-clickable': isRowClickable }"
        :row-class-name="rowClassName"
        @row-click="onRowClick"
        @selection-change="onSelectionChange"
      >
        <slot />
        <template #empty>
          <EmptyState :kind="data.length ? 'default' : 'first'" />
        </template>
      </el-table>
      <div v-if="showPagination" class="shell-pagination pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="(p: number) => $emit('update:page', p)"
          @size-change="(s: number) => $emit('update:pageSize', s)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import EmptyState from './EmptyState.vue'

withDefaults(
  defineProps<{
    data: unknown[]
    loading?: boolean
    total?: number
    page?: number
    pageSize?: number
    showPagination?: boolean
    rowClassName?: string | ((opt: { row: any; rowIndex: number }) => string)
  }>(),
  {
    loading: false,
    total: 0,
    page: 1,
    pageSize: 20,
    showPagination: true,
    rowClassName: '',
  },
)

const emit = defineEmits<{
  'update:page': [number]
  'update:pageSize': [number]
  'row-click': [unknown]
  'selection-change': [unknown[]]
}>()

function onRowClick(row: unknown, column: { type?: string }) {
  if (column?.type === 'selection') return
  emit('row-click', row)
}
function onSelectionChange(rows: unknown[]) {
  emit('selection-change', rows)
}

const isRowClickable = computed(() => typeof getCurrentInstance()?.vnode.props?.onRowClick === 'function')
</script>

<style scoped>
.data-table-shell-host,
.data-table-shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.data-table-shell {
  padding: 0;
  overflow: hidden;
}
.shell-toolbar { flex: 0 0 auto; padding: 12px 16px 8px; }
.shell-skeleton { padding: 12px 16px 20px; flex: 1; }
:deep(.el-table) { flex: 1; }
:deep(.is-row-clickable .el-table__body tr) { cursor: pointer; }
.shell-pagination {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  z-index: 6;
  margin-top: auto;
  padding: 14px 16px 14px;
  background: #fff;
}
</style>
