<template>
  <el-dialog
    :model-value="modelValue"
    title="代理停用待处理"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="alert alert-warn">停用需两名管理员全部会签确认。仅一名管理员确认时，该代理仍可正常使用（未停用）。此待办优先级最高。</div>
    <div v-for="a in pending.l1" :key="'l1'+a.id" class="page-card" style="margin-top:10px">
      <div class="disable-row">
        <div>
          <strong>{{ a.name }}</strong> <span class="tag tag-gray">一级</span> <span class="tag tag-orange">停用待会签</span>
          <p class="muted">{{ disableApplyLine(a) }}</p>
        </div>
        <el-button v-if="signedByMe(a)" disabled>停用（已签字，待会签）</el-button>
        <el-button v-else type="danger" @click="signL1(a.id)">确认停用会签</el-button>
      </div>
    </div>
    <div v-for="a in pending.l2" :key="'l2'+a.id" class="page-card" style="margin-top:10px">
      <div class="disable-row">
        <div>
          <strong>{{ a.name }}</strong> <span class="tag tag-gray">二级</span> <span class="tag tag-orange">停用待会签</span>
          <p class="muted">{{ disableApplyLine(a) }}</p>
        </div>
        <el-button v-if="signedByMe(a)" disabled>停用（已签字，待会签）</el-button>
        <el-button v-else type="danger" @click="signL2(a.id)">确认停用会签</el-button>
      </div>
    </div>
    <p v-if="!pending.l1?.length && !pending.l2?.length" class="empty-hint" style="padding:16px">暂无待会签</p>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">稍后处理</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { alreadySignedDisable, disableApplyLine, pendingDisableForAccount } from '@/utils/disablePending'

const props = withDefaults(defineProps<{ modelValue: boolean; mineOnly?: boolean }>(), {
  mineOnly: true,
})
const emit = defineEmits<{ 'update:modelValue': [boolean]; signed: [] }>()
const auth = useAuthStore()
const pending = reactive<{ l1: any[]; l2: any[] }>({ l1: [], l2: [] })

function signedByMe(a: any) {
  return alreadySignedDisable(a, auth.user?.username)
}
async function reload() {
  const p = await api.disablePending()
  const username = auth.user?.username
  pending.l1 = props.mineOnly ? pendingDisableForAccount(p.l1, username) : (p.l1 || [])
  pending.l2 = props.mineOnly ? pendingDisableForAccount(p.l2, username) : (p.l2 || [])
}
watch(() => props.modelValue, (v) => { if (v) reload() }, { immediate: true })

function closeIfEmpty() {
  if (!pending.l1.length && !pending.l2.length) emit('update:modelValue', false)
}
async function signL1(id: string) {
  await api.disableL1(id)
  ElMessage.success('已会签')
  await reload()
  closeIfEmpty()
  emit('signed')
}
async function signL2(id: string) {
  await api.disableL2(id)
  ElMessage.success('已会签')
  await reload()
  closeIfEmpty()
  emit('signed')
}
</script>
<style scoped>
.alert-warn { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; padding: 10px 12px; border-radius: 8px; font-size: 13px; }
.disable-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.muted { color: var(--text-3); font-size: 12px; margin: 6px 0 0; }
</style>
