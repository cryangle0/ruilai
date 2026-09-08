<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>操作日志</h2>
        <p>12.1 关键操作留痕：审核 / 改码 / 调库 / 异常 / 导入生成等</p>
      </div>
    </div>
    <SearchPanel :model="query" @search="onSearch" @reset="reset">
      <el-form-item>
        <el-input v-model="query.q" placeholder="搜索动作/账号" clearable style="width:220px" />
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.type" placeholder="全部类型" clearable style="width:140px">
          <el-option label="操作" value="op" />
          <el-option label="登录" value="login" />
          <el-option label="异常" value="exception" />
          <el-option label="预警" value="warn" />
          <el-option label="修改" value="edit" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.from" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="query.to" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
      </el-form-item>
    </SearchPanel>
    <DataTableShell :data="list" :loading="loading" :total="total" v-model:page="page" v-model:pageSize="pageSize">
      <el-table-column label="时间" width="170">
        <template #default="{row}">{{ formatDateTime(row.occurredAt) }}</template>
      </el-table-column>
      <el-table-column prop="account" label="账号" width="120" />
      <el-table-column prop="roleName" label="角色" width="140" />
      <el-table-column label="类型" width="90">
        <template #default="{row}">
          <span class="tag" :class="typeTone(row.type)">{{ logTypeLabel(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="action" label="动作" min-width="220" />
      <el-table-column prop="ip" label="IP" width="130" />
      <el-table-column label="结果" width="80">
        <template #default="{row}">
          <span class="tag" :class="isOk(row.ok) ? 'tag-green' : 'tag-red'">{{ isOk(row.ok) ? '成功' : '失败' }}</span>
        </template>
      </el-table-column>
    </DataTableShell>
  </div>
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import DataTableShell from '@/components/common/DataTableShell.vue'
import { api } from '@/api'
import { usePager } from '@/composables/usePager'
import { logTypeLabel } from '@/utils/format'
import { formatDateTime } from '@/utils/dates'

const { page, pageSize, total, loading, list, query } = usePager()
query.q = ''
query.type = ''
query.from = ''
query.to = ''
function typeTone(t?: string) {
  return t === 'exception' ? 'tag-red' : t === 'login' ? 'tag-blue' : t === 'warn' ? 'tag-orange' : 'tag-gray'
}
function isOk(v: unknown) {
  return v === true || v === 1 || v === '1'
}
async function load() {
  loading.value = true
  try {
    const q = String(query.q || '').trim()
    const type = String(query.type || '')
    const res = await api.logs({
      page: page.value,
      pageSize: pageSize.value,
      ...(q ? { q } : {}),
      ...(type ? { type } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
    })
    list.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}
function onSearch() {
  if (page.value !== 1) {
    page.value = 1
    return
  }
  load()
}
function reset() {
  query.type = ''
  query.q = ''
  query.from = ''
  query.to = ''
  if (page.value !== 1) {
    page.value = 1
    return
  }
  load()
}
watch([page, pageSize], load)
onMounted(load)
</script>
