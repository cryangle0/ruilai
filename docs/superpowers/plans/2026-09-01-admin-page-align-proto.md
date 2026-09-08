# 后台按页对齐原型 Implementation Plan

> **For agentic workers:** 一页一改、一页一点验。不要一次改完 16 页再测。验证用 Chrome DevTools（`user-chrome-devtools`），不要用 cursor-ide-browser。

**Goal:** 后台每个侧栏页（含登录壳）的列表、弹框、跳转与原型 `assets/app.js` 的**真实点击路径**一致。

**Architecture:** 对照物是原型里 `data-go` / `openModal` 实际会走到的页面，不是 `PAGES` 里无人跳转的死代码。跨页跳转先做一套 query + 返回约定，再按页改入口。小程序本轮不做。

**Tech Stack:** Vue3 + Element Plus（`04_代码/web`），Java API 只在该页缺后端能力时改。原型 persist key `ruilai_proto_v18` 不 bump。

**Spec:** 本文件 + 原型 `项目/锐涞经销商管理系统/assets/app.js`（`adminMenus` ~3336、`l1DetailJumpAttr` ~3514、`pageReturn` ~4140、`PAGES` ~5779）。

## Global Constraints

- 对照路径：原型 `data-go` 实际落地页。`l1-return-detail` / `l2-return-detail` 无任何 `data-go`，当死代码，不按它们做独立页。
- 一页做完必须用 Chrome DevTools 点：列表、主弹框、该页发出的跳转、返回。通过后再开下一页。
- 不破坏演示数据：不要双人会签把一级停掉；离开异常用「暂不处理，离开」，不要批量「已处理并离开」。
- 不 commit `.env` / OSS / 短信 / 微信私钥；不 bump 原型 key。
- 不改小程序弹框（`create-po` / `create-so` / `create-return` / `create-l2-mini` / `create-sub`）。
- 表头 `thFilterHtml` vs `SearchPanel` 位置不同：本轮不改布局，只补缺的筛选项。
- 同一天多页改完再部署一次前端；不要每页都 `vite build`。后端只在该页缺接口时打包。
- 线上：Web `https://label.onnsa.cn/ruilai/`，演示 `admin` / `admin2` / `demo`，密码 `demo`。

## 已做成、本轮只点验不重做

| 能力 | 文件 |
|---|---|
| 一级城市 chips / 全选全国 / 占用禁用 | `ChipSelect.vue`、`AgentL1View.vue` |
| 二级围栏城市搜索 chips | `CitySearchPicker.vue`、`AgentL2View.vue` |
| 待分配重新绑定城市 chips | `AgentPendingView.vue` |
| 采购段号数量=需求 | `PurchaseDrawer.vue`、`PurchaseService.java` |
| SN Excel 导入 | `SnView.vue`、`utils/snSeg.ts` |
| 离开异常三按钮 | `ExceptionView.vue` |
| 停用会签登录强制弹 | `DisablePendingDialog.vue`、`AppLayout.vue` |

## 文件地图（共享）

- Create: `04_代码/web/src/utils/detailJump.ts` — 一级/二级详情跳转 query 构造（对齐 `l1DetailJumpAttr` / `l2DetailJumpAttr`）
- Create: `04_代码/web/src/composables/useBackToDetail.ts` — 读 `back` query，顶栏「返回」回到 `agent-l1?id=` / `agent-l2?id=`
- Modify: `ReturnView.vue`、`PurchaseView.vue`、`SalesView.vue`、`StockView.vue`、`ExceptionView.vue` — `onMounted` 吃 query（日期/tab/代理），有 `back` 时显示返回
- Modify: `router/index.ts` — `/agent/l1/returns`、`/agent/l2/returns` 改 redirect 到 `/risk/return`（带 query），不再渲染独立详情组件
- Delete or stop using: `L1ReturnDetailView.vue`、`L2ReturnDetailView.vue`（redirect 生效后可删）

原型跳转契约（一级详情，`app.js:3514-3523`）：

| 按钮 | `data-go` | filter / tab | back |
|---|---|---|---|
| 采购 | `purchase` | `l1` + `from=monthStart` + `to=today` + tab `all` | `agent-l1-detail` |
| 销售 | `sales` | 同上 | 同上 |
| 退货 | **`return`（返货管理）** | `l1` + `l2=` + 当月日期 + tab `return-kind:all` + `return:all` | 同上 |
| 库存 | `stock` | `type=l1` + `agent=` | 同上 |
| 异常 | `exception` | `l1` + `l2=` + tab `activate-direct` | 同上 |
| 采购待处理 | `purchase` | `l1` + tab `pending` | 同上 |
| 售后待处理 | `return` | `l1` + tab `pending` | 同上 |

二级「采购」在原型是进 **销售单 · 分销 tab**，不是采购单（`app.js:3527`）。Vue 现在错跳 `/trade/purchase`。

---

### Task 0: 共享跳转 / 返回 / 日期

**Files:**
- Create: `04_代码/web/src/utils/detailJump.ts`
- Create: `04_代码/web/src/composables/useBackToDetail.ts`
- Modify: 五个货品/售后列表页 `onMounted` 读 query

- [ ] **Step 1:** `detailJump.ts` 输出与上表一致的 `{ path, query }`。日期用已有 `monthStart()` / `todayDate()`（`utils/dates.ts`）。query 键与现有 Vue 对齐：`l1Id` / `l2Id` / `from` / `to` / `tab` / `kind` / `status` / `back` / `backId`。
- [ ] **Step 2:** 有 `back=l1|l2` 时，目标页顶栏出「返回」，点回 `/agent/l1?id=backId` 或 `/agent/l2?id=backId`。侧栏从返货管理进的不加返回（`backToL1DetailAction` 无 `backRoute` 时为空）。
- [ ] **Step 3:** 列表页若 query 没带日期，默认本月 1 号～今天（对齐 `applyListDates`）。「历史」才清空日期。
- [ ] **Step 4:** 不在本任务改任何页面文案。Commit 仅在用户要求时做。

**Verify:** 单元不必；Task 3/4 点跳转时验证。

---

### Task 1: 登录壳

**Files:** `LoginView.vue`、`AppLayout.vue`、`DisablePendingDialog.vue`

对照：`maybePromptL1Disable`、`l1-disable-pending`（`close-on-click-modal=false`）。

- [ ] 登录页 admin/demo 能进工作台。
- [ ] 有待会签时登录后强制弹；点遮罩关不掉；「稍后处理」可关。演示无待办时：admin 在一级详情只签一名，logout 用 admin2 登录看弹框。不要点第二名。
- [ ] 顶栏通知、退出确认各点一次。

**Verify:** Chrome DevTools 登录 / 弹框 / 退出。

---

### Task 2: 工作台

**Files:** `HomeView.vue`  
对照：`pageHome` ~3442

- [ ] 6 个 KPI 跳转目标与原型一致（一级/二级/销售/SN/采购/异常）。
- [ ] 待办：待分配、二级审核、采购、异常、退货待审批 → 对应列表。退货待审批进返货管理。
- [ ] 决策（已写入本计划默认）：**保留**「代理停用待会签」待办（比原型多一条），登录强制弹仍要有。若用户要删待办，本页再改。

**Verify:** 点每个 KPI 和待办，看落地 URL/筛选项。

---

### Task 3: 返货管理（跳转枢纽，提前做）

**Files:** `ReturnView.vue`、`router/index.ts`、`L1ReturnDetailView.vue`、`L2ReturnDetailView.vue`  
对照：`pageReturn` ~4186，**不是** `pageL1ReturnDetail`

- [ ] 独立路由 `/agent/l1/returns`、`/agent/l2/returns` 改为 redirect 到 `/risk/return`（带 `l1Id`/`l2Id`/`from`/`to`/`kind=all`）。
- [ ] 吃 query：`l1Id`、`l2Id`、`from`、`to`、`kind`（类型 tab）、`status`（仅一级退原厂时的状态 tab）。
- [ ] 从详情跳入时顶栏「返回」；侧栏直接进则无返回。保留「数据统计」按钮。
- [ ] 点行开 `ReturnOrderDialog`。后台无新建退货单。
- [ ] 默认类型 tab：从详情「退货」来是「全部类型」；侧栏进入保持现状（若原型侧栏默认是一级退原厂，跟原型 `ui.tabs['return-kind']`）。先读 `pageReturn` 默认 `kind` 再定；不要猜。
- [ ] 待审置顶：仅非 user/l2 类型时，pending 在前（`app.js:4166-4172`）。

**Verify:** 侧栏进返货管理；再从书签打开带 `l1Id` 的 URL 应筛出该一级。点一行弹框。

---

### Task 4: 一级代理商

**Files:** `AgentL1View.vue`  
对照：`pageAgentL1`、`pageAgentL1Detail`、`create-l1` / `edit-l1`

- [ ] 列表点行进详情 `?id=`；返回列表。新建/编辑弹框已有 chips，本页只点验占用禁用 + 全选全国。
- [ ] 「退货」改为 `detailJump.returnFromL1(id)` → `/risk/return`，不再进独立页。
- [ ] 采购/销售/库存/异常/采购待处理/售后待处理 全部走 `detailJump`，带当月日期和 tab。
- [ ] 停用会签只点一名做 Task 1 数据，不要双签。

**Verify:** 点行详情 → 每个底栏按钮看 URL → 返回回到同一详情。

---

### Task 5: 二级代理商

**Files:** `AgentL2View.vue`  
对照：`pageAgentL2`、`pageAgentL2Detail`、`l2DetailJumpAttr`、`edit-l2`

- [x] 后台无「新建二级」。编辑标题固定「编辑二级代理」。围栏 chips 点验。
- [x] 「退货」→ `/risk/return?l1Id=parent&l2Id=<二级>&kind=all`（以原型 `l2=id` 为准，不是空 l2Id）。
- [x] 「采购」→ **销售单分销 tab**（原型 `data-go=sales` + `sales:distribute`），不是采购单。
- [x] 销售/库存/异常带 parentId + l2Id。Chrome 点验杭州城西专营，待用户确认。

**Verify:** 同上，重点核对采购落地页。

---

### Task 6: 二级审核

**Files:** `AgentAuditView.vue`  
对照：`pageAgentL2Audit`、`view-l2-audit`

- [x] Tab 待审/已通过/已驳回/全部。点行详情，通过/驳回在弹框内（已通过无这两个按钮）。通过/驳回先确认。一级名称搜索按 parent/prevParent。
- [x] 不在演示环境随便驳已通过单。待审为 0 时只开空列表 + 切 Tab。Chrome 点验通过，待用户确认。

**Verify:** 打开列表和详情弹框，无白屏。

---

### Task 7: 待分配(法人)

**Files:** `AgentPendingView.vue`  
对照：`pageAgentPending`、`view-pending-l2`、`rebind-l2`

- [x] 点行详情 → 重新绑定。城市 chips + 掉出可售范围提示。绑定先确认。不提交会改数据的绑定。
- [x] 线上演示池当前为 0（金华已绑在华东，未解绑造数据）。Chrome：空列表 + 说明文案。弹框代码已对齐，待有待分配行时再点。

**Verify:** 打开两个弹框后取消。

---

### Task 8: SN 码库

**Files:** `SnView.vue`  
对照：`pageSN`、`view-sn`、`edit-sn`、`gen-sn`、`import-sn-seg`、`reassign-frozen`

- [x] 点行详情；改到编辑再取消。生成 SN 弹框打开即关。导入弹框确认有文件选择 + 粘贴。冻结码 RL202606150002 打开重分配后取消。
- [x] 不批量生成/导入污染号段。生成/导入/重分配均先确认。Chrome 点验通过，待用户确认。

**Verify:** 四个弹框都能开。

---

### Task 9: 商品库

**Files:** `ProductView.vue`  
对照：`pageProduct`、`create-product`、`edit-product`

- [x] Tab 全部/套件/单品。点行编辑，取消不保存。新建套件走一遍 UI 不点创建（避免脏数据），核对组件/尺码 chips。
- [x] Chrome 点验通过，待用户确认。未点删除、未点创建。

**Verify:** 列表 + 编辑弹框。

---

### Task 10: 采购单管理

**Files:** `PurchaseView.vue`、`PurchaseDrawer.vue`  
对照：`pagePurchase`、`view-purchase`、`audit-po`

- [x] 后台无新建。点行详情；pending 单「去审核」：空号段确认按钮禁用（演示 PO1）；数量匹配才可点（PO4）。不要用 admin2 把演示一级停用签完。
- [x] 吃 `l1Id` + `tab=pending` + 日期。有 `back` 显示返回。
- [x] Chrome 点验通过，待用户确认。未点确认会签、未点删除。

**Verify:** 从一级「采购待处理」跳入应停在 pending tab。

---

### Task 11: 销售单管理

**Files:** `SalesView.vue` 及详情抽屉  
对照：`pageSales`、`view-sale`。`scan-so` 是小程序主路径。

- [x] 后台无新建分销/直销。点行详情。
- [x] **默认：去掉后台销售详情里的扫码入口**（原型后台没有）。若用户要留，本页标 extra 不删。
- [x] 吃 `l1Id`/`l2Id`/`tab`/`from`/`to`。二级「采购」会跳到本页 `tab=distribute`。
- [x] Chrome 点验通过，待用户确认。未扫码、未新建。

**Verify:** 从二级点「采购」应落到销售分销 tab。

---

### Task 12: 库存管理

**Files:** `StockView.vue`  
对照：`pageStock`、`view-stock`

- [x] 点行详情：流水 + SN + 可跳码库。吃 `agentType` + `agentId`。
- [x] 流水口径若与原型 `stockRowLogs` 明显不符，本页修过滤，不顺手改库存算法。
- [x] Chrome 点验通过，待用户确认。一级库存跳入筛华东；详情 SN 跳码库。未改 SN。

**Verify:** 从一级点库存，应筛该一级。

---

### Task 13: 异常管理

**Files:** `ExceptionView.vue`  
对照：`pageException`、`view-exception`、`ex-rules`、`leave-exception`

- [x] 离开确认已做：有待处理时点侧栏，三按钮；取消留在异常页；跳 `/goods/sn` 不拦。
- [x] `ex-explain` 并进详情、规则多超量比/周转：本轮 **不拆不删**（标 extra），除非用户要砍字段。
- [x] 吃 `l1Id`/`l2Id`/类型 tab。从一级来应对齐 `activate-direct`。一级筛按 SN 归属，不再用名称 LIKE。
- [x] Chrome 点验通过，待用户确认。离开用「暂不处理，离开」。未点处理/删除/扫描/已处理并离开。

**Verify:** 待处理异常时离开弹框；看 SN 不弹离开框。

---

### Task 14: 销售客户

**Files:** `CustomerView.vue`  
对照：`pageCustomers`、`view-customer`、`edit-customer`

- [x] 点行详情/编辑，取消不保存。
- [x] KPI 改为当前筛选全集（不是当前页合计）。这是本页明确要修的缺口。
- [x] Chrome 点验通过，待用户确认。翻页历史销量仍 14；筛华东变为 11。未新建/保存/删除。

**Verify:** 改页码后 KPI 不变；改筛选后 KPI 变。

---

### Task 15: 数据统计

**Files:** `StatsView.vue`  
对照：`pageStats` ~4493

- [ ] KPI 跳转带 `from`/`to`/`l1Id`/`l2Id` 和对应 tab（采购 all、销售 direct/distribute、库存 type/agent）。
- [ ] 图有数据即可，不对视觉像素。

**Verify:** 点每个 KPI，落地页筛选项与统计页当前区间一致。

---

### Task 16: 角色与权限

**Files:** `RoleView.vue`  
对照：`pageRole`、`create-role`、`edit-role`、`create-account`

- [ ] 三角色 Tab。编辑权限 / 新建角色 / 新建平台账号打开后取消。不要停用 admin。

**Verify:** 三个弹框。

---

### Task 17: 操作日志

**Files:** `LogView.vue`  
对照：`pageLog`

- [ ] 搜索 + 类型筛可用。筛在 SearchPanel 即可，不把头下拉搬到表头。

**Verify:** 搜一个关键字有结果。

---

### Task 18: 部署 + 通刷

- [ ] `vue-tsc && vite build`，前端 tar 到 `label:/var/www/ruilai`。本轮若改了 Java 再打 jar、`systemctl restart ruilai`。
- [ ] Chrome DevTools 按侧栏 16 项再点一遍跳转和弹框。
- [ ] 对照本计划勾验收。未修项必须写明「有意保留」。

---

## 本轮明确不做

- 小程序全部页面与弹框
- 把 SearchPanel 改成原型表头筛布局
- 拆 `ex-explain` 独立弹框、砍异常规则多余字段（除非用户改口）
- 独立「一级/二级退货详情」页（死代码）
- 客户以外的「当前页合计 KPI」大重构（只修客户页）

## Self-review

- 16 个侧栏页 + 登录壳均有 Task。
- 退货跳转以 `data-go=return` 为准，不复活死页面。
- 二级采购跳销售分销已写入 Task 5/11。
- 验证全部是 Chrome 点验，不是「源码看起来有」。
