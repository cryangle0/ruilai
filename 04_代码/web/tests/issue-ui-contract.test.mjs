import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { exceptionRequestScope } from '../src/utils/exceptionScope.ts'

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('exception list and counts share the effective SN scope', () => {
  const scope = exceptionRequestScope({
    dim: 'activate-direct',
    status: '待处理',
    type: '客户信息重复',
    l1Id: 'L1A',
    l2Id: 'L2A',
    from: '2026-09-01',
    to: '2026-09-30',
    sn: ' RL-SN-1 ',
  })
  assert.deepEqual(scope, {
    dim: 'activate-direct',
    status: '待处理',
    type: '客户信息重复',
    l1Id: 'L1A',
    l2Id: 'L2A',
    from: undefined,
    to: undefined,
    sn: 'RL-SN-1',
  })
})

test('issue 1 removes the redundant todo action and fills the row', () => {
  const view = source('src/views/home/HomeView.vue')
  assert.doesNotMatch(view, /查看全部待办/)
  assert.match(view, /grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/)
})

test('issues 2 through 5 keep nationwide provinces and only selectable fence cities', () => {
  const regions = source('src/utils/regions.ts')
  const cityPicker = source('src/components/common/CitySearchPicker.vue')
  const l1 = source('src/views/agent/AgentL1View.vue')
  const l2 = source('src/views/agent/AgentL2View.vue')
  const pending = source('src/views/agent/AgentPendingView.vue')
  const audit = source('src/views/agent/AgentAuditView.vue')
  const service = source('../backend/src/main/java/com/ruilai/module/agent/AgentService.java')

  assert.match(regions, /export const PROVINCES/)
  assert.match(regions, /export const ALL_CITIES/)
  assert.match(cityPicker, /disabledSet\.value\.has\(item\)/)
  assert.match(l1, /:items="PROVINCES"/)
  assert.match(l1, /:options="directCityOpts"/)
  assert.doesNotMatch(l1, /:options="ALL_CITIES"/)
  assert.match(l2, /width="1040px"/)
  assert.match(l2, /form-grid form-grid-3/)
  assert.match(l2, /:options="cityOpts"/)
  assert.doesNotMatch(l2, /:options="ALL_CITIES"/)
  const l2Ent = l2.indexOf('form-sec-title">企业信息')
  const l2Fence = l2.indexOf('form-sec-title">授权范围')
  assert.ok(l2Ent > -1 && l2Fence > l2Ent, 'L2 edit: 企业信息 sits below 基本信息 and above 授权范围')
  assert.match(pending, /:options="cityOpts"/)
  assert.doesNotMatch(pending, /:options="ALL_CITIES"/)
  assert.match(audit, /登录账号/)
  assert.doesNotMatch(audit, /合作协议/)
  assert.match(service, /enrichL2\(row\);\s*fillLogin\(row\);/)
})

test('issues 6 through 10 use content-height dialogs and live badges', () => {
  const audit = source('src/views/agent/AgentAuditView.vue')
  const pending = source('src/views/agent/AgentPendingView.vue')
  const tabs = source('src/components/common/PageTabs.vue')
  const styles = source('src/styles/index.css')
  const sidebar = source('src/layouts/components/Sidebar.vue')
  const purchase = source('src/views/trade/PurchaseView.vue')

  assert.match(audit, /width="900px"/)
  assert.match(pending, /width="820px"/)
  assert.match(pending, /width="920px"/)
  assert.match(tabs, /item\.showZero/)
  assert.match(audit, /id:\s*'pending'[\s\S]*badge:\s*counts\.value\.pending \|\| undefined/)
  assert.doesNotMatch(audit, /showZero:\s*true/)
  assert.match(purchase, /id:\s*'pending'[\s\S]*badge:\s*counts\.pending \|\| undefined/)
  assert.doesNotMatch(purchase, /showZero:\s*true/)
  assert.match(styles, /\.tab \.menu-badge\s*\{[\s\S]*?translateY\(-7px\)/)
  assert.match(sidebar, /v-if="badgeOf\(item\)"/)
  assert.match(sidebar, /ruilai:badges-changed/)
})

test('issues 6, 9, 10, 20, 30, 39 and 44 allow short dialogs to fit content', () => {
  const styles = source('src/styles/index.css')
  assert.doesNotMatch(styles, /(?:^|\n)\s*height:\s*min\(80vh,\s*calc\(100vh - 48px\)\)/)
  assert.match(styles, /\.el-dialog\s*\{[\s\S]*?height:\s*auto/)
})

test('issues 11 through 15 simplify and rebalance the SN list controls', () => {
  const view = source('src/views/goods/SnView.vue')
  assert.doesNotMatch(view, /系统生成SN/)
  assert.match(view, /class="date-range-filter"/)
  assert.doesNotMatch(view, /<el-option label="个性化"/)
  assert.match(view, /<el-option label="再入库" value="再入库"/)
  assert.match(view, /visibleTags\(row\.tags\)/)
  assert.match(view, /label="商品" width="148"/)
  assert.match(view, /label="标签" width="168"/)
  assert.doesNotMatch(view, /label="商品" min-width/)
})

test('issues 16 through 18 use traceable dates and lifecycle compatibility', () => {
  const view = source('src/views/goods/SnView.vue')
  const dates = source('../backend/src/main/java/com/ruilai/module/sn/SnFactoryDates.java')
  const service = source('../backend/src/main/java/com/ruilai/module/sn/SnService.java')
  assert.match(view, /RLyyyyMMdd/)
  assert.match(view, /v-model="n\.date"/)
  assert.match(view, /v-model="n\.text"/)
  assert.match(view, /class="no-wrap-label"/)
  assert.match(dates, /sn\.substring\(2,\s*10\)/)
  assert.match(dates, /SQL_FACTORY_DAY/)
  assert.match(service, /ensureLifecycleForDisplay/)
  assert.match(service, /销售到C端/)
  assert.match(service, /Product::getCode/)
  assert.match(service, /applyFactoryDay/)
  assert.match(view, /note-row :deep\(\.el-date-editor\)/)
})

test('issue 19 keeps size controls in one aligned editor row', () => {
  const view = source('src/views/goods/ProductView.vue')
  assert.match(view, /class="size-config-row"/)
})

test('issue 20 keeps the product dialog content-height', () => {
  const view = source('src/views/goods/ProductView.vue')
  assert.match(view, /class="kit-form-dlg"/)
})

test('issues 21 through 23 share list styling and current-month defaults', () => {
  const paths = [
    'src/views/trade/PurchaseView.vue',
    'src/views/trade/SalesView.vue',
    'src/views/trade/StockView.vue',
    'src/views/risk/ReturnView.vue',
    'src/views/risk/ExceptionView.vue',
    'src/views/risk/CustomerView.vue',
  ]
  for (const path of paths) {
    const view = source(path)
    assert.match(view, /<SearchPanel/)
    assert.match(view, /<KpiCards/)
  }
  for (const path of [
    'src/views/trade/PurchaseView.vue',
    'src/views/risk/ReturnView.vue',
    'src/views/risk/ExceptionView.vue',
  ]) {
    assert.match(source(path), /applyListDates\(query,\s*route\.query\)/)
  }
    assert.match(source('src/views/risk/CustomerView.vue'), /query\.from\s*=\s*query\.from\s*\|\|\s*monthStart\(\)/)
    const kpi = source('src/components/common/KpiCards.vue')
    const search = source('src/components/common/SearchPanel.vue')
    assert.match(kpi, /kpi-copy/)
    assert.match(kpi, /kpi\.is-sm::before/)
    assert.match(search, /search-panel::before/)
    assert.match(search, /<Search \/>/)
  const purchase = source('src/views/trade/PurchaseView.vue')
  const returns = source('src/views/risk/ReturnView.vue')
  const sidebar = source('src/layouts/components/Sidebar.vue')
  assert.match(purchase, /标准\/非标\/单品/)
  assert.doesNotMatch(purchase, /label="配件"/)
  assert.match(purchase, /detail:\s*\{\s*pendingPo:\s*counts\.pending\s*\+\s*counts\.cosigning/)
  assert.match(returns, /detail:\s*\{\s*pendingReturn:\s*kindCounts\.factoryPending/)
  assert.match(sidebar, /badges\.pendingPo\s*=\s*pending\.total\s*\+\s*cosigning\.total/)
  assert.match(sidebar, /badges\.pendingReturn\s*=\s*returns\.total/)
})

test('issues 24 through 27 persist valid custom specs and rejected reasons', () => {
  const drawer = source('src/views/trade/components/PurchaseDrawer.vue')
  const api = source('src/api/index.ts')
  const controller = source('../backend/src/main/java/com/ruilai/module/trade/TradeController.java')
  const service = source('../backend/src/main/java/com/ruilai/module/trade/PurchaseService.java')
  const entity = source('../backend/src/main/java/com/ruilai/module/trade/entity/PurchaseOrder.java')
  const migration = source('../backend/src/main/resources/db/migration/V6__purchase_reject_reason.sql')

  assert.match(drawer, /customProducts/)
  assert.match(drawer, /sizeOptions\(line\)/)
  assert.match(drawer, /beltOptions\(line\)/)
  assert.match(drawer, /\^RL\\d\{5,\}\$/)
  assert.doesNotMatch(drawer, /:disabled="!match"/)
  assert.doesNotMatch(drawer, /段号数量须等于/)
  assert.doesNotMatch(service, /段号数量须等于标准/)
  assert.match(api, /customLines/)
  assert.match(controller, /body\.get\("customLines"\)/)
  assert.match(service, /po\.setCustomLines\(customLines\)/)
  assert.match(service, /po\.setRejectReason/)
  assert.match(entity, /rejectReason/)
  assert.match(migration, /reject_reason/)
})

test('issues 28 through 30 simplify sales tabs and detail dialog', () => {
  const view = source('src/views/trade/SalesView.vue')
  const tabBlock = view.match(/const tabItems = computed\(\(\) => \[([\s\S]*?)\]\)/)?.[1] || ''
  assert.doesNotMatch(tabBlock, /badge:/)
  assert.match(view, /class="muted-label">下单时间/)
  assert.match(view, /class="issue-wide-dialog"/)
})

test('issues 31 through 37 record stock and align return states', () => {
  const stock = source('src/views/trade/StockView.vue')
  const stockTabs = stock.match(/const tabItems = computed\(\(\) => \[([\s\S]*?)\]\)/)?.[1] || ''
  assert.match(stock, /q\.agentId \? \{ agentId: q\.agentId \}/)
  assert.match(stock, /visibleLogs/)
  const dates = source('src/views/goods/SnView.vue')
  assert.match(dates, /factoryDateText\(cur\.sn, cur\.factoryAt\)/)
  const stockService = source('../backend/src/main/java/com/ruilai/module/trade/StockService.java')
  assert.match(stockService, /StringUtils\.hasText\(id\)/)
  const factoryDates = source('../backend/src/main/java/com/ruilai/module/sn/SnFactoryDates.java')
  assert.match(factoryDates, /fromSnPrefix/)
  const returns = source('src/views/risk/ReturnView.vue')
  const dialog = source('src/views/risk/components/ReturnOrderDialog.vue')
  const salesService = source('../backend/src/main/java/com/ruilai/module/trade/SalesService.java')
  const returnService = source('../backend/src/main/java/com/ruilai/module/trade/ReturnService.java')

  assert.doesNotMatch(stockTabs, /badge:/)
  assert.match(salesService, /writeStockLog\(row,\s*"l1"/)
  assert.match(salesService, /终端销售出库/)
  assert.match(returns, /factoryPending/)
  assert.doesNotMatch(returns, /title:\s*'二级代理退货',\s*badge:/)
  assert.match(returns, /title:\s*'终端退货'/)
  assert.match(dialog, /确认通过/)
  assert.match(dialog, /确认驳回/)
  assert.match(returns, /done:\s*'已通过'/)
  assert.match(returns, /rejected:\s*'已驳回'/)
  assert.match(returnService, /syncProcessNote/)
  assert.match(returnService, /situationNotes/)
})

test('issues 38 through 40 explain stock scans and fill parent agents', () => {
  const view = source('src/views/risk/ExceptionView.vue')
  const service = source('../backend/src/main/java/com/ruilai/module/risk/ExceptionService.java')
  assert.match(view, /不会修改库存数量/)
  assert.match(view, /立即按当前标准扫描库存/)
  assert.doesNotMatch(view, /v-model="rules\.overOrderRatio"/)
  assert.doesNotMatch(view, /v-model="rules\.stockTurnover"/)
  assert.match(view, /class="issue-wide-dialog"/)
  assert.match(service, /l2\.getParentId\(\)/)
  assert.match(service, /extra\.put\("l1Id"/)
})

test('issues 41 through 46 separate activation channels and customer filters', () => {
  const exceptions = source('src/views/risk/ExceptionView.vue')
  const sidebar = source('src/layouts/components/Sidebar.vue')
  const exceptionService = source('../backend/src/main/java/com/ruilai/module/risk/ExceptionService.java')
  const customers = source('src/views/risk/CustomerView.vue')
  const customerService = source('../backend/src/main/java/com/ruilai/module/customer/CustomerService.java')
  const salesService = source('../backend/src/main/java/com/ruilai/module/trade/SalesService.java')

  assert.match(exceptionService, /applyActivationChannel\(q,\s*distributed\)/)
  assert.match(exceptions, /class="muted-label">报警时间/)
  assert.doesNotMatch(exceptions, /counts\['activate-dist'\]\s*\|\|\s*counts\.scan/)
  assert.match(exceptions, /api\.exceptionCounts\(scope\)/)
  assert.match(exceptions, /counts\.open\s*=\s*counts\[dimTab\.value\]\s*\|\|\s*0/)
  assert.match(exceptions, /CustomEvent\('ruilai:badges-changed',\s*\{\s*detail:\s*\{\s*openEx/)
  assert.match(sidebar, /badges\.openEx\s*=\s*\(c\['activate-direct'\].*c\['activate-dist'\].*c\.stock/)
  assert.match(salesService, /sameCustomerIdentity/)
  assert.match(customers, /label="重复手机号"\s+value="phone"/)
  assert.match(customers, /label="重复地址"\s+value="addr"/)
  assert.match(customerService, /getRangeQty\(\)\s*<=\s*0/)
})

test('sept 9 exception tickets pin pending first and stop false SN/address flags', () => {
  const snView = source('src/views/goods/SnView.vue')
  const exceptions = source('src/views/risk/ExceptionView.vue')
  const snService = source('../backend/src/main/java/com/ruilai/module/sn/SnService.java')
  const exceptionService = source('../backend/src/main/java/com/ruilai/module/risk/ExceptionService.java')
  const salesService = source('../backend/src/main/java/com/ruilai/module/trade/SalesService.java')
  const home = source('../miniprogram/src/pages/home/index.vue')
  assert.match(snView, /v-if="row\.openException"/)
  assert.doesNotMatch(snView, /v-if="row\.frozen" class="tag tag-red">异常未处理/)
  assert.match(snView, /gotoEx\(row\.sn\)/)
  assert.match(exceptions, /placeholder="SN"/)
  assert.match(exceptions, /sn:\s*query\.sn/)
  assert.match(snService, /applyOpenException/)
  assert.match(exceptionService, /CASE WHEN status IN \('待处理','会签中'\) THEN 0 ELSE 1 END/)
  assert.doesNotMatch(salesService, /异常销售预警：/)
  assert.match(exceptionService, /startsWith\(\"异常销售预警：\"\)/)
  assert.match(salesService, /AddressMatch\.likelySame/)
  assert.match(salesService, /"direct"\.equals\(so\.getChannel\(\)\) \|\| !StringUtils\.hasText\(so\.getL2Id\(\)\)/)
  assert.doesNotMatch(home, /id: 'scan', title: '扫码', badge:/)
  const customers = source('../backend/src/main/java/com/ruilai/module/customer/CustomerService.java')
  const agentService = source('../backend/src/main/java/com/ruilai/module/agent/AgentService.java')
  const miniService = source('../miniprogram/src/pages/service/index.vue')
  assert.match(customers, /AddressMatch\.likelySame/)
  assert.match(customers, /applyDuplicateMarks/)
  assert.match(agentService, /assertUsernameAvailable/)
  assert.match(agentService, /用户名已存在/)
  assert.match(exceptions, /muted-label">SN/)
  assert.match(miniService, /sn-placeholder="SN"/)
})

test('issues 47 through 50 align statistics and explain role permissions', () => {
  const stats = source('src/views/risk/StatsView.vue')
  const dashboard = source('../backend/src/main/java/com/ruilai/module/dashboard/DashboardService.java')
  const roles = source('src/views/system/RoleView.vue')

  assert.match(stats, /kpiPrimary/)
  assert.match(stats, /kpiSecondary/)
  assert.match(stats, /<h3>销售渠道<\/h3>/)
  assert.match(stats, /一级代理排行/)
  assert.match(stats, /dash-panel--half/)
  assert.match(dashboard, /directAll\s*=\s*0;\s*directRange\s*=\s*0;/)
  assert.match(roles, /PERM_DESCS/)
  assert.doesNotMatch(roles, /<code>\{\{\s*p\s*\}\}<\/code>/)
})

test('issues 51 through 60 add account actions and complete mini scan flows', () => {
  const roles = source('src/views/system/RoleView.vue')
  const api = source('src/api/index.ts')
  const layout = source('src/layouts/AppLayout.vue')
  const system = source('../backend/src/main/java/com/ruilai/module/system/SystemController.java')
  const home = source('../miniprogram/src/pages/home/index.vue')
  const bind = source('../miniprogram/src/pkg/bind/index.vue')
  const scan = source('../miniprogram/src/pkg/scan/index.vue')

  assert.match(roles, /removeRole/)
  assert.match(roles, /canDeleteRole/)
  assert.match(roles, /:disabled="!canDeleteRole\(row\)"/)
  assert.doesNotMatch(roles, /v-if="accCount\(row\)===0"/)
  assert.match(system, /系统角色不可删除/)
  assert.match(roles, /savePassword/)
  assert.match(api, /changeAccountPassword/)
  assert.match(api, /unreadNotificationCount/)
  assert.match(system, /deleteRole/)
  assert.match(system, /changeAccountPassword/)
  assert.match(system, /notifications\/unread-count/)
  assert.match(system, /notificationAudience/)
  assert.match(layout, /router\.push\(n\.route\s*\|\|\s*notificationRoute\(n\)\)/)
  assert.match(layout, /api\.unreadNotificationCount\(\)/)
  assert.match(home, /<swiper/)
  assert.match(home, /当前在库[\s\S]*<view class="chart glass">/)
  assert.doesNotMatch(home, /查询扫码/)
  assert.match(home, /salesScanSummary/)
  assert.match(bind, /v-for="\(item,index\) in snRows"/)
  assert.match(bind, /mode="region"/)
  assert.match(bind, /输入加入/)
  assert.match(scan, /手动输入 SN/)
})

test('sales customers keep date filters and never merge a new scan into an old row', () => {
  const service = source('../backend/src/main/java/com/ruilai/module/customer/CustomerService.java')
  const sales = source('../backend/src/main/java/com/ruilai/module/trade/SalesService.java')
  const view = source('src/views/risk/CustomerView.vue')
  assert.match(service, /saleTime\(/)
  assert.match(service, /inRange\(c\.getCreatedAt\(\), from, to\)/)
  assert.doesNotMatch(service, /c\.getUpdatedAt\(\)/)
  assert.match(sales, /customerMapper\.insert\(c\)/)
  assert.doesNotMatch(sales, /eq\(Customer::getPhone, phone\)\.last\("limit 1"\)/)
  assert.doesNotMatch(sales, /\.ne\(Customer::getPhone, phone\)/)
  assert.match(view, /label="重复手机号" value="phone"/)
  assert.match(view, /label="重复地址" value="addr"/)
  assert.doesNotMatch(view, /仅重复/)
})

test('activation customer order numbers are visible and zero exception badges are absent', () => {
  const customers = source('src/views/risk/CustomerView.vue')
  const exceptions = source('src/views/risk/ExceptionView.vue')
  assert.match(customers, /prop="orderNo"\s+label="单号"/)
  assert.match(customers, /<span>单号<\/span>\{\{\s*form\.orderNo/)
  assert.match(exceptions, /badge:\s*counts\['activate-direct'\]\s*\|\|\s*undefined/)
  assert.match(exceptions, /badge:\s*counts\['activate-dist'\]\s*\|\|\s*undefined/)
  assert.match(exceptions, /badge:\s*counts\.stock\s*\|\|\s*undefined/)
})

test('header bell badge matches the design spec instead of a floating pill', () => {
  const layout = source('src/layouts/AppLayout.vue')
  assert.match(layout, /\.bell-dot\s*\{[\s\S]*?box-sizing:\s*border-box/)
  assert.doesNotMatch(layout, /box-sizing:\s*content-box/)
  assert.match(layout, /top:\s*4px/)
  assert.match(layout, /right:\s*4px/)
  assert.match(layout, /min-width:\s*16px/)
  assert.match(layout, /height:\s*16px/)
  assert.match(layout, /border:\s*2px solid #fff/)
})

test('mini program warning tags hug text and home chart stays off the tab bar', () => {
  const app = source('../miniprogram/src/App.vue')
  const biz = source('../miniprogram/src/pages/biz/index.vue')
  const home = source('../miniprogram/src/pages/home/index.vue')
  const trend = source('../miniprogram/src/components/TrendLine.vue')
  assert.match(app, /\.rl-fit-tag/)
  assert.match(app, /width:\s*fit-content/)
  assert.match(app, /128rpx \+ env\(safe-area-inset-bottom\)/)
  assert.match(app, /min-height:\s*0/)
  assert.match(biz, /class="warn-row rl-fit-tag"/)
  assert.match(biz, /@include rl-fit-tag/)
  assert.match(home, /margin-top:\s*16rpx/)
  assert.doesNotMatch(trend, /<canvas/)
  assert.doesNotMatch(trend, /canvas-id/)
})

test('mini program drawers keep form rows inside the sheet', () => {
  const drawer = source('../miniprogram/src/components/BottomDrawer.vue')
  const app = source('../miniprogram/src/App.vue')
  const field = source('../miniprogram/src/components/FieldRow.vue')
  assert.match(drawer, /class="body-inner"/)
  assert.match(drawer, /class="mask-dim"/)
  assert.doesNotMatch(drawer, /<scroll-view/)
  assert.doesNotMatch(drawer, /\.body \{[^}]*padding:\s*0 32rpx/)
  assert.match(app, /overflow-x:\s*hidden/)
  assert.match(field, /@include rl-hug-x/)
})
