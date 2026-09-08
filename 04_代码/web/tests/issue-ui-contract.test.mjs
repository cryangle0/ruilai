import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('issue 1 removes the redundant todo action and fills the row', () => {
  const view = source('src/views/home/HomeView.vue')
  assert.doesNotMatch(view, /查看全部待办/)
  assert.match(view, /grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/)
})

test('issues 2 through 5 keep nationwide choices and align agent details', () => {
  const regions = source('src/utils/regions.ts')
  const cityPicker = source('src/components/common/CitySearchPicker.vue')
  const l1 = source('src/views/agent/AgentL1View.vue')
  const l2 = source('src/views/agent/AgentL2View.vue')
  const audit = source('src/views/agent/AgentAuditView.vue')
  const service = source('../backend/src/main/java/com/ruilai/module/agent/AgentService.java')

  assert.match(regions, /export const ALL_CITIES/)
  assert.match(cityPicker, /disabledOptions/)
  assert.match(l1, /:options="ALL_CITIES"/)
  assert.match(l2, /width="1040px"/)
  assert.match(l2, /form-grid form-grid-3/)
  assert.match(l2, /:options="ALL_CITIES"/)
  assert.match(audit, /登录账号/)
  assert.doesNotMatch(audit, /合作协议/)
  assert.match(service, /enrichL2\(row\);\s*fillLogin\(row\);/)
})

test('issues 6 through 10 use content-height dialogs and live badges', () => {
  const audit = source('src/views/agent/AgentAuditView.vue')
  const pending = source('src/views/agent/AgentPendingView.vue')
  const tabs = source('src/components/common/PageTabs.vue')
  const sidebar = source('src/layouts/components/Sidebar.vue')
  const purchase = source('src/views/trade/PurchaseView.vue')

  assert.match(audit, /width="900px"/)
  assert.match(pending, /width="820px"/)
  assert.match(pending, /width="920px"/)
  assert.match(tabs, /item\.showZero/)
  assert.match(audit, /showZero:\s*true/)
  assert.match(purchase, /id:\s*'rejected'.*showZero:\s*true/)
  assert.match(sidebar, /v-if="badgeOf\(item\)"/)
  assert.match(sidebar, /ruilai:badges-changed/)
})

test('issues 6, 9, 10, 20, 30, 39 and 44 allow short dialogs to fit content', () => {
  const styles = source('src/styles/index.css')
  assert.doesNotMatch(styles, /height:\s*min\(80vh,\s*calc\(100vh - 48px\)\)/)
  assert.match(styles, /\.el-dialog\s*\{[\s\S]*?height:\s*auto/)
})

test('issues 11 through 15 simplify and rebalance the SN list controls', () => {
  const view = source('src/views/goods/SnView.vue')
  assert.doesNotMatch(view, /系统生成SN/)
  assert.match(view, /class="date-range-filter"/)
  assert.doesNotMatch(view, /<el-option label="个性化"/)
  assert.match(view, /<el-option label="再入库" value="再入库"/)
  assert.match(view, /visibleTags\(row\.tags\)/)
})

test('issue 19 keeps size controls in one aligned editor row', () => {
  const view = source('src/views/goods/ProductView.vue')
  assert.match(view, /class="size-config-row"/)
})
