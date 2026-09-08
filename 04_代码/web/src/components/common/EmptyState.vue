<template>
  <div class="empty-state">
    <el-empty :description="resolvedDescription" :image-size="imageSize">
      <div v-if="resolvedTitle" class="empty-title">{{ resolvedTitle }}</div>
      <p v-if="resolvedHint" class="empty-hint">{{ resolvedHint }}</p>
      <slot />
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type EmptyKind = 'first' | 'filtered' | 'forbidden' | 'error' | 'default'

const props = withDefaults(
  defineProps<{
    kind?: EmptyKind
    description?: string
    title?: string
    hint?: string
    hideHint?: boolean
    imageSize?: number
  }>(),
  {
    kind: 'default',
    description: '',
    title: '',
    hint: '',
    hideHint: false,
    imageSize: 80,
  },
)

const presets: Record<EmptyKind, { title: string; description: string; hint: string }> = {
  first: {
    title: '',
    description: '还没有任何记录',
    hint: '',
  },
  filtered: {
    title: '无匹配结果',
    description: '当前筛选条件下没有数据',
    hint: '可调整条件后重新查询，或重置筛选',
  },
  forbidden: {
    title: '无访问权限',
    description: '当前账号无权查看该数据',
    hint: '请联系管理员开通对应权限',
  },
  error: {
    title: '加载失败',
    description: '数据未能成功加载',
    hint: '请检查网络后重试',
  },
  default: {
    title: '',
    description: '暂无数据',
    hint: '',
  },
}

const resolvedTitle = computed(() => props.title || presets[props.kind].title)
const resolvedDescription = computed(
  () => props.description || presets[props.kind].description,
)
const resolvedHint = computed(() => {
  if (props.hideHint) return ''
  return props.hint || presets[props.kind].hint
})
</script>

<style scoped>
.empty-state {
  padding: 12px 0;
}
.empty-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.empty-hint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin: 0 0 12px;
}
</style>
