(() => {
  const state = {
    loggedIn: sessionStorage.getItem('ruilai_logged') === '1',
    role: sessionStorage.getItem('ruilai_role') || 'admin', // admin | l1 | l2
    mode: sessionStorage.getItem('ruilai_mode') || 'admin', // admin | agent
    route: location.hash.replace(/^#/, '') || 'home',
    modal: null,
  };

  const ROLES = {
    admin: { name: '平台管理员', avatar: '管' },
    l1: { name: '华东一级代理', avatar: '一' },
    l2: { name: '杭州二级代理', avatar: '二' },
  };

  const ADMIN_MENUS = [
    { group: '概览', items: [{ id: 'home', title: '工作台', icon: '⌂' }] },
    {
      group: '渠道',
      items: [
        { id: 'agent-l1', title: '一级代理商', icon: '①' },
        { id: 'agent-l2', title: '二级代理商', icon: '②' },
        { id: 'agent-bind', title: '从属关系', icon: '⇄' },
        { id: 'agent-pending', title: '待分配二级', icon: '⌛' },
      ],
    },
    {
      group: '货品',
      items: [
        { id: 'sn', title: 'SN码库', icon: '#' },
        { id: 'product', title: '商品库', icon: '▣' },
        { id: 'purchase', title: '采购单管理', icon: '▤' },
        { id: 'sales', title: '销售单管理', icon: '▥' },
        { id: 'stock', title: '库存管理', icon: '▦' },
      ],
    },
    {
      group: '售后与风控',
      items: [
        { id: 'return', title: '退货管理', icon: '↩' },
        { id: 'exception', title: '异常管理', icon: '⚠' },
        { id: 'stats', title: '数据统计', icon: '▤' },
      ],
    },
    {
      group: '系统',
      items: [
        { id: 'role', title: '角色与权限', icon: '◎' },
        { id: 'log', title: '系统日志', icon: '☰' },
      ],
    },
  ];

  const AGENT_MENUS = [
    { group: '代理端', items: [{ id: 'agent-home', title: '首页', icon: '⌂' }] },
    {
      group: '业务',
      items: [
        { id: 'agent-purchase', title: '采购申请', icon: '▤' },
        { id: 'agent-sales', title: '销售单', icon: '▥' },
        { id: 'agent-stock', title: '库存查询', icon: '▦' },
        { id: 'agent-bind-user', title: '用户绑定', icon: '☺' },
        { id: 'agent-aftersale', title: '售后管理', icon: '↩' },
        { id: 'agent-sub', title: '子账号', icon: '◎' },
      ],
    },
  ];

  const TITLES = {
    home: '工作台',
    'agent-l1': '一级代理商',
    'agent-l2': '二级代理商',
    'agent-bind': '从属关系管理',
    'agent-pending': '待分配二级代理',
    sn: 'SN码库',
    product: '商品库',
    purchase: '采购单管理',
    sales: '销售单管理',
    stock: '库存管理',
    return: '退货管理',
    exception: '异常管理',
    stats: '数据统计',
    role: '角色与权限',
    log: '系统日志',
    'agent-home': '代理商首页',
    'agent-purchase': '采购单申请',
    'agent-sales': '销售单',
    'agent-stock': '库存管理',
    'agent-bind-user': '用户绑定',
    'agent-aftersale': '售后管理',
    'agent-sub': '子账号管理',
  };

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function tag(text, type = 'gray') {
    return `<span class="tag tag-${type}">${escapeHtml(text)}</span>`;
  }

  function table(headers, rowsHtml) {
    return `
      <div class="page-card">
        <div class="table-wrap">
          <table class="data">
            <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rowsHtml || `<tr><td colspan="${headers.length}" class="empty-hint">暂无数据</td></tr>`}</tbody>
          </table>
        </div>
        <div class="pager"><span>共 ${rowsHtml ? (rowsHtml.match(/<tr>/g) || []).length : 0} 条</span><span>原型示意 · 每页 20 条</span></div>
      </div>`;
  }

  function pageHeader(title, desc, actions = '') {
    return `
      <div class="page-header">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(desc)}</p>
        </div>
        <div class="page-actions">${actions}</div>
      </div>`;
  }

  function searchBar(fieldsHtml, actionsHtml) {
    return `<div class="page-card search-panel">${fieldsHtml}${actionsHtml}</div>`;
  }

  /* ---------- Pages ---------- */
  function pageHome() {
    return `
      ${pageHeader('数据工作台', '锐涞经销商渠道盘面 · 原型演示数据', `
        <button class="btn" data-go="exception">异常中心</button>
        <button class="btn btn-primary" data-go="purchase">待审采购</button>
      `)}
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">一级代理</div><div class="metric-value num">12</div></div>
        <div class="metric-card"><div class="metric-label">二级代理</div><div class="metric-value num">86</div></div>
        <div class="metric-card"><div class="metric-label">本月采购量</div><div class="metric-value num">3,280</div></div>
        <div class="metric-card"><div class="metric-label">待处理异常</div><div class="metric-value num danger">7</div></div>
      </div>
      <div class="page-card">
        <h3 class="section-title">快捷入口</h3>
        <div class="shortcut-grid">
          ${[
            ['agent-l1', '①', '一级代理'],
            ['agent-l2', '②', '二级代理'],
            ['sn', '#', 'SN码库'],
            ['purchase', '▤', '采购审核'],
            ['sales', '▥', '销售单'],
            ['exception', '⚠', '异常预警'],
          ]
            .map(
              ([id, ico, t]) =>
                `<button class="shortcut-card" data-go="${id}"><span class="ico">${ico}</span><span>${t}</span></button>`
            )
            .join('')}
        </div>
      </div>
      <div class="split-grid">
        <div class="page-card">
          <h3 class="section-title">待处理事项</h3>
          ${[
            ['采购单待审核', 3, 'purchase'],
            ['一级退货待审', 2, 'return'],
            ['库存异常预警', 4, 'exception'],
            ['跨区激活异常', 3, 'exception'],
            ['待分配二级代理', 5, 'agent-pending'],
          ]
            .map(
              ([label, n, go]) => `
            <button class="todo-row" data-go="${go}">
              <span class="todo-label">${label}</span>
              <span class="todo-count hot">${n}</span>
            </button>`
            )
            .join('')}
        </div>
        <div class="page-card">
          <h3 class="section-title">最近动态</h3>
          ${[
            ['PO20260804021 采购审核通过', '号段 RL-A42 · 华东一级', '10:21'],
            ['SO20260804088 销售出库', '二级·杭州经销 → 库存转入', '09:48'],
            ['SN激活跨区预警', 'IP 广东 · 授权浙江', '09:12'],
            ['二级代理「金华个体」解绑', '进入待分配列表', '昨日'],
          ]
            .map(
              ([t, m, time]) => `
            <div class="recent-row">
              <div class="recent-main">
                <span class="recent-title">${t}</span>
                <span class="recent-meta">${m}</span>
              </div>
              <span class="recent-time">${time}</span>
            </div>`
            )
            .join('')}
        </div>
      </div>`;
  }

  function pageAgentL1() {
    const rows = [
      ['AG-L1-001', '华东锐涞总代', '张伟', '浙江·上海·江苏', '浙江', 18, '启用'],
      ['AG-L1-002', '华南渠道中心', '李娜', '广东·福建', '广东', 12, '启用'],
      ['AG-L1-003', '华北联合代理', '王强', '北京·河北·天津', '北京', 9, '启用'],
      ['AG-L1-004', '西南拓展部', '赵敏', '四川·重庆', '四川', 7, '停用'],
    ]
      .map(
        ([code, name, contact, area, main, n, st]) => `
      <tr>
        <td class="num">${code}</td>
        <td>${name}</td>
        <td>${contact}</td>
        <td>${area}</td>
        <td>${tag(main, 'green')}</td>
        <td class="num">${n}</td>
        <td>${st === '启用' ? tag('启用', 'green') : tag('停用', 'gray')}</td>
        <td class="ops">
          <button class="btn btn-sm" data-modal="edit-l1">编辑</button>
          <button class="btn btn-sm" data-go="agent-l2">下级</button>
        </td>
      </tr>`
      )
      .join('');

    return `
      ${pageHeader('一级代理商', '平台创建一级账号，电子围栏授权销售区域，主授权区域互斥占用', `
        <button class="btn btn-primary" data-modal="edit-l1">+ 新建一级代理</button>
      `)}
      <div class="alert alert-info">默认可选全国区域；其他一级已占用的主授权区域将自动剔除，区域变更后动态同步。</div>
      ${searchBar(
        `
        <input class="field-input" placeholder="代理名称 / 编码" />
        <select class="field-input"><option>全部状态</option><option>启用</option><option>停用</option></select>
        <select class="field-input"><option>主授权区域</option><option>浙江</option><option>广东</option></select>
      `,
        `<button class="btn btn-primary">查询</button><button class="btn">重置</button>`
      )}
      ${table(['编码', '名称', '联系人', '授权区域', '主授权区', '下属二级', '状态', '操作'], rows)}`;
  }

  function pageAgentL2() {
    const rows = [
      ['AG-L2-101', '杭州城西专营', '法人', '华东锐涞总代', '杭州市', '已绑', '启用'],
      ['AG-L2-102', '宁波海曙店', '个人', '华东锐涞总代', '宁波市', '已绑', '启用'],
      ['AG-L2-201', '广州天河渠道', '法人', '华南渠道中心', '广州市', '已绑', '启用'],
      ['AG-L2-088', '金华个体经销', '个人', '—', '—', '待分配', '启用'],
    ]
      .map(
        ([code, name, type, parent, area, bind, st]) => `
      <tr>
        <td class="num">${code}</td>
        <td>${name}</td>
        <td>${type === '法人' ? tag('法人', 'blue') : tag('个人', 'orange')}</td>
        <td>${parent}</td>
        <td>${area}</td>
        <td>${bind === '已绑' ? tag('已绑定', 'green') : tag('待分配', 'orange')}</td>
        <td>${tag(st, 'green')}</td>
        <td class="ops"><button class="btn btn-sm" data-modal="edit-l2">编辑</button></td>
      </tr>`
      )
      .join('');

    return `
      ${pageHeader('二级代理商', '由一级创建；区域必须落在一级授权范围内；需上传协议核对法人/个人性质', `
        <button class="btn btn-primary" data-modal="edit-l2">+ 新建二级代理</button>
      `)}
      ${searchBar(
        `
        <input class="field-input" placeholder="二级名称 / 编码" />
        <select class="field-input"><option>全部性质</option><option>法人</option><option>个人</option></select>
        <select class="field-input"><option>所属一级</option><option>华东锐涞总代</option></select>
      `,
        `<button class="btn btn-primary">查询</button>`
      )}
      ${table(['编码', '名称', '性质', '所属一级', '授权区域', '从属', '状态', '操作'], rows)}`;
  }

  function pageAgentBind() {
    return `
      ${pageHeader('从属关系管理', '平台可调整二级所属一级；区域互斥后按法人/个人规则解绑或保留', `
        <button class="btn btn-primary" data-modal="rebind">调整从属</button>
      `)}
      <div class="alert alert-warn">法人二级：授权区与一级无重叠时自动解绑并进入待分配。个人二级：保持原绑定，授权区不可再改。</div>
      ${table(
        ['二级代理', '性质', '原一级', '现一级', '区域状态', '最近变更', '操作'],
        `
        <tr>
          <td>杭州城西专营</td><td>${tag('法人', 'blue')}</td><td>华北联合代理</td><td>华东锐涞总代</td>
          <td>${tag('已重填区域', 'green')}</td><td class="num">2026-08-01</td>
          <td class="ops"><button class="btn btn-sm" data-modal="rebind">改绑</button></td>
        </tr>
        <tr>
          <td>金华个体经销</td><td>${tag('个人', 'orange')}</td><td>华东锐涞总代</td><td>—</td>
          <td>${tag('区域保留不可改', 'orange')}</td><td class="num">2026-07-28</td>
          <td class="ops"><button class="btn btn-sm" data-go="agent-pending">去分配</button></td>
        </tr>`
      )}`;
  }

  function pageAgentPending() {
    return `
      ${pageHeader('待分配二级代理', '因区域取消或手动解绑后无一级归属的二级集中展示', `
        <button class="btn btn-primary" data-modal="rebind">批量绑定</button>
      `)}
      ${table(
        ['编码', '名称', '性质', '原一级', '原授权区域', '进入待分配时间', '操作'],
        `
        <tr><td class="num">AG-L2-088</td><td>金华个体经销</td><td>${tag('个人', 'orange')}</td><td>华东锐涞总代</td><td>金华市</td><td class="num">07-28 16:20</td>
          <td class="ops"><button class="btn btn-sm btn-primary" data-modal="rebind">绑定一级</button></td></tr>
        <tr><td class="num">AG-L2-076</td><td>嘉兴法人店</td><td>${tag('法人', 'blue')}</td><td>华东锐涞总代</td><td>已清除</td><td class="num">07-22 11:03</td>
          <td class="ops"><button class="btn btn-sm btn-primary" data-modal="rebind">绑定一级</button></td></tr>`
      )}`;
  }

  function pageSN() {
    return `
      ${pageHeader('SN码库', '批量导入 SN；绑定一级代理与商品尺码，支撑采购号段与扫码流转', `
        <button class="btn">下载模板</button>
        <button class="btn btn-primary" data-modal="import-sn">批量导入</button>
      `)}
      ${searchBar(
        `
        <input class="field-input" placeholder="SN码" />
        <select class="field-input"><option>所属一级</option><option>华东锐涞总代</option></select>
        <select class="field-input"><option>尺码</option><option>M</option><option>L</option><option>XL</option></select>
      `,
        `<button class="btn btn-primary">查询</button>`
      )}
      ${table(
        ['SN码', '商品', '尺码', '绑定一级', '状态', '导入时间'],
        `
        <tr><td class="num">RL202608040001</td><td>锐涞经典款</td><td>M</td><td>华东锐涞总代</td><td>${tag('在库-一级', 'green')}</td><td class="num">08-04 09:10</td></tr>
        <tr><td class="num">RL202608040002</td><td>锐涞经典款</td><td>L</td><td>华东锐涞总代</td><td>${tag('已分二级', 'blue')}</td><td class="num">08-04 09:10</td></tr>
        <tr><td class="num">RL202608040003</td><td>锐涞运动款</td><td>XL</td><td>华南渠道中心</td><td>${tag('已绑用户', 'orange')}</td><td class="num">08-03 15:41</td></tr>
        <tr><td class="num">RL202608040004</td><td>锐涞经典款</td><td>M</td><td>华东锐涞总代</td><td>${tag('再入库', 'gray')}</td><td class="num">08-02 18:22</td></tr>`
      )}`;
  }

  function pageProduct() {
    return `
      ${pageHeader('商品库', '维护商品名称与规格尺码，供采购/销售/库存引用', `
        <button class="btn btn-primary" data-modal="edit-product">+ 新建商品</button>
      `)}
      ${table(
        ['商品编码', '商品名称', '规格/尺码', '创建时间', '状态', '操作'],
        `
        <tr><td class="num">P-1001</td><td>锐涞经典款</td><td>S / M / L / XL</td><td class="num">2026-06-01</td><td>${tag('上架', 'green')}</td>
          <td class="ops"><button class="btn btn-sm" data-modal="edit-product">编辑</button></td></tr>
        <tr><td class="num">P-1002</td><td>锐涞运动款</td><td>M / L / XL</td><td class="num">2026-06-12</td><td>${tag('上架', 'green')}</td>
          <td class="ops"><button class="btn btn-sm" data-modal="edit-product">编辑</button></td></tr>
        <tr><td class="num">P-1003</td><td>锐涞轻量款</td><td>S / M / L</td><td class="num">2026-07-08</td><td>${tag('下架', 'gray')}</td>
          <td class="ops"><button class="btn btn-sm" data-modal="edit-product">编辑</button></td></tr>`
      )}`;
  }

  function pagePurchase() {
    return `
      ${pageHeader('采购单管理', '一级发起采购；平台按尺码录入号段审核，校验数量与号段匹配后入库', `
        <button class="btn btn-primary" data-modal="audit-po">审核号段</button>
      `)}
      <div class="page-card">
        <div class="tabs">
          <button class="tab active">待审核</button>
          <button class="tab">已通过</button>
          <button class="tab">已驳回</button>
          <button class="tab">全部</button>
        </div>
      </div>
      ${table(
        ['采购单号', '一级代理', '商品/尺码', '数量', '号段', '状态', '申请时间', '操作'],
        `
        <tr>
          <td class="num">PO20260804021</td><td>华东锐涞总代</td><td>经典款 / M×40 L×20</td><td class="num">60</td><td>—</td>
          <td>${tag('待审核', 'orange')}</td><td class="num">08-04 08:50</td>
          <td class="ops"><button class="btn btn-sm btn-primary" data-modal="audit-po">审核</button></td>
        </tr>
        <tr>
          <td class="num">PO20260803011</td><td>华南渠道中心</td><td>运动款 / XL×30</td><td class="num">30</td>
          <td class="num">RL…3001-3030</td><td>${tag('已通过', 'green')}</td><td class="num">08-03 14:12</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td>
        </tr>`
      )}`;
  }

  function pageSales() {
    return `
      ${pageHeader('销售单管理', '平台可查看全部一级创建的销售单；扫码出库后库存转入二级', '')}
      ${searchBar(
        `
        <input class="field-input" placeholder="销售单号 / SN" />
        <select class="field-input"><option>一级代理</option></select>
        <select class="field-input"><option>二级代理</option></select>
      `,
        `<button class="btn btn-primary">查询</button>`
      )}
      ${table(
        ['销售单号', '一级', '二级', '商品汇总', '数量', '状态', '创建时间'],
        `
        <tr><td class="num">SO20260804088</td><td>华东锐涞总代</td><td>杭州城西专营</td><td>经典款 M/L</td><td class="num">24</td>
          <td>${tag('已完成', 'green')}</td><td class="num">08-04 09:48</td></tr>
        <tr><td class="num">SO20260804071</td><td>华东锐涞总代</td><td>宁波海曙店</td><td>运动款 XL</td><td class="num">10</td>
          <td>${tag('扫码中', 'blue')}</td><td class="num">08-04 09:05</td></tr>`
      )}`;
  }

  function pageStock() {
    return `
      ${pageHeader('库存管理', '采购通过进一级库存；销售完成进二级库存；可追溯单商品流水', '')}
      <div class="page-card">
        <div class="tabs">
          <button class="tab active">一级代理库存</button>
          <button class="tab">二级代理库存</button>
        </div>
      </div>
      ${table(
        ['代理', '商品', '尺码', '可用库存', '在途/冻结', '最近变动', '操作'],
        `
        <tr><td>华东锐涞总代</td><td>锐涞经典款</td><td>M</td><td class="num">126</td><td class="num">0</td><td>采购入库 +40</td>
          <td class="ops"><button class="btn btn-sm">流水</button></td></tr>
        <tr><td>杭州城西专营</td><td>锐涞经典款</td><td>L</td><td class="num">18</td><td class="num">0</td><td>销售转入 +12</td>
          <td class="ops"><button class="btn btn-sm">流水</button></td></tr>
        <tr><td>华南渠道中心</td><td>锐涞运动款</td><td>XL</td><td class="num">54</td><td class="num">6</td><td>退货回退 +2</td>
          <td class="ops"><button class="btn btn-sm">流水</button></td></tr>`
      )}`;
  }

  function pageReturn() {
    return `
      ${pageHeader('退货管理', '用户退货再入库；二级退货一级审，一级退货原厂审，库存逐级回退', '')}
      <div class="page-card">
        <div class="tabs">
          <button class="tab active">退货审核</button>
          <button class="tab">用户退货</button>
          <button class="tab">二级退货单</button>
          <button class="tab">一级退货单</button>
        </div>
      </div>
      ${table(
        ['退货单号', '类型', '发起方', '审批方', 'SN/数量', '状态', '操作'],
        `
        <tr><td class="num">RT2026080403</td><td>${tag('一级退原厂', 'orange')}</td><td>华东锐涞总代</td><td>原厂</td><td class="num">SN×6</td>
          <td>${tag('待审核', 'orange')}</td>
          <td class="ops"><button class="btn btn-sm btn-primary">通过</button><button class="btn btn-sm btn-danger">驳回</button></td></tr>
        <tr><td class="num">RT2026080401</td><td>${tag('二级退一级', 'blue')}</td><td>宁波海曙店</td><td>华东锐涞总代</td><td class="num">SN×2</td>
          <td>${tag('已通过', 'green')}</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>
        <tr><td class="num">RTU2026080399</td><td>${tag('用户退货', 'gray')}</td><td>杭州城西专营</td><td>—</td><td class="num">RL…0003</td>
          <td>${tag('再入库', 'green')}</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>`
      )}`;
  }

  function pageException() {
    return `
      ${pageHeader('异常管理', '库存异常倍数可配置；销售压货与跨区激活/绑定触发预警通知', `
        <button class="btn" data-modal="ex-setting">异常标准设置</button>
      `)}
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">销售库存异常</div><div class="metric-value num warn">4</div></div>
        <div class="metric-card"><div class="metric-label">SN激活跨区</div><div class="metric-value num danger">3</div></div>
        <div class="metric-card"><div class="metric-label">归属地不匹配</div><div class="metric-value num warn">2</div></div>
        <div class="metric-card"><div class="metric-label">预警倍数</div><div class="metric-value num">1.5×</div></div>
      </div>
      ${table(
        ['时间', '类型', '对象', '详情', '通知', '状态', '操作'],
        `
        <tr><td class="num">08-04 09:12</td><td>${tag('激活跨区', 'red')}</td><td>RL202608040002</td>
          <td>IP 广东 vs 授权浙江</td><td>一级+原厂</td><td>${tag('未处理', 'orange')}</td>
          <td class="ops"><button class="btn btn-sm">处理</button></td></tr>
        <tr><td class="num">08-04 08:40</td><td>${tag('库存异常', 'orange')}</td><td>杭州城西 · 经典款M</td>
          <td>新增库存 80 &gt; 预警线 45</td><td>一级+原厂</td><td>${tag('已通知', 'blue')}</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>
        <tr><td class="num">08-03 19:05</td><td>${tag('归属地异常', 'orange')}</td><td>用户绑定</td>
          <td>手机归属沪 · 地址填粤</td><td>一级+原厂</td><td>${tag('已关闭', 'gray')}</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>`
      )}`;
  }

  function pageStats() {
    return `
      ${pageHeader('数据统计', '采购量 / 销售量 / SN激活量 / 异常数据，支持时间与地区筛选', `
        <select class="field-input"><option>近30天</option><option>本月</option><option>本季</option></select>
        <button class="btn btn-primary">导出</button>
      `)}
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">累计采购量</div><div class="metric-value num">18,420</div></div>
        <div class="metric-card"><div class="metric-label">累计销售量</div><div class="metric-value num">15,906</div></div>
        <div class="metric-card"><div class="metric-label">SN激活量</div><div class="metric-value num">12,377</div></div>
        <div class="metric-card"><div class="metric-label">异常次数</div><div class="metric-value num warn">126</div></div>
      </div>
      <div class="split-grid">
        <div class="page-card">
          <h3 class="section-title">一级采购量 Top</h3>
          ${table(
            ['一级代理', '采购量', '占比'],
            `<tr><td>华东锐涞总代</td><td class="num">6,820</td><td>37%</td></tr>
             <tr><td>华南渠道中心</td><td class="num">4,110</td><td>22%</td></tr>
             <tr><td>华北联合代理</td><td class="num">3,540</td><td>19%</td></tr>`
          )}
        </div>
        <div class="page-card">
          <h3 class="section-title">激活量（按地区）</h3>
          ${table(
            ['地区', '激活量', '异常率'],
            `<tr><td>浙江</td><td class="num">4,220</td><td>1.2%</td></tr>
             <tr><td>广东</td><td class="num">3,180</td><td>2.8%</td></tr>
             <tr><td>北京</td><td class="num">1,960</td><td>0.9%</td></tr>`
          )}
        </div>
      </div>`;
  }

  function pageRole() {
    return `
      ${pageHeader('角色与权限', '自定义角色并为账号配置菜单/操作权限', `
        <button class="btn btn-primary">+ 新建角色</button>
      `)}
      ${table(
        ['角色', '说明', '账号数', '权限摘要', '操作'],
        `
        <tr><td>平台管理员</td><td>全量后台权限</td><td class="num">3</td><td>全部模块</td>
          <td class="ops"><button class="btn btn-sm">配置</button></td></tr>
        <tr><td>一级代理主账号</td><td>采购/销售/库存/下级管理</td><td class="num">12</td><td>代理前端全量</td>
          <td class="ops"><button class="btn btn-sm">配置</button></td></tr>
        <tr><td>一级子账号</td><td>仅销售单查看与扫码加商品</td><td class="num">28</td><td>销售扫码</td>
          <td class="ops"><button class="btn btn-sm">配置</button></td></tr>
        <tr><td>二级代理</td><td>库存/销售单/用户绑定/售后</td><td class="num">86</td><td>二级业务</td>
          <td class="ops"><button class="btn btn-sm">配置</button></td></tr>`
      )}`;
  }

  function pageLog() {
    return `
      ${pageHeader('系统日志', '后台登录日志与关键操作记录', '')}
      <div class="page-card">
        <div class="tabs">
          <button class="tab active">登录日志</button>
          <button class="tab">操作日志</button>
        </div>
      </div>
      ${table(
        ['时间', '账号', '角色', '动作', 'IP', '结果'],
        `
        <tr><td class="num">08-04 10:01</td><td>admin</td><td>平台管理员</td><td>登录后台</td><td class="num">10.0.1.8</td><td>${tag('成功', 'green')}</td></tr>
        <tr><td class="num">08-04 09:50</td><td>admin</td><td>平台管理员</td><td>审核采购单 PO…021</td><td class="num">10.0.1.8</td><td>${tag('成功', 'green')}</td></tr>
        <tr><td class="num">08-04 09:12</td><td>system</td><td>—</td><td>触发跨区激活预警</td><td>—</td><td>${tag('已记录', 'blue')}</td></tr>`
      )}`;
  }

  function pageAgentHome() {
    const isL1 = state.role !== 'l2';
    return `
      ${pageHeader(isL1 ? '一级代理工作台' : '二级代理工作台', '代理商前端 · 扫码作业与库存查询', `
        <button class="btn btn-primary" data-go="agent-bind-user">扫码绑用户</button>
      `)}
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">我的库存</div><div class="metric-value num">268</div></div>
        <div class="metric-card"><div class="metric-label">${isL1 ? '本月采购' : '本月转入'}</div><div class="metric-value num">120</div></div>
        <div class="metric-card"><div class="metric-label">${isL1 ? '本月销售' : '本月绑定'}</div><div class="metric-value num">86</div></div>
        <div class="metric-card"><div class="metric-label">待办</div><div class="metric-value num warn">${isL1 ? 2 : 1}</div></div>
      </div>
      <div class="page-card">
        <h3 class="section-title">快捷入口</h3>
        <div class="shortcut-grid">
          ${(isL1
            ? [
                ['agent-purchase', '▤', '采购申请'],
                ['agent-sales', '▥', '创建销售单'],
                ['agent-stock', '▦', '库存'],
                ['agent-bind-user', '☺', '用户绑定'],
                ['agent-aftersale', '↩', '售后'],
                ['agent-sub', '◎', '子账号'],
              ]
            : [
                ['agent-sales', '▥', '销售单'],
                ['agent-stock', '▦', '我的库存'],
                ['agent-bind-user', '☺', '用户绑定'],
                ['agent-aftersale', '↩', '售后'],
              ]
          )
            .map(
              ([id, ico, t]) =>
                `<button class="shortcut-card" data-go="${id}"><span class="ico">${ico}</span><span>${t}</span></button>`
            )
            .join('')}
        </div>
      </div>`;
  }

  function pageAgentPurchase() {
    return `
      ${pageHeader('采购单申请', '在商品库范围内选择商品尺码与数量提交后台审批，通过后进入库存', `
        <button class="btn btn-primary" data-modal="apply-po">+ 新建申请</button>
      `)}
      ${table(
        ['采购单号', '商品明细', '数量', '状态', '提交时间', '操作'],
        `
        <tr><td class="num">PO20260804021</td><td>经典款 M×40 L×20</td><td class="num">60</td>
          <td>${tag('待审核', 'orange')}</td><td class="num">08-04 08:50</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>
        <tr><td class="num">PO20260728008</td><td>运动款 XL×30</td><td class="num">30</td>
          <td>${tag('已入库', 'green')}</td><td class="num">07-28 11:20</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>`
      )}`;
  }

  function pageAgentSales() {
    return `
      ${pageHeader('销售单', '一级主账号/子账号扫 SN 添加商品；核对尺码数量后确认，库存转入二级', `
        <button class="btn btn-primary" data-modal="create-so">+ 创建销售单</button>
      `)}
      <div class="alert alert-info">子账号仅可查看销售单并扫码添加商品；主账号负责选择二级与最终确认。</div>
      ${table(
        ['销售单号', '二级代理', '扫码进度', '状态', '创建时间', '操作'],
        `
        <tr><td class="num">SO20260804071</td><td>宁波海曙店</td><td class="num">8 / 10</td>
          <td>${tag('扫码中', 'blue')}</td><td class="num">08-04 09:05</td>
          <td class="ops"><button class="btn btn-sm btn-primary" data-modal="create-so">继续扫码</button></td></tr>
        <tr><td class="num">SO20260804088</td><td>杭州城西专营</td><td class="num">24 / 24</td>
          <td>${tag('已完成', 'green')}</td><td class="num">08-04 09:48</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>`
      )}`;
  }

  function pageAgentStock() {
    return `
      ${pageHeader('库存查询', '一级可看自己与下属二级；二级仅看自己；支持单商品入库/销售/退货流水', '')}
      ${table(
        ['商品', '尺码', '库存', '最近变动', '操作'],
        `
        <tr><td>锐涞经典款</td><td>M</td><td class="num">126</td><td>采购入库 +40</td>
          <td class="ops"><button class="btn btn-sm">历史过程</button></td></tr>
        <tr><td>锐涞经典款</td><td>L</td><td class="num">64</td><td>销售出库 -12</td>
          <td class="ops"><button class="btn btn-sm">历史过程</button></td></tr>`
      )}`;
  }

  function pageAgentBindUser() {
    return `
      ${pageHeader('用户绑定', '扫 SN 绑定用户：先校验 IP 是否在授权区；手机号归属地与地址不匹配则预警', `
        <button class="btn btn-primary" data-modal="bind-user">开始扫码绑定</button>
      `)}
      <div class="alert alert-warn">超区时弹窗确认是否继续绑定；取消则不记录 IP。确认后进入用户信息填写页。</div>
      ${table(
        ['SN码', '绑定时间', '手机号', '地址', 'IP区域', '校验', '操作'],
        `
        <tr><td class="num">RL202608040003</td><td class="num">08-03 15:41</td><td class="num">138****6621</td><td>杭州市西湖区</td><td>浙江</td>
          <td>${tag('正常', 'green')}</td><td class="ops"><button class="btn btn-sm">查看</button></td></tr>
        <tr><td class="num">RL202608010088</td><td class="num">08-01 20:11</td><td class="num">139****1102</td><td>广州市天河区</td><td>广东</td>
          <td>${tag('归属地异常', 'orange')}</td><td class="ops"><button class="btn btn-sm">查看</button></td></tr>`
      )}`;
  }

  function pageAgentAftersale() {
    return `
      ${pageHeader('售后管理', '用户退货扫码建单再入库；代理退货需上级/原厂审批后回退库存', `
        <button class="btn">用户退货登记</button>
        <button class="btn btn-primary">发起退货审批</button>
      `)}
      ${table(
        ['单号', '类型', '状态', '时间', '操作'],
        `
        <tr><td class="num">RTU2026080399</td><td>用户退货再入库</td><td>${tag('完成', 'green')}</td><td class="num">08-03</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>
        <tr><td class="num">RT2026080401</td><td>二级→一级</td><td>${tag('已通过', 'green')}</td><td class="num">08-04</td>
          <td class="ops"><button class="btn btn-sm">详情</button></td></tr>`
      )}`;
  }

  function pageAgentSub() {
    return `
      ${pageHeader('子账号管理', '一级可创建子账号；子账号只可查看销售单并扫码添加商品', `
        <button class="btn btn-primary">+ 创建子账号</button>
      `)}
      ${table(
        ['账号', '姓名', '权限', '状态', '操作'],
        `
        <tr><td class="num">hd_scan_01</td><td>仓管小陈</td><td>${tag('销售扫码', 'blue')}</td><td>${tag('启用', 'green')}</td>
          <td class="ops"><button class="btn btn-sm">重置密码</button></td></tr>
        <tr><td class="num">hd_scan_02</td><td>仓管小周</td><td>${tag('销售扫码', 'blue')}</td><td>${tag('启用', 'green')}</td>
          <td class="ops"><button class="btn btn-sm">重置密码</button></td></tr>`
      )}`;
  }

  const PAGES = {
    home: pageHome,
    'agent-l1': pageAgentL1,
    'agent-l2': pageAgentL2,
    'agent-bind': pageAgentBind,
    'agent-pending': pageAgentPending,
    sn: pageSN,
    product: pageProduct,
    purchase: pagePurchase,
    sales: pageSales,
    stock: pageStock,
    return: pageReturn,
    exception: pageException,
    stats: pageStats,
    role: pageRole,
    log: pageLog,
    'agent-home': pageAgentHome,
    'agent-purchase': pageAgentPurchase,
    'agent-sales': pageAgentSales,
    'agent-stock': pageAgentStock,
    'agent-bind-user': pageAgentBindUser,
    'agent-aftersale': pageAgentAftersale,
    'agent-sub': pageAgentSub,
  };

  /* ---------- Modals ---------- */
  function modalHtml(type) {
    const map = {
      'edit-l1': {
        title: '新建 / 编辑一级代理',
        body: `
          <div class="form-grid">
            <div class="form-field"><label>代理名称</label><input class="field-input" placeholder="如：华东锐涞总代" /></div>
            <div class="form-field"><label>联系人</label><input class="field-input" placeholder="姓名" /></div>
            <div class="form-field span-2"><label>主授权区域</label>
              <div class="chips">
                ${['浙江', '上海', '江苏', '广东', '北京', '四川']
                  .map((x, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}">${x}</button>`)
                  .join('')}
              </div>
            </div>
            <div class="form-field span-2"><label>授权销售区域（电子围栏）</label>
              <div class="chips">
                ${['全国默认', '浙江', '上海', '江苏', '安徽', '福建']
                  .map((x, i) => `<button type="button" class="chip${i < 4 ? ' on' : ''}">${x}</button>`)
                  .join('')}
              </div>
              <p style="margin:8px 0 0;font-size:12px;color:var(--text-3)">已被其他一级占用为主授权的区域将自动剔除</p>
            </div>
          </div>`,
      },
      'edit-l2': {
        title: '新建 / 编辑二级代理',
        body: `
          <div class="form-grid">
            <div class="form-field"><label>二级名称</label><input class="field-input" /></div>
            <div class="form-field"><label>性质</label>
              <select class="field-input"><option>法人代理</option><option>个人代理</option></select>
            </div>
            <div class="form-field span-2"><label>代理协议</label><input class="field-input" type="file" /></div>
            <div class="form-field span-2"><label>授权销售区域（须在一级范围内）</label>
              <div class="chips">
                ${['杭州市', '宁波市', '温州市', '嘉兴市', '金华市']
                  .map((x, i) => `<button type="button" class="chip${i < 2 ? ' on' : ''}">${x}</button>`)
                  .join('')}
              </div>
            </div>
          </div>`,
      },
      rebind: {
        title: '绑定 / 调整一级代理',
        body: `
          <div class="form-field"><label>二级代理</label><input class="field-input" value="金华个体经销" /></div>
          <div class="form-field"><label>绑定一级</label>
            <select class="field-input"><option>华东锐涞总代</option><option>华南渠道中心</option></select>
          </div>
          <div class="alert alert-warn" style="margin-top:12px">修改后需由一级重新填写二级授权区域</div>`,
      },
      'import-sn': {
        title: '批量导入 SN 码',
        body: `
          <div class="form-field"><label>所属一级</label>
            <select class="field-input"><option>华东锐涞总代</option></select>
          </div>
          <div class="form-field"><label>商品 / 尺码</label>
            <select class="field-input"><option>锐涞经典款 / M</option><option>锐涞经典款 / L</option></select>
          </div>
          <div class="form-field"><label>上传文件</label><input class="field-input" type="file" /></div>`,
      },
      'edit-product': {
        title: '新建 / 编辑商品',
        body: `
          <div class="form-field"><label>商品名称</label><input class="field-input" placeholder="锐涞经典款" /></div>
          <div class="form-field"><label>规格尺码</label><input class="field-input" placeholder="S,M,L,XL" /></div>`,
      },
      'audit-po': {
        title: '采购单号段审核',
        body: `
          <div class="alert alert-info" style="margin-bottom:12px">PO20260804021 · 经典款 M×40 L×20 · 校验数量与号段是否匹配</div>
          <div class="form-field"><label>尺码 M 号段</label><input class="field-input" placeholder="RL202608040001-RL202608040040" /></div>
          <div class="form-field"><label>尺码 L 号段</label><input class="field-input" placeholder="可添加多行号段" /></div>
          <button class="btn btn-sm" type="button">+ 添加号段行</button>`,
      },
      'ex-setting': {
        title: '库存异常标准设置',
        body: `
          <div class="form-field"><label>判断倍数参数</label><input class="field-input" value="1.5" /></div>
          <p style="font-size:12px;color:var(--text-2);margin:0">销量 × 倍数 = 预警线；本次新增库存超过预警线则通知一级与原厂</p>`,
      },
      'apply-po': {
        title: '新建采购申请',
        body: `
          <div class="form-field"><label>商品</label><select class="field-input"><option>锐涞经典款</option></select></div>
          <div class="form-field"><label>尺码 / 数量</label><input class="field-input" placeholder="M:40, L:20" /></div>`,
      },
      'create-so': {
        title: '创建 / 扫码销售单',
        body: `
          <div class="form-field"><label>二级代理</label>
            <select class="field-input"><option>宁波海曙店</option><option>杭州城西专营</option></select>
          </div>
          <div class="form-field"><label>扫码添加 SN</label><input class="field-input" placeholder="聚焦此框扫码或粘贴 SN" /></div>
          <div class="alert alert-info">已扫 8 / 计划 10 · 确认前将核对各尺码数量是否一致</div>`,
      },
      'bind-user': {
        title: '扫码绑定用户',
        body: `
          <div class="form-field"><label>SN码</label><input class="field-input" placeholder="扫描或输入 SN" /></div>
          <div class="alert alert-warn" style="margin-bottom:12px">检测到当前 IP 区域：广东 · 授权区域：浙江。是否继续绑定？</div>
          <div class="form-field"><label>手机号</label><input class="field-input" placeholder="将识别归属地" /></div>
          <div class="form-field"><label>用户地址</label><input class="field-input" placeholder="省市区 + 详细地址" /></div>`,
      },
    };
    const m = map[type];
    if (!m) return '';
    return `
      <div class="modal-mask" data-close-modal>
        <div class="modal" role="dialog">
          <div class="modal-hd"><span>${m.title}</span><button class="btn btn-sm btn-ghost" data-close-modal>关闭</button></div>
          <div class="modal-bd">${m.body}</div>
          <div class="modal-ft">
            <button class="btn" data-close-modal>取消</button>
            <button class="btn btn-primary" data-close-modal>确定</button>
          </div>
        </div>
      </div>`;
  }

  /* ---------- Render ---------- */
  function renderLogin() {
    return `
      <div class="login-wrap">
        <div class="login-card">
          <div class="login-brand">
            <img src="assets/logo.svg" alt="" />
            <h1>锐涞经销商管理系统</h1>
          </div>
          <p class="login-sub">渠道授权 · SN 进销存 · 异常风控 · 高保真原型</p>
          <div class="form-field">
            <label>登录身份</label>
            <div class="role-pills">
              <button type="button" class="role-pill ${state.role === 'admin' ? 'active' : ''}" data-role="admin">平台管理员</button>
              <button type="button" class="role-pill ${state.role === 'l1' ? 'active' : ''}" data-role="l1">一级代理</button>
              <button type="button" class="role-pill ${state.role === 'l2' ? 'active' : ''}" data-role="l2">二级代理</button>
            </div>
          </div>
          <div class="form-field"><label>账号</label><input value="${state.role === 'admin' ? 'admin' : state.role === 'l1' ? 'agent_hd' : 'agent_hz'}" /></div>
          <div class="form-field"><label>密码</label><input type="password" value="******" /></div>
          <button class="btn btn-primary btn-block" id="btn-login">进入系统</button>
        </div>
      </div>`;
  }

  function renderApp() {
    const menus = state.mode === 'admin' ? ADMIN_MENUS : AGENT_MENUS;
    const title = TITLES[state.route] || '页面';
    const pageFn = PAGES[state.route] || pageHome;
    const role = ROLES[state.role] || ROLES.admin;

    return `
      <div class="app-bg">
        <div class="canvas">
          <header class="topbar">
            <div class="brand" data-go="${state.mode === 'admin' ? 'home' : 'agent-home'}">
              <img src="assets/logo.svg" alt="" />
              <span>锐涞经销商管理系统</span>
            </div>
            <div class="topbar-right">
              <div class="mode-switch">
                <button type="button" class="${state.mode === 'admin' ? 'active' : ''}" data-mode="admin">管理后台</button>
                <button type="button" class="${state.mode === 'agent' ? 'active' : ''}" data-mode="agent">代理前端</button>
              </div>
              <div class="user" id="btn-logout" title="点击退出">
                <span class="user-avatar">${role.avatar}</span>
                <span class="user-name">${role.name}</span>
              </div>
            </div>
          </header>
          <div class="panel">
            <aside class="sidebar">
              <div class="sidebar-scroll">
                ${menus
                  .map(
                    (g) => `
                  <div class="nav-group-title">${g.group}</div>
                  ${g.items
                    .map(
                      (it) => `
                    <button class="nav-item ${state.route === it.id ? 'active' : ''}" data-go="${it.id}">
                      <span class="icon">${it.icon}</span><span>${it.title}</span>
                    </button>`
                    )
                    .join('')}`
                  )
                  .join('')}
              </div>
              <button class="sidebar-foot" id="btn-logout-2">退出登录</button>
            </aside>
            <main class="content">
              <div class="content-bar">
                <span>首页</span><span class="sep">/</span><strong>${escapeHtml(title)}</strong>
              </div>
              <div class="content-body">
                <div class="page page--scroll">${pageFn()}</div>
              </div>
            </main>
          </div>
        </div>
        ${state.modal ? modalHtml(state.modal) : ''}
      </div>`;
  }

  function render() {
    const app = document.getElementById('app');
    app.innerHTML = state.loggedIn ? renderApp() : renderLogin();
    bindEvents();
  }

  function navigate(id) {
    if (!PAGES[id] && id !== 'home') return;
    state.route = id;
    location.hash = id;
    state.modal = null;
    render();
  }

  function bindEvents() {
    document.querySelectorAll('[data-role]').forEach((el) => {
      el.addEventListener('click', () => {
        state.role = el.getAttribute('data-role');
        sessionStorage.setItem('ruilai_role', state.role);
        render();
      });
    });

    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        state.loggedIn = true;
        sessionStorage.setItem('ruilai_logged', '1');
        state.mode = state.role === 'admin' ? 'admin' : 'agent';
        sessionStorage.setItem('ruilai_mode', state.mode);
        state.route = state.mode === 'admin' ? 'home' : 'agent-home';
        location.hash = state.route;
        render();
      });
    }

    document.querySelectorAll('[data-mode]').forEach((el) => {
      el.addEventListener('click', () => {
        const mode = el.getAttribute('data-mode');
        state.mode = mode;
        sessionStorage.setItem('ruilai_mode', mode);
        state.route = mode === 'admin' ? 'home' : 'agent-home';
        location.hash = state.route;
        render();
      });
    });

    document.querySelectorAll('[data-go]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(el.getAttribute('data-go'));
      });
    });

    document.querySelectorAll('[data-modal]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        state.modal = el.getAttribute('data-modal');
        render();
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target === el || el.classList.contains('btn')) {
          state.modal = null;
          render();
        }
      });
    });

    document.querySelectorAll('.chip').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        el.classList.toggle('on');
      });
    });

    const logout = () => {
      state.loggedIn = false;
      sessionStorage.removeItem('ruilai_logged');
      render();
    };
    const b1 = document.getElementById('btn-logout');
    const b2 = document.getElementById('btn-logout-2');
    if (b1) b1.addEventListener('click', logout);
    if (b2) b2.addEventListener('click', logout);
  }

  window.addEventListener('hashchange', () => {
    const id = location.hash.replace(/^#/, '');
    if (id && PAGES[id]) {
      state.route = id;
      if (state.loggedIn) render();
    }
  });

  // boot
  if (state.loggedIn && location.hash) {
    const id = location.hash.replace(/^#/, '');
    if (PAGES[id]) state.route = id;
  }
  render();
})();
