<template>
  <div class="page">
    <div class="page-header is-compact">
      <div>
        <h2>角色与权限</h2>
        <p>后台按角色控制菜单与写操作。二级代理与一级子账号请由一级在小程序「我的」创建</p>
      </div>
      <div class="page-actions">
        <el-button v-if="tab==='accounts'" type="primary" @click="openCreateAccount">新建平台账号</el-button>
        <el-button v-else-if="tab==='roles'" type="primary" @click="openCreateRole">新建角色</el-button>
      </div>
    </div>
    <div class="alert alert-info">平台账号绑定自定义角色后，侧栏与会签/建一级等写操作按权限生效。二级 / 一级子账号仍由一级小程序创建，此处可启停。演示主账号 admin 不可停用。</div>
    <PageTabs v-model="tab" :items="tabItems" />
    <DataTableShell v-if="tab==='accounts'" :data="accounts" :loading="loading" :total="accounts.length" :show-pagination="false">
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="name" label="姓名" width="140" />
      <el-table-column prop="roleName" label="角色" width="160" />
      <el-table-column prop="agentName" label="关联代理" min-width="140" />
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.status==='启用'?'tag-green':'tag-gray'">{{ row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{row}">
          <el-button size="small" @click="openPassword(row)">修改密码</el-button>
          <el-button v-if="row.username!=='admin'" size="small" @click="toggleAcc(row)">{{ row.status==='启用'?'停用':'启用' }}</el-button>
        </template>
      </el-table-column>
    </DataTableShell>
    <DataTableShell v-else-if="tab==='subs'" :data="subs" :loading="loading" :total="subs.length" :show-pagination="false">
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="name" label="姓名" width="140" />
      <el-table-column label="所属一级" min-width="160"><template #default="{row}">{{ l1Name(row.l1Id) }}</template></el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <span class="tag" :class="row.status==='启用'?'tag-green':'tag-gray'">{{ row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{row}">
          <el-button size="small" @click="toggleSub(row)">{{ row.status==='启用'?'停用':'启用' }}</el-button>
        </template>
      </el-table-column>
    </DataTableShell>
    <DataTableShell v-else :data="roles" :loading="loading" :total="roles.length" :show-pagination="false">
      <el-table-column prop="name" label="角色" width="160" />
      <el-table-column prop="remark" label="说明" min-width="180" />
      <el-table-column label="权限" min-width="220">
        <template #default="{row}">
          <span v-for="p in (row.perms||[])" :key="p" class="tag tag-gray" style="margin-right:4px">{{ permLabel(p) }}</span>
          <span v-if="!(row.perms||[]).length">—</span>
        </template>
      </el-table-column>
      <el-table-column label="账号数" width="90" align="right">
        <template #default="{row}">{{ accCount(row) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{row}">
          <el-button size="small" @click="openEditRole(row)">编辑权限</el-button>
          <el-button size="small" type="danger" plain :disabled="!canDeleteRole(row)" @click="removeRole(row)">删除</el-button>
        </template>
      </el-table-column>
    </DataTableShell>

    <el-dialog v-model="roleDlg" :title="roleForm.id ? `编辑权限 · ${roleForm.name}` : '新建角色'" width="560px" @closed="resetRoleForm">
      <p class="hint">{{ roleForm.id
        ? (roleForm.id === 'R1' ? '平台管理员须保留「全部权限」。' : '勾选该角色可用权限；点「全部权限」将全选。一级/二级/子账号角色会影响小程序能力。')
        : '新建后台角色并勾选权限；一级/二级业务账号不在此创建。' }}</p>
      <el-form label-width="90px">
        <el-form-item v-if="!roleForm.id" label="角色名称"><el-input v-model="roleForm.name" placeholder="如 运营专员" /></el-form-item>
        <el-form-item label="角色说明"><el-input v-model="roleForm.remark" :placeholder="roleForm.id ? '' : '可留空，保存时按权限生成'" /></el-form-item>
      </el-form>
      <div class="perm-check-grid">
        <label v-for="p in ALL_PERMS" :key="p" class="perm-check">
          <el-checkbox :model-value="permOn(p)" @change="(v:boolean)=>togglePerm(p,v)" />
          <span class="perm-copy">
            <strong>{{ permLabel(p) }}</strong>
            <small>{{ permDesc(p) }}</small>
          </span>
        </label>
      </div>
      <template #footer>
        <el-button @click="roleDlg=false">取消</el-button>
        <el-button type="primary" @click="saveRole">{{ roleForm.id ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="accDlg" title="新建平台账号" width="440px" @closed="resetAccForm">
      <el-form label-width="80px">
        <el-form-item label="用户名"><el-input v-model="accForm.username" placeholder="如 admin3" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="accForm.name" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="accForm.roleId" style="width:100%">
            <el-option v-for="r in adminRoles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码"><el-input v-model="accForm.password" type="password" show-password placeholder="至少 6 位" /></el-form-item>
      </el-form>
      <p class="hint">仅创建平台后台账号并指定角色；一级主账号随「新建一级」生成，二级/子账号由一级小程序创建。</p>
      <template #footer>
        <el-button @click="accDlg=false">取消</el-button>
        <el-button type="primary" @click="createAcc">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDlg" :title="`修改密码 · ${passwordAccount?.username || ''}`" width="420px" @closed="password=''">
      <el-form label-width="80px">
        <el-form-item label="新密码">
          <el-input v-model="password" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDlg=false">取消</el-button>
        <el-button type="primary" @click="savePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DataTableShell from '@/components/common/DataTableShell.vue'
import PageTabs from '@/components/common/PageTabs.vue'
import { api } from '@/api'

const PERM_LABELS: Record<string, string> = {
  all: '全部权限', purchase: '采购', sales: '销售', stock: '库存', l2: '下级代理',
  aftersale: '售后', sub: '子账号', exception: '异常', sales_scan: '销售扫码',
  sales_view: '销售查看', stock_self: '本级库存',
}
const PERM_DESCS: Record<string, string> = {
  all: '开放后台全部菜单和操作',
  purchase: '查看并处理采购单、审核及入库',
  sales: '查看销售单并进行销售业务操作',
  stock: '查看各级库存、SN 和库存流水',
  l2: '查看、创建和维护二级代理',
  aftersale: '查看并处理返货与售后',
  sub: '查看和维护一级子账号',
  exception: '查看、说明及处理异常预警',
  sales_scan: '仅执行销售出货扫码',
  sales_view: '仅查看本人范围内销售记录',
  stock_self: '仅查看本人所属层级库存',
}
const ALL_PERMS = Object.keys(PERM_LABELS)
function permLabel(k: string) { return PERM_LABELS[k] || k }
function permDesc(k: string) { return PERM_DESCS[k] || '控制对应功能的访问和操作权限' }

const tab = ref('roles')
const loading = ref(false)
const roles = ref<any[]>([])
const accounts = ref<any[]>([])
const subs = ref<any[]>([])
const l1s = ref<any[]>([])
const roleDlg = ref(false)
const accDlg = ref(false)
const passwordDlg = ref(false)
const passwordAccount = ref<any>(null)
const password = ref('')
const roleForm = ref<any>({ perms: [] as string[] })
const accForm = reactive({ username: '', name: '', password: '', roleId: 'R1' })
const tabItems = computed(() => [
  { id: 'roles', title: '角色', badge: roles.value.length || null },
  { id: 'accounts', title: '账号', badge: accounts.value.length || null },
  { id: 'subs', title: '一级子账号', badge: subs.value.length || null },
])
const AGENT_ROLE_IDS = ['R2', 'R3', 'R4']
const adminRoles = computed(() => roles.value.filter((r) => !AGENT_ROLE_IDS.includes(r.id)))
function l1Name(id?: string) { return l1s.value.find((a) => a.id === id)?.name || id || '—' }
function accCount(role: any) {
  const mapped: Record<string, string> = { R1: 'ADMIN', R2: 'L1', R3: 'SUB', R4: 'L2' }
  return accounts.value.filter((a) => a.roleId === role.id || (!a.roleId && a.roleCode === mapped[role.id])).length
}
function canDeleteRole(role: any) {
  if (AGENT_ROLE_IDS.includes(role.id) || role.id === 'R1') return false
  return accCount(role) === 0
}
function permOn(p: string) {
  const sel = roleForm.value.perms || []
  return sel.includes('all') || sel.includes(p)
}
function togglePerm(p: string, on: boolean) {
  if (p === 'all' && roleForm.value.id === 'R1' && !on) {
    ElMessage.warning('平台管理员须保留全部权限')
    return
  }
  let sel = [...(roleForm.value.perms || [])]
  if (p === 'all') {
    roleForm.value.perms = on ? [...ALL_PERMS] : []
    return
  }
  sel = sel.filter((x: string) => x !== 'all')
  if (on && !sel.includes(p)) sel.push(p)
  if (!on) sel = sel.filter((x: string) => x !== p)
  roleForm.value.perms = sel
}
async function load() {
  loading.value = true
  try {
    roles.value = await api.roles()
    accounts.value = await api.accounts()
    subs.value = await api.subs()
  } finally { loading.value = false }
}
function resetRoleForm() {
  roleForm.value = { perms: [] as string[] }
}
function resetAccForm() {
  accForm.username = ''
  accForm.name = ''
  accForm.password = ''
  accForm.roleId = adminRoles.value[0]?.id || 'R1'
}
function openCreateRole() {
  roleForm.value = { name: '', remark: '', perms: [] }
  roleDlg.value = true
}
function openEditRole(row: any) {
  roleForm.value = { id: row.id, name: row.name, remark: row.remark, perms: [...(row.perms || [])] }
  roleDlg.value = true
}
function openCreateAccount() {
  resetAccForm()
  accDlg.value = true
}
async function saveRole() {
  if (!roleForm.value.name) { ElMessage.error('请填写角色名称'); return }
  if (!(roleForm.value.perms || []).length) { ElMessage.error('请至少勾选一项权限'); return }
  if (roleForm.value.id === 'R1' && !(roleForm.value.perms || []).includes('all')) {
    ElMessage.error('平台管理员须保留全部权限')
    return
  }
  await api.saveRole(roleForm.value)
  ElMessage.success('已保存'); roleDlg.value = false; load()
}
async function createAcc() {
  if (!accForm.username.trim()) { ElMessage.error('请填写用户名'); return }
  if (accForm.password.length < 6) { ElMessage.error('登录密码至少 6 位'); return }
  await api.createAccount({ ...accForm })
  ElMessage.success('已创建'); accDlg.value = false
  resetAccForm()
  load()
}
async function toggleAcc(row: any) {
  const next = row.status === '启用' ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确认${next}账号「${row.username}」？`, '账号状态确认', {
      confirmButtonText: '确认',
      type: next === '停用' ? 'warning' : undefined,
    })
  } catch { return }
  await api.toggleAccount(row.id)
  load()
}
function openPassword(row: any) {
  passwordAccount.value = row
  password.value = ''
  passwordDlg.value = true
}
async function savePassword() {
  if (password.value.length < 6) { ElMessage.error('新密码至少 6 位'); return }
  await api.changeAccountPassword(passwordAccount.value.id, password.value)
  ElMessage.success('密码已修改')
  passwordDlg.value = false
}
async function removeRole(row: any) {
  if (!canDeleteRole(row)) {
    ElMessage.error(accCount(row) > 0 ? '该角色已绑定账号，不可删除' : '系统角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除角色「${row.name}」？`, '删除角色', { type: 'warning' })
  } catch { return }
  await api.deleteRole(row.id)
  ElMessage.success('角色已删除')
  load()
}
async function toggleSub(row: any) {
  const next = row.status === '启用' ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确认${next}子账号「${row.username}」？`, '子账号状态确认', {
      confirmButtonText: '确认',
      type: next === '停用' ? 'warning' : undefined,
    })
  } catch { return }
  await api.setSubStatus(row.id, next)
  load()
}
watch(tab, () => {})
onMounted(async () => {
  l1s.value = (await api.agentsL1({ page: 1, pageSize: 200 })).list || []
  load()
})
</script>
<style scoped>
.hint { color: var(--text-2); font-size: 13px; margin: 0 0 12px; }
.perm-copy { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.perm-copy strong { color: var(--text-strong); font-size: 13px; }
.perm-copy small { color: var(--text-3); font-size: 11px; line-height: 1.35; }
</style>
