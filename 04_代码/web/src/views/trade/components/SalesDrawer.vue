<template>
  <el-dialog v-model="visible" :title="title" width="560px" destroy-on-close>
    <el-form v-if="form" label-width="108px">
      <el-form-item label="一级代理">
        <el-select v-model="form.l1Id" filterable style="width:100%" @change="onL1">
          <el-option v-for="a in l1s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="二级代理">
        <el-select v-model="form.l2Id" filterable style="width:100%">
          <el-option v-for="a in l2s" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品">
        <el-select v-model="form.productId" style="width:100%" @change="onProduct">
          <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标准套件">
        <div class="line-list">
          <div v-for="k in combos" :key="k.key || k.label" class="line">
            <span style="flex:1">{{ k.label }}</span>
            <el-input-number v-model="k.qty" :min="0" :max="999" controls-position="right" />
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" @click="submit">创建并进入扫码</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { kitCombos } from '@/utils/regions'

const props = defineProps<{ modelValue: boolean; l1s: any[] }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [any] }>()
const visible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const title = '提交销售单（分销）'
const form = ref<any>(null)
const l2s = ref<any[]>([])
const products = ref<any[]>([])
const combos = ref<any[]>([])

watch(() => props.modelValue, async (v) => {
  if (!v) return
  products.value = (await api.products({ page: 1, pageSize: 100, status: '上架' })).list || []
  form.value = { l1Id: props.l1s[0]?.id, l2Id: '', productId: products.value[0]?.id }
  await onL1()
  onProduct()
})
async function onL1() {
  if (!form.value?.l1Id) return
  l2s.value = (await api.agentsL2({ page: 1, pageSize: 100, parentId: form.value.l1Id, auditStatus: 'approved' })).list
    ?.filter((a: any) => !a.pending) || []
  if (!l2s.value.some((a) => a.id === form.value.l2Id)) form.value.l2Id = l2s.value[0]?.id
}
function onProduct() {
  const p = products.value.find((x) => x.id === form.value.productId)
  combos.value = kitCombos(p).map((k: any) => ({ ...k, qty: 0 }))
}
async function submit() {
  const lines = combos.value.filter((k) => k.qty > 0).map((k) => ({
    productId: form.value.productId, size: k.size, belt: k.belt, qty: k.qty,
  }))
  if (!form.value.l2Id) { ElMessage.error('请选择二级'); return }
  if (!lines.length) { ElMessage.error('请填写数量'); return }
  const planBySize: Record<string, number> = {}
  let planTotal = 0
  for (const l of lines) {
    planBySize[l.size] = (planBySize[l.size] || 0) + l.qty
    planTotal += l.qty
  }
  const row = await api.createSale({
    channel: 'distribute', l1Id: form.value.l1Id, l2Id: form.value.l2Id,
    productId: form.value.productId, planTotal, planBySize, lines,
  })
  ElMessage.success('已创建销售单')
  visible.value = false
  emit('saved', row)
}
</script>
