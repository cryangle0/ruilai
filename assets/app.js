(() => {
  /* =========================================================
   * 锐涞经销商管理系统 · 可走查完整交互原型
   * ========================================================= */

  const ALL_REGIONS = ['浙江', '上海', '江苏', '安徽', '广东', '福建', '北京', '河北', '天津', '四川', '重庆'];
  const CITY_MAP = {
    浙江: ['杭州市', '宁波市', '温州市', '嘉兴市', '金华市'],
    上海: ['上海市'],
    江苏: ['南京市', '苏州市', '无锡市'],
    安徽: ['合肥市'],
    广东: ['广州市', '深圳市', '东莞市'],
    福建: ['福州市', '厦门市'],
    北京: ['北京市'],
    河北: ['石家庄市'],
    天津: ['天津市'],
    四川: ['成都市'],
    重庆: ['重庆市'],
  };

  const PHONE_LOC = {
    '138': '浙江', '139': '广东', '137': '上海', '136': '北京', '135': '江苏', '188': '四川',
  };

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }
  function nowStr() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function todayCompact() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  }
  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- Seed data ---------- */
  function seed() {
    const products = [
      { id: 'P1', code: 'P-1001', name: '锐涞经典款', sizes: ['S', 'M', 'L', 'XL'], status: '上架' },
      { id: 'P2', code: 'P-1002', name: '锐涞运动款', sizes: ['M', 'L', 'XL'], status: '上架' },
      { id: 'P3', code: 'P-1003', name: '锐涞轻量款', sizes: ['S', 'M', 'L'], status: '下架' },
    ];
    const agentsL1 = [
      { id: 'L1A', code: 'AG-L1-001', name: '华东锐涞总代', contact: '张伟', areas: ['浙江', '上海', '江苏'], mainArea: '浙江', status: '启用' },
      { id: 'L1B', code: 'AG-L1-002', name: '华南渠道中心', contact: '李娜', areas: ['广东', '福建'], mainArea: '广东', status: '启用' },
      { id: 'L1C', code: 'AG-L1-003', name: '华北联合代理', contact: '王强', areas: ['北京', '河北', '天津'], mainArea: '北京', status: '启用' },
    ];
    const agentsL2 = [
      { id: 'L2A', code: 'AG-L2-101', name: '杭州城西专营', type: '法人', parentId: 'L1A', areas: ['杭州市'], status: '启用', pending: false },
      { id: 'L2B', code: 'AG-L2-102', name: '宁波海曙店', type: '个人', parentId: 'L1A', areas: ['宁波市'], status: '启用', pending: false },
      { id: 'L2C', code: 'AG-L2-201', name: '广州天河渠道', type: '法人', parentId: 'L1B', areas: ['广州市'], status: '启用', pending: false },
      { id: 'L2D', code: 'AG-L2-088', name: '金华个体经销', type: '个人', parentId: null, areas: ['金华市'], status: '启用', pending: true, prevParentId: 'L1A', prevAreas: ['金华市'] },
    ];

    const sns = [];
    // RL202608010001-0040 classic M for L1A warehouse→ some already in stock
    for (let i = 1; i <= 40; i++) {
      const sn = `RL20260801${String(i).padStart(4, '0')}`;
      sns.push({ sn, productId: 'P1', size: 'M', l1Id: 'L1A', l2Id: null, status: i <= 30 ? 'l1' : 'warehouse', user: null, prevUser: null, reIn: false, resale: false, bindAt: null, bindIpRegion: null });
    }
    for (let i = 41; i <= 60; i++) {
      const sn = `RL20260801${String(i).padStart(4, '0')}`;
      sns.push({ sn, productId: 'P1', size: 'L', l1Id: 'L1A', l2Id: null, status: 'l1', user: null, prevUser: null, reIn: false, resale: false, bindAt: null, bindIpRegion: null });
    }
    // some already at L2 / bound
    for (let i = 1; i <= 12; i++) {
      const sn = `RL20260720${String(i).padStart(4, '0')}`;
      sns.push({
        sn, productId: 'P1', size: 'M', l1Id: 'L1A', l2Id: 'L2A', status: i <= 8 ? 'bound' : 'l2',
        user: i <= 8 ? { phone: '138****1001', addr: '杭州市西湖区文一路1号', phoneLoc: '浙江' } : null,
        prevUser: null, reIn: false, resale: false, bindAt: i <= 8 ? '2026-07-25 12:00' : null, bindIpRegion: i <= 8 ? '浙江' : null,
      });
    }
    for (let i = 1; i <= 30; i++) {
      const sn = `RL20260802${String(i).padStart(4, '0')}`;
      sns.push({ sn, productId: 'P2', size: 'XL', l1Id: 'L1B', l2Id: null, status: 'l1', user: null, prevUser: null, reIn: false, resale: false, bindAt: null, bindIpRegion: null });
    }

    return {
      exceptionMultiplier: 1.5,
      demoIpRegion: '浙江',
      products,
      agentsL1,
      agentsL2,
      sns,
      purchases: [
        {
          id: 'PO1', no: `PO${todayCompact()}021`, l1Id: 'L1A',
          lines: [{ productId: 'P1', size: 'M', qty: 10 }],
          status: 'pending', createdAt: nowStr(), segments: [],
        },
      ],
      sales: [
        {
          id: 'SO1', no: `SO${todayCompact()}088`, l1Id: 'L1A', l2Id: 'L2A',
          planned: { P1_M: 0 }, scanned: [], status: 'done', createdAt: nowStr(),
        },
      ],
      returns: [],
      exceptions: [],
      notifications: [],
      stockLogs: [
        { id: 'H1', agentType: 'l1', agentId: 'L1A', productId: 'P1', size: 'M', delta: 30, reason: '采购入库', time: '2026-08-01 10:00', ref: 'PO-SEED' },
        { id: 'H2', agentType: 'l2', agentId: 'L2A', productId: 'P1', size: 'M', delta: 12, reason: '销售转入', time: '2026-07-20 15:00', ref: 'SO-SEED' },
        { id: 'H3', agentType: 'l2', agentId: 'L2A', productId: 'P1', size: 'M', delta: -8, reason: '用户绑定出库(销量)', time: '2026-07-25 12:00', ref: 'BIND-SEED' },
      ],
      roles: [
        { id: 'R1', name: '平台管理员', desc: '全量后台权限', perms: ['all'] },
        { id: 'R2', name: '一级代理主账号', desc: '采购/销售/库存/下级', perms: ['purchase', 'sales', 'stock', 'l2', 'bind', 'aftersale', 'sub'] },
        { id: 'R3', name: '一级子账号', desc: '仅销售扫码', perms: ['sales_scan'] },
        { id: 'R4', name: '二级代理', desc: '库存/销售单/绑定/售后', perms: ['sales_view', 'stock_self', 'bind', 'aftersale'] },
      ],
      accounts: [
        { id: 'ACC1', username: 'admin', name: '平台管理员', roleId: 'R1', status: '启用' },
        { id: 'ACC2', username: 'agent_hd', name: '华东锐涞总代', roleId: 'R2', agentId: 'L1A', status: '启用' },
        { id: 'ACC3', username: 'agent_hz', name: '杭州城西专营', roleId: 'R4', agentId: 'L2A', status: '启用' },
        { id: 'ACC4', username: 'hd_scan_01', name: '仓管小陈', roleId: 'R3', agentId: 'L1A', status: '启用' },
        { id: 'ACC5', username: 'hd_scan_02', name: '仓管小周', roleId: 'R3', agentId: 'L1A', status: '启用' },
      ],
      logs: [
        { time: nowStr(), account: 'admin', role: '平台管理员', action: '登录后台', ip: '10.0.1.8', ok: true, type: 'login' },
      ],
      subAccounts: [
        { id: 'SUB1', l1Id: 'L1A', username: 'hd_scan_01', name: '仓管小陈', status: '启用' },
        { id: 'SUB2', l1Id: 'L1A', username: 'hd_scan_02', name: '仓管小周', status: '启用' },
      ],
      seq: { po: 22, so: 89, rt: 1, snBatch: 1, notify: 1 },
    };
  }

  const persistKey = 'ruilai_proto_v3';
  function loadStore() {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // migrate soft fields
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.accounts) parsed.accounts = seed().accounts;
        (parsed.sns || []).forEach((s) => {
          if (s.resale === undefined) s.resale = false;
          if (s.bindAt === undefined) s.bindAt = s.status === 'bound' ? '2026-07-25 12:00' : null;
        });
        return parsed;
      }
    } catch (_) {}
    return seed();
  }
  function saveStore() {
    localStorage.setItem(persistKey, JSON.stringify(db));
  }

  let db = loadStore();

  const ui = {
    loggedIn: sessionStorage.getItem('ruilai_logged') === '1',
    role: sessionStorage.getItem('ruilai_role') || 'admin', // admin | l1 | l2 | sub
    mode: sessionStorage.getItem('ruilai_mode') || 'admin',
    route: (location.hash.replace(/^#/, '') || 'home'),
    modal: null, // { type, payload }
    drawer: null,
    toast: null,
    tabs: {},
    filters: {},
    form: {},
    notifyOpen: false,
  };

  const ROLES = {
    admin: { name: '平台管理员', avatar: '管', account: 'admin' },
    l1: { name: '华东锐涞总代', avatar: '一', account: 'agent_hd', l1Id: 'L1A' },
    l2: { name: '杭州城西专营', avatar: '二', account: 'agent_hz', l2Id: 'L2A', l1Id: 'L1A' },
    sub: { name: '仓管小陈(子账号)', avatar: '子', account: 'hd_scan_01', l1Id: 'L1A' },
  };

  function currentL1Id() {
    return ROLES[ui.role]?.l1Id || null;
  }
  function currentL2Id() {
    return ROLES[ui.role]?.l2Id || null;
  }

  function addLog(action, type = 'op', ok = true) {
    const r = ROLES[ui.role];
    db.logs.unshift({
      time: nowStr(),
      account: r.account,
      role: r.name,
      action,
      ip: '10.0.1.8',
      ok,
      type,
    });
    saveStore();
  }

  function toast(msg, kind = 'ok') {
    ui.toast = { msg, kind, id: Date.now() };
    render();
    setTimeout(() => {
      if (ui.toast && ui.toast.id === ui.toast.id) {
        ui.toast = null;
        const el = document.querySelector('.toast-wrap');
        if (el) el.innerHTML = '';
      }
      // soft clear without full rerender if possible
      const wrap = document.querySelector('.toast-wrap');
      if (wrap) wrap.innerHTML = '';
      ui.toast = null;
    }, 2400);
  }

  function productName(id) {
    return db.products.find((p) => p.id === id)?.name || id;
  }
  function l1Name(id) {
    return db.agentsL1.find((a) => a.id === id)?.name || '—';
  }
  function l2Name(id) {
    return db.agentsL2.find((a) => a.id === id)?.name || '—';
  }

  function occupiedMainAreas(exceptId) {
    return new Set(db.agentsL1.filter((a) => a.id !== exceptId && a.status === '启用').map((a) => a.mainArea));
  }

  function citiesForL1(l1Id) {
    const a = db.agentsL1.find((x) => x.id === l1Id);
    if (!a) return [];
    return a.areas.flatMap((r) => CITY_MAP[r] || []);
  }

  function stockCount(agentType, agentId, productId, size) {
    return db.sns.filter((s) => {
      if (s.productId !== productId || s.size !== size) return false;
      if (agentType === 'l1') return s.l1Id === agentId && s.status === 'l1';
      if (agentType === 'l2') return s.l2Id === agentId && (s.status === 'l2' || (s.status === 'bound' && false) || s.status === 'l2');
      // l2 available = l2 not bound, or reIn
      return false;
    }).length;
  }

  function l2AvailableStock(l2Id, productId, size) {
    return db.sns.filter((s) => s.l2Id === l2Id && s.productId === productId && s.size === size && (s.status === 'l2' || (s.status === 'bound' && s.reIn))).length
      + db.sns.filter((s) => s.l2Id === l2Id && s.productId === productId && s.size === size && s.status === 'l2').length;
  }

  // Fix stock helpers properly
  function countSn(pred) {
    return db.sns.filter(pred).length;
  }

  function getStockRows(agentType, agentId) {
    const map = new Map();
    db.sns.forEach((s) => {
      let ok = false;
      if (agentType === 'l1' && s.l1Id === agentId && s.status === 'l1') ok = true;
      if (agentType === 'l2' && s.l2Id === agentId && (s.status === 'l2' || s.reIn)) ok = true;
      if (!ok) return;
      const key = `${s.productId}_${s.size}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([key, qty]) => {
      const [productId, size] = key.split('_');
      return { productId, size, qty };
    });
  }

  function pushNotify(title, body, to = '一级+原厂') {
    db.notifications = db.notifications || [];
    db.notifications.unshift({
      id: uid('N'),
      time: nowStr(),
      title,
      body,
      to,
      read: false,
    });
  }

  function pushException(type, target, detail) {
    db.exceptions.unshift({
      id: uid('EX'),
      time: nowStr(),
      type,
      target,
      detail,
      notify: '一级+原厂',
      status: '未处理',
    });
    pushNotify(`预警：${type}`, `${target} · ${detail}`, '一级+原厂');
    saveStore();
  }

  function availableL1Areas(exceptId) {
    const occ = occupiedMainAreas(exceptId);
    // 默认全国，剔除已被占用为主授权的区域
    return ALL_REGIONS.filter((r) => !occ.has(r));
  }

  function parseTime(t) {
    return new Date(String(t).replace(/-/g, '/')).getTime() || 0;
  }

  function withinRange(timeStr, days) {
    const n = Number(days) || 30;
    const ts = parseTime(timeStr);
    return Date.now() - ts <= n * 86400000;
  }

  function parseOneSegment(seg) {
    const m = String(seg).trim().match(/^(RL\d+)(?:\s*[-~—]\s*(RL\d+))?$/i);
    if (!m) return null;
    const start = m[1].toUpperCase();
    const end = (m[2] || m[1]).toUpperCase();
    const pref = start.slice(0, -4);
    const sNum = parseInt(start.slice(-4), 10);
    const eNum = parseInt(end.slice(-4), 10);
    if (Number.isNaN(sNum) || Number.isNaN(eNum) || eNum < sNum) return null;
    if (end.slice(0, -4) !== pref) return null;
    const list = [];
    for (let i = sNum; i <= eNum; i++) list.push(pref + String(i).padStart(4, '0'));
    return list;
  }

  /** 支持单号段，或多个号段用逗号/分号拼接 */
  function parseSegment(seg) {
    const parts = String(seg).split(/[,;，；]+/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return null;
    const list = [];
    for (const p of parts) {
      const one = parseOneSegment(p);
      if (!one) return null;
      list.push(...one);
    }
    return [...new Set(list)];
  }

  function roleAccountCount(roleId) {
    return (db.accounts || []).filter((a) => a.roleId === roleId).length;
  }

  function currentAccount() {
    const accName = ROLES[ui.role]?.account;
    return (db.accounts || []).find((a) => a.username === accName) || null;
  }

  function currentPerms() {
    const acc = currentAccount();
    if (!acc) return ['all'];
    const role = db.roles.find((r) => r.id === acc.roleId);
    return role?.perms || ['all'];
  }

  function hasPerm(p) {
    const perms = currentPerms();
    return perms.includes('all') || perms.includes(p);
  }

  const MENU_PERM = {
    home: 'all', 'agent-l1': 'l2', 'agent-l2': 'l2', 'agent-bind': 'l2', 'agent-pending': 'l2',
    sn: 'purchase', product: 'purchase', purchase: 'purchase', sales: 'sales', stock: 'stock',
    return: 'aftersale', exception: 'exception', stats: 'stats', role: 'all', log: 'all',
  };

  function filterMenusByPerm(menus) {
    if (hasPerm('all') || ui.role !== 'admin') return menus;
    return menus.map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        const need = MENU_PERM[it.id];
        return !need || need === 'all' || hasPerm(need);
      }),
    })).filter((g) => g.items.length);
  }

  /* ---------- Menus ---------- */
  function adminMenus() {
    return [
      { group: '概览', items: [{ id: 'home', title: '工作台', icon: '⌂' }] },
      { group: '渠道', items: [
        { id: 'agent-l1', title: '一级代理商', icon: '①' },
        { id: 'agent-l2', title: '二级代理商', icon: '②' },
        { id: 'agent-bind', title: '从属关系', icon: '⇄' },
        { id: 'agent-pending', title: '待分配二级', icon: '⌛' },
      ]},
      { group: '货品', items: [
        { id: 'sn', title: 'SN码库', icon: '#' },
        { id: 'product', title: '商品库', icon: '▣' },
        { id: 'purchase', title: '采购单管理', icon: '▤' },
        { id: 'sales', title: '销售单管理', icon: '▥' },
        { id: 'stock', title: '库存管理', icon: '▦' },
      ]},
      { group: '售后与风控', items: [
        { id: 'return', title: '退货管理', icon: '↩' },
        { id: 'exception', title: '异常管理', icon: '⚠' },
        { id: 'stats', title: '数据统计', icon: '▤' },
      ]},
      { group: '系统', items: [
        { id: 'role', title: '角色与权限', icon: '◎' },
        { id: 'log', title: '系统日志', icon: '☰' },
      ]},
    ];
  }

  function agentMenus() {
    if (ui.role === 'l2') {
      return [
        { group: '代理端', items: [{ id: 'agent-home', title: '首页', icon: '⌂' }] },
        { group: '业务', items: [
          { id: 'agent-sales', title: '销售单', icon: '▥' },
          { id: 'agent-stock', title: '我的库存', icon: '▦' },
          { id: 'agent-bind-user', title: '用户绑定', icon: '☺' },
          { id: 'agent-aftersale', title: '售后管理', icon: '↩' },
        ]},
      ];
    }
    if (ui.role === 'sub') {
      return [
        { group: '代理端', items: [{ id: 'agent-home', title: '首页', icon: '⌂' }] },
        { group: '业务', items: [
          { id: 'agent-sales', title: '销售单(扫码)', icon: '▥' },
        ]},
      ];
    }
    // l1
    return [
      { group: '代理端', items: [{ id: 'agent-home', title: '首页', icon: '⌂' }] },
      { group: '业务', items: [
        { id: 'agent-purchase', title: '采购申请', icon: '▤' },
        { id: 'agent-sales', title: '销售单', icon: '▥' },
        { id: 'agent-stock', title: '库存查询', icon: '▦' },
        { id: 'agent-bind-user', title: '用户绑定', icon: '☺' },
        { id: 'agent-aftersale', title: '售后管理', icon: '↩' },
        { id: 'agent-sub', title: '子账号', icon: '◎' },
        { id: 'agent-l2-mine', title: '我的二级代理', icon: '②' },
      ]},
    ];
  }

  const TITLES = {
    home: '工作台', 'agent-l1': '一级代理商', 'agent-l2': '二级代理商', 'agent-bind': '从属关系管理',
    'agent-pending': '待分配二级代理', sn: 'SN码库', product: '商品库', purchase: '采购单管理',
    sales: '销售单管理', stock: '库存管理', return: '退货管理', exception: '异常管理', stats: '数据统计',
    role: '角色与权限', log: '系统日志', 'agent-home': '代理商首页', 'agent-purchase': '采购单申请',
    'agent-sales': '销售单', 'agent-stock': '库存管理', 'agent-bind-user': '用户绑定',
    'agent-aftersale': '售后管理', 'agent-sub': '子账号管理', 'agent-l2-mine': '我的二级代理',
  };

  /* ---------- UI helpers ---------- */
  function tag(text, type = 'gray') {
    return `<span class="tag tag-${type}">${escapeHtml(text)}</span>`;
  }
  function pageHeader(title, desc, actions = '') {
    return `<div class="page-header"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(desc)}</p></div><div class="page-actions">${actions}</div></div>`;
  }
  function searchBar(html) {
    return `<div class="page-card search-panel">${html}</div>`;
  }
  function table(headers, rowsHtml, emptyCols) {
    const body = rowsHtml || `<tr><td colspan="${emptyCols || headers.length}" class="empty-hint">暂无数据</td></tr>`;
    const count = rowsHtml ? (rowsHtml.match(/<tr[\s>]/g) || []).length : 0;
    return `<div class="page-card"><div class="table-wrap"><table class="data"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div><div class="pager"><span>共 ${count} 条</span><span>可走查原型 · 数据保存在本机</span></div></div>`;
  }
  function tabs(key, items) {
    const cur = ui.tabs[key] || items[0].id;
    ui.tabs[key] = cur;
    return `<div class="page-card"><div class="tabs">${items.map((it) => `<button type="button" class="tab ${cur === it.id ? 'active' : ''}" data-tab="${key}:${it.id}">${it.label}</button>`).join('')}</div></div>`;
  }

  /* ---------- Pages ---------- */
  function pageHome() {
    const pendingPo = db.purchases.filter((p) => p.status === 'pending').length;
    const pendingRt = db.returns.filter((r) => r.status === 'pending').length;
    const openEx = db.exceptions.filter((e) => e.status === '未处理').length;
    const pendingL2 = db.agentsL2.filter((a) => a.pending).length;
    return `
      ${pageHeader('数据工作台', '实时聚合本机演示数据', `<button class="btn" data-go="exception">异常中心</button><button class="btn btn-primary" data-go="purchase">待审采购 ${pendingPo}</button>`)}
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">一级代理</div><div class="metric-value num">${db.agentsL1.length}</div></div>
        <div class="metric-card"><div class="metric-label">二级代理</div><div class="metric-value num">${db.agentsL2.filter((a) => !a.pending).length}</div></div>
        <div class="metric-card"><div class="metric-label">SN 总量</div><div class="metric-value num">${db.sns.length}</div></div>
        <div class="metric-card"><div class="metric-label">待处理异常</div><div class="metric-value num ${openEx ? 'danger' : ''}">${openEx}</div></div>
      </div>
      <div class="split-grid">
        <div class="page-card">
          <h3 class="section-title">待处理事项</h3>
          ${[
            ['采购单待审核', pendingPo, 'purchase'],
            ['退货待审核', pendingRt, 'return'],
            ['未处理异常', openEx, 'exception'],
            ['待分配二级', pendingL2, 'agent-pending'],
          ].map(([l, n, g]) => `<button class="todo-row" data-go="${g}"><span>${l}</span><span class="todo-count ${n ? 'hot' : ''}">${n}</span></button>`).join('')}
        </div>
        <div class="page-card">
          <h3 class="section-title">最近操作日志</h3>
          ${db.logs.slice(0, 6).map((l) => `<div class="recent-row"><div class="recent-main"><span class="recent-title">${escapeHtml(l.action)}</span><span class="recent-meta">${escapeHtml(l.account)} · ${escapeHtml(l.role)}</span></div><span class="recent-time">${escapeHtml(l.time.slice(5))}</span></div>`).join('') || '<div class="empty-hint">暂无</div>'}
        </div>
      </div>`;
  }

  function pageAgentL1() {
    const f = ui.filters['agent-l1'] || { q: '', status: '', main: '' };
    let list = db.agentsL1.slice();
    if (f.q) list = list.filter((a) => a.name.includes(f.q) || a.code.includes(f.q));
    if (f.status) list = list.filter((a) => a.status === f.status);
    if (f.main) list = list.filter((a) => a.mainArea === f.main);
    const rows = list.map((a) => {
      const n = db.agentsL2.filter((x) => x.parentId === a.id && !x.pending).length;
      return `<tr>
        <td class="num">${a.code}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.contact)}</td>
        <td>${escapeHtml(a.areas.join('·'))}</td><td>${tag(a.mainArea, 'green')}</td>
        <td class="num">${n}</td><td>${a.status === '启用' ? tag('启用', 'green') : tag('停用', 'gray')}</td>
        <td class="ops">
          <button class="btn btn-sm" data-action="edit-l1" data-id="${a.id}">编辑</button>
          <button class="btn btn-sm" data-action="toggle-l1" data-id="${a.id}">${a.status === '启用' ? '停用' : '启用'}</button>
        </td></tr>`;
    }).join('');
    return `
      ${pageHeader('一级代理商', '电子围栏授权；主授权区域互斥占用，创建/编辑时自动剔除已占用主区', `<button class="btn btn-primary" data-action="edit-l1">+ 新建一级代理</button>`)}
      <div class="alert alert-info">当前已被占用的主授权区域：${[...occupiedMainAreas()].join('、') || '无'}</div>
      ${searchBar(`
        <input class="field-input" data-filter="agent-l1:q" placeholder="名称/编码" value="${escapeHtml(f.q)}" />
        <select class="field-input" data-filter="agent-l1:status"><option value="">全部状态</option><option value="启用" ${f.status==='启用'?'selected':''}>启用</option><option value="停用" ${f.status==='停用'?'selected':''}>停用</option></select>
        <select class="field-input" data-filter="agent-l1:main"><option value="">主授权区域</option>${ALL_REGIONS.map((r)=>`<option value="${r}" ${f.main===r?'selected':''}>${r}</option>`).join('')}</select>
        <button class="btn btn-primary" data-action="apply-filter" data-key="agent-l1">查询</button>
        <button class="btn" data-action="reset-filter" data-key="agent-l1">重置</button>
      `)}
      ${table(['编码','名称','联系人','授权区域','主授权区','下属二级','状态','操作'], rows)}`;
  }

  function pageAgentL2() {
    const f = ui.filters['agent-l2'] || { q: '', type: '', parent: '' };
    let list = db.agentsL2.filter((a) => !a.pending);
    if (ui.mode === 'agent' && ui.role === 'l1') list = list.filter((a) => a.parentId === currentL1Id());
    if (f.q) list = list.filter((a) => a.name.includes(f.q) || a.code.includes(f.q));
    if (f.type) list = list.filter((a) => a.type === f.type);
    if (f.parent) list = list.filter((a) => a.parentId === f.parent);
    const rows = list.map((a) => `<tr>
      <td class="num">${a.code}</td><td>${escapeHtml(a.name)}</td>
      <td>${a.type === '法人' ? tag('法人','blue') : tag('个人','orange')}</td>
      <td>${escapeHtml(l1Name(a.parentId))}</td><td>${escapeHtml((a.areas||[]).join('、'))}</td>
      <td>${tag('已绑定','green')}</td><td>${tag(a.status,'green')}</td>
      <td class="ops"><button class="btn btn-sm" data-action="edit-l2" data-id="${a.id}">编辑</button>
      ${ui.mode==='admin'?`<button class="btn btn-sm" data-action="unbind-l2" data-id="${a.id}">解绑</button>`:''}</td></tr>`).join('');
    const canCreate = ui.mode === 'admin' || ui.role === 'l1';
    return `
      ${pageHeader('二级代理商', '区域必须落在一级授权范围内；超范围创建会报错；需区分法人/个人并上传协议', canCreate?`<button class="btn btn-primary" data-action="edit-l2">+ 新建二级代理</button>`:'')}
      ${searchBar(`
        <input class="field-input" data-filter="agent-l2:q" placeholder="名称/编码" value="${escapeHtml(f.q||'')}" />
        <select class="field-input" data-filter="agent-l2:type"><option value="">全部性质</option><option value="法人" ${f.type==='法人'?'selected':''}>法人</option><option value="个人" ${f.type==='个人'?'selected':''}>个人</option></select>
        ${ui.mode==='admin'?`<select class="field-input" data-filter="agent-l2:parent"><option value="">所属一级</option>${db.agentsL1.map(a=>`<option value="${a.id}" ${f.parent===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>`:''}
        <button class="btn btn-primary" data-action="apply-filter" data-key="agent-l2">查询</button>
      `)}
      ${table(['编码','名称','性质','所属一级','授权区域','从属','状态','操作'], rows)}`;
  }

  function pageAgentBind() {
    const rows = db.agentsL2.filter((a) => !a.pending).map((a) => `<tr>
      <td>${escapeHtml(a.name)}</td><td>${a.type==='法人'?tag('法人','blue'):tag('个人','orange')}</td>
      <td>${escapeHtml(l1Name(a.parentId))}</td>
      <td>${escapeHtml((a.areas||[]).join('、')||'—')}</td>
      <td class="ops"><button class="btn btn-sm" data-action="rebind" data-id="${a.id}">改绑</button>
      <button class="btn btn-sm" data-action="remove-area-sim" data-id="${a.id}">模拟一级撤区</button></td></tr>`).join('');
    return `
      ${pageHeader('从属关系管理', '改绑后需一级重填区域；一级撤区时法人解绑清区进待分配，个人保留绑定且区域不可改', '')}
      <div class="alert alert-warn">点「模拟一级撤区」：若二级区域不在一级剩余授权内，将按法人/个人规则处理。</div>
      ${table(['二级代理','性质','当前一级','授权区域','操作'], rows)}`;
  }

  function pageAgentPending() {
    const list = db.agentsL2.filter((a) => a.pending);
    const rows = list.map((a) => `<tr>
      <td class="num">${a.code}</td><td>${escapeHtml(a.name)}</td>
      <td>${a.type==='法人'?tag('法人','blue'):tag('个人','orange')}</td>
      <td>${escapeHtml(l1Name(a.prevParentId))}</td>
      <td>${escapeHtml((a.prevAreas||a.areas||[]).join('、')||'已清除')}</td>
      <td class="ops"><button class="btn btn-sm btn-primary" data-action="rebind" data-id="${a.id}">绑定一级</button></td></tr>`).join('');
    return `${pageHeader('待分配二级代理', '无一级归属的二级集中展示，可重新绑定', '')}${table(['编码','名称','性质','原一级','原/当前区域','操作'], rows)}`;
  }

  function pageSN() {
    const f = ui.filters.sn || { q: '', l1: '', size: '' };
    let list = db.sns.slice().reverse();
    if (f.q) list = list.filter((s) => s.sn.includes(f.q.toUpperCase()));
    if (f.l1) list = list.filter((s) => s.l1Id === f.l1);
    if (f.size) list = list.filter((s) => s.size === f.size);
    list = list.slice(0, 50);
    const statusMap = { warehouse: ['待入库', 'gray'], l1: ['在库-一级', 'green'], l2: ['在库-二级', 'blue'], bound: ['已绑用户', 'orange'], factory: ['已退原厂', 'gray'] };
    const rows = list.map((s) => {
      const st = statusMap[s.status] || [s.status, 'gray'];
      return `<tr><td class="num">${s.sn}</td><td>${escapeHtml(productName(s.productId))}</td><td>${s.size}</td>
        <td>${escapeHtml(l1Name(s.l1Id))}</td><td>${escapeHtml(s.l2Id ? l2Name(s.l2Id) : '—')}</td>
        <td>${tag(st[0], st[1])}${s.reIn ? ' '+tag('再入库','gray') : ''}</td></tr>`;
    }).join('');
    return `
      ${pageHeader('SN码库', '批量导入并绑定一级代理与尺码；支撑采购号段与扫码流转', `<button class="btn" data-action="download-sn-tpl">下载模板说明</button><button class="btn btn-primary" data-action="import-sn">批量导入</button>`)}
      ${searchBar(`
        <input class="field-input" data-filter="sn:q" placeholder="SN码" value="${escapeHtml(f.q||'')}" />
        <select class="field-input" data-filter="sn:l1"><option value="">所属一级</option>${db.agentsL1.map(a=>`<option value="${a.id}" ${f.l1===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:size"><option value="">尺码</option>${['S','M','L','XL'].map(s=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
        <button class="btn btn-primary" data-action="apply-filter" data-key="sn">查询</button>
      `)}
      ${table(['SN码','商品','尺码','绑定一级','二级','状态'], rows)}`;
  }

  function pageProduct() {
    const rows = db.products.map((p) => `<tr>
      <td class="num">${p.code}</td><td>${escapeHtml(p.name)}</td><td>${p.sizes.join(' / ')}</td>
      <td>${p.status==='上架'?tag('上架','green'):tag('下架','gray')}</td>
      <td class="ops"><button class="btn btn-sm" data-action="edit-product" data-id="${p.id}">编辑</button>
      <button class="btn btn-sm" data-action="toggle-product" data-id="${p.id}">${p.status==='上架'?'下架':'上架'}</button></td></tr>`).join('');
    return `${pageHeader('商品库', '维护商品名称与规格尺码', `<button class="btn btn-primary" data-action="edit-product">+ 新建商品</button>`)}
      ${table(['商品编码','商品名称','规格/尺码','状态','操作'], rows)}`;
  }

  function pagePurchase() {
    const tab = ui.tabs.purchase || 'pending';
    let list = db.purchases.slice().reverse();
    if (tab !== 'all') list = list.filter((p) => p.status === tab);
    const stMap = { pending: ['待审核','orange'], approved: ['已通过','green'], rejected: ['已驳回','red'] };
    const rows = list.map((p) => {
      const detail = p.lines.map((l) => `${productName(l.productId)}/${l.size}×${l.qty}`).join('，');
      const qty = p.lines.reduce((s, l) => s + l.qty, 0);
      const st = stMap[p.status];
      return `<tr><td class="num">${p.no}</td><td>${escapeHtml(l1Name(p.l1Id))}</td><td>${escapeHtml(detail)}</td>
        <td class="num">${qty}</td><td class="num">${(p.segments||[]).join('；')||'—'}</td>
        <td>${tag(st[0], st[1])}</td><td class="num">${escapeHtml(p.createdAt)}</td>
        <td class="ops">${p.status==='pending'?`<button class="btn btn-sm btn-primary" data-action="audit-po" data-id="${p.id}">审核</button>
        <button class="btn btn-sm btn-danger" data-action="reject-po" data-id="${p.id}">驳回</button>`:`<button class="btn btn-sm" data-action="view-po" data-id="${p.id}">详情</button>`}</td></tr>`;
    }).join('');
    return `
      ${pageHeader('采购单管理', '按尺码录入号段审核，校验数量与号段匹配后方可入库', '')}
      ${tabs('purchase', [{id:'pending',label:'待审核'},{id:'approved',label:'已通过'},{id:'rejected',label:'已驳回'},{id:'all',label:'全部'}])}
      ${table(['采购单号','一级代理','商品/尺码','数量','号段','状态','申请时间','操作'], rows)}`;
  }

  function pageSales() {
    const f = ui.filters.sales || { q: '' };
    let list = db.sales.slice().reverse();
    if (f.q) list = list.filter((s) => s.no.includes(f.q) || (s.scanned||[]).some((x) => x.includes(f.q.toUpperCase())));
    const rows = list.map((s) => {
      const qty = (s.scanned || []).length;
      return `<tr><td class="num">${s.no}</td><td>${escapeHtml(l1Name(s.l1Id))}</td><td>${escapeHtml(l2Name(s.l2Id))}</td>
        <td class="num">${qty}</td><td>${s.status==='done'?tag('已完成','green'):tag('扫码中','blue')}</td>
        <td class="num">${escapeHtml(s.createdAt)}</td>
        <td class="ops"><button class="btn btn-sm" data-action="view-so" data-id="${s.id}">详情</button></td></tr>`;
    }).join('');
    return `
      ${pageHeader('销售单管理', '平台可查看全部一级创建的销售单', '')}
      ${searchBar(`<input class="field-input" data-filter="sales:q" placeholder="销售单号/SN" value="${escapeHtml(f.q||'')}" /><button class="btn btn-primary" data-action="apply-filter" data-key="sales">查询</button>`)}
      ${table(['销售单号','一级','二级','数量','状态','创建时间','操作'], rows)}`;
  }

  function pageStock() {
    const tab = ui.tabs.stock || 'l1';
    let rows = '';
    if (tab === 'l1') {
      db.agentsL1.forEach((a) => {
        getStockRows('l1', a.id).forEach((r) => {
          rows += `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(productName(r.productId))}</td><td>${r.size}</td>
            <td class="num">${r.qty}</td>
            <td class="ops"><button class="btn btn-sm" data-action="stock-hist" data-type="l1" data-id="${a.id}" data-pid="${r.productId}" data-size="${r.size}">流水</button></td></tr>`;
        });
      });
    } else {
      db.agentsL2.filter((a) => !a.pending).forEach((a) => {
        getStockRows('l2', a.id).forEach((r) => {
          rows += `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(productName(r.productId))}</td><td>${r.size}</td>
            <td class="num">${r.qty}</td>
            <td class="ops"><button class="btn btn-sm" data-action="stock-hist" data-type="l2" data-id="${a.id}" data-pid="${r.productId}" data-size="${r.size}">流水</button></td></tr>`;
        });
      });
    }
    return `
      ${pageHeader('库存管理', '采购通过进一级库存；销售完成进二级库存；可追溯流水', '')}
      ${tabs('stock', [{id:'l1',label:'一级代理库存'},{id:'l2',label:'二级代理库存'}])}
      ${table(['代理','商品','尺码','可用库存','操作'], rows)}`;
  }

  function pageReturn() {
    const tab = ui.tabs.return || 'audit';
    let list = db.returns.slice().reverse();
    if (tab === 'audit') list = list.filter((r) => r.status === 'pending' && r.type === 'l1_to_factory');
    if (tab === 'user') list = list.filter((r) => r.type === 'user');
    if (tab === 'l2') list = list.filter((r) => r.type === 'l2_to_l1');
    if (tab === 'l1') list = list.filter((r) => r.type === 'l1_to_factory');
    const typeMap = { user: ['用户退货','gray'], l2_to_l1: ['二级退一级','blue'], l1_to_factory: ['一级退原厂','orange'] };
    const rows = list.map((r) => {
      const tm = typeMap[r.type];
      return `<tr><td class="num">${r.no}</td><td>${tag(tm[0], tm[1])}</td><td>${escapeHtml(r.fromName)}</td>
        <td class="num">${(r.sns||[]).length}</td><td>${r.status==='pending'?tag('待审核','orange'):r.status==='approved'?tag('已通过','green'):tag(r.status,'gray')}</td>
        <td class="num">${escapeHtml(r.createdAt)}</td>
        <td class="ops">${r.status==='pending' && (r.type==='l1_to_factory' && ui.mode==='admin' || r.type==='l2_to_l1' && (ui.mode==='admin'||ui.role==='l1'))
          ? `<button class="btn btn-sm btn-primary" data-action="approve-rt" data-id="${r.id}">通过</button>
             <button class="btn btn-sm btn-danger" data-action="reject-rt" data-id="${r.id}">驳回</button>`
          : `<button class="btn btn-sm" data-action="view-rt" data-id="${r.id}">详情</button>`}</td></tr>`;
    }).join('');
    return `
      ${pageHeader('退货管理', '用户退货再入库；二级→一级审；一级→原厂审；库存逐级回退', '')}
      ${tabs('return', [{id:'audit',label:'退货审核'},{id:'user',label:'用户退货'},{id:'l2',label:'二级退货单'},{id:'l1',label:'一级退货单'}])}
      ${table(['退货单号','类型','发起方','SN数','状态','时间','操作'], rows)}`;
  }

  function pageException() {
    const open = db.exceptions.filter((e) => e.status === '未处理').length;
    const rows = db.exceptions.map((e) => `<tr>
      <td class="num">${escapeHtml(e.time)}</td>
      <td>${e.type.includes('跨区')||e.type.includes('激活')?tag(e.type,'red'):tag(e.type,'orange')}</td>
      <td>${escapeHtml(e.target)}</td><td>${escapeHtml(e.detail)}</td><td>${escapeHtml(e.notify)}</td>
      <td>${e.status==='未处理'?tag('未处理','orange'):tag('已关闭','gray')}</td>
      <td class="ops">${e.status==='未处理'?`<button class="btn btn-sm btn-primary" data-action="close-ex" data-id="${e.id}">处理关闭</button>`:'—'}</td></tr>`).join('');
    return `
      ${pageHeader('异常管理', `预警倍数当前 ${db.exceptionMultiplier}×；销售压货与跨区激活/绑定将写入此列表`, `<button class="btn" data-action="ex-setting">异常标准设置</button>`)}
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">未处理</div><div class="metric-value num ${open?'danger':''}">${open}</div></div>
        <div class="metric-card"><div class="metric-label">全部异常</div><div class="metric-value num">${db.exceptions.length}</div></div>
        <div class="metric-card"><div class="metric-label">预警倍数</div><div class="metric-value num">${db.exceptionMultiplier}×</div></div>
        <div class="metric-card"><div class="metric-label">演示IP地区</div><div class="metric-value" style="font-size:18px">${db.demoIpRegion}</div></div>
      </div>
      ${table(['时间','类型','对象','详情','通知','状态','操作'], rows)}`;
  }

  function pageStats() {
    const f = ui.filters.stats || { range: '30' };
    const days = f.range || '30';
    const pos = db.purchases.filter((p) => p.status === 'approved' && withinRange(p.createdAt, days));
    const sos = db.sales.filter((s) => s.status === 'done' && withinRange(s.createdAt, days));
    const acts = db.sns.filter((s) => s.status === 'bound' && withinRange(s.bindAt || s.user?.boundAt || '2026-07-25 12:00', days));
    const exs = db.exceptions.filter((e) => withinRange(e.time, days));
    const poQty = pos.reduce((s, p) => s + p.lines.reduce((a, l) => a + l.qty, 0), 0);
    const soQty = sos.reduce((s, x) => s + (x.scanned || []).length, 0);
    const actQty = acts.length;
    const exQty = exs.length;
    const byL1Po = db.agentsL1.map((a) => ({
      name: a.name,
      q: pos.filter((p) => p.l1Id === a.id).reduce((s, p) => s + p.lines.reduce((x, l) => x + l.qty, 0), 0),
    })).sort((a, b) => b.q - a.q);
    const byL1So = db.agentsL1.map((a) => ({
      name: a.name,
      q: sos.filter((s) => s.l1Id === a.id).reduce((n, x) => n + (x.scanned || []).length, 0),
    })).sort((a, b) => b.q - a.q);
    const byRegion = {};
    acts.forEach((s) => {
      const r = s.bindIpRegion || s.user?.phoneLoc || '未知';
      byRegion[r] = (byRegion[r] || 0) + 1;
    });
    const byExType = {};
    exs.forEach((e) => { byExType[e.type] = (byExType[e.type] || 0) + 1; });
    return `
      ${pageHeader('数据统计', `近 ${days} 天：采购 / 销售 / SN激活 / 异常（按时间真实过滤）`, `
        <select class="field-input" data-filter="stats:range">
          <option value="7" ${days==='7'?'selected':''}>近7天</option>
          <option value="30" ${days==='30'?'selected':''}>近30天</option>
          <option value="90" ${days==='90'?'selected':''}>近90天</option>
          <option value="365" ${days==='365'?'selected':''}>近一年</option>
        </select>
        <button class="btn btn-primary" data-action="apply-filter" data-key="stats">应用</button>
        <button class="btn" data-action="export-stats">导出汇总</button>
      `)}
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">采购量</div><div class="metric-value num">${poQty}</div></div>
        <div class="metric-card"><div class="metric-label">销售量</div><div class="metric-value num">${soQty}</div></div>
        <div class="metric-card"><div class="metric-label">SN激活量</div><div class="metric-value num">${actQty}</div></div>
        <div class="metric-card"><div class="metric-label">异常次数</div><div class="metric-value num warn">${exQty}</div></div>
      </div>
      <div class="split-grid">
        <div class="page-card"><h3 class="section-title">采购量（按一级）</h3>
          ${table(['一级代理','采购量'], byL1Po.map((x)=>`<tr><td>${escapeHtml(x.name)}</td><td class="num">${x.q}</td></tr>`).join(''))}
        </div>
        <div class="page-card"><h3 class="section-title">销售量（按一级）</h3>
          ${table(['一级代理','销售量'], byL1So.map((x)=>`<tr><td>${escapeHtml(x.name)}</td><td class="num">${x.q}</td></tr>`).join(''))}
        </div>
        <div class="page-card"><h3 class="section-title">激活量（按IP地区）</h3>
          ${table(['地区','激活量'], Object.entries(byRegion).map(([k,v])=>`<tr><td>${escapeHtml(k)}</td><td class="num">${v}</td></tr>`).join('') || '')}
        </div>
        <div class="page-card"><h3 class="section-title">异常分布</h3>
          ${table(['异常类型','次数'], Object.entries(byExType).map(([k,v])=>`<tr><td>${escapeHtml(k)}</td><td class="num">${v}</td></tr>`).join('') || '')}
        </div>
      </div>`;
  }

  function pageRole() {
    const rows = db.roles.map((r) => `<tr>
      <td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.desc)}</td><td class="num">${roleAccountCount(r.id)}</td>
      <td>${escapeHtml((r.perms||[]).join(', '))}</td>
      <td class="ops"><button class="btn btn-sm" data-action="edit-role" data-id="${r.id}">配置权限</button></td></tr>`).join('');
    const accRows = (db.accounts || []).map((a) => {
      const role = db.roles.find((r) => r.id === a.roleId);
      return `<tr>
        <td class="num">${escapeHtml(a.username)}</td><td>${escapeHtml(a.name)}</td>
        <td><select class="field-input" data-acc-role="${a.id}">${db.roles.map((r)=>`<option value="${r.id}" ${a.roleId===r.id?'selected':''}>${escapeHtml(r.name)}</option>`).join('')}</select></td>
        <td>${tag(a.status,'green')}</td>
        <td class="ops"><button class="btn btn-sm btn-primary" data-action="save-acc-role" data-id="${a.id}">保存绑定</button></td></tr>`;
    }).join('');
    return `${pageHeader('角色与权限', '配置角色权限，并绑定到账号；菜单按当前账号角色权限过滤', `<button class="btn btn-primary" data-action="edit-role">+ 新建角色</button>`)}
      ${table(['角色','说明','账号数','权限摘要','操作'], rows)}
      <div class="page-card" style="margin-top:12px"><h3 class="section-title">账号 ↔ 角色绑定</h3>
        <div class="table-wrap"><table class="data"><thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>状态</th><th>操作</th></tr></thead><tbody>${accRows}</tbody></table></div>
        <p class="muted" style="margin-top:8px">演示：登录身份映射到上表账号；改角色权限后将影响后台可见菜单。</p>
      </div>`;
  }

  function pageLog() {
    const tab = ui.tabs.log || 'login';
    const list = db.logs.filter((l) => (tab === 'login' ? l.type === 'login' : l.type !== 'login'));
    const rows = list.map((l) => `<tr>
      <td class="num">${escapeHtml(l.time)}</td><td>${escapeHtml(l.account)}</td><td>${escapeHtml(l.role)}</td>
      <td>${escapeHtml(l.action)}</td><td class="num">${escapeHtml(l.ip)}</td>
      <td>${l.ok?tag('成功','green'):tag('失败','red')}</td></tr>`).join('');
    return `${pageHeader('系统日志', '后台登录日志与关键操作记录', '')}
      ${tabs('log', [{id:'login',label:'登录日志'},{id:'op',label:'操作日志'}])}
      ${table(['时间','账号','角色','动作','IP','结果'], rows)}`;
  }

  function pageAgentHome() {
    const l1 = currentL1Id();
    const l2 = currentL2Id();
    let stock = 0;
    if (ui.role === 'l2') stock = getStockRows('l2', l2).reduce((s, r) => s + r.qty, 0);
    else stock = getStockRows('l1', l1).reduce((s, r) => s + r.qty, 0);
    const shortcuts = ui.role === 'l2'
      ? [['agent-sales','销售单'],['agent-stock','我的库存'],['agent-bind-user','用户绑定'],['agent-aftersale','售后']]
      : ui.role === 'sub'
        ? [['agent-sales','销售扫码']]
        : [['agent-purchase','采购申请'],['agent-sales','创建销售单'],['agent-stock','库存'],['agent-bind-user','用户绑定'],['agent-aftersale','售后'],['agent-sub','子账号']];
    return `
      ${pageHeader(ROLES[ui.role].name + ' · 工作台', '代理商前端可走查', ui.role!=='sub'?`<button class="btn btn-primary" data-go="agent-bind-user">扫码绑用户</button>`:'')}
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">库存件数</div><div class="metric-value num">${stock}</div></div>
        <div class="metric-card"><div class="metric-label">销售单</div><div class="metric-value num">${db.sales.filter((s)=> ui.role==='l2'?s.l2Id===l2:s.l1Id===l1).length}</div></div>
        <div class="metric-card"><div class="metric-label">已绑用户SN</div><div class="metric-value num">${db.sns.filter((s)=>s.status==='bound' && (ui.role==='l2'?s.l2Id===l2:s.l1Id===l1)).length}</div></div>
        <div class="metric-card"><div class="metric-label">身份</div><div class="metric-value" style="font-size:16px">${ui.role}</div></div>
      </div>
      <div class="page-card"><h3 class="section-title">快捷入口</h3>
        <div class="shortcut-grid">${shortcuts.map(([id,t])=>`<button class="shortcut-card" data-go="${id}"><span class="ico">●</span><span>${t}</span></button>`).join('')}</div>
      </div>`;
  }

  function pageAgentPurchase() {
    const l1 = currentL1Id();
    const list = db.purchases.filter((p) => p.l1Id === l1).slice().reverse();
    const stMap = { pending: ['待审核','orange'], approved: ['已入库','green'], rejected: ['已驳回','red'] };
    const rows = list.map((p) => {
      const st = stMap[p.status];
      const detail = p.lines.map((l) => `${productName(l.productId)}/${l.size}×${l.qty}`).join('，');
      return `<tr><td class="num">${p.no}</td><td>${escapeHtml(detail)}</td><td class="num">${p.lines.reduce((s,l)=>s+l.qty,0)}</td>
        <td>${tag(st[0],st[1])}</td><td class="num">${escapeHtml(p.createdAt)}</td>
        <td class="ops"><button class="btn btn-sm" data-action="view-po" data-id="${p.id}">详情</button></td></tr>`;
    }).join('');
    return `${pageHeader('采购单申请', '选择商品尺码数量提交后台审批，通过后进入自己库存', `<button class="btn btn-primary" data-action="apply-po">+ 新建申请</button>`)}
      ${table(['采购单号','商品明细','数量','状态','提交时间','操作'], rows)}`;
  }

  function pageAgentSales() {
    const l1 = currentL1Id();
    const l2 = currentL2Id();
    let list = db.sales.slice().reverse();
    if (ui.role === 'l2') list = list.filter((s) => s.l2Id === l2);
    else list = list.filter((s) => s.l1Id === l1);
    const canCreate = ui.role === 'l1' || ui.role === 'sub';
    const rows = list.map((s) => `<tr>
      <td class="num">${s.no}</td><td>${escapeHtml(l2Name(s.l2Id))}</td>
      <td class="num">${(s.scanned||[]).length}${s.planTotal ? ' / '+s.planTotal : ''}</td>
      <td>${s.status==='done'?tag('已完成','green'):tag('扫码中','blue')}</td>
      <td class="num">${escapeHtml(s.createdAt)}</td>
      <td class="ops">${s.status!=='done' && canCreate?`<button class="btn btn-sm btn-primary" data-action="continue-so" data-id="${s.id}">继续扫码</button>`:''}
        <button class="btn btn-sm" data-action="view-so" data-id="${s.id}">详情</button></td></tr>`).join('');
    return `${pageHeader('销售单', ui.role==='sub'?'子账号仅可扫码添加商品':'一级创建销售单并扫码；确认后库存转入二级', canCreate && ui.role!=='sub'?`<button class="btn btn-primary" data-action="create-so">+ 创建销售单</button>`: canCreate?`<button class="btn btn-primary" data-action="create-so">扫码作业</button>`:'')}
      ${ui.role==='sub'?`<div class="alert alert-info">子账号无权选择二级与最终确认；请打开「扫码中」单据继续扫码，由主账号确认。</div>`:''}
      ${table(['销售单号','二级代理','扫码进度','状态','创建时间','操作'], rows)}`;
  }

  function pageAgentStock() {
    const isL2 = ui.role === 'l2';
    const tab = ui.tabs.agentStock || (isL2 ? 'self' : 'self');
    let rows = '';
    if (isL2) {
      getStockRows('l2', currentL2Id()).forEach((r) => {
        rows += `<tr><td>${escapeHtml(productName(r.productId))}</td><td>${r.size}</td><td class="num">${r.qty}</td>
          <td class="ops"><button class="btn btn-sm" data-action="stock-hist" data-type="l2" data-id="${currentL2Id()}" data-pid="${r.productId}" data-size="${r.size}">历史过程</button></td></tr>`;
      });
    } else {
      const show = tab === 'sub' ? 'l2' : 'l1';
      if (show === 'l1') {
        getStockRows('l1', currentL1Id()).forEach((r) => {
          rows += `<tr><td>我的库存</td><td>${escapeHtml(productName(r.productId))}</td><td>${r.size}</td><td class="num">${r.qty}</td>
            <td class="ops"><button class="btn btn-sm" data-action="stock-hist" data-type="l1" data-id="${currentL1Id()}" data-pid="${r.productId}" data-size="${r.size}">历史过程</button></td></tr>`;
        });
      } else {
        db.agentsL2.filter((a) => a.parentId === currentL1Id() && !a.pending).forEach((a) => {
          getStockRows('l2', a.id).forEach((r) => {
            rows += `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(productName(r.productId))}</td><td>${r.size}</td><td class="num">${r.qty}</td>
              <td class="ops"><button class="btn btn-sm" data-action="stock-hist" data-type="l2" data-id="${a.id}" data-pid="${r.productId}" data-size="${r.size}">历史过程</button></td></tr>`;
          });
        });
      }
    }
    return `
      ${pageHeader('库存查询', isL2?'仅可查看自己当前库存':'可查看自己与下属二级库存，并查看单商品完整历史', '')}
      ${isL2?'':tabs('agentStock', [{id:'self',label:'我的库存'},{id:'sub',label:'下属二级库存'}])}
      ${table(isL2?['商品','尺码','库存','操作']:['对象','商品','尺码','库存','操作'], rows)}`;
  }

  function pageAgentBindUser() {
    const ownerPred = (s) => {
      if (ui.role === 'l2') return s.l2Id === currentL2Id();
      return s.l1Id === currentL1Id() && s.l2Id;
    };
    const list = db.sns.filter((s) => (s.status === 'bound' || (s.reIn && s.prevUser)) && ownerPred(s)).slice(-30).reverse();
    const rows = list.map((s) => {
      const u = s.user || s.prevUser;
      const showUser = s.status === 'bound' && s.user ? `${u.phone} / ${u.addr}` : (s.reIn ? '（再入库，再次扫码将隐藏原用户）' : '—');
      return `<tr><td class="num">${s.sn}</td><td>${escapeHtml(showUser)}</td>
        <td>${escapeHtml(s.bindIpRegion||'—')}</td>
        <td>${s.user && s.user.phoneLoc && s.user.addr && !s.user.addr.includes(s.user.phoneLoc) && s.status==='bound' ? tag('归属地异常','orange') : tag('正常','green')}</td>
        <td class="ops"><button class="btn btn-sm" data-action="view-bind" data-sn="${s.sn}">查看</button></td></tr>`;
    }).join('');
    return `
      ${pageHeader('用户绑定', '扫SN→IP校验→填用户→手机归属地与地址校验；不匹配则异常预警', `
        <div class="ip-demo"><span class="muted">演示当前IP地区</span>
          <select class="field-input" id="demo-ip" style="width:120px">${ALL_REGIONS.map(r=>`<option value="${r}" ${db.demoIpRegion===r?'selected':''}>${r}</option>`).join('')}</select>
        </div>
        <button class="btn btn-primary" data-action="bind-user">开始扫码绑定</button>`)}
      <div class="alert alert-warn">超区将弹窗确认；取消则不记录IP。确认后记录IP并进入用户信息页。</div>
      ${table(['SN码','用户信息','IP区域','校验','操作'], rows)}`;
  }

  function pageAgentAftersale() {
    const mineReturns = db.returns.filter((r) => {
      if (ui.role === 'l2') return r.fromId === currentL2Id();
      return r.fromId === currentL1Id() || r.approverId === currentL1Id() || (r.type==='l2_to_l1' && db.agentsL2.find(a=>a.id===r.fromId)?.parentId===currentL1Id());
    }).slice().reverse();
    const rows = mineReturns.map((r) => `<tr>
      <td class="num">${r.no}</td><td>${escapeHtml(r.typeLabel||r.type)}</td>
      <td>${r.status==='pending'?tag('待审','orange'):r.status==='approved'?tag('已通过','green'):tag(r.status,'gray')}</td>
      <td class="num">${escapeHtml(r.createdAt)}</td>
      <td class="ops">
        ${r.status==='pending' && r.type==='l2_to_l1' && ui.role==='l1' ? `<button class="btn btn-sm btn-primary" data-action="approve-rt" data-id="${r.id}">审批通过</button>`:''}
        <button class="btn btn-sm" data-action="view-rt" data-id="${r.id}">详情</button>
      </td></tr>`).join('');
    const resaleList = db.sns.filter((s) => {
      if (!(s.reIn || s.resale)) return false;
      if (ui.role === 'l2') return s.l2Id === currentL2Id();
      return s.l1Id === currentL1Id();
    });
    const resaleRows = resaleList.map((s) => `<tr>
      <td class="num">${s.sn}</td><td>${escapeHtml(productName(s.productId))} / ${s.size}</td>
      <td>${s.resale ? tag('可再销售','green') : tag('待标记','orange')}</td>
      <td class="ops">${!s.resale ? `<button class="btn btn-sm btn-primary" data-action="mark-resale" data-sn="${s.sn}">标记再销售</button>` : `<button class="btn btn-sm" data-action="bind-user">去绑定</button>`}</td>
    </tr>`).join('');
    return `
      ${pageHeader('售后管理', '用户退货再入库后需「标记再销售」方可再次绑用户；代理退货走上级/原厂审批', `
        <button class="btn" data-action="user-return">用户退货登记</button>
        <button class="btn btn-primary" data-action="agent-return">发起退货审批</button>`)}
      ${table(['单号','类型','状态','时间','操作'], rows)}
      <div class="page-card" style="margin-top:12px"><h3 class="section-title">退货再销售</h3>
        ${table(['SN','商品','状态','操作'], resaleRows)}
      </div>`;
  }

  function pageAgentSub() {
    const list = db.subAccounts.filter((s) => s.l1Id === currentL1Id());
    const rows = list.map((s) => `<tr>
      <td class="num">${escapeHtml(s.username)}</td><td>${escapeHtml(s.name)}</td>
      <td>${tag('销售扫码','blue')}</td><td>${tag(s.status,'green')}</td>
      <td class="ops"><button class="btn btn-sm" data-action="reset-sub" data-id="${s.id}">重置密码</button>
      <button class="btn btn-sm" data-action="toggle-sub" data-id="${s.id}">${s.status==='启用'?'停用':'启用'}</button></td></tr>`).join('');
    return `${pageHeader('子账号管理', '子账号只可查看销售单并扫码添加商品', `<button class="btn btn-primary" data-action="create-sub">+ 创建子账号</button>`)}
      ${table(['账号','姓名','权限','状态','操作'], rows)}`;
  }

  const PAGES = {
    home: pageHome, 'agent-l1': pageAgentL1, 'agent-l2': pageAgentL2, 'agent-bind': pageAgentBind,
    'agent-pending': pageAgentPending, sn: pageSN, product: pageProduct, purchase: pagePurchase,
    sales: pageSales, stock: pageStock, return: pageReturn, exception: pageException, stats: pageStats,
    role: pageRole, log: pageLog, 'agent-home': pageAgentHome, 'agent-purchase': pageAgentPurchase,
    'agent-sales': pageAgentSales, 'agent-stock': pageAgentStock, 'agent-bind-user': pageAgentBindUser,
    'agent-aftersale': pageAgentAftersale, 'agent-sub': pageAgentSub, 'agent-l2-mine': pageAgentL2,
  };

  /* ---------- Modals ---------- */
  function openModal(type, payload = {}) {
    ui.modal = { type, payload, step: payload.step || 1, draft: payload.draft || {} };
    render();
  }
  function closeModal() {
    ui.modal = null;
    render();
  }

  function modalContent() {
    if (!ui.modal) return '';
    const { type, payload, draft } = ui.modal;
    let title = '';
    let body = '';
    let foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="modal-ok">确定</button>`;

    if (type === 'edit-l1') {
      const a = payload.id ? db.agentsL1.find((x) => x.id === payload.id) : null;
      const occupied = occupiedMainAreas(a?.id);
      const avail = availableL1Areas(a?.id);
      title = a ? '编辑一级代理' : '新建一级代理';
      const main = draft.mainArea || a?.mainArea || '';
      const areas = draft.areas || a?.areas || (!a ? avail.slice() : []);
      body = `
        <div class="form-grid">
          <div class="form-field"><label>代理名称</label><input class="field-input" id="f-name" value="${escapeHtml(draft.name||a?.name||'')}" /></div>
          <div class="form-field"><label>联系人</label><input class="field-input" id="f-contact" value="${escapeHtml(draft.contact||a?.contact||'')}" /></div>
          <div class="form-field span-2"><label>主授权区域（互斥 · 已占用自动剔除）</label>
            <div class="chips" id="f-main">${avail.map((r)=>{
              const on = main===r;
              return `<button type="button" class="chip ${on?'on':''}" data-pick-main="${r}">${r}</button>`;
            }).join('')}${[...occupied].map((r)=>`<button type="button" class="chip" disabled style="opacity:.35" title="已被占用">${r}(已占用)</button>`).join('')}</div>
          </div>
          <div class="form-field span-2"><label>授权销售区域（默认全国可选，已扣占用主区）</label>
            <div class="chips" id="f-areas">${ALL_REGIONS.map((r)=>{
              const blocked = occupied.has(r) && main !== r;
              const on = areas.includes(r);
              return `<button type="button" class="chip ${on?'on':''}" data-toggle-area="${r}" ${blocked?'disabled style="opacity:.35"':''}>${r}${blocked?'(主区占用)':''}</button>`;
            }).join('')}</div>
            <p class="muted">新建时默认勾选全部可用区域（全国口径）；主授权区互斥占用。</p>
            ${!a ? `<button type="button" class="btn btn-sm" data-action="l1-select-national">一键选全国可用区</button>` : ''}
          </div>
        </div>`;
    }

    if (type === 'edit-l2') {
      const a = payload.id ? db.agentsL2.find((x) => x.id === payload.id) : null;
      const parentId = draft.parentId || a?.parentId || (ui.role==='l1'?currentL1Id(): db.agentsL1[0]?.id);
      const allowed = citiesForL1(parentId);
      const areas = draft.areas || a?.areas || [];
      title = a ? '编辑二级代理' : '新建二级代理';
      body = `
        <div class="form-grid">
          <div class="form-field"><label>二级名称</label><input class="field-input" id="f-name" value="${escapeHtml(draft.name||a?.name||'')}" /></div>
          <div class="form-field"><label>性质</label>
            <select class="field-input" id="f-type"><option value="法人" ${(draft.type||a?.type)==='法人'?'selected':''}>法人代理</option><option value="个人" ${(draft.type||a?.type)==='个人'?'selected':''}>个人代理</option></select>
          </div>
          ${ui.mode==='admin'?`<div class="form-field span-2"><label>所属一级</label>
            <select class="field-input" id="f-parent">${db.agentsL1.map(x=>`<option value="${x.id}" ${parentId===x.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select>
          </div>`:`<input type="hidden" id="f-parent" value="${parentId}" />`}
          <div class="form-field span-2"><label>代理协议（上传后校验性质）</label>
            <input class="field-input" id="f-file" type="file" accept=".pdf,.jpg,.png,.doc,.docx" />
            <p class="muted">文件名建议含「法人」或「个人」以便自动核对；也可手动确认下方勾选。</p>
            <label class="check-item" style="margin-top:8px"><input type="checkbox" id="f-protocol-ok" ${draft.protocolOk || a?.protocolOk ? 'checked' : ''}/> 已核对协议性质与所选一致</label>
          </div>
          <div class="form-field span-2"><label>授权销售区域（必须在一级范围内）</label>
            <div class="chips">${allowed.map((c)=>`<button type="button" class="chip ${areas.includes(c)?'on':''}" data-toggle-city="${c}">${c}</button>`).join('')||'<span class="err-text">一级无可用城市</span>'}</div>
            <p class="muted">允许：${allowed.join('、')||'无'}</p>
          </div>
        </div>`;
    }

    if (type === 'rebind') {
      const a = db.agentsL2.find((x) => x.id === payload.id);
      title = '绑定 / 调整一级代理';
      body = `
        <div class="form-field"><label>二级代理</label><input class="field-input" value="${escapeHtml(a?.name||'')}" disabled /></div>
        <div class="form-field"><label>绑定一级</label>
          <select class="field-input" id="f-parent">${db.agentsL1.map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join('')}</select>
        </div>
        <div class="alert alert-warn" style="margin-top:12px">修改后二级授权区域将清空，需由一级重新填写。</div>`;
    }

    if (type === 'import-sn') {
      title = '批量导入 SN 码';
      body = `
        <div class="form-field"><label>所属一级</label>
          <select class="field-input" id="f-l1">${db.agentsL1.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select>
        </div>
        <div class="form-field"><label>商品</label>
          <select class="field-input" id="f-pid">${db.products.filter(p=>p.status==='上架').map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select>
        </div>
        <div class="form-field"><label>尺码</label>
          <select class="field-input" id="f-size"><option>M</option><option>L</option><option>S</option><option>XL</option></select>
        </div>
        <div class="form-field"><label>起始序号（生成演示）</label><input class="field-input" id="f-start" value="1" /></div>
        <div class="form-field"><label>导入数量</label><input class="field-input" id="f-qty" value="10" /></div>
        <p class="muted">将生成 RL + 日期 + 序号 的 SN，状态为「待入库」，绑定所选一级与尺码。</p>`;
    }

    if (type === 'edit-product') {
      const p = payload.id ? db.products.find((x) => x.id === payload.id) : null;
      title = p ? '编辑商品' : '新建商品';
      body = `
        <div class="form-field"><label>商品名称</label><input class="field-input" id="f-name" value="${escapeHtml(p?.name||'')}" /></div>
        <div class="form-field"><label>规格尺码（逗号分隔）</label><input class="field-input" id="f-sizes" value="${escapeHtml((p?.sizes||['S','M','L']).join(','))}" /></div>`;
    }

    if (type === 'audit-po') {
      const p = db.purchases.find((x) => x.id === payload.id);
      title = '采购单号段审核';
      const rows = (p?.lines || []).map((l, idx) => `
        <div class="segment-row">
          <span>${productName(l.productId)} / ${l.size} ×${l.qty}</span>
          <input class="field-input seg-input" data-idx="${idx}" placeholder="如 RL202608010031-RL202608010040" />
          <span class="muted">需恰好 ${l.qty} 个SN</span>
          <span></span>
        </div>`).join('');
      body = `
        <div class="alert alert-info" style="margin-bottom:12px">${p?.no} · ${escapeHtml(l1Name(p?.l1Id))} · 提交时校验数量与号段匹配</div>
        <div class="segment-rows">${rows}</div>
        <button class="btn btn-sm" type="button" data-action="add-seg-hint">说明：每行可填多段，如 RL…001-005,RL…010-014</button>
        <div id="audit-err" class="err-text"></div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="confirm-audit-po" data-id="${p.id}">提交通过</button>`;
    }

    if (type === 'view-po' || type === 'view-so' || type === 'view-rt' || type === 'view-bind') {
      const d = payload.data || {};
      const field = (label, value, span2 = false) => `
        <div class="form-field${span2 ? ' span-2' : ''}">
          <label>${escapeHtml(label)}</label>
          <input class="field-input" readonly value="${escapeHtml(value ?? '—')}" />
        </div>`;
      const area = (label, html) => `
        <div class="form-field span-2">
          <label>${escapeHtml(label)}</label>
          <div class="detail-box">${html}</div>
        </div>`;

      if (type === 'view-po') {
        const stMap = { pending: '待审核', approved: '已通过', rejected: '已驳回' };
        const lines = (d.lines || []).map((l) => `${productName(l.productId)} / ${l.size} × ${l.qty}`).join('；') || '—';
        title = `采购单详情 · ${d.no || ''}`;
        body = `<div class="form-grid">
          ${field('采购单号', d.no)}
          ${field('状态', stMap[d.status] || d.status)}
          ${field('一级代理', l1Name(d.l1Id))}
          ${field('申请时间', d.createdAt)}
          ${field('商品明细', lines, true)}
          ${field('审核号段', (d.segments || []).join('；') || '—', true)}
        </div>`;
      } else if (type === 'view-so') {
        const stMap = { scanning: '扫码中', done: '已完成' };
        const sns = (d.scanned || []);
        title = `销售单详情 · ${d.no || ''}`;
        body = `<div class="form-grid">
          ${field('销售单号', d.no)}
          ${field('状态', stMap[d.status] || d.status)}
          ${field('一级代理', l1Name(d.l1Id))}
          ${field('二级代理', l2Name(d.l2Id))}
          ${field('计划数量', d.planTotal ?? (d.planned ? Object.values(d.planned).reduce((a, b) => a + b, 0) : '—'))}
          ${field('已扫数量', sns.length)}
          ${field('创建时间', d.createdAt, true)}
          ${area('扫码 SN 清单', sns.length
            ? `<div class="sn-list">${sns.map((sn) => `<div>${escapeHtml(sn)}</div>`).join('')}</div>`
            : '<span class="muted">暂无扫码记录</span>')}
        </div>`;
      } else if (type === 'view-rt') {
        const typeMap = { user: '用户退货', l2_to_l1: '二级退一级', l1_to_factory: '一级退原厂' };
        const stMap = { pending: '待审核', approved: '已通过', rejected: '已驳回' };
        title = `退货单详情 · ${d.no || ''}`;
        body = `<div class="form-grid">
          ${field('退货单号', d.no)}
          ${field('状态', stMap[d.status] || d.status)}
          ${field('类型', d.typeLabel || typeMap[d.type] || d.type)}
          ${field('发起方', d.fromName)}
          ${field('创建时间', d.createdAt, true)}
          ${area('退货 SN', (d.sns || []).length
            ? `<div class="sn-list">${(d.sns || []).map((sn) => `<div>${escapeHtml(sn)}</div>`).join('')}</div>`
            : '<span class="muted">无</span>')}
        </div>`;
      } else {
        // view-bind: SN row or tip object
        const sn = d.sn || '—';
        const user = d.user || null;
        const tip = d.tip || '';
        title = `用户绑定详情 · ${sn}`;
        body = `<div class="form-grid">
          ${tip ? `<div class="alert alert-info span-2" style="grid-column:1/-1;margin-bottom:4px">${escapeHtml(tip)}</div>` : ''}
          ${field('SN码', sn)}
          ${field('状态', d.status === 'bound' ? '已绑用户' : (d.reIn ? '再入库待绑' : (d.status || '—')))}
          ${field('一级代理', d.l1Id ? l1Name(d.l1Id) : '—')}
          ${field('二级代理', d.l2Id ? l2Name(d.l2Id) : '—')}
          ${field('商品', d.productId ? `${productName(d.productId)} / ${d.size || ''}` : '—')}
          ${field('绑定IP地区', d.bindIpRegion || '—')}
          ${field('手机号', user?.phone || '—')}
          ${field('手机归属地', user?.phoneLoc || '—')}
          ${field('用户地址', user?.addr || '—', true)}
          ${d.prevUser ? field('原绑定用户(归档)', `${d.prevUser.phone || ''} ${d.prevUser.addr || ''}`, true) : ''}
        </div>`;
      }
      foot = `<button class="btn btn-primary" data-action="close-modal">关闭</button>`;
    }

    if (type === 'ex-setting') {
      title = '库存异常标准设置';
      body = `<div class="form-field"><label>判断倍数参数</label><input class="field-input" id="f-mul" value="${db.exceptionMultiplier}" /></div>
        <p class="muted">销量 × 倍数 = 预警线；本次向二级新增库存超过预警线则通知一级与原厂。</p>`;
    }

    if (type === 'apply-po') {
      title = '新建采购申请';
      body = `
        <div class="form-field"><label>商品</label>
          <select class="field-input" id="f-pid">${db.products.filter(p=>p.status==='上架').map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select>
        </div>
        <div class="form-field"><label>尺码</label><select class="field-input" id="f-size"><option>M</option><option>L</option><option>S</option><option>XL</option></select></div>
        <div class="form-field"><label>数量</label><input class="field-input" id="f-qty" value="10" /></div>
        <button class="btn btn-sm" data-action="add-po-line">+ 添加到明细</button>
        <div class="sn-list" id="po-lines">${(draft.lines||[]).map((l,i)=>`<div>${productName(l.productId)} / ${l.size} × ${l.qty}<button class="btn btn-sm" data-action="rm-po-line" data-i="${i}">删</button></div>`).join('')||'<div class="muted" style="padding:8px">尚未添加明细</div>'}</div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="submit-po">提交审批</button>`;
    }

    if (type === 'create-so' || type === 'continue-so') {
      const so = payload.id ? db.sales.find((x) => x.id === payload.id) : null;
      title = so ? `销售单扫码 · ${so.no}` : '创建销售单';
      const scanned = draft.scanned || so?.scanned || [];
      const l2s = db.agentsL2.filter((a) => a.parentId === currentL1Id() && !a.pending);
      const step = ui.modal.step || 1;
      body = `
        <div class="wizard-steps">
          <div class="wizard-step ${step>=1?'on':''}"><span class="n">1</span>选择二级</div>
          <div class="wizard-step ${step>=2?'on':''}"><span class="n">2</span>扫码添加</div>
          <div class="wizard-step ${step>=3?'on':''}"><span class="n">3</span>核对确认</div>
        </div>
        ${step===1?`
          <div class="form-field"><label>二级代理</label>
            <select class="field-input" id="f-l2">${l2s.map(a=>`<option value="${a.id}" ${ (draft.l2Id||so?.l2Id)===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>计划数量（总计）</label><input class="field-input" id="f-plan" value="${draft.planTotal||so?.planTotal||10}" /></div>
          <div class="form-field span-2"><label>按尺码计划（可选，填写后确认时严格校验）</label>
            <div class="size-plan">${['S','M','L','XL'].map((sz)=>`<label class="size-plan-item">尺码 ${sz}<input class="field-input plan-size" data-size="${sz}" value="${(draft.planBySize||so?.planBySize||{})[sz]||''}" placeholder="0" style="width:72px" /></label>`).join('')}</div>
          </div>
          ${ui.role==='sub'?'<div class="err-text">子账号不能新建，只能继续已有扫码中单据</div>':''}
        `:''}
        ${step===2?`
          <div class="form-field"><label>扫码 / 输入 SN（回车添加）</label>
            <input class="field-input" id="f-sn-scan" placeholder="例如仓库中的 RL202608010001" /></div>
          <div class="sn-list">${scanned.map(sn=>`<div>${sn}<button class="btn btn-sm" data-action="rm-scan" data-sn="${sn}">移除</button></div>`).join('')||'<div class="muted" style="padding:8px">尚未扫码</div>'}</div>
          <p class="muted">已扫 ${scanned.length}${so||draft.planTotal?` / 计划 ${draft.planTotal||so?.planTotal}`:''}</p>
        `:''}
        ${step===3?`
          <div class="alert alert-info">核对各尺码数量后确认：SN 从一级转入二级，并按「区间销量×倍数」检测销售库存异常。</div>
          <div class="sn-list">${(() => {
            const map={}; scanned.forEach(sn=>{const s=db.sns.find(x=>x.sn===sn); if(!s)return; const k=s.size; map[k]=(map[k]||0)+1;});
            const plan = draft.planBySize || {};
            return Object.keys({ ...map, ...plan }).sort().map((k)=>{
              const got = map[k]||0; const need = plan[k];
              const ok = need===undefined || need==='' || Number(need)===got;
              return `<div>尺码 ${k}<span>${got} 件${need!==undefined&&need!==''?` / 计划 ${need}`:''} ${ok?'':'⚠'}</span></div>`;
            }).join('')||'<div>无</div>';
          })()}</div>
        `:''}`;
      if (step === 1) foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="so-next" ${ui.role==='sub' && !so?'disabled':''}>下一步</button>`;
      if (step === 2) foot = `<button class="btn" data-action="so-prev">上一步</button><button class="btn btn-primary" data-action="so-next">去核对</button>`;
      if (step === 3) foot = `<button class="btn" data-action="so-prev">上一步</button>${ui.role==='sub'?'<span class="muted">子账号不可最终确认</span>':`<button class="btn btn-primary" data-action="confirm-so">确认完成销售单</button>`}`;
    }

    if (type === 'bind-user') {
      const step = ui.modal.step || 1;
      title = '扫码绑定用户';
      body = `
        <div class="wizard-steps">
          <div class="wizard-step ${step>=1?'on':''}"><span class="n">1</span>扫SN</div>
          <div class="wizard-step ${step>=2?'on':''}"><span class="n">2</span>IP校验</div>
          <div class="wizard-step ${step>=3?'on':''}"><span class="n">3</span>用户信息</div>
        </div>
        ${step===1?`<div class="form-field"><label>SN码</label><input class="field-input" id="f-sn" placeholder="输入在库二级或再入库SN" value="${escapeHtml(draft.sn||'')}" /></div>
          <p class="muted">当前演示IP地区：<b>${db.demoIpRegion}</b>（可在页面上改）</p>`:''}
        ${step===2?`<div class="alert alert-warn">检测到 IP 区域 <b>${db.demoIpRegion}</b>，授权区域为 <b>${escapeHtml((draft.authAreas||[]).join('、'))}</b>。
          ${draft.ipOk?'在授权范围内。':'不在授权范围内！继续将记录IP；取消则不记录IP并退出。'}</div>`:''}
        ${step===3?`
          <div class="form-field"><label>手机号</label><input class="field-input" id="f-phone" placeholder="前3位决定归属地演示 138浙江/139广东..." value="${escapeHtml(draft.phone||'')}" /></div>
          <div class="form-field"><label>用户地址（含省名）</label><input class="field-input" id="f-addr" placeholder="如：浙江省杭州市..." value="${escapeHtml(draft.addr||'')}" /></div>
          <p class="muted">将识别手机归属地，并与地址校验；不匹配则写入异常销售预警。</p>`:''}`;
      if (step === 1) foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="bind-next">下一步</button>`;
      if (step === 2) foot = `<button class="btn" data-action="bind-cancel-ip">取消绑定</button><button class="btn btn-primary" data-action="bind-confirm-ip">确认继续</button>`;
      if (step === 3) foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="bind-save">保存绑定</button>`;
    }

    if (type === 'user-return') {
      title = '用户退货登记';
      body = `
        <div class="form-field"><label>退货 SN（已绑用户）</label><input class="field-input" id="f-sn" placeholder="RL..." /></div>
        <div class="alert alert-info">确认后：保留原用户到归档，商品标记再入库进入当前库存；再次扫码绑定将隐藏原用户信息。</div>`;
    }

    if (type === 'agent-return') {
      title = '发起代理退货审批';
      body = `
        <div class="form-field"><label>退货 SN（当前在库）</label><input class="field-input" id="f-sn" /></div>
        <p class="muted">${ui.role==='l2'?'将提交一级审批，通过后库存退回一级。':'将提交原厂审批，通过后库存退回原厂。'}</p>`;
    }

    if (type === 'create-sub') {
      title = '创建子账号';
      body = `
        <div class="form-field"><label>账号</label><input class="field-input" id="f-user" placeholder="scan_xx" /></div>
        <div class="form-field"><label>姓名</label><input class="field-input" id="f-name" /></div>
        <p class="muted">权限固定：仅销售单查看与扫码加商品。</p>`;
    }

    if (type === 'edit-role') {
      const r = payload.id ? db.roles.find((x) => x.id === payload.id) : null;
      title = r ? '配置角色权限' : '新建角色';
      const allPerms = ['all','purchase','sales','sales_scan','sales_view','stock','stock_self','l2','bind','aftersale','sub','exception','stats'];
      const perms = draft.perms || r?.perms || [];
      body = `
        <div class="form-field"><label>角色名</label><input class="field-input" id="f-name" value="${escapeHtml(r?.name||draft.name||'')}" /></div>
        <div class="form-field"><label>说明</label><input class="field-input" id="f-desc" value="${escapeHtml(r?.desc||'')}" /></div>
        <div class="check-grid">${allPerms.map(p=>`<label class="check-item"><input type="checkbox" data-perm="${p}" ${perms.includes(p)?'checked':''}/> ${p}</label>`).join('')}</div>`;
    }

    if (type === 'stock-hist') {
      title = '库存历史过程';
      const logs = db.stockLogs.filter((h) => h.agentType === payload.type && h.agentId === payload.id && h.productId === payload.pid && h.size === payload.size);
      body = table(['时间','变动','原因','关联单'], logs.map((h)=>`<tr><td class="num">${escapeHtml(h.time)}</td><td class="num">${h.delta>0?'+':''}${h.delta}</td><td>${escapeHtml(h.reason)}</td><td class="num">${escapeHtml(h.ref||'')}</td></tr>`).join('')) 
        + `<p class="muted" style="margin-top:8px">${escapeHtml(productName(payload.pid))} / ${payload.size}</p>`;
      foot = `<button class="btn btn-primary" data-action="close-modal">关闭</button>`;
    }

    if (!title) return '';
    return `<div class="modal-mask" id="modal-mask"><div class="modal" id="modal-box" role="dialog">
      <div class="modal-hd"><span>${title}</span><button class="btn btn-sm btn-ghost" data-action="close-modal">关闭</button></div>
      <div class="modal-bd">${body}</div>
      <div class="modal-ft">${foot}</div>
    </div></div>`;
  }

  /* ---------- Business actions ---------- */
  function saveL1() {
    const name = $('#f-name')?.value.trim();
    const contact = $('#f-contact')?.value.trim();
    const mainArea = ui.modal.draft.mainArea;
    const areas = ui.modal.draft.areas || [];
    if (!name || !mainArea || !areas.length) return toast('请完整填写名称、主授权区与授权区域', 'err');
    if (occupiedMainAreas(ui.modal.payload.id).has(mainArea)) return toast('主授权区域已被其他一级占用', 'err');
    if (!areas.includes(mainArea)) areas.push(mainArea);
    // remove occupied mains from areas except own main
    const occ = occupiedMainAreas(ui.modal.payload.id);
    const cleanAreas = areas.filter((r) => r === mainArea || !occ.has(r));
    if (ui.modal.payload.id) {
      const a = db.agentsL1.find((x) => x.id === ui.modal.payload.id);
      Object.assign(a, { name, contact, mainArea, areas: cleanAreas });
      addLog(`编辑一级代理 ${name}`);
      // simulate region shrink effects on L2
      applyL1AreaChange(a.id);
    } else {
      db.agentsL1.push({
        id: uid('L1'), code: `AG-L1-${String(db.agentsL1.length + 1).padStart(3, '0')}`,
        name, contact, mainArea, areas: cleanAreas, status: '启用',
      });
      addLog(`创建一级代理 ${name}`);
    }
    saveStore();
    closeModal();
    toast('一级代理已保存');
  }

  function applyL1AreaChange(l1Id) {
    const l1 = db.agentsL1.find((a) => a.id === l1Id);
    const allowedCities = new Set(citiesForL1(l1Id));
    db.agentsL2.filter((a) => a.parentId === l1Id && !a.pending).forEach((a) => {
      const remain = (a.areas || []).filter((c) => allowedCities.has(c));
      if (remain.length === 0) {
        if (a.type === '法人') {
          a.prevParentId = a.parentId;
          a.prevAreas = a.areas.slice();
          a.parentId = null;
          a.areas = [];
          a.pending = true;
          addLog(`法人二级 ${a.name} 因区域撤销进入待分配`);
        } else {
          // personal keep bind and areas, lock note
          a.areaLocked = true;
          addLog(`个人二级 ${a.name} 保留绑定，区域不可再改`);
        }
      } else {
        a.areas = remain;
      }
    });
  }

  function saveL2() {
    const name = $('#f-name')?.value.trim();
    const type = $('#f-type')?.value;
    const parentId = $('#f-parent')?.value;
    const areas = ui.modal.draft.areas || [];
    const file = $('#f-file')?.files?.[0];
    const protocolOk = $('#f-protocol-ok')?.checked;
    if (!name || !parentId || !areas.length) return toast('请填写名称、一级与授权区域', 'err');
    if (!file && !ui.modal.payload.id) return toast('请上传代理协议以核对性质', 'err');
    // 协议性质核对：文件名含法人/个人，或手动勾选确认
    if (file) {
      const fn = file.name;
      const hintCorp = /法人|公司|enterprise/i.test(fn);
      const hintPerson = /个人|个体|personal/i.test(fn);
      if (hintCorp && type !== '法人') return toast('协议文件名偏向「法人」，与所选性质不符', 'err');
      if (hintPerson && type !== '个人') return toast('协议文件名偏向「个人」，与所选性质不符', 'err');
      if (!hintCorp && !hintPerson && !protocolOk) {
        return toast('未能从协议识别性质，请勾选「已核对协议性质」', 'err');
      }
    } else if (!ui.modal.payload.id && !protocolOk) {
      return toast('请上传协议或勾选已核对性质', 'err');
    }
    const allowed = new Set(citiesForL1(parentId));
    const illegal = areas.filter((c) => !allowed.has(c));
    if (illegal.length) return toast(`授权区域超出一级范围：${illegal.join('、')}`, 'err');
    const existing = ui.modal.payload.id ? db.agentsL2.find((x) => x.id === ui.modal.payload.id) : null;
    if (existing?.areaLocked && existing.type === '个人') {
      if (JSON.stringify(areas) !== JSON.stringify(existing.areas)) return toast('个人二级在一级撤区后授权区域不得修改', 'err');
    }
    if (existing) {
      Object.assign(existing, { name, type, parentId, areas, pending: false, protocolOk: true, protocolName: file?.name || existing.protocolName });
      addLog(`编辑二级代理 ${name}（协议性质已核）`);
    } else {
      db.agentsL2.push({
        id: uid('L2'), code: `AG-L2-${String(db.agentsL2.length + 101)}`,
        name, type, parentId, areas, status: '启用', pending: false, protocolOk: true, protocolName: file?.name || '',
      });
      addLog(`创建二级代理 ${name}（协议性质已核）`);
    }
    saveStore();
    closeModal();
    toast('二级代理已保存，协议性质已核对');
  }

  function doRebind() {
    const a = db.agentsL2.find((x) => x.id === ui.modal.payload.id);
    const parentId = $('#f-parent')?.value;
    if (!a || !parentId) return;
    a.parentId = parentId;
    a.areas = [];
    a.pending = false;
    a.areaLocked = false;
    addLog(`二级 ${a.name} 改绑至 ${l1Name(parentId)}，区域待重填`);
    saveStore();
    closeModal();
    toast('已改绑，请一级重新填写授权区域');
    ui.route = 'agent-l2';
  }

  function doImportSn() {
    const l1Id = $('#f-l1')?.value;
    const productId = $('#f-pid')?.value;
    const size = $('#f-size')?.value;
    const start = parseInt($('#f-start')?.value || '1', 10);
    const qty = parseInt($('#f-qty')?.value || '0', 10);
    if (!qty || qty < 1) return toast('数量无效', 'err');
    const batch = String(db.seq.snBatch++).padStart(2, '0');
    let added = 0;
    for (let i = 0; i < qty; i++) {
      const sn = `RL${todayCompact()}${batch}${String(start + i).padStart(4, '0')}`;
      if (db.sns.some((s) => s.sn === sn)) continue;
      db.sns.push({ sn, productId, size, l1Id, l2Id: null, status: 'warehouse', user: null, prevUser: null, reIn: false, resale: false, bindAt: null, bindIpRegion: null });
      added++;
    }
    addLog(`导入SN ${added} 条 → ${l1Name(l1Id)} / ${size}`);
    saveStore();
    closeModal();
    toast(`成功导入 ${added} 条 SN`);
  }

  function confirmAuditPo(id) {
    const p = db.purchases.find((x) => x.id === id);
    if (!p) return;
    const inputs = [...document.querySelectorAll('.seg-input')];
    const allSn = [];
    const errBox = document.getElementById('audit-err');
    for (let i = 0; i < p.lines.length; i++) {
      const line = p.lines[i];
      const seg = inputs[i]?.value.trim();
      const list = parseSegment(seg || '');
      if (!list) {
        if (errBox) errBox.textContent = `第 ${i + 1} 行号段格式错误`;
        return toast('号段格式错误', 'err');
      }
      if (list.length !== line.qty) {
        if (errBox) errBox.textContent = `${line.size} 号段数量 ${list.length} ≠ 采购数量 ${line.qty}`;
        return toast('数量与号段不匹配', 'err');
      }
      for (const sn of list) {
        const row = db.sns.find((s) => s.sn === sn);
        if (!row) {
          if (errBox) errBox.textContent = `SN ${sn} 不存在，请先导入`;
          return toast(`SN不存在: ${sn}`, 'err');
        }
        if (row.l1Id !== p.l1Id) {
          if (errBox) errBox.textContent = `${sn} 未绑定该一级代理`;
          return toast('SN未绑定该一级', 'err');
        }
        if (row.productId !== line.productId || row.size !== line.size) {
          if (errBox) errBox.textContent = `${sn} 商品/尺码不匹配`;
          return toast('商品尺码不匹配', 'err');
        }
        if (row.status !== 'warehouse' && row.status !== 'factory') {
          if (errBox) errBox.textContent = `${sn} 状态不可入库(${row.status})`;
          return toast('SN状态不可入库', 'err');
        }
      }
      allSn.push({ line, list });
    }
    allSn.forEach(({ line, list }) => {
      list.forEach((sn) => {
        const row = db.sns.find((s) => s.sn === sn);
        row.status = 'l1';
        row.l2Id = null;
        row.reIn = false;
      });
      db.stockLogs.unshift({
        id: uid('H'), agentType: 'l1', agentId: p.l1Id, productId: line.productId, size: line.size,
        delta: list.length, reason: '采购入库', time: nowStr(), ref: p.no,
      });
    });
    p.status = 'approved';
    p.segments = inputs.map((x) => x.value.trim());
    addLog(`审核通过采购单 ${p.no}`);
    saveStore();
    closeModal();
    toast('审核通过，已入库一级库存');
  }

  function checkSalesStockException(l1Id, l2Id, incomingBySize) {
    // 需求：上次新增库存 → 本次新增库存期间的销量(单尺码) × 倍数 = 预警线
    // 调用时机：本次销售转入流水已写入，故最新一条入库为本次，上一条为「上次」
    Object.entries(incomingBySize).forEach(([key, qty]) => {
      const [productId, size] = key.split('_');
      const inboundLogs = db.stockLogs
        .filter((h) => h.agentType === 'l2' && h.agentId === l2Id && h.productId === productId && h.size === size
          && h.delta > 0 && (h.reason.includes('销售转入') || h.reason.includes('入库')))
        .sort((a, b) => parseTime(b.time) - parseTime(a.time));
      const thisInboundTime = inboundLogs[0] ? parseTime(inboundLogs[0].time) : Date.now();
      const lastInboundTime = inboundLogs.length > 1 ? parseTime(inboundLogs[1].time) : 0;
      const sold = db.stockLogs.filter((h) =>
        h.agentType === 'l2' && h.agentId === l2Id && h.productId === productId && h.size === size
        && h.delta < 0 && parseTime(h.time) >= lastInboundTime && parseTime(h.time) <= thisInboundTime
        && !String(h.ref || '').includes(inboundLogs[0]?.ref || '__none__')
      ).reduce((s, h) => s + Math.abs(h.delta), 0);
      const line = sold * db.exceptionMultiplier;
      if (qty > line) {
        pushException('销售库存异常', `${l2Name(l2Id)} · ${productName(productId)}${size}`,
          `本次新增 ${qty} > 预警线 ${line.toFixed(1)}（区间销量 ${sold} × ${db.exceptionMultiplier}，自上次入库起）`);
        addLog(`触发销售库存异常预警 ${l2Name(l2Id)} ${size}`);
      }
    });
  }

  function confirmSo() {
    const draft = ui.modal.draft;
    const scanned = draft.scanned || [];
    if (!scanned.length) return toast('请先扫码', 'err');
    if (draft.planTotal && scanned.length !== Number(draft.planTotal)) {
      return toast(`数量不一致：已扫 ${scanned.length} ≠ 计划 ${draft.planTotal}`, 'err');
    }
    const l2Id = draft.l2Id;
    const l1Id = currentL1Id();
    const incoming = {};
    const bySize = {};
    for (const sn of scanned) {
      const row = db.sns.find((s) => s.sn === sn);
      if (!row || row.l1Id !== l1Id || row.status !== 'l1') return toast(`SN不可销售: ${sn}`, 'err');
      incoming[`${row.productId}_${row.size}`] = (incoming[`${row.productId}_${row.size}`] || 0) + 1;
      bySize[row.size] = (bySize[row.size] || 0) + 1;
    }
    // 按尺码校验计划数量
    const planBySize = draft.planBySize || {};
    const planSizes = Object.keys(planBySize).filter((k) => Number(planBySize[k]) > 0);
    if (planSizes.length) {
      for (const size of planSizes) {
        const need = Number(planBySize[size]) || 0;
        const got = bySize[size] || 0;
        if (got !== need) return toast(`尺码 ${size} 数量不符：已扫 ${got} ≠ 计划 ${need}`, 'err');
      }
      for (const size of Object.keys(bySize)) {
        if (!planSizes.includes(size)) return toast(`存在未计划尺码 ${size}（已扫 ${bySize[size]}）`, 'err');
      }
    }
    scanned.forEach((sn) => {
      const row = db.sns.find((s) => s.sn === sn);
      row.status = 'l2';
      row.l2Id = l2Id;
    });
    Object.entries(incoming).forEach(([key, qty]) => {
      const [productId, size] = key.split('_');
      db.stockLogs.unshift({ id: uid('H'), agentType: 'l1', agentId: l1Id, productId, size, delta: -qty, reason: '销售出库', time: nowStr(), ref: draft.no });
      db.stockLogs.unshift({ id: uid('H'), agentType: 'l2', agentId: l2Id, productId, size, delta: qty, reason: '销售转入', time: nowStr(), ref: draft.no });
    });
    checkSalesStockException(l1Id, l2Id, incoming);
    let so = draft.id ? db.sales.find((x) => x.id === draft.id) : null;
    if (so) {
      so.scanned = scanned.slice();
      so.status = 'done';
      so.l2Id = l2Id;
      so.planTotal = draft.planTotal;
      so.planBySize = { ...(draft.planBySize || {}) };
    } else {
      so = {
        id: uid('SO'), no: `SO${todayCompact()}${String(db.seq.so++).padStart(3, '0')}`,
        l1Id, l2Id, scanned: scanned.slice(), planTotal: draft.planTotal,
        planBySize: { ...(draft.planBySize || {}) }, status: 'done', createdAt: nowStr(),
      };
      db.sales.unshift(so);
    }
    addLog(`完成销售单 ${so.no} → ${l2Name(l2Id)}`);
    saveStore();
    closeModal();
    toast('销售单完成，库存已转移');
  }

  function bindNextFromSn() {
    const sn = ($('#f-sn')?.value || ui.modal.draft.sn || '').trim().toUpperCase();
    const row = db.sns.find((s) => s.sn === sn);
    if (!row) return toast('SN不存在', 'err');
    // must be at current agent stock
    if (ui.role === 'l2') {
      if (row.l2Id !== currentL2Id() || (row.status !== 'l2' && !(row.reIn && row.status !== 'bound'))) {
        if (!(row.l2Id === currentL2Id() && (row.status === 'l2' || row.reIn))) return toast('SN不在当前二级可绑库存', 'err');
      }
      if (row.status === 'bound' && !row.reIn) return toast('该SN已绑定用户；若未退货再次扫码应展示用户信息', 'warn');
    } else {
      if (!row.l2Id || row.l1Id !== currentL1Id()) return toast('请使用已分到二级的SN进行用户绑定', 'err');
    }
    if (row.status === 'bound' && !row.reIn) {
      openModal('view-bind', { data: { sn: row.sn, user: row.user, tip: '未产生退货记录，展示当前绑定用户' } });
      return;
    }
    if (row.reIn && !row.resale) {
      return toast('该SN退货再入库后，请先在售后管理「标记再销售」', 'err');
    }
    const agent = ui.role === 'l2'
      ? db.agentsL2.find((a) => a.id === currentL2Id())
      : db.agentsL2.find((a) => a.id === row.l2Id);
    const l1 = db.agentsL1.find((a) => a.id === row.l1Id);
    // auth: l2 uses areas (city->province rough), l1 uses mainArea when still at l1 - but bind is after sales so l2
    let authAreas = [];
    if (agent) {
      // map city to province
      authAreas = Object.entries(CITY_MAP).filter(([, cities]) => cities.some((c) => (agent.areas || []).includes(c))).map(([p]) => p);
      if (!authAreas.length) authAreas = l1 ? [l1.mainArea, ...l1.areas] : [];
    } else if (l1) authAreas = [l1.mainArea];
    const ipOk = authAreas.includes(db.demoIpRegion);
    ui.modal.draft = { ...ui.modal.draft, sn, authAreas, ipOk, rowId: sn };
    ui.modal.step = 2;
    render();
  }

  function bindSave() {
    const phone = $('#f-phone')?.value.trim();
    const addr = $('#f-addr')?.value.trim();
    if (!phone || !addr) return toast('请填写手机号与地址', 'err');
    const loc = PHONE_LOC[phone.slice(0, 3)] || '未知';
    const row = db.sns.find((s) => s.sn === ui.modal.draft.sn);
    const wasResale = !!row.reIn || !!row.resale;
    row.user = { phone, addr, phoneLoc: loc };
    row.prevUser = null;
    row.status = 'bound';
    row.reIn = false;
    row.resale = false;
    row.bindAt = nowStr();
    row.bindIpRegion = db.demoIpRegion;
    let warn = false;
    if (!ui.modal.draft.ipOk) {
      pushException('SN激活异常', row.sn,
        `跨区激活：IP ${db.demoIpRegion} 不在授权区 ${(ui.modal.draft.authAreas || []).join('、') || '—'}`);
      warn = true;
    }
    if (!addr.includes(loc) && loc !== '未知') {
      pushException('归属地异常', row.sn, `手机归属${loc} · 地址「${addr}」不匹配`);
      warn = true;
    }
    db.stockLogs.unshift({
      id: uid('H'), agentType: 'l2', agentId: row.l2Id, productId: row.productId, size: row.size,
      delta: -1, reason: wasResale ? '再销售绑定出库' : '用户绑定出库(销量)', time: nowStr(), ref: row.sn,
    });
    addLog(`绑定用户 ${row.sn}${wasResale ? '（再销售）' : ''}${!ui.modal.draft.ipOk ? '（跨区激活）' : ''}`);
    saveStore();
    closeModal();
    toast(warn ? '已绑定，已写入异常预警' : (wasResale ? '再销售绑定成功' : '用户绑定成功'), warn ? 'warn' : undefined);
  }

  function doUserReturn() {
    const sn = $('#f-sn')?.value.trim().toUpperCase();
    const row = db.sns.find((s) => s.sn === sn);
    if (!row || row.status !== 'bound') return toast('请输入已绑用户的SN', 'err');
    if (ui.role === 'l2' && row.l2Id !== currentL2Id()) return toast('非本渠道销售SN', 'err');
    row.prevUser = row.user;
    row.user = null;
    row.reIn = true;
    row.resale = false;
    row.status = 'l2';
    row.bindAt = null;
    const no = `RTU${todayCompact()}${String(db.seq.rt++).padStart(2, '0')}`;
    db.returns.unshift({
      id: uid('RT'), no, type: 'user', typeLabel: '用户退货再入库',
      fromId: row.l2Id, fromName: l2Name(row.l2Id), sns: [sn], status: 'approved', createdAt: nowStr(), resaleReady: false,
    });
    db.stockLogs.unshift({ id: uid('H'), agentType: 'l2', agentId: row.l2Id, productId: row.productId, size: row.size, delta: 1, reason: '用户退货再入库', time: nowStr(), ref: no });
    addLog(`用户退货 ${sn}`);
    saveStore();
    closeModal();
    toast('已再入库，请在售后中「标记再销售」后可再次绑定');
  }

  function doAgentReturn() {
    const sn = $('#f-sn')?.value.trim().toUpperCase();
    const row = db.sns.find((s) => s.sn === sn);
    if (!row) return toast('SN不存在', 'err');
    const no = `RT${todayCompact()}${String(db.seq.rt++).padStart(2, '0')}`;
    if (ui.role === 'l2') {
      if (row.l2Id !== currentL2Id() || (row.status !== 'l2' && !row.reIn)) return toast('SN不在本二级库存', 'err');
      db.returns.unshift({
        id: uid('RT'), no, type: 'l2_to_l1', typeLabel: '二级退一级',
        fromId: currentL2Id(), fromName: l2Name(currentL2Id()), approverId: currentL1Id(),
        sns: [sn], status: 'pending', createdAt: nowStr(),
      });
      addLog(`发起二级退货 ${sn}`);
      toast('已提交一级审批');
    } else {
      if (row.l1Id !== currentL1Id() || row.status !== 'l1') return toast('SN不在本一级库存', 'err');
      db.returns.unshift({
        id: uid('RT'), no, type: 'l1_to_factory', typeLabel: '一级退原厂',
        fromId: currentL1Id(), fromName: l1Name(currentL1Id()),
        sns: [sn], status: 'pending', createdAt: nowStr(),
      });
      addLog(`发起一级退货 ${sn}`);
      toast('已提交原厂审批');
    }
    saveStore();
    closeModal();
  }

  function approveReturn(id) {
    const r = db.returns.find((x) => x.id === id);
    if (!r || r.status !== 'pending') return;
    r.sns.forEach((sn) => {
      const row = db.sns.find((s) => s.sn === sn);
      if (!row) return;
      if (r.type === 'l2_to_l1') {
        row.status = 'l1';
        row.l2Id = null;
        row.reIn = false;
        db.stockLogs.unshift({ id: uid('H'), agentType: 'l2', agentId: r.fromId, productId: row.productId, size: row.size, delta: -1, reason: '退货出库至一级', time: nowStr(), ref: r.no });
        db.stockLogs.unshift({ id: uid('H'), agentType: 'l1', agentId: row.l1Id, productId: row.productId, size: row.size, delta: 1, reason: '二级退货入库', time: nowStr(), ref: r.no });
      }
      if (r.type === 'l1_to_factory') {
        row.status = 'factory';
        db.stockLogs.unshift({ id: uid('H'), agentType: 'l1', agentId: r.fromId, productId: row.productId, size: row.size, delta: -1, reason: '退货回原厂', time: nowStr(), ref: r.no });
      }
    });
    r.status = 'approved';
    addLog(`退货审批通过 ${r.no}`);
    saveStore();
    toast('已通过，库存已回退');
    render();
  }

  /* ---------- Render shell ---------- */
  function $(sel) { return document.querySelector(sel); }

  function renderLogin() {
    return `<div class="login-wrap"><div class="login-card">
      <div class="login-brand"><img src="assets/logo.svg" alt="" /><h1>锐涞经销商管理系统</h1></div>
      <p class="login-sub">可走查完整交互原型 · 数据保存在浏览器本地</p>
      <div class="form-field"><label>登录身份</label>
        <div class="role-pills">
          ${[['admin','平台管理员'],['l1','一级代理'],['l2','二级代理'],['sub','一级子账号']].map(([k,t])=>
            `<button type="button" class="role-pill ${ui.role===k?'active':''}" data-role="${k}">${t}</button>`).join('')}
        </div>
      </div>
      <div class="form-field"><label>账号</label><input value="${ROLES[ui.role]?.account||''}" readonly /></div>
      <div class="form-field"><label>密码</label><input type="password" value="******" readonly /></div>
      <button class="btn btn-primary btn-block" id="btn-login">进入系统</button>
      <button class="btn btn-block" data-action="reset-demo" style="margin-top:8px">重置演示数据</button>
    </div></div>`;
  }

  function renderApp() {
    const menus = filterMenusByPerm(ui.mode === 'admin' ? adminMenus() : agentMenus());
    const title = TITLES[ui.route] || '页面';
    const pageFn = PAGES[ui.route] || (ui.mode === 'admin' ? pageHome : pageAgentHome);
    const role = ROLES[ui.role];
    const notes = db.notifications || [];
    const unread = notes.filter((n) => !n.read).length;
    return `<div class="app-bg"><div class="canvas">
      <header class="topbar">
        <div class="brand" data-go="${ui.mode==='admin'?'home':'agent-home'}"><img src="assets/logo.svg" alt="" /><span>锐涞经销商管理系统</span></div>
        <div class="topbar-right">
          <div class="mode-switch">
            <button type="button" class="${ui.mode==='admin'?'active':''}" data-mode="admin" ${ui.role!=='admin'?'':''}>管理后台</button>
            <button type="button" class="${ui.mode==='agent'?'active':''}" data-mode="agent">代理前端</button>
          </div>
          <div class="notify-wrap">
            <button type="button" class="notify-btn" data-action="toggle-notify" title="消息通知">🔔${unread?`<span class="notify-badge">${unread}</span>`:''}</button>
            ${ui.notifyOpen ? `<div class="notify-panel">
              <div class="notify-hd"><strong>通知中心</strong><button class="btn btn-sm" data-action="mark-all-read">全部已读</button></div>
              ${notes.slice(0, 20).map((n)=>`<button type="button" class="notify-item ${n.read?'':'unread'}" data-action="read-notify" data-id="${n.id}">
                <div class="notify-title">${escapeHtml(n.title)}</div>
                <div class="notify-body">${escapeHtml(n.body)}</div>
                <div class="notify-meta">${escapeHtml(n.time)} · ${escapeHtml(n.to||'')}</div>
              </button>`).join('') || '<div class="empty-hint" style="padding:16px">暂无通知</div>'}
            </div>` : ''}
          </div>
          <div class="user" data-action="logout" title="退出"><span class="user-avatar">${role.avatar}</span><span class="user-name">${role.name}</span></div>
        </div>
      </header>
      <div class="panel">
        <aside class="sidebar"><div class="sidebar-scroll">
          ${menus.map((g)=>`<div class="nav-group-title">${g.group}</div>${g.items.map((it)=>
            `<button class="nav-item ${ui.route===it.id?'active':''}" data-go="${it.id}"><span class="icon">${it.icon}</span><span>${it.title}</span></button>`).join('')}`).join('')}
        </div>
        <button class="sidebar-foot" data-action="logout">退出登录</button></aside>
        <main class="content">
          <div class="content-bar"><span>首页</span><span class="sep">/</span><strong>${escapeHtml(title)}</strong></div>
          <div class="content-body"><div class="page page--scroll">${pageFn()}</div></div>
        </main>
      </div>
    </div>
    ${modalContent()}
    <div class="toast-wrap">${ui.toast?`<div class="toast ${ui.toast.kind}">${escapeHtml(ui.toast.msg)}</div>`:''}</div>
    </div>`;
  }

  function render() {
    document.getElementById('app').innerHTML = ui.loggedIn ? renderApp() : renderLogin();
    bindEvents();
  }

  function navigate(id) {
    if (!PAGES[id]) return;
    // role guards
    if (ui.mode === 'agent') {
      if (ui.role === 'l2' && ['agent-purchase','agent-sub','agent-l2-mine'].includes(id)) return toast('二级代理无此菜单权限', 'err');
      if (ui.role === 'sub' && !['agent-home','agent-sales'].includes(id)) return toast('子账号仅可访问销售扫码', 'err');
    }
    ui.route = id;
    location.hash = id;
    ui.modal = null;
    render();
  }

  function bindEvents() {
    document.querySelectorAll('[data-role]').forEach((el) => el.addEventListener('click', () => {
      ui.role = el.getAttribute('data-role');
      sessionStorage.setItem('ruilai_role', ui.role);
      render();
    }));
    $('#btn-login')?.addEventListener('click', () => {
      ui.loggedIn = true;
      sessionStorage.setItem('ruilai_logged', '1');
      ui.mode = ui.role === 'admin' ? 'admin' : 'agent';
      sessionStorage.setItem('ruilai_mode', ui.mode);
      ui.route = ui.mode === 'admin' ? 'home' : 'agent-home';
      location.hash = ui.route;
      addLog('登录系统', 'login');
      toast(`已以 ${ROLES[ui.role].name} 登录`);
      render();
    });
    document.querySelectorAll('[data-mode]').forEach((el) => el.addEventListener('click', () => {
      const mode = el.getAttribute('data-mode');
      if (mode === 'admin' && ui.role !== 'admin') {
        // allow peek with warning
        toast('当前身份非平台管理员，仅演示切换后台只读浏览', 'warn');
      }
      ui.mode = mode;
      sessionStorage.setItem('ruilai_mode', mode);
      ui.route = mode === 'admin' ? 'home' : 'agent-home';
      location.hash = ui.route;
      render();
    }));
    document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.getAttribute('data-go'));
    }));
    document.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => {
      const [key, id] = el.getAttribute('data-tab').split(':');
      ui.tabs[key] = id;
      render();
    }));
    document.querySelectorAll('[data-filter]').forEach((el) => {
      el.addEventListener('change', () => {
        const [key, field] = el.getAttribute('data-filter').split(':');
        ui.filters[key] = ui.filters[key] || {};
        ui.filters[key][field] = el.value;
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const [key] = el.getAttribute('data-filter').split(':');
          ui.filters[key] = ui.filters[key] || {};
          ui.filters[key][el.getAttribute('data-filter').split(':')[1]] = el.value;
          render();
        }
      });
    });
    $('#demo-ip')?.addEventListener('change', (e) => {
      db.demoIpRegion = e.target.value;
      saveStore();
      toast(`演示IP地区已设为 ${db.demoIpRegion}`);
    });

    // modal mask: only close when clicking mask itself
    $('#modal-mask')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-mask') closeModal();
    });
    $('#modal-box')?.addEventListener('click', (e) => e.stopPropagation());

    // chips in modal
    document.querySelectorAll('[data-pick-main]').forEach((el) => el.addEventListener('click', () => {
      if (el.disabled) return;
      ui.modal.draft.mainArea = el.getAttribute('data-pick-main');
      const areas = new Set(ui.modal.draft.areas || []);
      areas.add(ui.modal.draft.mainArea);
      ui.modal.draft.areas = [...areas];
      render();
    }));
    document.querySelectorAll('[data-toggle-area]').forEach((el) => el.addEventListener('click', () => {
      const r = el.getAttribute('data-toggle-area');
      const areas = new Set(ui.modal.draft.areas || []);
      if (areas.has(r)) areas.delete(r); else areas.add(r);
      ui.modal.draft.areas = [...areas];
      el.classList.toggle('on');
    }));
    document.querySelectorAll('[data-toggle-city]').forEach((el) => el.addEventListener('click', () => {
      const c = el.getAttribute('data-toggle-city');
      const areas = new Set(ui.modal.draft.areas || []);
      if (areas.has(c)) areas.delete(c); else areas.add(c);
      ui.modal.draft.areas = [...areas];
      el.classList.toggle('on');
    }));
    $('#f-parent')?.addEventListener('change', () => {
      if (ui.modal?.type === 'edit-l2') {
        ui.modal.draft.parentId = $('#f-parent').value;
        ui.modal.draft.areas = [];
        render();
      }
    });

    $('#f-sn-scan')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const sn = e.target.value.trim().toUpperCase();
        e.target.value = '';
        if (!sn) return;
        const row = db.sns.find((s) => s.sn === sn);
        if (!row) return toast('SN不存在', 'err');
        if (row.l1Id !== currentL1Id() || row.status !== 'l1') return toast('只能扫本一级在库SN', 'err');
        const scanned = ui.modal.draft.scanned || [];
        if (scanned.includes(sn)) return toast('已扫过', 'warn');
        scanned.push(sn);
        ui.modal.draft.scanned = scanned;
        // persist draft into scanning SO
        if (ui.modal.draft.id) {
          const so = db.sales.find((x) => x.id === ui.modal.draft.id);
          if (so) { so.scanned = scanned.slice(); so.status = 'scanning'; saveStore(); }
        }
        render();
      }
    });

    document.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const act = el.getAttribute('data-action');
        const id = el.getAttribute('data-id');
        handleAction(act, id, el);
      });
    });
  }

  function handleAction(act, id, el) {
    switch (act) {
      case 'logout':
        ui.loggedIn = false; sessionStorage.removeItem('ruilai_logged'); addLog('退出登录', 'login'); render(); break;
      case 'reset-demo':
        localStorage.removeItem(persistKey); db = seed(); saveStore(); toast('演示数据已重置'); render(); break;
      case 'close-modal': closeModal(); break;
      case 'apply-filter': {
        const key = el.getAttribute('data-key');
        document.querySelectorAll(`[data-filter^="${key}:"]`).forEach((inp) => {
          const field = inp.getAttribute('data-filter').split(':')[1];
          ui.filters[key] = ui.filters[key] || {};
          ui.filters[key][field] = inp.value;
        });
        render(); break;
      }
      case 'reset-filter':
        ui.filters[el.getAttribute('data-key')] = {};
        render(); break;
      case 'edit-l1': {
        const cur = id ? db.agentsL1.find((a) => a.id === id) : null;
        ui.modal = {
          type: 'edit-l1',
          payload: { id },
          step: 1,
          draft: cur
            ? { name: cur.name, contact: cur.contact, mainArea: cur.mainArea, areas: [...cur.areas] }
            : { name: '', contact: '', areas: availableL1Areas(), mainArea: '' },
        };
        render();
        break;
      }
      case 'l1-select-national':
        ui.modal.draft.areas = availableL1Areas(ui.modal.payload.id);
        render(); toast('已勾选全部可用区域（全国口径）'); break;
      case 'toggle-notify':
        ui.notifyOpen = !ui.notifyOpen; render(); break;
      case 'mark-all-read':
        (db.notifications || []).forEach((n) => { n.read = true; });
        saveStore(); ui.notifyOpen = true; render(); break;
      case 'read-notify': {
        const n = (db.notifications || []).find((x) => x.id === id);
        if (n) n.read = true;
        saveStore(); ui.notifyOpen = true; render(); break;
      }
      case 'mark-resale': {
        const sn = el.getAttribute('data-sn');
        const row = db.sns.find((s) => s.sn === sn);
        if (!row || !row.reIn) return toast('仅退货再入库 SN 可标记', 'err');
        row.resale = true;
        const rt = db.returns.find((r) => (r.sns || []).includes(sn) && r.type === 'user');
        if (rt) rt.resaleReady = true;
        addLog(`标记再销售 ${sn}`);
        pushNotify('再销售就绪', `${sn} 已标记可再销售`, ui.role === 'l2' ? '二级' : '一级');
        saveStore(); toast('已标记再销售，可扫码绑定'); render(); break;
      }
      case 'save-acc-role': {
        const acc = db.accounts.find((a) => a.id === id);
        const sel = document.querySelector(`[data-acc-role="${id}"]`);
        if (!acc || !sel) break;
        acc.roleId = sel.value;
        addLog(`账号 ${acc.username} 绑定角色 ${db.roles.find((r)=>r.id===acc.roleId)?.name || ''}`);
        saveStore(); toast('账号角色已绑定，菜单将按权限过滤'); render(); break;
      }
      case 'toggle-l1': {
        const a = db.agentsL1.find((x) => x.id === id);
        a.status = a.status === '启用' ? '停用' : '启用';
        addLog(`${a.status}一级代理 ${a.name}`); saveStore(); render(); toast('状态已更新'); break;
      }
      case 'edit-l2':
        ui.modal = { type: 'edit-l2', payload: { id }, step: 1, draft: id ? { ...db.agentsL2.find((a)=>a.id===id), areas: [...(db.agentsL2.find((a)=>a.id===id).areas||[])] } : { areas: [], parentId: ui.role==='l1'?currentL1Id():db.agentsL1[0]?.id, type: '法人' } };
        render(); break;
      case 'unbind-l2': {
        const a = db.agentsL2.find((x) => x.id === id);
        a.prevParentId = a.parentId; a.prevAreas = [...(a.areas||[])];
        a.parentId = null; a.areas = a.type === '法人' ? [] : a.areas; a.pending = true;
        addLog(`解绑二级 ${a.name}`); saveStore(); toast('已进入待分配'); render(); break;
      }
      case 'rebind': openModal('rebind', { id }); break;
      case 'remove-area-sim': {
        const a = db.agentsL2.find((x) => x.id === id);
        const l1 = db.agentsL1.find((x) => x.id === a.parentId);
        if (!l1) break;
        // remove provinces that contain this city
        const hitProv = Object.entries(CITY_MAP).find(([, cities]) => cities.some((c) => a.areas.includes(c)))?.[0];
        if (hitProv) {
          l1.areas = l1.areas.filter((r) => r !== hitProv);
          if (l1.mainArea === hitProv) toast('主授权区被撤，请编辑一级重设', 'warn');
          applyL1AreaChange(l1.id);
          saveStore(); toast(`已模拟撤销一级区域 ${hitProv}`); render();
        }
        break;
      }
      case 'import-sn': openModal('import-sn'); break;
      case 'download-sn-tpl': toast('模板字段：SN,一级编码,商品编码,尺码（演示）'); break;
      case 'edit-product': openModal('edit-product', { id }); break;
      case 'toggle-product': {
        const p = db.products.find((x) => x.id === id);
        p.status = p.status === '上架' ? '下架' : '上架';
        saveStore(); render(); break;
      }
      case 'audit-po': openModal('audit-po', { id }); break;
      case 'reject-po': {
        const p = db.purchases.find((x) => x.id === id);
        p.status = 'rejected'; addLog(`驳回采购单 ${p.no}`); saveStore(); toast('已驳回'); render(); break;
      }
      case 'view-po': openModal('view-po', { data: db.purchases.find((x) => x.id === id) }); break;
      case 'view-so': openModal('view-so', { data: db.sales.find((x) => x.id === id) }); break;
      case 'view-rt': openModal('view-rt', { data: db.returns.find((x) => x.id === id) }); break;
      case 'view-bind': {
        const sn = el.getAttribute('data-sn');
        const row = db.sns.find((s) => s.sn === sn);
        openModal('view-bind', { data: row }); break;
      }
      case 'confirm-audit-po': confirmAuditPo(id); break;
      case 'add-seg-hint': toast('每行可填一段或多段（逗号分隔），合计数量必须等于采购数量'); break;
      case 'ex-setting': openModal('ex-setting'); break;
      case 'close-ex': {
        const ex = db.exceptions.find((x) => x.id === id);
        ex.status = '已关闭'; addLog(`关闭异常 ${ex.type}`); saveStore(); render(); toast('已处理关闭'); break;
      }
      case 'export-stats': toast('已导出统计汇总（演示）'); addLog('导出数据统计'); break;
      case 'edit-role':
        ui.modal = { type: 'edit-role', payload: { id }, step: 1, draft: { perms: id ? [...(db.roles.find(r=>r.id===id)?.perms||[])] : [] } };
        render(); break;
      case 'apply-po':
        ui.modal = { type: 'apply-po', payload: {}, step: 1, draft: { lines: [] } }; render(); break;
      case 'add-po-line': {
        const productId = $('#f-pid').value; const size = $('#f-size').value; const qty = parseInt($('#f-qty').value, 10);
        if (!qty) return toast('数量无效', 'err');
        ui.modal.draft.lines = ui.modal.draft.lines || [];
        ui.modal.draft.lines.push({ productId, size, qty });
        render(); break;
      }
      case 'rm-po-line':
        ui.modal.draft.lines.splice(+el.getAttribute('data-i'), 1); render(); break;
      case 'submit-po': {
        const lines = ui.modal.draft.lines || [];
        if (!lines.length) return toast('请添加明细', 'err');
        const no = `PO${todayCompact()}${String(db.seq.po++).padStart(3, '0')}`;
        db.purchases.unshift({ id: uid('PO'), no, l1Id: currentL1Id(), lines, status: 'pending', createdAt: nowStr(), segments: [] });
        addLog(`提交采购申请 ${no}`); saveStore(); closeModal(); toast('已提交，等待平台审核'); break;
      }
      case 'create-so':
        if (ui.role === 'sub') return toast('子账号请打开已有「扫码中」单据', 'err');
        ui.modal = { type: 'create-so', payload: {}, step: 1, draft: { scanned: [], planTotal: 10, l2Id: db.agentsL2.find(a=>a.parentId===currentL1Id()&&!a.pending)?.id } };
        render(); break;
      case 'continue-so': {
        const so = db.sales.find((x) => x.id === id);
        ui.modal = { type: 'continue-so', payload: { id }, step: 2, draft: { id: so.id, no: so.no, l2Id: so.l2Id, scanned: [...(so.scanned||[])], planTotal: so.planTotal || 10, planBySize: { ...(so.planBySize || {}) } } };
        render(); break;
      }
      case 'so-next': {
        if (ui.modal.step === 1) {
          if (ui.role === 'sub' && !ui.modal.payload.id) return toast('子账号不能新建销售单', 'err');
          ui.modal.draft.l2Id = $('#f-l2')?.value;
          ui.modal.draft.planTotal = parseInt($('#f-plan')?.value || '0', 10);
          const planBySize = {};
          document.querySelectorAll('.plan-size').forEach((inp) => {
            const v = parseInt(inp.value || '0', 10);
            if (v > 0) planBySize[inp.getAttribute('data-size')] = v;
          });
          ui.modal.draft.planBySize = planBySize;
          if (Object.keys(planBySize).length) {
            const sum = Object.values(planBySize).reduce((a, b) => a + b, 0);
            ui.modal.draft.planTotal = sum;
          }
          if (!ui.modal.draft.l2Id) return toast('请选择二级', 'err');
          if (!ui.modal.draft.id) {
            const so = {
              id: uid('SO'), no: `SO${todayCompact()}${String(db.seq.so++).padStart(3, '0')}`,
              l1Id: currentL1Id(), l2Id: ui.modal.draft.l2Id, scanned: [], planTotal: ui.modal.draft.planTotal,
              planBySize: { ...planBySize }, status: 'scanning', createdAt: nowStr(),
            };
            db.sales.unshift(so); ui.modal.draft.id = so.id; ui.modal.draft.no = so.no; saveStore();
          } else {
            const so = db.sales.find((x) => x.id === ui.modal.draft.id);
            if (so) { so.planTotal = ui.modal.draft.planTotal; so.planBySize = { ...planBySize }; saveStore(); }
          }
          ui.modal.step = 2;
        } else if (ui.modal.step === 2) {
          if (!(ui.modal.draft.scanned||[]).length) return toast('请先扫码', 'err');
          ui.modal.step = 3;
        }
        render(); break;
      }
      case 'so-prev': ui.modal.step = Math.max(1, ui.modal.step - 1); render(); break;
      case 'rm-scan':
        ui.modal.draft.scanned = ui.modal.draft.scanned.filter((s) => s !== el.getAttribute('data-sn')); render(); break;
      case 'confirm-so': confirmSo(); break;
      case 'bind-user':
        ui.modal = { type: 'bind-user', payload: {}, step: 1, draft: {} }; render(); break;
      case 'bind-next': bindNextFromSn(); break;
      case 'bind-cancel-ip':
        addLog(`取消超区绑定 ${ui.modal.draft.sn}（未记录IP）`);
        toast('已取消，未记录IP'); closeModal(); break;
      case 'bind-confirm-ip':
        ui.modal.step = 3; render(); break;
      case 'bind-save': bindSave(); break;
      case 'user-return': openModal('user-return'); break;
      case 'agent-return': openModal('agent-return'); break;
      case 'approve-rt': approveReturn(id); break;
      case 'reject-rt': {
        const r = db.returns.find((x) => x.id === id);
        r.status = 'rejected'; addLog(`驳回退货 ${r.no}`); saveStore(); toast('已驳回'); render(); break;
      }
      case 'create-sub': openModal('create-sub'); break;
      case 'reset-sub': toast('密码已重置为 123456（演示）'); addLog(`重置子账号密码 ${id}`); break;
      case 'toggle-sub': {
        const s = db.subAccounts.find((x) => x.id === id);
        s.status = s.status === '启用' ? '停用' : '启用'; saveStore(); render(); break;
      }
      case 'stock-hist':
        openModal('stock-hist', { type: el.getAttribute('data-type'), id: el.getAttribute('data-id'), pid: el.getAttribute('data-pid'), size: el.getAttribute('data-size') });
        break;
      case 'modal-ok':
        if (ui.modal.type === 'edit-l1') saveL1();
        else if (ui.modal.type === 'edit-l2') saveL2();
        else if (ui.modal.type === 'rebind') doRebind();
        else if (ui.modal.type === 'import-sn') doImportSn();
        else if (ui.modal.type === 'edit-product') {
          const name = $('#f-name').value.trim();
          const sizes = $('#f-sizes').value.split(/[,，\s]+/).filter(Boolean);
          if (!name || !sizes.length) return toast('请填写完整', 'err');
          if (ui.modal.payload.id) {
            const p = db.products.find((x) => x.id === ui.modal.payload.id);
            p.name = name; p.sizes = sizes;
          } else {
            db.products.push({ id: uid('P'), code: `P-${1000+db.products.length+1}`, name, sizes, status: '上架' });
          }
          addLog(`保存商品 ${name}`); saveStore(); closeModal(); toast('商品已保存');
        } else if (ui.modal.type === 'ex-setting') {
          const mul = parseFloat($('#f-mul').value);
          if (!(mul > 0)) return toast('倍数无效', 'err');
          db.exceptionMultiplier = mul; saveStore(); addLog(`设置异常倍数 ${mul}`); closeModal(); toast('已保存');
        } else if (ui.modal.type === 'user-return') doUserReturn();
        else if (ui.modal.type === 'agent-return') doAgentReturn();
        else if (ui.modal.type === 'create-sub') {
          const username = $('#f-user').value.trim(); const name = $('#f-name').value.trim();
          if (!username || !name) return toast('请填写完整', 'err');
          db.subAccounts.push({ id: uid('SUB'), l1Id: currentL1Id(), username, name, status: '启用' });
          addLog(`创建子账号 ${username}`); saveStore(); closeModal(); toast('子账号已创建');
        } else if (ui.modal.type === 'edit-role') {
          const name = $('#f-name').value.trim(); const desc = $('#f-desc').value.trim();
          const perms = [...document.querySelectorAll('[data-perm]:checked')].map((x) => x.getAttribute('data-perm'));
          if (!name) return toast('请填写角色名', 'err');
          if (ui.modal.payload.id) {
            const r = db.roles.find((x) => x.id === ui.modal.payload.id);
            r.name = name; r.desc = desc; r.perms = perms;
          } else db.roles.push({ id: uid('R'), name, desc, perms, accounts: 0 });
          addLog(`保存角色 ${name}`); saveStore(); closeModal(); toast('角色已保存');
        } else closeModal();
        break;
      default: break;
    }
  }

  window.addEventListener('hashchange', () => {
    const id = location.hash.replace(/^#/, '');
    if (id && PAGES[id] && ui.loggedIn) { ui.route = id; render(); }
  });

  // boot
  if (ui.loggedIn && location.hash) {
    const id = location.hash.replace(/^#/, '');
    if (PAGES[id]) ui.route = id;
  }
  render();
})();
