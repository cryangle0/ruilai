(() => {
  /* =========================================================
   * 锐涞经销商管理系统 · 可走查完整交互原型 v6.1
   * ========================================================= */

  const BAND_SIZES = ['SS', 'S', 'M', 'L', 'LL'];
  // 腰带尺码仅 S/M/L；标品组合：S+SS/S+S=小，M+M=中，L+L/L+LL=大
  const BELTS = ['腰带S', '腰带M', '腰带L'];
  const DEFAULT_BELT = { SS: '腰带S', S: '腰带S', M: '腰带M', L: '腰带L', LL: '腰带L' };
  const STANDARD_COMBO_NOTE = '标品：腰带S+弹力带SS/S=小；腰带M+弹力带M=中；腰带L+弹力带L/LL=大。其他组合请下非标。';
  // 原型标品 5 档 + 非标腰带档位→可选弹力带（排除标品组合）
  const STANDARD_KITS = [
    { key: 'S-SS', label: '小（腰带S+弹力带SS）', size: 'SS', belt: '腰带S', grade: '小' },
    { key: 'S-S', label: '小（腰带S+弹力带S）', size: 'S', belt: '腰带S', grade: '小' },
    { key: 'M-M', label: '中（腰带M+弹力带M）', size: 'M', belt: '腰带M', grade: '中' },
    { key: 'L-L', label: '大（腰带L+弹力带L）', size: 'L', belt: '腰带L', grade: '大' },
    { key: 'L-LL', label: '大（腰带L+弹力带LL）', size: 'LL', belt: '腰带L', grade: '大' },
  ];
  const NONSTD_GRADES = [
    { id: '小', belt: '腰带S', bands: ['M', 'L', 'LL'] },
    { id: '中', belt: '腰带M', bands: ['SS', 'S', 'L', 'LL'] },
    { id: '大', belt: '腰带L', bands: ['SS', 'S', 'M'] },
  ];
  function nonstdBandsForGrade(gradeId) {
    return (NONSTD_GRADES.find((g) => g.id === gradeId) || NONSTD_GRADES[0]).bands;
  }
  function nonstdBeltForGrade(gradeId) {
    return (NONSTD_GRADES.find((g) => g.id === gradeId) || NONSTD_GRADES[0]).belt;
  }
  function kitStdCombos(p) {
    const sizes = new Set((p && p.sizes && p.sizes.length) ? p.sizes : BAND_SIZES);
    const belts = new Set((p && p.belts && p.belts.length) ? p.belts : BELTS);
    return STANDARD_KITS.filter((k) => sizes.has(k.size) && belts.has(k.belt));
  }
  function nonstdGradesForProduct(p) {
    const sizes = new Set((p && p.sizes && p.sizes.length) ? p.sizes : BAND_SIZES);
    const belts = new Set((p && p.belts && p.belts.length) ? p.belts : BELTS);
    return NONSTD_GRADES
      .filter((g) => belts.has(g.belt))
      .map((g) => ({ ...g, bands: g.bands.filter((b) => sizes.has(b)) }))
      .filter((g) => g.bands.length > 0);
  }
  function nonstdBandsForProductGrade(p, gradeId) {
    const g = nonstdGradesForProduct(p).find((x) => x.id === gradeId);
    return g ? g.bands : [];
  }
  function customComboLabel(belt, size) {
    const g = NONSTD_GRADES.find((x) => x.belt === normalizeBelt(belt))?.id || '';
    return `${g ? g + '（' + normalizeBelt(belt) + '）' : normalizeBelt(belt)} + 弹力带${size}`;
  }
  function normalizeBelt(b) {
    if (!b) return '腰带M';
    if (BELTS.includes(b)) return b;
    if (/SS|S$/i.test(b) && !/腰带M|腰带L/.test(b)) return '腰带S';
    if (/LL|L$/i.test(b) && !/腰带S|腰带M/.test(b)) return '腰带L';
    if (/M/i.test(b)) return '腰带M';
    return '腰带M';
  }
  const PERM_LABELS = {
    all: '全部权限',
    purchase: '采购',
    sales: '销售',
    stock: '库存',
    l2: '下级代理',
    aftersale: '售后',
    sub: '子账号',
    exception: '异常',
    sales_scan: '销售扫码',
    sales_view: '销售查看',
    stock_self: '本级库存',
  };
  function permLabel(key) { return PERM_LABELS[key] || key; }
  const ALL_PERMS = Object.keys(PERM_LABELS);
  const DETAIL_PERMS = ALL_PERMS.filter((p) => p !== 'all');
  function roleDescFromPerms(perms) {
    const list = Array.isArray(perms) ? perms : [];
    if (!list.length) return '';
    if (list.includes('all') || DETAIL_PERMS.every((p) => list.includes(p))) return '全量后台权限';
    return list.map(permLabel).join('/');
  }
  const LOG_TYPE_LABELS = { op: '操作', login: '登录', exception: '异常', warn: '预警', edit: '修改' };
  function logTypeLabel(t) { return LOG_TYPE_LABELS[t] || t || '操作'; }
  // 演示时钟固定在 8.7，避免原型随真实日期漂到 8.8/8.9
  const DEMO_NOW = new Date('2026-08-07T14:30:00');
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
  const PHONE_LOC = { '138': '浙江', '139': '广东', '137': '上海', '136': '北京', '135': '江苏', '188': '四川' };
  const RETURN_REASONS = [
    { type: '投诉', label: '客诉退货' },
    { type: '质量', label: '质量退货' },
    { type: '尺码', label: '尺码不合适' },
    { type: '批次', label: '批次瑕疵' },
    { type: '其他', label: '其他（手写）' },
  ];
  const SN_STATUS_LABEL = {
    warehouse: '原厂在库', l1: '一级在库', l2: '二级在库', bound: '已销售', frozen: '冷冻库', factory: '已退原厂',
  };
  const PO_STATUS = {
    pending: '待审核', cosigning: '会签中', approved: '已生效', rejected: '已驳回',
  };
  const SO_STATUS = {
    scanning: '扫码中', done: '已完成', cancelled: '已取消',
  };
  const RT_STATUS = {
    pending: '待审核', approved: '已通过', done: '已处理', rejected: '已驳回',
  };
  function returnStatusLabel(status) {
    return RT_STATUS[status] || status || '—';
  }
  function returnStatusTag(status) {
    const tone = status === 'pending' ? 'orange'
      : status === 'approved' ? 'green'
      : status === 'rejected' ? 'red'
      : 'gray';
    return tag(returnStatusLabel(status), tone);
  }
  function saleStatusTag(status) {
    const tone = status === 'scanning' ? 'orange' : status === 'done' ? 'green' : 'gray';
    return tag(SO_STATUS[status] || status || '—', tone);
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }
  function demoNow() {
    // 保留真实时分，日期锚定演示日 8.7
    const real = new Date();
    const d = new Date(DEMO_NOW);
    d.setHours(real.getHours(), real.getMinutes(), real.getSeconds(), 0);
    return d;
  }
  function nowStr() {
    const d = demoNow();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function todayCompact() {
    const d = DEMO_NOW;
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  }
  function monthStart() {
    const d = DEMO_NOW;
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-01`;
  }
  function todayDate() {
    const d = DEMO_NOW;
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function normalizeDemoLogTimes(logs) {
    if (!Array.isArray(logs)) return;
    let i = 0;
    logs.forEach((l) => {
      const m = String(l.time || '').match(/^(\d{4})-(\d{2})-(\d{2})(\s.*)?$/);
      if (!m) return;
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const day = Number(m[3]);
      // 演示区间外（8.8 及以后，或非 2026-08）压到 8.6 / 8.7
      if (y !== 2026 || mo !== 8 || day < 6 || day > 7) {
        const newDay = (i % 2 === 0) ? '07' : '06';
        l.time = `${m[1]}-08-${newDay}${m[4] || ' 10:00'}`;
        i += 1;
      }
    });
  }
  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function parseTime(t) {
    return new Date(String(t || '').replace(/-/g, '/')).getTime() || 0;
  }
  function inDateRange(timeStr, from, to) {
    if (!from && !to) return true;
    const ts = parseTime(timeStr);
    if (from && ts < parseTime(from + ' 00:00')) return false;
    if (to && ts > parseTime(to + ' 23:59')) return false;
    return true;
  }
  function tag(text, tone = 'gray') {
    return `<span class="tag tag-${tone || 'gray'}">${escapeHtml(text)}</span>`;
  }
  function $(sel) { return document.querySelector(sel); }

  /* ---------- Seed ---------- */
  function seed() {
    const kitSizes = [...BAND_SIZES];
    const productLines = [
      { id: 'PL-MED', code: 'MED', name: '医疗版', active: true, note: '当前主产品线' },
      { id: 'PL-YOUTH', code: 'YOUTH', name: '青春版', active: false, note: '预留扩展，暂未上线 SKU' },
    ];
    const products = [
      { id: 'P1', code: 'P-1001', name: '锐涞经典款套件', type: 'kit', productLineId: 'PL-MED', sizes: kitSizes, belts: [...BELTS], defaultBelt: { ...DEFAULT_BELT }, status: '上架', note: '弹力带+腰带必配 · 标品五档' },
      { id: 'P2', code: 'P-1002', name: '锐涞运动款套件', type: 'kit', productLineId: 'PL-MED', sizes: kitSizes, belts: [...BELTS], defaultBelt: { ...DEFAULT_BELT }, status: '上架', note: '弹力带+腰带必配 · 标品五档' },
      { id: 'PART-BELT', code: 'PART-BELT', name: '腰带规格', type: 'part', productLineId: 'PL-MED', sizes: BELTS, status: '上架', note: '配件·不生成SN' },
      { id: 'PART-SIL', code: 'PART-SIL', name: '主体硅胶带', type: 'part', productLineId: 'PL-MED', sizes: BAND_SIZES, status: '上架', note: '配件·不生成SN' },
      { id: 'P-Y1', code: 'Y-2001', name: '青春版弹性套件（预留）', type: 'kit', productLineId: 'PL-YOUTH', sizes: kitSizes, belts: [...BELTS], defaultBelt: { ...DEFAULT_BELT }, status: '下架', note: '多产品线预留' },
    ];

    const agentsL1 = [
      {
        id: 'L1A', code: 'AG-L1-001', name: '华东锐涞总代', contact: '张伟', phone: '13800001111',
        mainAreas: ['浙江', '上海'], areas: ['浙江', '上海', '江苏'], saleAreas: ['浙江', '上海', '江苏'],
        directAreas: ['杭州市', '宁波市', '上海市', '苏州市'],
        warnMultiplier: 1.5, warnMode: 'soft', status: '启用',
        ent: { company: '杭州华东锐涞贸易有限公司', creditCode: '91330100MA27XQ001A', legal: '张伟', phone: '0571-88001234', addr: '杭州市西湖区文三路 100 号' },
      },
      {
        id: 'L1B', code: 'AG-L1-002', name: '华南渠道中心', contact: '李娜', phone: '13900002222',
        mainAreas: ['广东'], areas: ['广东', '福建'], saleAreas: ['广东', '福建'],
        directAreas: ['广州市', '深圳市', '厦门市'],
        warnMultiplier: 1.5, warnMode: 'strict', status: '启用',
        ent: { company: '广州华南渠道管理有限公司', creditCode: '91440100MA59XK002B', legal: '李娜', phone: '020-38001234', addr: '广州市天河区体育西路 8 号' },
      },
      {
        id: 'L1C', code: 'AG-L1-003', name: '华北联合代理', contact: '王强', phone: '13600003333',
        mainAreas: ['北京'], areas: ['北京', '河北', '天津'], saleAreas: ['北京', '河北', '天津'],
        directAreas: ['北京市', '天津市', '石家庄市'],
        warnMultiplier: 2.0, warnMode: 'strict', status: '启用',
        ent: { company: '北京华北联合商贸有限公司', creditCode: '91110100MA01XT003C', legal: '王强', phone: '010-56001234', addr: '北京市朝阳区建国路 88 号' },
      },
    ];

    const agentsL2 = [
      { id: 'L2A', code: 'AG-L2-101', name: '杭州城西专营', type: '法人', parentId: 'L1A', areas: ['杭州市'], status: '启用', pending: false, auditStatus: 'approved', protocolOk: true,
        warnMultiplier: null, warnMode: null,
        ent: { company: '杭州城西专营商贸有限公司', creditCode: '91330106MA2BXQ101D', legal: '陈晨', phone: '0571-87654321', addr: '杭州市西湖区古墩路 200 号' } },
      { id: 'L2B', code: 'AG-L2-102', name: '宁波海曙店', type: '个人', parentId: 'L1A', areas: ['宁波市'], status: '启用', pending: false, auditStatus: 'approved', protocolOk: true, warnMultiplier: null, warnMode: null },
      { id: 'L2C', code: 'AG-L2-201', name: '广州天河渠道', type: '法人', parentId: 'L1B', areas: ['广州市'], status: '启用', pending: false, auditStatus: 'approved', protocolOk: true,
        warnMultiplier: 1.2, warnMode: 'strict',
        ent: { company: '广州天河渠道商贸有限公司', creditCode: '91440106MA5CXK201E', legal: '周舟', phone: '020-87001122', addr: '广州市天河区天河路 385 号' } },
      { id: 'L2D', code: 'AG-L2-088', name: '金华法人渠道', type: '法人', parentId: null, areas: [], status: '启用', pending: true, auditStatus: 'approved', prevParentId: 'L1A', prevAreas: ['金华市'], protocolOk: true,
        ent: { company: '金华锐涞渠道有限公司', creditCode: '91330700MA2FXP088F', legal: '吴刚', phone: '0579-82334455', addr: '金华市婺城区双龙南街 300 号' } },
      { id: 'L2E', code: 'AG-L2-103', name: '温州鹿城专营', type: '法人', parentId: 'L1A', areas: ['温州市'], status: '启用', pending: false, auditStatus: 'pending', protocolOk: true,
        ent: { company: '温州鹿城专营商贸有限公司', creditCode: '91330302MA2HXR103G', legal: '林立', phone: '0577-88990011', addr: '温州市鹿城区车站大道 66 号' } },
    ];

    function mkSn(sn, opts) {
      const size = opts.size || 'M';
      return {
        sn, productId: opts.productId || 'P1', size, belt: opts.belt || DEFAULT_BELT[size],
        l1Id: opts.l1Id || null, l2Id: opts.l2Id || null,
        status: opts.status || 'l1', tags: opts.tags || [], frozen: !!opts.frozen,
        factoryAt: opts.factoryAt || null, soldAt: opts.soldAt || null, returnAt: opts.returnAt || null,
        user: opts.user || null, prevUser: opts.prevUser || null,
        events: opts.events || [], reIn: !!opts.reIn, resale: !!opts.resale,
        bindAt: opts.bindAt || null, bindIpRegion: opts.bindIpRegion || null,
      };
    }

    const sns = [];
    for (let i = 1; i <= 30; i++) {
      sns.push(mkSn(`RL20260801${String(i).padStart(4, '0')}`, { size: 'M', status: i <= 25 ? 'l1' : 'warehouse', l1Id: 'L1A' }));
    }
    for (let i = 31; i <= 50; i++) {
      sns.push(mkSn(`RL20260801${String(i).padStart(4, '0')}`, { size: 'L', status: 'l1', l1Id: 'L1A' }));
    }
    for (let i = 51; i <= 60; i++) {
      sns.push(mkSn(`RL20260801${String(i).padStart(4, '0')}`, { size: 'S', belt: '腰带M', status: 'l1', l1Id: 'L1A', tags: ['个性化'] }));
    }
    for (let i = 1; i <= 12; i++) {
      const sn = `RL20260720${String(i).padStart(4, '0')}`;
      if (i === 7) {
        sns.push(mkSn(sn, { size: 'M', l1Id: 'L1A', l2Id: 'L2A', status: 'l2', reIn: true, tags: ['已退货', '修理过'],
          soldAt: '2026-07-25 12:00', bindAt: '2026-07-25 12:00', bindIpRegion: '浙江',
          prevUser: { phone: '138****1007', addr: '杭州市余杭区', phoneLoc: '浙江' }, returnAt: '2026-08-01 11:20' }));
        continue;
      }
      const bound = i <= 6;
      sns.push(mkSn(sn, {
        size: 'M', l1Id: 'L1A', l2Id: 'L2A', status: bound ? 'bound' : 'l2',
        soldAt: bound ? '2026-07-25 12:00' : null, bindAt: bound ? '2026-07-25 12:00' : null,
        bindIpRegion: bound ? (i === 4 ? '广东' : '浙江') : null,
        user: bound ? { phone: `138****100${i}`, addr: '杭州市西湖区文一路1号', phoneLoc: i === 4 ? '广东' : '浙江' } : null,
      }));
    }
    for (let i = 1; i <= 6; i++) {
      sns.push(mkSn(`RL20260721${String(i).padStart(4, '0')}`, {
        size: 'L', l1Id: 'L1A', l2Id: 'L2B', status: i <= 2 ? 'bound' : 'l2',
        soldAt: i <= 2 ? '2026-07-28 11:00' : null, bindAt: i <= 2 ? '2026-07-28 11:00' : null, bindIpRegion: i <= 2 ? '浙江' : null,
        user: i <= 2 ? { phone: `135****400${i}`, addr: '宁波市海曙区中山东路88号', phoneLoc: '江苏' } : null,
      }));
    }
    for (let i = 1; i <= 25; i++) {
      const toL2 = i <= 5;
      sns.push(mkSn(`RL20260802${String(i).padStart(4, '0')}`, {
        productId: 'P2', size: 'LL', l1Id: 'L1B', l2Id: toL2 ? 'L2C' : null, status: toL2 ? 'l2' : 'l1',
      }));
    }
    // frozen pool demo
    sns.push(mkSn('RL202606150001', { size: 'M', l1Id: null, status: 'frozen', frozen: true, tags: ['已退货', '冷冻'], factoryAt: null, returnAt: '2026-07-10 10:00' }));
    sns.push(mkSn('RL202606150002', { size: 'S', l1Id: null, status: 'frozen', frozen: true, tags: ['已退货', '冷冻'], returnAt: '2026-07-12 14:00' }));

    const soScannedA = ['RL202607200009', 'RL202607200010', 'RL202607200011', 'RL202607200012'];
    const soScannedB = ['RL202607210003', 'RL202607210004', 'RL202607210005', 'RL202607210006'];

    return {
      exceptionMultiplier: 1.5,
      exceptionRules: {
        overOrderRatio: 1.0,   // 二级在库≥出货量×此值 → 超量预警
        stockTurnover: 1.5,    // 二级在库 > 一级在库×倍数 → 库存异常
        softAutoClose: false,
      },
      activeProductLineId: 'PL-MED',
      productLines,
      demoIpRegion: '浙江',
      products,
      agentsL1,
      agentsL2,
      sns,
      purchases: [
        {
          id: 'PO0', no: `PO${todayCompact()}003`, l1Id: 'L1A',
          lines: [{ productId: 'P1', size: 'M', qty: 30, belt: '腰带M' }, { productId: 'P1', size: 'L', qty: 20, belt: '腰带L' }],
          customLines: [{ productId: 'P1', size: 'S', belt: '腰带M', qty: 10 }],
          parts: [{ partId: 'PART-BELT', spec: '腰带M', qty: 5 }, { partId: 'PART-SIL', spec: 'M', qty: 3 }],
          status: 'approved', createdAt: '2026-08-01 10:00',
          segments: {
            'P1_M_腰带M': ['RL202608010001-RL202608010030'],
            'P1_L_腰带L': ['RL202608010031-RL202608010050'],
            'P1_S_腰带M': ['RL202608010051-RL202608010060'],
          },
          cosign: { admin1: true, admin2: true, admin1At: '2026-08-01 10:05', admin2At: '2026-08-01 10:08' },
          approvedAt: '2026-08-01 10:08',
        },
        {
          id: 'PO1', no: `PO${todayCompact()}021`, l1Id: 'L1A',
          lines: [{ productId: 'P1', size: 'M', qty: 10, belt: '腰带M' }],
          customLines: [], parts: [{ partId: 'PART-SIL', spec: 'M', qty: 2 }],
          status: 'pending', createdAt: nowStr(), segments: {}, cosign: { admin1: false, admin2: false },
        },
        {
          id: 'PO2', no: `PO${todayCompact()}015`, l1Id: 'L1A',
          lines: [{ productId: 'P1', size: 'L', qty: 5, belt: '腰带L' }, { productId: 'P1', size: 'M', qty: 3, belt: '腰带M' }],
          customLines: [{ productId: 'P1', size: 'M', belt: '腰带S', qty: 2 }],
          parts: [], status: 'pending', createdAt: '2026-08-03 14:20', segments: {}, cosign: { admin1: false, admin2: false },
        },
        {
          id: 'PO3', no: `PO${todayCompact()}008`, l1Id: 'L1B',
          lines: [{ productId: 'P2', size: 'LL', qty: 25, belt: '腰带LL' }],
          customLines: [], parts: [], status: 'approved', createdAt: '2026-08-02 09:10',
          segments: { 'P2_LL_腰带LL': ['RL202608020001-RL202608020025'] },
          cosign: { admin1: true, admin2: true }, approvedAt: '2026-08-02 09:20',
        },
        {
          id: 'PO4', no: `PO${todayCompact()}030`, l1Id: 'L1A',
          lines: [{ productId: 'P1', size: 'SS', qty: 8, belt: '腰带SS' }],
          customLines: [], parts: [], status: 'cosigning', createdAt: '2026-08-06 11:00',
          segments: { 'P1_SS_腰带SS': ['RL202608060001-RL202608060008'] },
          cosign: { admin1: true, admin2: false, admin1At: '2026-08-06 11:30', admin2At: null },
        },
        {
          id: 'PO5', no: `PO${todayCompact()}031`, l1Id: 'L1B',
          lines: [{ productId: 'P2', size: 'M', qty: 6, belt: '腰带M' }],
          customLines: [], parts: [], status: 'approved', createdAt: '2026-08-07 09:00',
          segments: { 'P2_M_腰带M': ['RL202608070001-RL202608070006'] },
          cosign: { admin1: true, admin2: true, admin1At: '2026-08-07 09:10', admin2At: '2026-08-07 09:20' },
          approvedAt: '2026-08-07 09:20',
        },
      ],
      sales: [
        { id: 'SO1', no: `SO${todayCompact()}088`, channel: 'distribute', l1Id: 'L1A', l2Id: 'L2A', productId: 'P1',
          planTotal: 4, planBySize: { M: 4 }, scanned: soScannedA, status: 'done', createdAt: '2026-07-20 15:00' },
        { id: 'SO2', no: `SO${todayCompact()}090`, channel: 'distribute', l1Id: 'L1A', l2Id: 'L2B', productId: 'P1',
          planTotal: 4, planBySize: { L: 4 }, scanned: soScannedB, status: 'done', createdAt: '2026-07-22 10:30' },
        { id: 'SO3', no: `SO${todayCompact()}095`, channel: 'distribute', l1Id: 'L1A', l2Id: 'L2A', productId: 'P1',
          planTotal: 6, planBySize: { M: 4, L: 2 }, scanned: ['RL202608010001', 'RL202608010002'], status: 'scanning', createdAt: nowStr() },
        { id: 'SO4', no: `SO${todayCompact()}072`, channel: 'distribute', l1Id: 'L1B', l2Id: 'L2C', productId: 'P2',
          planTotal: 5, planBySize: { LL: 5 }, scanned: ['RL202608020001', 'RL202608020002', 'RL202608020003', 'RL202608020004', 'RL202608020005'],
          status: 'done', createdAt: '2026-08-02 16:00' },
        { id: 'SO5', no: `SO${todayCompact()}100`, channel: 'direct', l1Id: 'L1A', l2Id: null, productId: 'P1',
          planTotal: 2, planBySize: { M: 2 }, scanned: ['RL202607200001', 'RL202607200002'], status: 'done', createdAt: '2026-07-25 12:00',
          customer: { phone: '138****1001', addr: '杭州市西湖区文一路1号', phoneLoc: '浙江' } },
      ],
      returns: [
        { id: 'RT1', no: `RTU${todayCompact()}01`, type: 'user', typeLabel: '用户退货再入库', fromId: 'L2A', fromName: '杭州城西专营',
          sns: ['RL202607200007'], status: 'approved', createdAt: '2026-08-01 11:20', reason: '尺码不合适', reasonType: '尺码' },
        { id: 'RT2', no: `RT${todayCompact()}02`, type: 'l2_to_l1', typeLabel: '二级退一级', fromId: 'L2A', fromName: '杭州城西专营', approverId: 'L1A',
          sns: ['RL202607200011'], status: 'pending', createdAt: '2026-08-04 09:00', reason: '质量问题：面料起球', reasonType: '质量' },
        { id: 'RT3', no: `RT${todayCompact()}03`, type: 'l1_to_factory', typeLabel: '一级退原厂', fromId: 'L1A', fromName: '华东锐涞总代',
          sns: ['RL202608010041'], status: 'pending', createdAt: '2026-08-04 15:30', reason: '批次瑕疵，申请退回原厂', reasonType: '批次' },
        { id: 'RT4', no: `RT${todayCompact()}04`, type: 'self', typeLabel: '自行售后处理', fromId: 'L2A', fromName: '杭州城西专营',
          sns: ['RL202607200010'], status: 'done', createdAt: '2026-08-03 13:10', reason: '轻微线头，自行换货处理', reasonType: '其他' },
        { id: 'RT5', no: `RT${todayCompact()}05`, type: 'l2_to_l1', typeLabel: '二级退一级', fromId: 'L2B', fromName: '宁波海曙店', approverId: 'L1A',
          sns: ['RL202607210006'], status: 'approved', createdAt: '2026-07-30 16:40', reason: '客诉退货，转退一级', reasonType: '投诉' },
        { id: 'RT6', no: `RT${todayCompact()}06`, type: 'l1_to_factory', typeLabel: '一级退原厂', fromId: 'L1A', fromName: '华东锐涞总代',
          sns: ['RL202606150001', 'RL202606150002'], status: 'approved', createdAt: '2026-07-10 10:00', reason: '质量退货入冷冻库', reasonType: '质量' },
      ],
      exceptions: [
        { id: 'EX1', time: '2026-07-25 12:05', type: '归属地异常', target: 'RL202607200004', detail: '手机归属广东 · IP地区浙江不一致', notify: '一级+原厂', status: '未处理', dim: 'activate' },
        { id: 'EX2', time: '2026-07-28 11:02', type: 'SN激活异常', target: 'RL202607210001', detail: '跨区激活：IP 浙江 不在直销围栏', notify: '一级+原厂', status: '未处理', dim: 'activate' },
        { id: 'EX3', time: '2026-08-02 16:10', type: '销售库存异常', target: '广州天河渠道 · 锐涞运动款LL', detail: '本次新增 5 > 预警线（区间销量 × 倍数）', notify: '一级+原厂', status: '未处理', dim: 'stock' },
        { id: 'EX4', time: '2026-07-22 10:40', type: '销售库存异常', target: '宁波海曙店 · 锐涞经典款L', detail: '本次新增 4 > 预警线', notify: '一级+原厂', status: '已处理', dim: 'stock' },
        { id: 'EX5', time: '2026-08-05 09:20', type: '超量下单预警', target: '杭州城西专营', detail: '2级库存充足仍大量申请下单，需一级填写说明', notify: '一级+原厂', status: '未处理', dim: 'scan', explain: '' },
        { id: 'EX6', time: '2026-08-06 14:00', type: '扫码尺码不匹配', target: 'RL202608010001', detail: '出货计划 M，实扫 SN 为 L', notify: '原厂', status: '未处理', dim: 'scan' },
        { id: 'EX7', time: '2026-08-07 10:10', type: '客户信息重复', target: 'RL202607200003', detail: '手机号 138****1003 已激活 1 次 · 可查看历史绑定', notify: '一级+原厂', status: '未处理', dim: 'activate', dupPhone: '138****1003' },
      ],
      notifications: [
        { id: 'N1', time: nowStr(), title: '预警：归属地异常', body: 'RL202607200004 · 手机归属不匹配', to: '一级+原厂', read: false },
        { id: 'N2', time: '2026-08-04 09:01', title: '退货待审', body: '杭州城西专营提交二级退一级', to: '一级', read: false },
        { id: 'N3', time: '2026-08-06 11:01', title: '二级待分配', body: '金华法人渠道待重新绑定一级', to: '原厂', read: false },
      ],
      stockLogs: [
        { id: 'H1', agentType: 'l1', agentId: 'L1A', productId: 'P1', size: 'M', delta: 30, reason: '采购入库', time: '2026-08-01 10:00', ref: 'PO-SEED' },
        { id: 'H1b', agentType: 'l1', agentId: 'L1A', productId: 'P1', size: 'L', delta: 20, reason: '采购入库', time: '2026-08-01 10:05', ref: 'PO-SEED-L' },
        { id: 'H2', agentType: 'l2', agentId: 'L2A', productId: 'P1', size: 'M', delta: 12, reason: '销售转入', time: '2026-07-20 15:00', ref: 'SO088' },
        { id: 'H3', agentType: 'l2', agentId: 'L2A', productId: 'P1', size: 'M', delta: -6, reason: '用户绑定出库', time: '2026-07-25 12:00', ref: 'BIND-SEED' },
        { id: 'H4', agentType: 'l1', agentId: 'L1B', productId: 'P2', size: 'LL', delta: 25, reason: '采购入库', time: '2026-08-02 09:20', ref: 'PO008' },
      ],
      roles: [
        { id: 'R1', name: '平台管理员', desc: '全量后台权限', perms: ['all'] },
        { id: 'R2', name: '一级代理主账号', desc: '采购/销售/库存/下级/异常', perms: ['purchase', 'sales', 'stock', 'l2', 'aftersale', 'sub', 'exception'] },
        { id: 'R3', name: '一级子账号', desc: '仅销售扫码', perms: ['sales_scan'] },
        { id: 'R4', name: '二级代理', desc: '库存/销售/售后/异常', perms: ['sales_view', 'stock_self', 'aftersale', 'exception'] },
      ],
      accounts: [
        { id: 'ACC1', username: 'admin', name: '平台管理员', roleId: 'R1', status: '启用', password: 'demo' },
        { id: 'ACC1b', username: 'admin2', name: '平台管理员B', roleId: 'R1', status: '启用', password: 'demo' },
        { id: 'ACC2', username: 'agent_hd', name: '华东锐涞总代', roleId: 'R2', agentId: 'L1A', status: '启用', password: '******' },
        { id: 'ACC3', username: 'agent_hz', name: '杭州城西专营', roleId: 'R4', agentId: 'L2A', status: '启用', password: '******' },
        { id: 'ACC4', username: 'hd_scan_01', name: '仓管小陈', roleId: 'R3', agentId: 'L1A', status: '启用', password: '******' },
        { id: 'ACC5', username: 'hd_scan_02', name: '仓管小周', roleId: 'R3', agentId: 'L1A', status: '启用', password: '******' },
      ],
      logs: [
        { time: '2026-08-07 14:20', account: 'admin', role: '平台管理员', action: '登录后台', ip: '10.0.1.8', ok: true, type: 'login' },
        { time: '2026-08-07 11:05', account: 'agent_hd', role: '华东锐涞总代', action: '登录小程序', ip: '10.0.1.8', ok: true, type: 'login' },
        { time: '2026-08-07 09:12', account: 'admin', role: '平台管理员', action: '采购单自动生效 PO20260807031', ip: '10.0.1.8', ok: true, type: 'op' },
        { time: '2026-08-06 18:40', account: 'admin', role: '平台管理员', action: '处理异常 超量下单预警', ip: '10.0.1.8', ok: true, type: 'exception' },
        { time: '2026-08-06 16:22', account: 'admin2', role: '平台管理员', action: '会签确认采购 PO20260807030', ip: '10.0.1.8', ok: true, type: 'op' },
        { time: '2026-08-06 10:08', account: 'admin', role: '平台管理员', action: '登录后台', ip: '10.0.1.8', ok: true, type: 'login' },
      ],
      subAccounts: [
        { id: 'SUB1', l1Id: 'L1A', username: 'hd_scan_01', name: '仓管小陈', status: '启用' },
        { id: 'SUB2', l1Id: 'L1A', username: 'hd_scan_02', name: '仓管小周', status: '启用' },
        { id: 'SUB3', l1Id: 'L1B', username: 'hn_scan_01', name: '华南仓管阿强', status: '启用' },
      ],
      seq: { po: 32, so: 101, rt: 7, snBatch: 1, notify: 4 },
    };
  }

  const persistKey = 'ruilai_proto_v9';
  function loadStore() {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.accounts) parsed.accounts = seed().accounts;
        if (!parsed.productLines) parsed.productLines = seed().productLines;
        if (!parsed.activeProductLineId) parsed.activeProductLineId = 'PL-MED';
        if (!parsed.exceptionRules) {
          parsed.exceptionRules = { overOrderRatio: 1.0, stockTurnover: Number(parsed.exceptionMultiplier) || 1.5, softAutoClose: false };
        }
        (parsed.sns || []).forEach((s) => {
          if (!s.belt) s.belt = DEFAULT_BELT[s.size] || '腰带M';
          else s.belt = normalizeBelt(s.belt);
          if (!s.tags) s.tags = [];
          if (s.frozen === undefined) s.frozen = s.status === 'frozen';
          if (!s.events) s.events = [];
        });
        (parsed.products || []).forEach((p) => {
          if (!p.productLineId) p.productLineId = 'PL-MED';
          if (p.type === 'kit') {
            if (!p.sizes || !p.sizes.length) p.sizes = [...BAND_SIZES];
            if (!p.belts || !p.belts.length) p.belts = [...BELTS];
            p.defaultBelt = { ...DEFAULT_BELT, ...(p.defaultBelt || {}) };
          }
        });
        (parsed.agentsL1 || []).forEach((a) => {
          if (!a.mainAreas) a.mainAreas = a.mainArea ? [a.mainArea] : [];
          if (!a.saleAreas) a.saleAreas = a.areas || [];
          if (!a.directAreas) a.directAreas = [];
          if (!a.warnMultiplier) a.warnMultiplier = 1.5;
          if (!a.warnMode) a.warnMode = 'strict';
        });
        (parsed.agentsL2 || []).forEach((a) => {
          if (a.warnMode === undefined) a.warnMode = null;
          if (a.warnMultiplier === undefined) a.warnMultiplier = null;
        });
        (parsed.purchases || []).forEach((p) => {
          if (!p.customLines) p.customLines = [];
          if (!p.parts) p.parts = [];
          if (!p.cosign) p.cosign = { admin1: false, admin2: false };
          if (!p.segments) p.segments = {};
          if (Array.isArray(p.segments)) {
            const obj = {};
            (p.lines || []).forEach((l, i) => { obj[`${l.productId}_${l.size}_${l.belt || DEFAULT_BELT[l.size]}`] = [p.segments[i]].filter(Boolean); });
            p.segments = obj;
          }
          // 会签完成后立即生效：旧「待生效」迁移为已生效
          if (p.status === 'approvedPending') {
            p.status = 'approved';
            if (!p.approvedAt) p.approvedAt = nowStr();
          }
        });
        (parsed.sales || []).forEach((s) => { if (!s.channel) s.channel = s.l2Id ? 'distribute' : 'direct'; });
        (parsed.returns || []).forEach((r) => { if (!r.reasonType) r.reasonType = '其他'; });
        (parsed.exceptions || []).forEach((e) => {
          if (e.dim === 'nonSn') e.dim = 'scan';
          else if (e.dim === 'sn') e.dim = 'activate';
          else if (!e.dim) {
            e.dim = /库存|压货/.test(e.type) ? 'stock'
              : (/激活|归属地|客户信息|跨区/.test(e.type) ? 'activate'
                : (/扫码|尺码不匹配|超量|采购|下单/.test(e.type) ? 'scan' : 'activate'));
          }
          if (e.status === '已关闭') e.status = '已处理';
        });
        if (!parsed.logs) parsed.logs = seed().logs;
        normalizeDemoLogTimes(parsed.logs);
        return parsed;
      }
    } catch (_) {}
    return seed();
  }
  function saveStore() { localStorage.setItem(persistKey, JSON.stringify(db)); }

  let db = loadStore();
  normalizeDemoLogTimes(db.logs);
  try { saveStore(); } catch (_) {}

  const ui = {
    loggedIn: sessionStorage.getItem('ruilai_logged') === '1',
    role: sessionStorage.getItem('ruilai_role') || 'admin',
    mode: sessionStorage.getItem('ruilai_mode') || 'admin', // admin | mini
    loginTab: sessionStorage.getItem('ruilai_login_tab') || 'platform', // platform | mini
    account: sessionStorage.getItem('ruilai_account') || '',
    route: (location.hash.replace(/^#/, '') || 'home'),
    modal: null,
    confirm: null, // 全局二次确认：{ title, message, action, payload, danger, okText, cancelText }
    toast: null,
    tabs: {},
    filters: {},
    form: {},
    notifyOpen: false,
    sort: {},
    scanMode: sessionStorage.getItem('ruilai_scan_mode') || 'ship', // ship | direct
  };

  const ROLES = {
    admin: { name: '平台管理员', avatar: '管', account: 'admin' },
    l1: { name: '华东锐涞总代', avatar: '一', account: 'agent_hd', l1Id: 'L1A' },
    l2: { name: '杭州城西专营', avatar: '二', account: 'agent_hz', l2Id: 'L2A', l1Id: 'L1A' },
    sub: { name: '仓管小陈(子账号)', avatar: '子', account: 'hd_scan_01', l1Id: 'L1A' },
  };

  const MINI_ROLES = [
    { role: 'l1', label: '一级' },
    { role: 'l2', label: '二级' },
    { role: 'sub', label: '子账号' },
  ];

  const TITLES = {
    home: '工作台', 'agent-l1': '一级代理商', 'agent-l2': '二级代理商', 'agent-l2-audit': '二级审核',
    'agent-pending': '待分配(法人)', sn: 'SN码库', product: '商品库', purchase: '采购单管理',
    sales: '销售单管理', stock: '库存管理', return: '返货管理', exception: '异常管理', customers: '销售客户',
    stats: '数据统计', role: '角色与权限', log: '操作日志',
    'l1-sales-detail': '一级销售详情', 'l1-return-detail': '一级退货详情',
    'l2-sales-detail': '二级销售详情', 'l2-return-detail': '二级退货详情',
    'mini-scan': '扫码', 'mini-biz': '业务', 'mini-purchase': '采购', 'mini-sales': '销售', 'mini-stock': '库存',
    'mini-service': '售后', 'mini-aftersale': '售后', 'mini-exception': '异常', 'mini-mine': '我的',
  };

  function currentL1Id() { return ROLES[ui.role]?.l1Id || null; }
  function currentL2Id() { return ROLES[ui.role]?.l2Id || null; }

  function addLog(action, type = 'op', ok = true) {
    const r = ROLES[ui.role] || { account: ui.account || '—', name: ui.role };
    db.logs.unshift({ time: nowStr(), account: r.account || ui.account, role: r.name, action, ip: '10.0.1.8', ok, type });
    saveStore();
  }

  function toast(msg, kind = 'ok') {
    ui.toast = { msg, kind, id: Date.now() };
    render();
    setTimeout(() => {
      const wrap = document.querySelector('.toast-wrap');
      if (wrap) wrap.innerHTML = '';
      ui.toast = null;
    }, 2400);
  }

  function productName(id) { return db.products.find((p) => p.id === id)?.name || id; }
  function l1Name(id) { return db.agentsL1.find((a) => a.id === id)?.name || '—'; }
  function l2Name(id) { return db.agentsL2.find((a) => a.id === id)?.name || '—'; }
  function activeLineId() { return db.activeProductLineId || 'PL-MED'; }
  function kitProducts() {
    const line = activeLineId();
    const byLine = db.products.filter((p) => p.type === 'kit' && (p.productLineId || 'PL-MED') === line && (p.status === '上架' || line !== 'PL-MED'));
    // 预留产品线无上架 SKU 时回退到医疗版，避免出货/导入弹窗空商品
    if (byLine.length) return byLine;
    return db.products.filter((p) => p.type === 'kit' && p.status === '上架');
  }
  function partProducts() {
    return db.products.filter((p) => p.type === 'part' && (p.productLineId || 'PL-MED') === activeLineId());
  }
  function lineName(id) { return (db.productLines || []).find((l) => l.id === id)?.name || id; }

  function soProductDetail(s) {
    const map = {};
    (s.scanned || []).forEach((sn) => {
      const row = db.sns.find((x) => x.sn === sn);
      if (!row) return;
      const k = `${row.productId}_${row.size}_${row.belt || ''}`;
      map[k] = (map[k] || 0) + 1;
    });
    let text = Object.entries(map).map(([k, q]) => {
      const [pid, size, belt] = k.split('_');
      return `${productName(pid)}/${size}${belt ? '+' + belt : ''}×${q}`;
    }).join('，');
    if (!text && s.planBySize && Object.keys(s.planBySize).length) {
      text = Object.entries(s.planBySize).filter(([, q]) => q).map(([sz, q]) => `${sz}×${q}`).join('，');
    }
    const accParts = (s.parts || []).map((p) => `${productName(p.partId)}/${p.spec}×${p.qty}`).join('，');
    if (accParts) text = text ? `${text}；配件 ${accParts}` : `配件 ${accParts}`;
    return text || '—';
  }

  function snsProductDetail(snList) {
    const map = {};
    (snList || []).forEach((sn) => {
      const row = db.sns.find((x) => x.sn === sn);
      if (!row) return;
      const k = `${row.productId}_${row.size}_${row.belt || ''}`;
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([k, q]) => {
      const [pid, size, belt] = k.split('_');
      return `${productName(pid)}/${size}${belt ? '+' + belt : ''}×${q}`;
    }).join('，') || '—';
  }

  function exceptionDim(e) {
    // 三类：扫码异常 / 激活异常 / 销售库存异常（兼容旧 dim）
    if (e.dim === 'scan' || e.dim === 'activate' || e.dim === 'stock') return e.dim;
    if (e.dim === 'nonSn') return 'scan';
    if (e.dim === 'sn') return 'activate';
    if (/库存|压货/.test(e.type)) return 'stock';
    if (/激活|归属地|客户信息|跨区/.test(e.type)) return 'activate';
    if (/扫码|尺码不匹配|超量|采购|下单/.test(e.type)) return 'scan';
    return 'activate';
  }

  function planBySizeText(plan) {
    if (!plan) return '—';
    if (typeof plan === 'string') {
      try { plan = JSON.parse(plan); } catch (_) { return plan; }
    }
    if (typeof plan !== 'object') return '—';
    const parts = Object.entries(plan).filter(([, q]) => Number(q) > 0).map(([sz, q]) => `${sz}×${q}`);
    return parts.join('，') || '—';
  }

  function miniTimeSnFilters(scope) {
    const f = ui.filters[scope] || {};
    return `<div class="mini-filters">
      <input type="date" class="field-input" data-filter="${scope}:from" value="${escapeHtml(f.from || '')}" title="开始日期" />
      <input type="date" class="field-input" data-filter="${scope}:to" value="${escapeHtml(f.to || '')}" title="结束日期" />
      <input class="field-input" data-filter="${scope}:sn" placeholder="SN码" value="${escapeHtml(f.sn || '')}" />
    </div>`;
  }

  function matchTimeSnFilter(time, snList, f) {
    if ((f.from || f.to) && !inDateRange(time, f.from, f.to)) return false;
    if (f.sn) {
      const q = String(f.sn).trim().toLowerCase();
      if (!q) return true;
      const hit = (snList || []).some((sn) => String(sn).toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  }

  function purchaseSnHaystack(p) {
    const segs = Object.values(p.segments || {}).flat().filter(Boolean);
    return [p.no, ...segs, ...(p.sns || [])];
  }

  function saleProductRows(s) {
    const rows = [];
    const plan = s.planBySize || {};
    const sizes = new Set([...Object.keys(plan), ...((s.scanned || []).map((sn) => db.sns.find((x) => x.sn === sn)?.size).filter(Boolean))]);
    sizes.forEach((size) => {
      const scannedOfSize = (s.scanned || []).filter((sn) => db.sns.find((x) => x.sn === sn)?.size === size);
      const sample = scannedOfSize[0] ? db.sns.find((x) => x.sn === scannedOfSize[0]) : null;
      rows.push({
        productId: s.productId || sample?.productId,
        size,
        belt: sample?.belt || DEFAULT_BELT[size] || '—',
        plan: Number(plan[size] || 0),
        scanned: scannedOfSize.length,
      });
    });
    return rows;
  }

  function saleDetailHtml(s) {
    const productRows = saleProductRows(s);
    const snRows = (s.scanned || []).map((sn) => {
      const row = db.sns.find((x) => x.sn === sn);
      const u = row?.user || row?.prevUser;
      return { sn, size: row?.size || '—', belt: row?.belt || '—', user: u ? `${u.phone || ''} ${u.addr || ''}`.trim() : '—' };
    });
    return `<div class="detail-grid">
        <div><span>渠道</span>${tag(s.channel==='direct'?'直售':'分销', s.channel==='direct'?'orange':'blue')}</div>
        <div><span>状态</span>${saleStatusTag(s.status)}</div>
        <div><span>一级</span>${escapeHtml(l1Name(s.l1Id))}</div>
        <div><span>二级</span>${s.l2Id?escapeHtml(l2Name(s.l2Id)):'—'}</div>
        <div><span>计划/已扫</span>${(s.scanned||[]).length}/${s.planTotal||0}</div>
        <div><span>时间</span>${escapeHtml(s.createdAt||'—')}</div>
      </div>
      <h4 style="margin-top:12px">商品明细</h4>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>商品</th><th>弹力带</th><th>腰带</th><th>计划</th><th>已扫</th></tr></thead>
        <tbody>${productRows.map((r)=>`<tr>
          <td>${escapeHtml(productName(r.productId))}</td>
          <td>${escapeHtml(r.size)}</td>
          <td>${escapeHtml(r.belt)}</td>
          <td class="num">${r.plan}</td>
          <td class="num">${r.scanned}</td>
        </tr>`).join('') || `<tr><td colspan="5">${emptyHint('无商品明细')}</td></tr>`}
        ${(s.parts||[]).map((p)=>`<tr>
          <td>${escapeHtml(productName(p.partId))}（配件）</td>
          <td>—</td><td>${escapeHtml(p.spec||'—')}</td>
          <td class="num">${p.qty||0}</td><td class="num">—</td>
        </tr>`).join('')}
        </tbody>
      </table></div>
      <h4 style="margin-top:12px">SN码（${snRows.length}）</h4>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>SN</th><th>尺码</th><th>腰带</th><th>客户</th></tr></thead>
        <tbody>${snRows.map((r)=>`<tr>
          <td><code>${escapeHtml(r.sn)}</code></td>
          <td>${escapeHtml(r.size)}</td>
          <td>${escapeHtml(r.belt)}</td>
          <td>${escapeHtml(r.user)}</td>
        </tr>`).join('') || `<tr><td colspan="4">${emptyHint('暂无已扫 SN')}</td></tr>`}</tbody>
      </table></div>`;
  }

  function listCendOrders() {
    const orders = [];
    const covered = new Set();
    const inScopeSn = (row) => {
      if (!row) return false;
      if (ui.role === 'l2') return row.l2Id === currentL2Id();
      return row.l1Id === currentL1Id();
    };
    const inScopeSale = (s) => {
      if (ui.role === 'l2') return s.l2Id === currentL2Id() || (s.channel === 'direct' && (s.scanned || []).some((sn) => db.sns.find((x) => x.sn === sn)?.l2Id === currentL2Id()));
      return s.l1Id === currentL1Id();
    };
    db.sales.filter((s) => s.channel === 'direct' && inScopeSale(s)).forEach((s) => {
      (s.scanned || []).forEach((sn) => covered.add(sn));
      const users = (s.scanned || []).map((sn) => db.sns.find((x) => x.sn === sn)?.user || db.sns.find((x) => x.sn === sn)?.prevUser).filter(Boolean);
      const u = users[0] || s.customer || null;
      orders.push({
        id: s.id,
        kind: 'sale',
        no: s.no,
        createdAt: s.createdAt,
        sns: s.scanned || [],
        phone: u?.phone || s.customer?.phone || '—',
        addr: u?.addr || s.customer?.addr || '—',
        detail: soProductDetail(s),
        status: s.status,
      });
    });
    db.sns.filter((row) => (row.user || row.prevUser) && inScopeSn(row) && !covered.has(row.sn)).forEach((row) => {
      const u = row.user || row.prevUser;
      orders.push({
        id: `CO_${row.sn}`,
        kind: 'bind',
        no: `CO${String(row.sn).slice(-8)}`,
        createdAt: row.soldAt || row.bindAt || row.returnAt || '',
        sns: [row.sn],
        phone: u.phone || '—',
        addr: u.addr || '—',
        detail: `${productName(row.productId)}/${row.size}${row.belt ? '+' + row.belt : ''}`,
        status: row.status === 'bound' ? 'done' : 'done',
        snRow: row,
      });
    });
    orders.sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
    return orders;
  }

  function cendOrderDetailHtml(order) {
    if (order.kind === 'sale') {
      const s = db.sales.find((x) => x.id === order.id);
      return saleDetailHtml(s);
    }
    const row = order.snRow || db.sns.find((x) => x.sn === order.sns[0]);
    const u = row?.user || row?.prevUser || {};
    return `<div class="detail-grid">
        <div><span>订单号</span>${escapeHtml(order.no)}</div>
        <div><span>状态</span>${tag(row?.status === 'bound' ? '已销售' : '已归档', 'green')}</div>
        <div><span>客户手机</span>${escapeHtml(u.phone || '—')}</div>
        <div><span>归属地</span>${escapeHtml(u.phoneLoc || '—')}</div>
        <div class="span-2"><span>地址</span>${escapeHtml(u.addr || '—')}</div>
        <div><span>商品</span>${escapeHtml(productName(row?.productId))}</div>
        <div><span>尺码</span>${escapeHtml(row?.size || '—')} / ${escapeHtml(row?.belt || '—')}</div>
        <div><span>SN码</span><code>${escapeHtml(row?.sn || '—')}</code></div>
        <div><span>时间</span>${escapeHtml(order.createdAt || '—')}</div>
        <div><span>代理</span>${escapeHtml(row?.l2Id ? l2Name(row.l2Id) : l1Name(row?.l1Id))}</div>
      </div>`;
  }

  function tryAddSnToSale(s, sn) {
    sn = String(sn || '').trim().toUpperCase();
    if (!sn) return { ok: false, msg: '请输入 SN' };
    const row = db.sns.find((x) => x.sn === sn);
    if (!row) return { ok: false, msg: `SN 不存在：${sn}` };
    if (row.frozen || row.status === 'frozen') return { ok: false, msg: `冷冻 SN 无效：${sn}` };
    if (row.l1Id !== s.l1Id || row.status !== 'l1') return { ok: false, msg: `不在本一级库存：${sn}` };
    if (row.productId !== s.productId) return { ok: false, msg: `商品不匹配：${sn}` };
    const need = s.planBySize[row.size] || 0;
    if (need <= 0) {
      const orderSizes = Object.keys(s.planBySize || {}).filter((k) => (s.planBySize[k] || 0) > 0).join('/');
      return { ok: false, msg: `尺寸不匹配：订单要 ${orderSizes || '—'}，扫到 ${row.size}` };
    }
    const got = (s.scanned || []).filter((x) => db.sns.find((y) => y.sn === x)?.size === row.size).length;
    if (got >= need) return { ok: false, msg: `尺寸 ${row.size} 已扫满（${got}/${need}）` };
    if ((s.scanned || []).includes(sn)) return { ok: false, msg: `已扫描：${sn}` };
    s.scanned = s.scanned || [];
    s.scanned.push(sn);
    return { ok: true, msg: sn };
  }

  function getStockSns(agentType, agentId, f = {}) {
    return db.sns.filter((s) => {
      let ok = false;
      if (agentType === 'l1' && s.l1Id === agentId && s.status === 'l1' && !s.frozen) ok = true;
      if (agentType === 'l2' && s.l2Id === agentId && (s.status === 'l2' || s.reIn) && !s.frozen) ok = true;
      if (!ok) return false;
      if (f.sn && !s.sn.toLowerCase().includes(String(f.sn).toLowerCase())) return false;
      if (f.size && s.size !== f.size) return false;
      if (f.belt && s.belt !== f.belt) return false;
      if (f.productId && s.productId !== f.productId) return false;
      return true;
    });
  }

  function occupiedMainAreas(exceptId) {
    const set = new Set();
    db.agentsL1.filter((a) => a.id !== exceptId && a.status === '启用').forEach((a) => {
      (a.mainAreas || (a.mainArea ? [a.mainArea] : [])).forEach((r) => set.add(r));
    });
    return set;
  }

  function availableL1Areas(exceptId) {
    const occ = occupiedMainAreas(exceptId);
    return ALL_REGIONS.filter((r) => !occ.has(r));
  }

  function citiesForL1(l1Id) {
    const a = db.agentsL1.find((x) => x.id === l1Id);
    if (!a) return [];
    return (a.saleAreas || a.areas || []).flatMap((r) => CITY_MAP[r] || []);
  }

  function getStockRows(agentType, agentId) {
    const map = new Map();
    db.sns.forEach((s) => {
      let ok = false;
      if (agentType === 'l1' && s.l1Id === agentId && s.status === 'l1') ok = true;
      if (agentType === 'l2' && s.l2Id === agentId && (s.status === 'l2' || s.reIn)) ok = true;
      if (!ok) return;
      const key = `${s.productId}_${s.size}_${s.belt || ''}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([key, qty]) => {
      const [productId, size, belt] = key.split('_');
      return { productId, size, belt, qty };
    });
  }

  function pushNotify(title, body, to = '一级+原厂') {
    db.notifications = db.notifications || [];
    db.notifications.unshift({ id: uid('N'), time: nowStr(), title, body, to, read: false });
  }

  function resolveWarnConfig(l1Id, l2Id) {
    const l1 = db.agentsL1.find((a) => a.id === l1Id);
    const l2 = l2Id ? db.agentsL2.find((a) => a.id === l2Id) : null;
    const mult = Number(l2?.warnMultiplier || l1?.warnMultiplier || db.exceptionMultiplier || 1.5);
    const mode = l2?.warnMode || l1?.warnMode || 'strict';
    const rules = db.exceptionRules || { overOrderRatio: 1.0, stockTurnover: mult };
    return { mult, mode, rules, l1, l2 };
  }

  function pushException(type, target, detail, dim, opts = {}) {
    const d = dim || exceptionDim({ type });
    const mode = opts.mode || 'strict';
    const status = mode === 'soft' ? '仅记录' : '未处理';
    const row = {
      id: uid('EX'), time: nowStr(), type, target, detail,
      notify: mode === 'soft' ? '仅记录' : '一级+原厂',
      status, dim: d, warnMode: mode, explain: '',
    };
    if (opts.dupPhone) row.dupPhone = opts.dupPhone;
    db.exceptions.unshift(row);
    if (mode !== 'soft') pushNotify(`预警：${type}`, `${target} · ${detail}`, '一级+原厂');
    addLog(`${mode === 'soft' ? '软报警记录' : '触发异常'} ${type} · ${target}`, mode === 'soft' ? 'warn' : 'exception');
    saveStore();
  }

  function pushSnEvent(row, title, desc, type = 'op') {
    if (!row) return;
    row.events = row.events || [];
    row.events.push({ time: nowStr(), title, desc: desc || '', type });
  }

  function snStatusMeta(row) {
    if (!row) return { label: '未知', tone: 'gray' };
    if (row.frozen || row.status === 'frozen') return { label: '冷冻库', tone: 'orange' };
    const map = {
      warehouse: { label: '原厂在库', tone: 'gray' },
      l1: { label: '一级在库', tone: 'green' },
      l2: { label: row.reIn ? '再入库' : '二级在库', tone: 'blue' },
      bound: { label: '已销售', tone: 'orange' },
      factory: { label: '已退原厂', tone: 'gray' },
    };
    return map[row.status] || { label: row.status, tone: 'gray' };
  }

  function snHistoryTags(row) {
    const tags = [...(row.tags || [])];
    if (row.reIn && !tags.includes('已退货')) tags.push('已退货');
    if (row.resale && !tags.includes('可再销售')) tags.push('可再销售');
    if ((row.events || []).some((e) => /修改|维修/.test(e.title)) && !tags.includes('修改过')) tags.push('修改过');
    return tags;
  }

  function getSnLifecycle(row) {
    if (!row) return [];
    const ev = [...(row.events || [])];
    const y = row.sn.slice(2, 6), m = row.sn.slice(6, 8), d = row.sn.slice(8, 10);
    const base = (/^\d{8}$/.test(`${y}${m}${d}`)) ? `${y}-${m}-${d}` : '2026-08-01';
    const has = (title) => ev.some((e) => e.title === title);
    const hasCend = () => ev.some((e) => e.type === 'bind' || /销售到C端|C端销售|直销激活|C端绑定/.test(e.title || ''));
    if (!has('生成并导入码库')) ev.push({ time: `${base} 09:00`, title: '生成并导入码库', desc: `${productName(row.productId)} / ${row.size}+${row.belt || ''} · ${l1Name(row.l1Id)}`, type: 'import' });
    if (row.status !== 'warehouse' && !has('采购审核入库')) ev.push({ time: `${base} 10:30`, title: '采购审核入库', desc: '进入一级代理库存', type: 'purchase' });
    if ((row.l2Id || row.status === 'l2' || row.status === 'bound') && !ev.some((e) => e.type === 'sales')) {
      const so = db.sales.find((s) => (s.scanned || []).includes(row.sn));
      ev.push({ time: so?.createdAt || `${base} 15:00`, title: so?.channel === 'direct' ? '直销扫码' : '销售转入二级', desc: `${so ? so.no + ' · ' : ''}${l2Name(row.l2Id)}`, type: 'sales' });
    }
    const userReturn = db.returns.find((r) => r.type === 'user' && (r.sns || []).includes(row.sn));
    // 当前已售 / 曾售后退货（prevUser / 用户退货单 / reIn）都必须有「销售到C端」
    if (!hasCend() && (row.status === 'bound' || row.bindAt || row.user || row.prevUser || row.reIn || userReturn)) {
      const u = row.user || row.prevUser || {};
      const afterReturn = !!(row.prevUser || userReturn || row.reIn);
      ev.push({
        time: row.bindAt || row.soldAt || (userReturn && userReturn.createdAt) || `${base} 16:00`,
        title: '销售到C端',
        desc: afterReturn
          ? `${u.phone || '—'} · ${u.addr || '—'}（后退货）`
          : `${u.phone || '—'} · IP ${row.bindIpRegion || '—'} · ${u.addr || ''}`,
        type: 'bind',
      });
    }
    db.returns.filter((r) => (r.sns || []).includes(row.sn)).forEach((r) => {
      if (!ev.some((e) => e.desc && e.desc.includes(r.no))) ev.push({ time: r.createdAt, title: r.typeLabel || '退货', desc: `${r.no} · ${r.reason || ''}`, type: 'return' });
    });
    if (row.status === 'frozen' || row.frozen) ev.push({ time: row.returnAt || nowStr(), title: '进入冷冻库', desc: '待管理员重新分配', type: 'frozen' });
    if (row.status === 'factory') ev.push({ time: row.factoryAt || nowStr(), title: '退回原厂', desc: '库存退出渠道', type: 'factory' });
    db.exceptions.filter((e) => e.target === row.sn || String(e.target || '').includes(row.sn)).forEach((e) => {
      if (!ev.some((x) => x.time === e.time && x.title.includes(e.type))) ev.push({ time: e.time, title: `异常：${e.type}`, desc: e.detail, type: 'exception' });
    });
    return ev.sort((a, b) => parseTime(b.time) - parseTime(a.time));
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

  function parseSegment(seg) {
    const parts = String(seg).split(/[,;，；\n]+/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return null;
    const list = [];
    for (const p of parts) {
      const one = parseOneSegment(p);
      if (!one) return null;
      list.push(...one);
    }
    return [...new Set(list)];
  }

  function pendingL2Count() {
    return db.agentsL2.filter((a) => a.pending && a.type === '法人').length;
  }
  function pendingL2AuditCount() {
    return db.agentsL2.filter((a) => a.auditStatus === 'pending').length;
  }
  function pendingPoCount() {
    return db.purchases.filter((p) => ['pending', 'cosigning'].includes(p.status)).length;
  }
  function pendingReturnCount() {
    return db.returns.filter((r) => r.status === 'pending').length;
  }
  function openExCount() {
    return db.exceptions.filter((e) => e.status === '未处理').length;
  }

  function getOpenExceptionIdsInFilter() {
    const dim = ui.tabs.exception || 'scan';
    const f = ui.filters.exception || {};
    return db.exceptions.filter((e) => {
      if (e.status !== '未处理') return false;
      if (exceptionDim(e) !== dim) return false;
      if (f.status && e.status !== f.status) return false;
      if (f.type === 'dup' && !/客户信息重复/.test(e.type)) return false;
      if (f.from || f.to) {
        if (!inDateRange(e.time, f.from, f.to)) return false;
      }
      if (f.l1) {
        const name = l1Name(f.l1);
        const sn = db.sns.find((s) => s.sn === e.target);
        const hit = (sn && sn.l1Id === f.l1) || String(e.target).includes(name) || String(e.detail || '').includes(name);
        if (!hit) return false;
      }
      return true;
    }).map((e) => e.id);
  }

  function extractSegLines(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map((line) => String(line).split(/[\t,;；]/)[0].trim())
      .filter((c) => c && (/RL/i.test(c) || parseOneSegment(c)));
  }

  function importSnSegmentsFromText(text, meta) {
    const lines = extractSegLines(text);
    if (!lines.length) return { added: 0, skipped: 0, err: '未识别到有效段号' };
    let added = 0; let skipped = 0;
    lines.forEach((seg) => {
      const list = parseSegment(seg);
      if (!list) { skipped++; return; }
      list.forEach((sn) => {
        if (db.sns.some((s) => s.sn === sn)) { skipped++; return; }
        const row = {
          sn, productId: meta.productId, size: meta.size, belt: meta.belt,
          l1Id: meta.l1Id, l2Id: null, status: 'warehouse', tags: [],
          frozen: false, factoryAt: nowStr(), soldAt: null, returnAt: null, user: null, events: [], reIn: false, resale: false,
        };
        pushSnEvent(row, '生成并导入码库', `文件/粘贴导入 · ${l1Name(meta.l1Id)}`, 'import');
        db.sns.push(row);
        added++;
      });
    });
    return { added, skipped };
  }

  function nextInternalSnBatch(qty) {
    db.seq.snBatch = (db.seq.snBatch || 1) + 1;
    const prefix = `RL${todayCompact()}`;
    const existing = db.sns.filter((s) => s.sn.startsWith(prefix)).map((s) => parseInt(s.sn.slice(-4), 10)).filter((n) => !Number.isNaN(n));
    let start = (existing.length ? Math.max(...existing) : 0) + 1;
    const list = [];
    for (let i = 0; i < qty; i++) list.push(prefix + String(start + i).padStart(4, '0'));
    return list;
  }
  function l1ExCount(l1Id) {
    return db.exceptions.filter((e) => {
      if (e.status !== '未处理') return false;
      const sn = db.sns.find((s) => s.sn === e.target);
      if (sn && sn.l1Id === l1Id) return true;
      const l1 = db.agentsL1.find((a) => a.id === l1Id);
      return l1 && String(e.target || '').includes(l1.name);
    }).length;
  }

  function countdownText(approvedAt) {
    if (!approvedAt) return '';
    const end = parseTime(approvedAt) + 24 * 3600 * 1000;
    const left = end - Date.now();
    if (left <= 0) return '已到期生效';
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `剩余 ${h}时${m}分`;
  }

  function ensureApprovedPendingEffect() {
    let changed = false;
    db.purchases.forEach((p) => {
      if (p.status === 'approvedPending') {
        applyPurchaseApprove(p, true);
        changed = true;
      }
    });
    if (changed) saveStore();
  }

  function lineSegKey(line) {
    return `${line.productId}_${line.size}_${line.belt || DEFAULT_BELT[line.size]}`;
  }

  function purchaseNeedQty(p) {
    let n = 0;
    (p.lines || []).forEach((l) => { n += Number(l.qty) || 0; });
    (p.customLines || []).forEach((l) => { n += Number(l.qty) || 0; });
    return n;
  }

  function purchaseSegCount(p) {
    let n = 0;
    const segs = p.segments || {};
    Object.values(segs).forEach((arr) => {
      (arr || []).forEach((seg) => {
        const list = parseSegment(seg);
        if (list) n += list.length;
      });
    });
    return n;
  }

  function segmentsMatch(p) {
    return purchaseNeedQty(p) > 0 && purchaseSegCount(p) === purchaseNeedQty(p);
  }
  /* ---------- UI helpers ---------- */
  function pageHeader(title, desc, actions = '') {
    return `<div class="page-header"><div><h2>${escapeHtml(title)}</h2>${desc ? `<p>${desc}</p>` : ''}</div><div class="page-actions">${actions}</div></div>`;
  }
  function metricCard(label, value, go, setFilter = '', extra = '') {
    const attr = go ? ` data-go="${go}"${setFilter ? ` data-set-filter="${setFilter}"` : ''} style="cursor:pointer"` : '';
    return `<div class="metric-card"${attr}><div class="metric-label">${escapeHtml(label)}</div><div class="metric-value num">${value}</div>${extra}</div>`;
  }
  function emptyHint(text = '暂无数据') {
    return `<div class="empty-hint">${escapeHtml(text)}</div>`;
  }
  function filterBar(inner) {
    return `<div class="page-card search-panel">${inner}<button class="btn btn-sm" data-action="apply-filter">查询</button></div>`;
  }
  function tabsHtml(key, items) {
    const cur = ui.tabs[key] || items[0]?.id;
    return `<div class="page-card"><div class="tabs">${items.map((it) => {
      const badge = it.badge != null ? `<span class="menu-badge">${it.badge}</span>` : '';
      return `<button type="button" class="tab ${cur === it.id ? 'active' : ''}" data-tab="${key}:${it.id}">${escapeHtml(it.title)}${badge}</button>`;
    }).join('')}</div></div>`;
  }
  function confirmDialog(message, action, payload = {}, opts = {}) {
    ui.confirm = {
      title: opts.title || '请确认',
      message: message || '确认执行该操作？',
      action,
      payload: payload || {},
      danger: !!opts.danger,
      okText: opts.okText || (opts.danger ? '确认驳回' : '确定'),
      cancelText: opts.cancelText || '取消',
    };
    render();
  }
  function closeConfirm() {
    ui.confirm = null;
    render();
  }
  function confirmOverlayHtml() {
    const c = ui.confirm;
    if (!c) return '';
    return `<div class="confirm-mask" id="confirm-mask">
      <div class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="confirm-hd"><strong id="confirm-title">${escapeHtml(c.title)}</strong></div>
        <div class="confirm-bd"><p>${escapeHtml(c.message)}</p></div>
        <div class="confirm-ft">
          <button type="button" class="btn" data-action="confirm-cancel">${escapeHtml(c.cancelText || '取消')}</button>
          <button type="button" class="btn ${c.danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm-ok">${escapeHtml(c.okText || '确定')}</button>
        </div>
      </div>
    </div>`;
  }

  function adminMenus() {
    return [
      { group: '概览', items: [{ id: 'home', title: '工作台', icon: '⌂' }] },
      { group: '渠道', items: [
        { id: 'agent-l1', title: '一级代理商', icon: '①' },
        { id: 'agent-l2', title: '二级代理商', icon: '②' },
        { id: 'agent-l2-audit', title: '二级审核', icon: '✓', badge: pendingL2AuditCount() || null },
        { id: 'agent-pending', title: '待分配(法人)', icon: '⌛', badge: pendingL2Count() || null },
      ]},
      { group: '货品', items: [
        { id: 'sn', title: 'SN码库', icon: '#' },
        { id: 'product', title: '商品库', icon: '▣' },
        { id: 'purchase', title: '采购单管理', icon: '▤', badge: pendingPoCount() || null },
        { id: 'sales', title: '销售单管理', icon: '▥' },
        { id: 'stock', title: '库存管理', icon: '▦' },
      ]},
      { group: '售后与风控', items: [
        { id: 'return', title: '返货管理', icon: '↩', badge: pendingReturnCount() || null },
        { id: 'exception', title: '异常管理', icon: '⚠', badge: openExCount() || null },
        { id: 'customers', title: '销售客户', icon: '☺' },
        { id: 'stats', title: '数据统计', icon: '▤' },
      ]},
      { group: '系统', items: [
        { id: 'role', title: '角色与权限', icon: '⚙' },
        { id: 'log', title: '操作日志', icon: '≡' },
      ]},
    ];
  }

  const MINI_TAB_ICONS = {
    scan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
    biz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M4 11h16"/></svg>',
    stock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 16.5 12 21l9-4.5"/></svg>',
    sales: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l3-4 3 2 4-6"/></svg>',
    service: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a7 7 0 0 0-7 7v2.5a2.5 2.5 0 0 0 2.5 2.5H9v-5H7A5 5 0 0 1 17 10h-2v5h1.5A2.5 2.5 0 0 0 19 12.5V10a7 7 0 0 0-7-7z"/><path d="M9 17.5V19a3 3 0 0 0 6 0v-1.5"/></svg>',
    mine: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/></svg>',
  };

  function miniTabs() {
    if (ui.role === 'sub') {
      return [
        { id: 'mini-scan', title: '扫码', icon: 'scan' },
        { id: 'mini-mine', title: '我的', icon: 'mine' },
      ];
    }
    if (ui.role === 'l2') {
      return [
        { id: 'mini-scan', title: '扫码', icon: 'scan' },
        { id: 'mini-sales', title: '销售', icon: 'sales' },
        { id: 'mini-stock', title: '库存', icon: 'stock' },
        { id: 'mini-service', title: '售后', icon: 'service' },
        { id: 'mini-mine', title: '我的', icon: 'mine' },
      ];
    }
    // 一级：5 个规范底栏；采购/销售、退货/异常收入页内分段，能力不变
    return [
      { id: 'mini-scan', title: '扫码', icon: 'scan' },
      { id: 'mini-biz', title: '业务', icon: 'biz' },
      { id: 'mini-stock', title: '库存', icon: 'stock' },
      { id: 'mini-service', title: '售后', icon: 'service' },
      { id: 'mini-mine', title: '我的', icon: 'mine' },
    ];
  }

  function miniAllowedRoutes() {
    const base = miniTabs().map((t) => t.id);
    if (ui.role === 'l1') return [...base, 'mini-purchase', 'mini-sales', 'mini-aftersale', 'mini-exception'];
    if (ui.role === 'l2') return [...base, 'mini-aftersale', 'mini-exception'];
    return base;
  }

  function miniTabIsActive(tabId) {
    const r = ui.route;
    if (tabId === 'mini-biz') return ['mini-biz', 'mini-purchase', 'mini-sales'].includes(r);
    if (tabId === 'mini-service') return ['mini-service', 'mini-aftersale', 'mini-exception'].includes(r);
    if (tabId === 'mini-scan') return r === 'mini-scan';
    return r === tabId;
  }

  function miniSegHtml(key, items) {
    const cur = ui.tabs[key] || items[0]?.id;
    return `<div class="mini-seg" role="tablist">${items.map((it) => `
      <button type="button" class="mini-seg-btn ${cur === it.id ? 'on' : ''}" data-tab="${key}:${it.id}" role="tab" aria-selected="${cur === it.id}">
        ${escapeHtml(it.title)}${it.badge != null ? `<span class="mini-seg-badge">${it.badge}</span>` : ''}
      </button>`).join('')}</div>`;
  }

  /* ---------- Pages: Admin ---------- */
  function pageHome() {
    const pendingL2 = pendingL2Count();
    const pendingL2Audit = pendingL2AuditCount();
    const pendingPo = pendingPoCount();
    const pendingReturn = pendingReturnCount();
    const openEx = openExCount();
    const monthSales = db.sales.filter((s) => inDateRange(s.createdAt, monthStart(), todayDate()) && s.status === 'done')
      .reduce((n, s) => n + (s.scanned || []).length, 0);
    const snBound = db.sns.filter((s) => s.status === 'bound').length;
    return `${pageHeader('工作台', '平台运营总览与待办')}
      <div class="metric-grid">
        ${metricCard('一级代理', db.agentsL1.filter((a) => a.status === '启用').length, 'agent-l1')}
        ${metricCard('二级代理', db.agentsL2.filter((a) => a.auditStatus === 'approved' && !a.pending).length, 'agent-l2')}
        ${metricCard('当月销量', monthSales, 'sales')}
        ${metricCard('已销售SN', snBound, 'sn')}
        ${metricCard('待审采购', pendingPo, 'purchase')}
        ${metricCard('未处理异常', openEx, 'exception')}
      </div>
      <div class="page-card" style="margin-top:12px">
        <h3 class="section-title">待办事项</h3>
        <div>
          <button class="todo-row" data-go="agent-pending"><span>待分配二级（法人）</span><span class="todo-count ${pendingL2 ? 'hot' : ''}">${pendingL2}</span></button>
          <button class="todo-row" data-go="agent-l2-audit"><span>二级审核待处理</span><span class="todo-count">${pendingL2Audit}</span></button>
          <button class="todo-row" data-go="purchase"><span>采购单待审核/会签</span><span class="todo-count">${pendingPo}</span></button>
          <button class="todo-row" data-go="exception"><span>未处理异常</span><span class="todo-count ${openEx ? 'hot' : ''}">${openEx}</span></button>
          <button class="todo-row" data-go="return"><span>退货待审批</span><span class="todo-count">${pendingReturn}</span></button>
        </div>
      </div>`;
  }

  function pageAgentL1() {
    const f = ui.filters['agent-l1'] || {};
    let rows = db.agentsL1.slice();
    if (f.q) {
      const q = f.q.toLowerCase();
      rows = rows.filter((a) => [a.name, a.code, a.contact, ...(a.mainAreas || [])].join(' ').toLowerCase().includes(q));
    }
    if (f.status) rows = rows.filter((a) => a.status === f.status);
    const tr = rows.map((a) => {
      const exN = l1ExCount(a.id);
      return `<tr class="row-clickable" data-row-action="view-agent-l1" data-id="${a.id}">
        <td>${escapeHtml(a.code)}</td>
        <td>${escapeHtml(a.name)}</td>
        <td>${escapeHtml(a.contact)}</td>
        <td>${escapeHtml((a.mainAreas || []).join('、') || '—')}</td>
        <td>${escapeHtml((a.saleAreas || a.areas || []).join('、'))}</td>
        <td>${escapeHtml((a.directAreas || []).slice(0, 3).join('、') || '—')}${(a.directAreas || []).length > 3 ? '…' : ''}</td>
        <td>${tag(a.status, a.status === '启用' ? 'green' : 'gray')}</td>
        <td class="ops" onclick="event.stopPropagation()">
          <button class="btn btn-sm" data-go="l1-sales-detail" data-set-filter="l1-sales:l1Id=${a.id}">销售</button>
          <button class="btn btn-sm" data-go="l1-return-detail" data-set-filter="l1-return:l1Id=${a.id}">退货</button>
          <button class="btn btn-sm ${exN ? 'btn-danger' : ''}" data-go="exception" data-set-filter="exception:l1=${a.id}">异常${exN ? `<span class="menu-badge">${exN}</span>` : ''}</button>
        </td>
      </tr>`;
    }).join('');
    return `${pageHeader('一级代理商', '点击行查看详情（编辑/停用在详情内）', '<button class="btn btn-primary" data-action="open-create-l1">新建一级</button>')}
      ${filterBar(`
        <input class="field-input" placeholder="搜索名称/编码/区域" data-filter="agent-l1:q" value="${escapeHtml(f.q || '')}" />
        <select class="field-input" data-filter="agent-l1:status"><option value="">状态</option><option value="启用" ${f.status==='启用'?'selected':''}>启用</option><option value="停用" ${f.status==='停用'?'selected':''}>停用</option></select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>联系人</th><th>主授权区域</th><th>可销售范围</th><th>直销范围</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${tr || `<tr><td colspan="8">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageL1SalesDetail() {
    const f = ui.filters['l1-sales'] || {};
    const l1Id = f.l1Id || db.agentsL1[0]?.id;
    const from = f.from || monthStart();
    const to = f.to || todayDate();
    const channel = ui.tabs['l1-sales'] || 'distribute';
    const all = db.sales.filter((s) => s.l1Id === l1Id && s.status === 'done');
    const monthQty = all.filter((s) => inDateRange(s.createdAt, from, to)).reduce((n, s) => n + (s.scanned || []).length, 0);
    const histQty = all.reduce((n, s) => n + (s.scanned || []).length, 0);
    const list = all.filter((s) => s.channel === channel && inDateRange(s.createdAt, from, to));
    return `${pageHeader('一级销售详情', `${l1Name(l1Id)} · 默认当月可改区间`, '<button class="btn" data-go="agent-l1">返回列表</button>')}
      ${filterBar(`
        <select class="field-input" data-filter="l1-sales:l1Id">${db.agentsL1.map((a)=>`<option value="${a.id}" ${a.id===l1Id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input type="date" class="field-input" data-filter="l1-sales:from" value="${from}" />
        <input type="date" class="field-input" data-filter="l1-sales:to" value="${to}" />
      `)}
      <div class="metric-grid">${metricCard('当月销量', monthQty)}${metricCard('历史总量', histQty)}</div>
      ${tabsHtml('l1-sales', [{ id: 'distribute', title: '分销' }, { id: 'direct', title: '直售' }])}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>渠道</th><th>二级/客户</th><th>商品明细</th><th>数量</th><th>时间</th></tr></thead>
        <tbody>${list.map((s)=>`<tr class="row-clickable" data-row-action="view-sale" data-id="${s.id}">
          <td>${escapeHtml(s.no)}</td><td>${tag(s.channel==='direct'?'直售':'分销', s.channel==='direct'?'orange':'blue')}</td>
          <td>${s.channel==='direct'?'C端直销':escapeHtml(l2Name(s.l2Id))}</td>
          <td>${escapeHtml(soProductDetail(s))}</td><td class="num">${(s.scanned||[]).length}</td><td>${escapeHtml(s.createdAt)}</td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageL1ReturnDetail() {
    const f = ui.filters['l1-return'] || {};
    const l1Id = f.l1Id || db.agentsL1[0]?.id;
    const from = f.from || monthStart();
    const to = f.to || todayDate();
    const all = db.returns.filter((r) => {
      const snOk = (r.sns || []).some((sn) => db.sns.find((s) => s.sn === sn && s.l1Id === l1Id));
      return snOk || r.fromId === l1Id || r.approverId === l1Id;
    });
    const monthQty = all.filter((r) => inDateRange(r.createdAt, from, to)).reduce((n, r) => n + (r.sns || []).length, 0);
    const histQty = all.reduce((n, r) => n + (r.sns || []).length, 0);
    const list = all.filter((r) => inDateRange(r.createdAt, from, to));
    return `${pageHeader('一级退货详情', `${l1Name(l1Id)} · 默认当月`, '<button class="btn" data-go="agent-l1">返回列表</button>')}
      ${filterBar(`
        <select class="field-input" data-filter="l1-return:l1Id">${db.agentsL1.map((a)=>`<option value="${a.id}" ${a.id===l1Id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input type="date" class="field-input" data-filter="l1-return:from" value="${from}" />
        <input type="date" class="field-input" data-filter="l1-return:to" value="${to}" />
      `)}
      <div class="metric-grid">${metricCard('当月退货', monthQty)}${metricCard('历史总量', histQty)}</div>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>类型</th><th>理由</th><th>商品明细</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>${list.map((r)=>`<tr class="row-clickable" data-row-action="view-return" data-id="${r.id}">
          <td>${escapeHtml(r.no)}</td><td>${escapeHtml(r.typeLabel||r.type)}</td>
          <td>${tag(r.reasonType||'其他')} ${escapeHtml(r.reason||'')}</td>
          <td>${escapeHtml(snsProductDetail(r.sns))}</td>
          <td>${tag(r.status==='pending'?'待审':r.status==='approved'?'已通过':r.status)}</td>
          <td>${escapeHtml(r.createdAt)}</td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageL2SalesDetail() {
    const f = ui.filters['l2-sales'] || {};
    const l2Id = f.l2Id || db.agentsL2.find((a) => !a.pending)?.id;
    const from = f.from || monthStart();
    const to = f.to || todayDate();
    const all = db.sales.filter((s) => s.l2Id === l2Id && s.status === 'done');
    const monthQty = all.filter((s) => inDateRange(s.createdAt, from, to)).reduce((n, s) => n + (s.scanned || []).length, 0);
    const histQty = all.reduce((n, s) => n + (s.scanned || []).length, 0);
    const list = all.filter((s) => inDateRange(s.createdAt, from, to));
    return `${pageHeader('二级销售详情', `${l2Name(l2Id)} · 默认当月`, '<button class="btn" data-go="agent-l2">返回列表</button>')}
      ${filterBar(`
        <select class="field-input" data-filter="l2-sales:l2Id">${db.agentsL2.filter((a)=>!a.pending).map((a)=>`<option value="${a.id}" ${a.id===l2Id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input type="date" class="field-input" data-filter="l2-sales:from" value="${from}" />
        <input type="date" class="field-input" data-filter="l2-sales:to" value="${to}" />
      `)}
      <div class="metric-grid">${metricCard('当月销量', monthQty)}${metricCard('历史总量', histQty)}</div>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>渠道</th><th>商品明细</th><th>数量</th><th>时间</th></tr></thead>
        <tbody>${list.map((s)=>`<tr class="row-clickable" data-row-action="view-sale" data-id="${s.id}">
          <td>${escapeHtml(s.no)}</td><td>${tag('分销','blue')}</td>
          <td>${escapeHtml(soProductDetail(s))}</td><td class="num">${(s.scanned||[]).length}</td><td>${escapeHtml(s.createdAt)}</td>
        </tr>`).join('') || `<tr><td colspan="5">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageL2ReturnDetail() {
    const f = ui.filters['l2-return'] || {};
    const l2Id = f.l2Id || db.agentsL2.find((a) => !a.pending)?.id;
    const from = f.from || monthStart();
    const to = f.to || todayDate();
    const all = db.returns.filter((r) => r.fromId === l2Id || (r.sns || []).some((sn) => db.sns.find((s) => s.sn === sn && s.l2Id === l2Id)));
    const monthQty = all.filter((r) => inDateRange(r.createdAt, from, to)).reduce((n, r) => n + (r.sns || []).length, 0);
    const histQty = all.reduce((n, r) => n + (r.sns || []).length, 0);
    const list = all.filter((r) => inDateRange(r.createdAt, from, to));
    return `${pageHeader('二级退货详情', `${l2Name(l2Id)} · 默认当月`, '<button class="btn" data-go="agent-l2">返回列表</button>')}
      ${filterBar(`
        <select class="field-input" data-filter="l2-return:l2Id">${db.agentsL2.filter((a)=>!a.pending).map((a)=>`<option value="${a.id}" ${a.id===l2Id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input type="date" class="field-input" data-filter="l2-return:from" value="${from}" />
        <input type="date" class="field-input" data-filter="l2-return:to" value="${to}" />
      `)}
      <div class="metric-grid">${metricCard('当月退货', monthQty)}${metricCard('历史总量', histQty)}</div>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>类型</th><th>理由</th><th>SN</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>${list.map((r)=>`<tr class="row-clickable" data-row-action="view-return" data-id="${r.id}">
          <td>${escapeHtml(r.no)}</td><td>${escapeHtml(r.typeLabel||r.type)}</td>
          <td>${tag(r.reasonType||'其他')} ${escapeHtml(r.reason||'')}</td>
          <td>${(r.sns||[]).map((sn)=>`<code>${escapeHtml(sn)}</code>`).join(' ')||'—'}</td>
          <td>${tag(r.status==='pending'?'待审':r.status==='approved'?'已通过':r.status)}</td>
          <td>${escapeHtml(r.createdAt)}</td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageAgentL2() {
    const f = ui.filters['agent-l2'] || {};
    const sortKey = ui.sort['agent-l2'] || 'parent';
    const sortDir = ui.sort['agent-l2-dir'] || 'asc';
    let rows = db.agentsL2.filter((a) => !a.pending && a.auditStatus === 'approved');
    if (f.q) {
      const q = f.q.toLowerCase();
      rows = rows.filter((a) => [a.name, a.code, ...(a.areas || [])].join(' ').toLowerCase().includes(q));
    }
    if (f.type) rows = rows.filter((a) => a.type === f.type);
    if (f.parent) rows = rows.filter((a) => a.parentId === f.parent);
    if (f.region) rows = rows.filter((a) => (a.areas || []).some((c) => c.includes(f.region)) || citiesForL1(a.parentId).includes(f.region));
    rows.sort((a, b) => {
      let av, bv;
      if (sortKey === 'parent') { av = l1Name(a.parentId); bv = l1Name(b.parentId); }
      else { av = a.name; bv = b.name; }
      return sortDir === 'asc' ? String(av).localeCompare(String(bv), 'zh') : String(bv).localeCompare(String(av), 'zh');
    });
    const sortMark = (k) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
    return `${pageHeader('二级代理商', '点击行进入详情（含解绑/改绑/围栏）')}
      ${filterBar(`
        <input class="field-input" placeholder="搜索" data-filter="agent-l2:q" value="${escapeHtml(f.q||'')}" />
        <select class="field-input" data-filter="agent-l2:type"><option value="">类型</option><option value="法人" ${f.type==='法人'?'selected':''}>法人</option><option value="个人" ${f.type==='个人'?'selected':''}>个人</option></select>
        <select class="field-input" data-filter="agent-l2:parent"><option value="">所属一级</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${f.parent===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input class="field-input" placeholder="所属地域/城市" data-filter="agent-l2:region" value="${escapeHtml(f.region||'')}" />
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr>
          <th>编码</th><th>名称</th><th>类型</th>
          <th class="sortable" data-action="sort-col" data-sort-key="parent" data-sort-scope="agent-l2">所属一级${sortMark('parent')}</th>
          <th>授权城市</th><th>状态</th><th>操作</th>
        </tr></thead>
        <tbody>${rows.map((a)=>`<tr class="row-clickable" data-row-action="view-agent-l2" data-id="${a.id}">
          <td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${tag(a.type, a.type==='法人'?'blue':'gray')}</td>
          <td>${escapeHtml(l1Name(a.parentId))}</td><td>${escapeHtml((a.areas||[]).join('、')||'—')}</td>
          <td>${tag(a.status, a.status==='启用'?'green':'gray')}</td>
          <td class="ops" onclick="event.stopPropagation()">
            <button class="btn btn-sm" data-go="l2-sales-detail" data-set-filter="l2-sales:l2Id=${a.id}">销售</button>
            <button class="btn btn-sm" data-go="l2-return-detail" data-set-filter="l2-return:l2Id=${a.id}">退货</button>
          </td>
        </tr>`).join('') || `<tr><td colspan="7">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageAgentL2Audit() {
    const rows = db.agentsL2.filter((a) => a.auditStatus === 'pending');
    return `${pageHeader('二级审核', '点击行进入详情，审核操作在详情内')}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>类型</th><th>申请一级</th><th>城市</th><th>状态</th></tr></thead>
        <tbody>${rows.map((a)=>`<tr class="row-clickable" data-row-action="view-l2-audit" data-id="${a.id}">
          <td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.type)}</td>
          <td>${escapeHtml(l1Name(a.parentId))}</td><td>${escapeHtml((a.areas||[]).join('、'))}</td>
          <td>${tag('待审核','orange')}</td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint('暂无待审')}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageAgentPending() {
    const rows = db.agentsL2.filter((a) => a.pending && a.type === '法人');
    return `${pageHeader('待分配二级（仅法人）', `共 ${rows.length} 家 · 点击行进入详情重新绑定`)}
      <div class="alert alert-info">一级停用/撤区后，其下属法人二级进入待分配池，需管理员重新绑定。</div>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>原一级</th><th>原城市</th><th>状态</th></tr></thead>
        <tbody>${rows.map((a)=>`<tr class="row-clickable" data-row-action="view-pending-l2" data-id="${a.id}">
          <td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td>
          <td>${escapeHtml(l1Name(a.prevParentId)||'—')}</td>
          <td>${escapeHtml((a.prevAreas||[]).join('、')||'—')}</td>
          <td>${tag('待分配','orange')}</td>
        </tr>`).join('') || `<tr><td colspan="5">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageProduct() {
    const kits = kitProducts();
    const parts = partProducts();
    const lines = db.productLines || [];
    const allKits = db.products.filter((p) => p.type === 'kit');
    return `${pageHeader('商品库', '套件 = 腰带 + 弹力带（分别选尺码）；配件不生成 SN',
      '<button class="btn btn-primary" data-action="open-create-product" data-ptype="kit">新建套件</button><button class="btn" data-action="open-create-product" data-ptype="part">新建配件</button>')}
      <div class="alert alert-info">${escapeHtml(STANDARD_COMBO_NOTE)} 当前产品线：<strong>${escapeHtml(lineName(activeLineId()))}</strong>
        ${(lines).map((l)=>`<button class="btn btn-sm ${activeLineId()===l.id?'btn-primary':''}" data-action="switch-line" data-id="${l.id}" style="margin-left:6px">${escapeHtml(l.name)}${l.active?'':' ·预留'}</button>`).join('')}
      </div>
      <h3 class="section-title">产品线（12.4）</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>状态</th><th>SKU数</th><th>说明</th></tr></thead>
        <tbody>${lines.map((l)=>`<tr>
          <td>${escapeHtml(l.code)}</td><td>${escapeHtml(l.name)}</td>
          <td>${tag(activeLineId()===l.id?'当前':'预留', activeLineId()===l.id?'green':'gray')}</td>
          <td class="num">${allKits.filter((p)=> (p.productLineId||'PL-MED')===l.id).length}</td>
          <td>${escapeHtml(l.note||'')}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <h3 class="section-title" style="margin-top:16px">套件商品（${escapeHtml(lineName(activeLineId()))}）</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>弹力带尺码</th><th>腰带尺码</th><th>标品组合</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${kits.map((p)=>`<tr>
          <td>${escapeHtml(p.code)}</td><td>${escapeHtml(p.name)}</td>
          <td>${(p.sizes||BAND_SIZES).map((s)=>tag(s,'blue')).join(' ')}</td>
          <td>${(p.belts||BELTS).map((b)=>tag(String(b).replace(/^腰带/,''),'green')).join(' ')}</td>
          <td>${kitStdCombos(p).map((k)=>tag(k.grade+'·'+k.size+'+'+String(k.belt).replace(/^腰带/,''),'orange')).join(' ') || '—'}</td>
          <td>${tag(p.status, p.status==='上架'?'green':'gray')}</td>
          <td class="ops"><button class="btn btn-sm" data-action="open-edit-product" data-id="${p.id}">修改</button></td>
        </tr>`).join('')}</tbody>
      </table></div>
      <h3 class="section-title" style="margin-top:16px">配件（无 SN）</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>规格</th><th>状态</th><th>说明</th><th>操作</th></tr></thead>
        <tbody>${parts.map((p)=>`<tr>
          <td>${escapeHtml(p.code)}</td><td>${escapeHtml(p.name)}</td>
          <td>${(p.sizes||[]).map((s)=>tag(s)).join(' ')}</td>
          <td>${tag(p.status,'green')}</td><td>${escapeHtml(p.note||'')}</td>
          <td class="ops"><button class="btn btn-sm" data-action="open-edit-product" data-id="${p.id}">修改</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`;
  }

  function pageSN() {
    const f = ui.filters.sn || {};
    let rows = db.sns.slice();
    if (f.sn) rows = rows.filter((s) => s.sn.toLowerCase().includes(f.sn.toLowerCase()));
    if (f.l1) rows = rows.filter((s) => s.l1Id === f.l1);
    if (f.l2) rows = rows.filter((s) => s.l2Id === f.l2);
    if (f.size) rows = rows.filter((s) => s.size === f.size);
    if (f.belt) rows = rows.filter((s) => s.belt === f.belt);
    if (f.channel === 'direct') rows = rows.filter((s) => s.status === 'bound' && !s.l2Id);
    if (f.channel === 'distribute') rows = rows.filter((s) => s.l2Id && (s.status === 'l2' || s.status === 'bound'));
    if (f.status) rows = rows.filter((s) => (f.status === 'frozen' ? (s.frozen || s.status === 'frozen') : s.status === f.status));
    if (f.factoryFrom || f.factoryTo) rows = rows.filter((s) => inDateRange(s.factoryAt || '', f.factoryFrom, f.factoryTo));
    if (f.soldFrom || f.soldTo) rows = rows.filter((s) => inDateRange(s.soldAt || s.bindAt || '', f.soldFrom, f.soldTo));
    if (f.returnFrom || f.returnTo) rows = rows.filter((s) => inDateRange(s.returnAt || '', f.returnFrom, f.returnTo));
    if ((f.from || f.to) && !(f.factoryFrom || f.soldFrom || f.returnFrom)) {
      rows = rows.filter((s) => inDateRange(s.soldAt || s.factoryAt || s.returnAt || s.bindAt || '', f.from, f.to));
    }
    rows = rows.slice(0, 200);
    return `${pageHeader('SN码库', '多维筛选 · 点击行查看生命周期/编辑', '<button class="btn" data-action="open-gen-sn">系统生成SN</button><button class="btn" data-action="open-import-sn-seg">Excel导入段号</button>')}
      ${filterBar(`
        <input class="field-input" placeholder="SN" data-filter="sn:sn" value="${escapeHtml(f.sn||'')}" />
        <select class="field-input" data-filter="sn:l1"><option value="">一级</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${f.l1===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:l2"><option value="">二级</option>${db.agentsL2.map((a)=>`<option value="${a.id}" ${f.l2===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:size"><option value="">弹力带尺码</option>${BAND_SIZES.map((s)=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:belt"><option value="">腰带尺码</option>${BELTS.map((s)=>`<option value="${s}" ${f.belt===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:status"><option value="">状态</option>${Object.entries(SN_STATUS_LABEL).map(([k,v])=>`<option value="${k}" ${f.status===k?'selected':''}>${v}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:channel"><option value="">渠道</option><option value="distribute" ${f.channel==='distribute'?'selected':''}>分销</option><option value="direct" ${f.channel==='direct'?'selected':''}>直销</option></select>
        <label class="muted">出厂</label><input type="date" class="field-input" data-filter="sn:factoryFrom" value="${escapeHtml(f.factoryFrom||'')}" /><input type="date" class="field-input" data-filter="sn:factoryTo" value="${escapeHtml(f.factoryTo||'')}" />
        <label class="muted">销售</label><input type="date" class="field-input" data-filter="sn:soldFrom" value="${escapeHtml(f.soldFrom||'')}" /><input type="date" class="field-input" data-filter="sn:soldTo" value="${escapeHtml(f.soldTo||'')}" />
        <label class="muted">退货</label><input type="date" class="field-input" data-filter="sn:returnFrom" value="${escapeHtml(f.returnFrom||'')}" /><input type="date" class="field-input" data-filter="sn:returnTo" value="${escapeHtml(f.returnTo||'')}" />
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>SN</th><th>商品</th><th>尺寸</th><th>腰带</th><th>一级</th><th>二级</th><th>状态</th><th>历史标签</th></tr></thead>
        <tbody>${rows.map((s)=>{
          const st = snStatusMeta(s);
          const hist = snHistoryTags(s);
          return `<tr class="row-clickable" data-row-action="view-sn" data-id="${s.sn}">
            <td class="num">${escapeHtml(s.sn)}</td>
            <td>${escapeHtml(productName(s.productId))}</td>
            <td>${escapeHtml(s.size)}</td><td>${escapeHtml(s.belt||'—')}</td>
            <td>${escapeHtml(l1Name(s.l1Id))}</td><td>${escapeHtml(l2Name(s.l2Id))}</td>
            <td>${tag(st.label, st.tone)}</td>
            <td>${hist.map((t)=>tag(t,'orange')).join(' ')||'—'}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="8">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }
  function pagePurchase() {
    const tab = ui.tabs.purchase || 'all';
    let rows = db.purchases.slice();
    if (tab !== 'all') rows = rows.filter((p) => p.status === tab);
    const tabItems = [
      { id: 'all', title: '全部' },
      { id: 'pending', title: '待审核' },
      { id: 'cosigning', title: '会签中' },
      { id: 'approved', title: '已生效' },
      { id: 'rejected', title: '已驳回' },
    ];
    return `${pageHeader('采购单管理', '一站式审核：标准/非标/配件 + 段号起止 + 双人会签即生效', '<button class="btn btn-primary" data-action="mini-create-po">新建采购申请</button><button class="btn" data-action="open-order-cart" data-channel="purchase" style="margin-left:8px">购物车式下单</button>')}
      ${tabsHtml('purchase', tabItems)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>一级</th><th>标准行</th><th>非标</th><th>配件</th><th>状态</th><th>会签</th><th>时间</th></tr></thead>
        <tbody>${rows.map((p)=>{
          const cos = p.cosign || {};
          return `<tr class="row-clickable" data-row-action="view-purchase" data-id="${p.id}">
            <td>${escapeHtml(p.no)}</td><td>${escapeHtml(l1Name(p.l1Id))}</td>
            <td>${(p.lines||[]).map((l)=>`${l.size}×${l.qty}`).join('，')||'—'}</td>
            <td>${(p.customLines||[]).map((l)=>`${l.size}+${l.belt}×${l.qty}`).join('，')||'—'}</td>
            <td>${(p.parts||[]).map((x)=>`${productName(x.partId)}/${x.spec}×${x.qty}`).join('，')||'—'}</td>
            <td>${tag(PO_STATUS[p.status]||p.status)}</td>
            <td>${cos.admin1?'✓':'-'}/${cos.admin2?'✓':'-'}</td>
            <td>${escapeHtml(p.createdAt)}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="8">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageSales() {
    const f = ui.filters.sales || {};
    let rows = db.sales.slice();
    if (f.channel) rows = rows.filter((s) => s.channel === f.channel);
    if (f.l1) rows = rows.filter((s) => s.l1Id === f.l1);
    if (f.status) rows = rows.filter((s) => s.status === f.status);
    return `${pageHeader('销售单管理', '分销 / 直售 · 点击行查看详情', '<button class="btn btn-primary" data-action="open-order-cart" data-channel="sales">购物车式下单</button>')}
      ${filterBar(`
        <select class="field-input" data-filter="sales:channel"><option value="">渠道</option><option value="distribute" ${f.channel==='distribute'?'selected':''}>分销</option><option value="direct" ${f.channel==='direct'?'selected':''}>直售</option></select>
        <select class="field-input" data-filter="sales:l1"><option value="">一级</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${f.l1===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="sales:status"><option value="">状态</option><option value="scanning" ${f.status==='scanning'?'selected':''}>扫码中</option><option value="done" ${f.status==='done'?'selected':''}>已完成</option></select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>渠道</th><th>一级</th><th>二级</th><th>商品明细</th><th>计划/已扫</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>${rows.map((s)=>`<tr class="row-clickable" data-row-action="view-sale" data-id="${s.id}">
          <td>${escapeHtml(s.no)}</td>
          <td>${tag(s.channel==='direct'?'直售':'分销', s.channel==='direct'?'orange':'blue')}</td>
          <td>${escapeHtml(l1Name(s.l1Id))}</td>
          <td>${s.channel==='direct'?'—':escapeHtml(l2Name(s.l2Id))}</td>
          <td>${escapeHtml(soProductDetail(s))}</td>
          <td class="num">${s.planTotal||0} / ${(s.scanned||[]).length}</td>
          <td>${tag(s.status==='done'?'已完成':'扫码中', s.status==='done'?'green':'orange')}</td>
          <td>${escapeHtml(s.createdAt)}</td>
        </tr>`).join('') || `<tr><td colspan="8">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageStock() {
    const f = ui.filters.stock || {};
    const agentType = f.type || 'l1';
    const agentId = f.agent || (agentType === 'l1' ? db.agentsL1[0]?.id : db.agentsL2[0]?.id);
    const rows = getStockRows(agentType, agentId);
    const snRows = getStockSns(agentType, agentId, f).slice(0, 200);
    const agents = agentType === 'l1' ? db.agentsL1 : db.agentsL2.filter((a) => !a.pending);
    return `${pageHeader('库存管理', '汇总 + SN 明细筛选')}
      ${filterBar(`
        <select class="field-input" data-filter="stock:type"><option value="l1" ${agentType==='l1'?'selected':''}>一级</option><option value="l2" ${agentType==='l2'?'selected':''}>二级</option></select>
        <select class="field-input" data-filter="stock:agent">${agents.map((a)=>`<option value="${a.id}" ${a.id===agentId?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input class="field-input" placeholder="SN" data-filter="stock:sn" value="${escapeHtml(f.sn||'')}" />
        <select class="field-input" data-filter="stock:productId"><option value="">商品</option>${kitProducts().map((p)=>`<option value="${p.id}" ${f.productId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="stock:size"><option value="">弹力带尺码</option>${BAND_SIZES.map((s)=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="stock:belt"><option value="">腰带尺码</option>${BELTS.map((s)=>`<option value="${s}" ${f.belt===s?'selected':''}>${s}</option>`).join('')}</select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>商品</th><th>弹力带尺码</th><th>腰带尺码</th><th>数量</th></tr></thead>
        <tbody>${rows.map((r)=>`<tr>
          <td>${escapeHtml(productName(r.productId))}</td><td>${escapeHtml(r.size)}</td>
          <td>${escapeHtml(r.belt||'—')}</td><td class="num">${r.qty}</td>
        </tr>`).join('') || `<tr><td colspan="4">${emptyHint()}</td></tr>`}</tbody>
      </table></div>
      <h3 class="section-title" style="margin-top:12px">在库 SN 明细（${snRows.length}）</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>SN</th><th>商品</th><th>弹力带</th><th>腰带</th><th>状态</th></tr></thead>
        <tbody>${snRows.map((s)=>{
          const st = snStatusMeta(s);
          return `<tr class="row-clickable" data-row-action="view-sn" data-id="${s.sn}">
            <td class="num">${escapeHtml(s.sn)}</td>
            <td>${escapeHtml(productName(s.productId))}</td>
            <td>${escapeHtml(s.size)}</td><td>${escapeHtml(s.belt||'—')}</td>
            <td>${tag(st.label, st.tone)}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="5">${emptyHint()}</td></tr>`}</tbody>
      </table></div>
      <h3 class="section-title" style="margin-top:12px">库存流水</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>时间</th><th>代理</th><th>商品</th><th>变动</th><th>原因</th><th>单号</th></tr></thead>
        <tbody>${db.stockLogs.slice(0,40).map((h)=>`<tr>
          <td>${escapeHtml(h.time)}</td>
          <td>${escapeHtml(h.agentType==='l1'?l1Name(h.agentId):l2Name(h.agentId))}</td>
          <td>${escapeHtml(productName(h.productId))}/${escapeHtml(h.size)}</td>
          <td class="num">${h.delta>0?'+':''}${h.delta}</td>
          <td>${escapeHtml(h.reason)}</td><td>${escapeHtml(h.ref||'')}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
  }

  function pageReturn() {
    const f = ui.filters.return || {};
    let rows = db.returns.slice();
    if (f.reasonType) rows = rows.filter((r) => r.reasonType === f.reasonType);
    if (f.status) rows = rows.filter((r) => r.status === f.status);
    rows.sort((a, b) => {
      const pa = a.status === 'pending' ? 0 : 1;
      const pb = b.status === 'pending' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return parseTime(b.createdAt) - parseTime(a.createdAt);
    });
    const monthQty = db.returns.filter((r) => inDateRange(r.createdAt, monthStart(), todayDate())).reduce((n, r) => n + (r.sns || []).length, 0);
    const histQty = db.returns.reduce((n, r) => n + (r.sns || []).length, 0);
    return `${pageHeader('返货管理', '列表含 SN · 统计可点进详情', '<button class="btn" data-go="stats">数据统计</button>')}
      <div class="metric-grid" style="margin-bottom:10px">
        ${metricCard('本月退货件数', monthQty, 'return')}
        ${metricCard('历史退货件数', histQty, 'return')}
        ${metricCard('待审单', db.returns.filter((r)=>r.status==='pending').length, 'return', 'return:status=pending')}
      </div>
      ${filterBar(`
        <select class="field-input" data-filter="return:reasonType"><option value="">退货理由</option>${RETURN_REASONS.map((r)=>`<option value="${r.type}" ${f.reasonType===r.type?'selected':''}>${r.label}</option>`).join('')}</select>
        <select class="field-input" data-filter="return:status"><option value="">状态</option><option value="pending" ${f.status==='pending'?'selected':''}>待审核</option><option value="approved" ${f.status==='approved'?'selected':''}>已通过</option><option value="done" ${f.status==='done'?'selected':''}>已处理</option><option value="rejected" ${f.status==='rejected'?'selected':''}>已驳回</option></select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>类型</th><th>来源</th><th>理由</th><th>SN码</th><th>商品明细</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>${rows.map((r)=>`<tr class="row-clickable" data-row-action="view-return" data-id="${r.id}">
          <td>${escapeHtml(r.no)}</td><td>${escapeHtml(r.typeLabel||r.type)}</td>
          <td>${escapeHtml(r.fromName||'')}</td>
          <td>${tag(r.reasonType||'其他')} ${escapeHtml(r.reason||'')}</td>
          <td>${(r.sns||[]).map((sn)=>`<code>${escapeHtml(sn)}</code>`).join('<br>')||'—'}</td>
          <td>${escapeHtml(snsProductDetail(r.sns))}</td>
          <td>${returnStatusTag(r.status)}</td><td>${escapeHtml(r.createdAt)}</td>
        </tr>`).join('') || `<tr><td colspan="8">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageException() {
    const dim = ui.tabs.exception || 'scan';
    const f = ui.filters.exception || {};
    const rules = db.exceptionRules || { overOrderRatio: 1.0, stockTurnover: db.exceptionMultiplier || 1.5 };
    let rows = db.exceptions.filter((e) => exceptionDim(e) === dim);
    if (f.status) rows = rows.filter((e) => e.status === f.status);
    if (f.from || f.to) rows = rows.filter((e) => inDateRange(e.time, f.from, f.to));
    if (f.type === 'dup') rows = rows.filter((e) => /客户信息重复/.test(e.type));
    if (f.l1) {
      const name = l1Name(f.l1);
      rows = rows.filter((e) => {
        const sn = db.sns.find((s) => s.sn === e.target);
        return (sn && sn.l1Id === f.l1) || String(e.target).includes(name) || String(e.detail || '').includes(name);
      });
    }
    const counts = {
      scan: db.exceptions.filter((e) => exceptionDim(e) === 'scan' && e.status === '未处理').length,
      activate: db.exceptions.filter((e) => exceptionDim(e) === 'activate' && e.status === '未处理').length,
      stock: db.exceptions.filter((e) => exceptionDim(e) === 'stock' && e.status === '未处理').length,
    };
    const histTotal = db.exceptions.filter((e) => exceptionDim(e) === dim).length;
    const openN = getOpenExceptionIdsInFilter().length;
    return `${pageHeader('异常管理', '扫码 / 激活 / 销售库存 · 未处理加粗')}
      <div class="page-card" style="margin-bottom:12px;padding:14px;border:1px solid var(--primary);background:rgba(15,118,110,.04)">
        <div style="font-weight:600;margin-bottom:8px">异常标准配置（平台可改）</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <label style="font-size:12px">全局倍数 <input class="field-input" style="width:70px" type="number" step="0.1" value="${db.exceptionMultiplier}" id="f-ex-mult" /></label>
          <label style="font-size:12px">超量比 <input class="field-input" style="width:70px" type="number" step="0.1" value="${rules.overOrderRatio}" id="f-ex-over" /></label>
          <label style="font-size:12px">周转比 <input class="field-input" style="width:70px" type="number" step="0.1" value="${rules.stockTurnover}" id="f-ex-turn" /></label>
          <button class="btn btn-sm btn-primary" data-action="save-ex-rules">保存标准</button>
          <span class="muted">一级/二级详情可单独设严格/软报警</span>
        </div>
      </div>
      ${tabsHtml('exception', [
        { id: 'scan', title: '扫码异常', badge: counts.scan || null },
        { id: 'activate', title: '激活异常', badge: counts.activate || null },
        { id: 'stock', title: '销售库存异常', badge: counts.stock || null },
      ])}
      <div class="metric-grid" style="margin-bottom:10px">
        <div class="metric-card"><div class="metric-label">当前筛选</div><div class="metric-value num">${rows.length}</div></div>
        <div class="metric-card"><div class="metric-label">本维历史总量</div><div class="metric-value num">${histTotal}</div></div>
        <div class="metric-card"><div class="metric-label">未处理(当前筛)</div><div class="metric-value num">${openN}</div></div>
        <div class="metric-card"><div class="metric-label">预警倍数</div><div class="metric-value num">${db.exceptionMultiplier}×</div></div>
      </div>
      ${filterBar(`
        <select class="field-input" data-filter="exception:status"><option value="">状态</option><option value="未处理" ${f.status==='未处理'?'selected':''}>未处理</option><option value="已处理" ${f.status==='已处理'?'selected':''}>已处理</option><option value="仅记录" ${f.status==='仅记录'?'selected':''}>仅记录</option></select>
        <select class="field-input" data-filter="exception:type"><option value="">类型快捷</option><option value="dup" ${f.type==='dup'?'selected':''}>客户信息重复</option></select>
        <select class="field-input" data-filter="exception:l1"><option value="">关联一级</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${f.l1===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input type="date" class="field-input" data-filter="exception:from" value="${escapeHtml(f.from||'')}" />
        <input type="date" class="field-input" data-filter="exception:to" value="${escapeHtml(f.to||'')}" />
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>时间</th><th>类型</th><th>对象</th><th>详情</th><th>一级解释</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${rows.map((e)=>{
          const bold = e.status === '未处理' ? 'ex-bold' : '';
          return `<tr class="${bold} row-clickable" data-row-action="view-exception" data-id="${e.id}">
            <td>${escapeHtml(e.time)}</td><td>${escapeHtml(e.type)}${e.warnMode==='soft'?tag('软','gray'):''}</td>
            <td>${escapeHtml(e.target)}</td><td>${escapeHtml(e.detail)}</td>
            <td>${escapeHtml(e.explain || '—')}</td>
            <td>${tag(e.status, e.status==='未处理'?'orange':(e.status==='仅记录'?'gray':'green'))}</td>
            <td class="ops" onclick="event.stopPropagation()">${e.status==='未处理'?`<button class="btn btn-sm" data-action="close-exception" data-id="${e.id}">处理</button>
              ${e.type.includes('超量')?`<button class="btn btn-sm" data-action="edit-ex-explain" data-id="${e.id}">填解释</button>`:''}
              ${/客户信息重复/.test(e.type)?`<button class="btn btn-sm" data-action="view-dup-customer" data-id="${e.id}">查看重复</button>`:''}`:'—'}
              ${e.target && String(e.target).startsWith('RL')?`<button class="btn btn-sm" data-action="open-view-sn" data-id="${e.target}">看SN</button>`:''}
            </td>
          </tr>`;
        }).join('') || `<tr><td colspan="7">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageStats() {
    const from = (ui.filters.stats || {}).from || monthStart();
    const to = (ui.filters.stats || {}).to || todayDate();
    const poAll = db.purchases.filter((p) => p.status === 'approved');
    const poMonth = poAll.filter((p) => inDateRange(p.createdAt, from, to));
    const poQty = (list) => list.reduce((n, p) => n + purchaseNeedQty(p), 0);
    const soDone = db.sales.filter((s) => s.status === 'done');
    const soDist = soDone.filter((s) => s.channel === 'distribute');
    const soDir = soDone.filter((s) => s.channel === 'direct');
    const saleQty = (list, fr, t) => list.filter((s) => inDateRange(s.createdAt, fr, t)).reduce((n, s) => n + (s.scanned || []).length, 0);
    const distRange = saleQty(soDist, from, to);
    const dirRange = saleQty(soDir, from, to);
    const saleRange = distRange + dirRange;
    const actMonth = db.sns.filter((s) => s.status === 'bound' && inDateRange(s.soldAt || s.bindAt, from, to)).length;
    const actAll = db.sns.filter((s) => s.status === 'bound').length;
    const rtMonth = db.returns.filter((r) => inDateRange(r.createdAt, from, to)).reduce((n, r) => n + (r.sns || []).length, 0);
    const rtPending = pendingReturnCount();
    const exOpen = openExCount();
    const poPending = pendingPoCount();
    const days = eachDateStr(from, to);
    const trendSales = days.map((d) => saleQty(soDone, d, d));
    const trendPo = days.map((d) => poQty(poAll.filter((p) => inDateRange(p.createdAt, d, d))));
    const trendAct = days.map((d) => db.sns.filter((s) => s.status === 'bound' && inDateRange(s.soldAt || s.bindAt, d, d)).length);
    const dayLabels = days.map((d) => d.slice(5));
    const snStatus = [
      { label: '原厂', value: db.sns.filter((s) => s.status === 'warehouse').length, color: '#64748b' },
      { label: '一级', value: db.sns.filter((s) => s.status === 'l1').length, color: '#38bdf8' },
      { label: '二级', value: db.sns.filter((s) => s.status === 'l2' || s.reIn).length, color: '#2dd4a8' },
      { label: '已售', value: actAll, color: '#00a46e' },
      { label: '冷冻/退厂', value: db.sns.filter((s) => s.status === 'frozen' || s.status === 'factory').length, color: '#f59e0b' },
    ];
    const channelPie = [
      { label: '分销', value: distRange || saleQty(soDist), color: '#2dd4a8' },
      { label: '直销', value: dirRange || saleQty(soDir), color: '#38bdf8' },
    ];
    const l1Rank = db.agentsL1.map((a) => {
      const q = soDone.filter((s) => s.l1Id === a.id && inDateRange(s.createdAt, from, to))
        .reduce((n, s) => n + (s.scanned || []).length, 0);
      return { label: a.name.replace(/锐涞|总代|代理/g, '').slice(0, 8) || a.name, value: q };
    }).sort((a, b) => b.value - a.value);
    const exByType = {};
    db.exceptions.forEach((e) => { exByType[e.type || '其他'] = (exByType[e.type || '其他'] || 0) + 1; });
    const exBars = Object.entries(exByType).map(([label, value]) => ({ label: label.slice(0, 8), value }))
      .sort((a, b) => b.value - a.value).slice(0, 6);
    const rtByStatus = [
      { label: '待审', value: db.returns.filter((r) => r.status === 'pending').length, color: '#f59e0b' },
      { label: '已通过', value: db.returns.filter((r) => r.status === 'approved').length, color: '#2dd4a8' },
      { label: '已处理', value: db.returns.filter((r) => r.status === 'done').length, color: '#38bdf8' },
      { label: '已驳回', value: db.returns.filter((r) => r.status === 'rejected').length, color: '#f87171' },
    ];
    const sizeMap = {};
    soDone.filter((s) => inDateRange(s.createdAt, from, to)).forEach((s) => {
      Object.entries(s.planBySize || {}).forEach(([sz, q]) => { sizeMap[sz] = (sizeMap[sz] || 0) + Number(q || 0); });
    });
    const sizeBars = BAND_SIZES.map((sz) => ({ label: sz, value: sizeMap[sz] || 0 }));
    const kpi = (label, value, go, filter, tone = '') =>
      `<button type="button" class="dash-kpi ${tone}" ${go ? `data-go="${go}"` : ''}${filter ? ` data-set-filter="${filter}"` : ''}>
        <span class="dash-kpi-label">${escapeHtml(label)}</span>
        <strong class="dash-kpi-value num">${value}</strong>
      </button>`;

    return `<div class="dash">
      <div class="dash-toolbar">
        <span class="dash-toolbar-hint">点击指标可下钻列表</span>
        <div class="dash-filters">
          <input type="date" class="field-input dash-input" data-filter="stats:from" value="${from}" />
          <span class="dash-sep">→</span>
          <input type="date" class="field-input dash-input" data-filter="stats:to" value="${to}" />
          <button class="btn btn-sm dash-query" data-action="apply-filter">刷新</button>
        </div>
      </div>

      <div class="dash-kpis">
        ${kpi('区间销量 SN', saleRange, 'sn')}
        ${kpi('区间采购量', poQty(poMonth), 'purchase')}
        ${kpi('区间激活', actMonth, 'sn', 'sn:status=bound')}
        ${kpi('待审采购', poPending, 'purchase', '', poPending ? 'warn' : '')}
        ${kpi('待审退货', rtPending, 'return', 'return:status=pending', rtPending ? 'warn' : '')}
        ${kpi('未处理异常', exOpen, 'exception', 'exception:status=未处理', exOpen ? 'danger' : '')}
      </div>

      <div class="dash-grid">
        <section class="dash-panel dash-panel--wide">
          <header class="dash-panel-hd"><h3>业务趋势</h3><span>销量 / 采购入库 / 激活</span></header>
          ${svgMultiLine(dayLabels, [
            { name: '销量', color: '#2dd4a8', values: trendSales },
            { name: '采购', color: '#38bdf8', values: trendPo },
            { name: '激活', color: '#fbbf24', values: trendAct },
          ])}
        </section>
        <section class="dash-panel">
          <header class="dash-panel-hd"><h3>销售渠道</h3><span>区间出货构成</span></header>
          ${svgDonut(channelPie)}
        </section>
        <section class="dash-panel">
          <header class="dash-panel-hd"><h3>一级代理销量榜</h3><span>区间 SN</span></header>
          ${svgHBars(l1Rank, '#2dd4a8')}
        </section>
        <section class="dash-panel">
          <header class="dash-panel-hd"><h3>SN 生命周期分布</h3><span>全库现状</span></header>
          ${svgDonut(snStatus)}
        </section>
        <section class="dash-panel">
          <header class="dash-panel-hd"><h3>尺码结构</h3><span>区间计划尺码</span></header>
          ${svgVBars(sizeBars, '#38bdf8')}
        </section>
        <section class="dash-panel">
          <header class="dash-panel-hd"><h3>异常类型</h3><span>历史累计</span></header>
          ${svgHBars(exBars, '#f87171')}
        </section>
        <section class="dash-panel">
          <header class="dash-panel-hd"><h3>退货状态</h3><span>区间外全库单量</span></header>
          ${svgDonut(rtByStatus)}
          <div class="dash-footnote">区间退货件数 <strong class="num">${rtMonth}</strong></div>
        </section>
        <section class="dash-panel dash-panel--wide">
          <header class="dash-panel-hd"><h3>经营快照</h3><span>可下钻</span></header>
          <div class="dash-snap">
            <button type="button" class="dash-snap-item" data-go="purchase"><span>历史采购总量</span><strong class="num">${poQty(poAll)}</strong></button>
            <button type="button" class="dash-snap-item" data-go="sn" data-set-filter="sn:channel=distribute"><span>分销历史</span><strong class="num">${saleQty(soDist)}</strong></button>
            <button type="button" class="dash-snap-item" data-go="sn" data-set-filter="sn:channel=direct"><span>直销历史</span><strong class="num">${saleQty(soDir)}</strong></button>
            <button type="button" class="dash-snap-item" data-go="sn" data-set-filter="sn:status=bound"><span>历史激活</span><strong class="num">${actAll}</strong></button>
            <button type="button" class="dash-snap-item" data-go="return"><span>历史退货件数</span><strong class="num">${db.returns.reduce((n, r) => n + (r.sns || []).length, 0)}</strong></button>
            <button type="button" class="dash-snap-item" data-go="exception"><span>异常总量</span><strong class="num">${db.exceptions.length}</strong></button>
          </div>
        </section>
      </div>
    </div>`;
  }

  function eachDateStr(from, to) {
    const out = [];
    const cur = new Date(String(from).replace(/-/g, '/'));
    const end = new Date(String(to).replace(/-/g, '/'));
    if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime())) return [from];
    let guard = 0;
    while (cur <= end && guard < 62) {
      const p = (n) => String(n).padStart(2, '0');
      out.push(`${cur.getFullYear()}-${p(cur.getMonth() + 1)}-${p(cur.getDate())}`);
      cur.setDate(cur.getDate() + 1);
      guard += 1;
    }
    return out.length ? out : [from];
  }

  function svgMultiLine(labels, series) {
    const W = 640; const H = 220; const pad = { l: 36, r: 16, t: 18, b: 32 };
    const iw = W - pad.l - pad.r; const ih = H - pad.t - pad.b;
    const maxV = Math.max(1, ...series.flatMap((s) => s.values));
    const n = Math.max(1, labels.length - 1);
    const xAt = (i) => pad.l + (labels.length <= 1 ? iw / 2 : (i / n) * iw);
    const yAt = (v) => pad.t + ih - (v / maxV) * ih;
    const paths = series.map((s) => {
      const pts = s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
      const area = `${xAt(0)},${pad.t + ih} ${pts} ${xAt(s.values.length - 1)},${pad.t + ih}`;
      return `<polygon points="${area}" fill="${s.color}22"></polygon>
        <polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"></polyline>
        ${s.values.map((v, i) => `<circle cx="${xAt(i)}" cy="${yAt(v)}" r="3" fill="${s.color}"></circle>`).join('')}`;
    }).join('');
    const yTicks = [0, 0.5, 1].map((t) => {
      const v = Math.round(maxV * t);
      const y = yAt(v);
      return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="#e7eeec"></line>
        <text x="${pad.l - 6}" y="${y + 3}" text-anchor="end" class="dash-svg-label">${v}</text>`;
    }).join('');
    const step = labels.length > 10 ? Math.ceil(labels.length / 8) : 1;
    const xLabs = labels.map((lb, i) => (i % step === 0 || i === labels.length - 1)
      ? `<text x="${xAt(i)}" y="${H - 8}" text-anchor="middle" class="dash-svg-label">${escapeHtml(lb)}</text>` : '').join('');
    const legend = series.map((s) => `<span><i style="background:${s.color}"></i>${escapeHtml(s.name)}</span>`).join('');
    return `<div class="dash-chart">${paths ? `<svg viewBox="0 0 ${W} ${H}" class="dash-svg" role="img">${yTicks}${paths}${xLabs}</svg>` : emptyHint('暂无趋势')}
      <div class="dash-legend">${legend}</div></div>`;
  }

  function svgDonut(items) {
    const data = (items || []).filter((x) => x.value > 0);
    const total = data.reduce((n, x) => n + x.value, 0) || 1;
    const R = 54; const r = 34; const cx = 70; const cy = 70;
    let ang = -Math.PI / 2;
    const arcs = (data.length ? data : [{ label: '空', value: 1, color: '#334155' }]).map((it) => {
      const sweep = (it.value / total) * Math.PI * 2;
      const a0 = ang; const a1 = ang + sweep; ang = a1;
      const large = sweep > Math.PI ? 1 : 0;
      const x0 = cx + R * Math.cos(a0); const y0 = cy + R * Math.sin(a0);
      const x1 = cx + R * Math.cos(a1); const y1 = cy + R * Math.sin(a1);
      const xi0 = cx + r * Math.cos(a1); const yi0 = cy + r * Math.sin(a1);
      const xi1 = cx + r * Math.cos(a0); const yi1 = cy + r * Math.sin(a0);
      const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
      return `<path d="${d}" fill="${it.color || '#2dd4a8'}"><title>${escapeHtml(it.label)} ${it.value}</title></path>`;
    }).join('');
    const legend = (items || []).map((it) => `<div class="dash-donut-row"><span><i style="background:${it.color}"></i>${escapeHtml(it.label)}</span><strong class="num">${it.value}</strong></div>`).join('');
    return `<div class="dash-donut">
      <svg viewBox="0 0 140 140" class="dash-svg dash-svg--donut">${arcs}
        <text x="70" y="66" text-anchor="middle" class="dash-svg-center num">${data.reduce((n, x) => n + x.value, 0)}</text>
        <text x="70" y="84" text-anchor="middle" class="dash-svg-label">合计</text>
      </svg>
      <div class="dash-donut-legend">${legend}</div>
    </div>`;
  }

  function svgHBars(items, color = '#2dd4a8') {
    const rows = (items || []).slice(0, 6);
    const maxV = Math.max(1, ...rows.map((x) => x.value));
    if (!rows.length) return emptyHint('暂无数据');
    return `<div class="dash-hbars">${rows.map((it) => {
      const pct = Math.max(4, Math.round((it.value / maxV) * 100));
      return `<div class="dash-hbar">
        <span class="dash-hbar-label" title="${escapeHtml(it.label)}">${escapeHtml(it.label)}</span>
        <div class="dash-hbar-track"><div class="dash-hbar-fill" style="width:${pct}%;background:${color}"></div></div>
        <strong class="dash-hbar-val num">${it.value}</strong>
      </div>`;
    }).join('')}</div>`;
  }

  function svgVBars(items, color = '#38bdf8') {
    const rows = items || [];
    const maxV = Math.max(1, ...rows.map((x) => x.value));
    return `<div class="dash-vbars">${rows.map((it) => {
      const pct = Math.max(it.value ? 8 : 2, Math.round((it.value / maxV) * 100));
      return `<div class="dash-vbar">
        <strong class="num">${it.value}</strong>
        <div class="dash-vbar-col"><div class="dash-vbar-fill" style="height:${pct}%;background:${color}"></div></div>
        <span>${escapeHtml(it.label)}</span>
      </div>`;
    }).join('')}</div>`;
  }

  function pageRole() {
    return `${pageHeader('角色与权限', '创建账号 / 一级子账号（仅扫码）· 角色权限可编辑', '<button class="btn btn-primary" data-action="open-create-account">新建账号</button>')}
      <h3 class="section-title">角色</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>角色</th><th>说明</th><th>权限</th><th>账号数</th><th>操作</th></tr></thead>
        <tbody>${db.roles.map((r)=>`<tr>
          <td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.desc)}</td>
          <td>${(r.perms||[]).map((p)=>tag(permLabel(p))).join(' ') || '—'}</td>
          <td class="num">${db.accounts.filter((a)=>a.roleId===r.id).length}</td>
          <td class="ops"><button class="btn btn-sm" data-action="open-edit-role" data-id="${r.id}">编辑权限</button></td>
        </tr>`).join('')}</tbody>
      </table></div>
      <h3 class="section-title" style="margin-top:12px">账号</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>用户名</th><th>姓名</th><th>角色</th><th>关联代理</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${db.accounts.map((a)=>{
          const role = db.roles.find((r)=>r.id===a.roleId);
          return `<tr>
            <td>${escapeHtml(a.username)}</td><td>${escapeHtml(a.name)}</td>
            <td>${escapeHtml(role?.name||'')}</td>
            <td>${escapeHtml(a.agentId ? (l1Name(a.agentId)!=='—'?l1Name(a.agentId):l2Name(a.agentId)) : '—')}</td>
            <td>${tag(a.status, a.status==='启用'?'green':'gray')}</td>
            <td class="ops"><button class="btn btn-sm" data-action="toggle-account" data-id="${a.id}">${a.status==='启用'?'停用':'启用'}</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
      <h3 class="section-title" style="margin-top:12px">一级子账号 <button class="btn btn-sm btn-primary" data-action="open-create-sub">创建子账号</button></h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>用户名</th><th>姓名</th><th>所属一级</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${db.subAccounts.map((s)=>`<tr>
          <td>${escapeHtml(s.username)}</td><td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(l1Name(s.l1Id))}</td>
          <td>${tag(s.status, s.status==='启用'?'green':'gray')}</td>
          <td class="ops"><button class="btn btn-sm" data-action="toggle-sub" data-id="${s.id}">${s.status==='启用'?'停用':'启用'}</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`;
  }

  function pageLog() {
    const f = ui.filters.log || {};
    let rows = db.logs.slice();
    if (f.q) rows = rows.filter((l) => `${l.action}${l.account}${l.role}`.toLowerCase().includes(f.q.toLowerCase()));
    if (f.type) rows = rows.filter((l) => (l.type || 'op') === f.type);
    rows = rows.slice(0, 150);
    return `${pageHeader('操作日志', '12.1 关键操作留痕：审核 / 改码 / 调库 / 异常 / 导入生成等')}
      ${filterBar(`
        <input class="field-input" placeholder="搜索动作/账号" data-filter="log:q" value="${escapeHtml(f.q||'')}" />
        <select class="field-input" data-filter="log:type">
          <option value="">全部类型</option>
          ${Object.keys(LOG_TYPE_LABELS).map((t)=>`<option value="${t}" ${f.type===t?'selected':''}>${LOG_TYPE_LABELS[t]}</option>`).join('')}
        </select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>时间</th><th>账号</th><th>角色</th><th>类型</th><th>动作</th><th>IP</th><th>结果</th></tr></thead>
        <tbody>${rows.map((l)=>`<tr>
          <td>${escapeHtml(l.time)}</td><td>${escapeHtml(l.account)}</td><td>${escapeHtml(l.role)}</td>
          <td>${tag(logTypeLabel(l.type||'op'))}</td>
          <td>${escapeHtml(l.action)}</td><td>${escapeHtml(l.ip)}</td>
          <td>${tag(l.ok?'成功':'失败', l.ok?'green':'red')}</td>
        </tr>`).join('') || `<tr><td colspan="7">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  /* ---------- Mini pages ---------- */
  function pageMiniScan() {
    if (ui.role === 'sub') {
      return pageMiniShipScan(true);
    }
    if (ui.role === 'l2') {
      ui.scanMode = 'direct';
      return `<div class="mini-page-title">扫码</div>
        <div class="alert alert-info">出库不适用（二级不发货给下级）</div>
        <p class="mini-page-desc">提示：库存查看请用「库存」页；查询单个 SN 也可在库存页搜索。本页仅做直销激活。</p>
        <div class="scan-mode-grid">
          <button type="button" class="scan-mode-card on" data-action="set-scan-mode" data-scan-mode="direct"><strong>直销激活</strong><span>先扫码再填客户</span></button>
        </div>
        <div style="margin-top:14px">${pageMiniDirectScan()}</div>`;
    }
    const mode = ui.scanMode || 'ship';
    return `<div class="mini-page-title">扫码</div>
      <p class="mini-page-desc">出货扫码 / 直销激活（已去掉查询扫码）</p>
      <div class="scan-mode-grid">
        <button type="button" class="scan-mode-card ${mode==='ship'?'on':''}" data-action="set-scan-mode" data-scan-mode="ship"><strong>出货扫码</strong><span>分销给二级</span></button>
        <button type="button" class="scan-mode-card ${mode==='direct'?'on':''}" data-action="set-scan-mode" data-scan-mode="direct"><strong>直销激活</strong><span>先扫码再填客户</span></button>
      </div>
      <div style="margin-top:14px">${mode==='direct'?pageMiniDirectScan():pageMiniShipScan(false)}</div>`;
  }

  function pageMiniShipScan(subOnly) {
    const open = db.sales.filter((s) => s.l1Id === currentL1Id() && s.channel === 'distribute' && s.status === 'scanning');
    return `${subOnly?'<div class="mini-page-title">销售扫码</div><p class="mini-page-desc">子账号仅可扫码出货，不可改单</p>':''}
      ${!subOnly?`<button class="btn btn-primary btn-block" data-action="open-order-cart" data-channel="sales" style="margin-bottom:10px">购物车式下单</button>`:''}
      <div class="mini-list">${open.map((s)=>`<button type="button" class="mini-list-item" data-action="mini-open-scan-so" data-id="${s.id}">
        <strong>${escapeHtml(s.no)}</strong>
        <span>${escapeHtml(l2Name(s.l2Id))} · ${escapeHtml(soProductDetail(s))}</span>
        <span>${(s.scanned||[]).length}/${s.planTotal}</span>
      </button>`).join('') || emptyHint('暂无进行中出货单')}</div>`;
  }

  function pageMiniDirectScan() {
    const step = ui.directStep || 1;
    const sn = ui.form.directSn || '';
    const row = sn ? db.sns.find((s) => s.sn === sn) : null;
    if (step === 1) {
      return `<div class="alert alert-info">步骤 1/2：先扫描 SN，校验通过后再填写客户信息</div>
        <div class="form-field"><label>SN</label><input class="field-input" id="direct-sn" placeholder="扫描 SN" value="${escapeHtml(sn)}" /></div>
        <button class="btn btn-primary btn-block" data-action="mini-direct-step1">下一步：填写客户</button>`;
    }
    return `<div class="alert alert-info">步骤 2/2：填写客户 · SN ${escapeHtml(sn)} · ${escapeHtml(row ? productName(row.productId) + '/' + row.size : '')}</div>
      <div class="form-field"><label>客户手机</label><input class="field-input" id="direct-phone" placeholder="11位手机号" value="13800138000" /></div>
      <div class="form-field"><label>地址</label><input class="field-input" id="direct-addr" value="杭州市西湖区文一路1号" /></div>
      <div class="form-field"><label>演示IP地区</label>
        <select class="field-input" id="demo-ip">${ALL_REGIONS.map((r)=>`<option value="${r}" ${db.demoIpRegion===r?'selected':''}>${r}</option>`).join('')}</select>
      </div>
      <p class="mini-page-desc">校验：IP 须在直销围栏内；手机归属地须与 IP 地区一致。</p>
      <button class="btn btn-block" data-action="mini-direct-back" style="margin-bottom:8px">返回扫码</button>
      <button class="btn btn-primary btn-block" data-action="mini-direct-bind">校验并激活</button>`;
  }

  function miniPurchaseBody() {
    const f = ui.filters.miniPo || {};
    let list = db.purchases.filter((p) => p.l1Id === currentL1Id());
    list = list.filter((p) => matchTimeSnFilter(p.createdAt, purchaseSnHaystack(p), f));
    list = list.slice().sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
    return `<p class="mini-page-desc">发起采购申请（标准/非标/配件）</p>
      <button class="btn btn-primary btn-block" data-action="mini-create-po">新建采购申请</button>
      <button class="btn btn-block" data-action="open-order-cart" data-channel="purchase" style="margin-top:8px">购物车式下单</button>
      ${miniTimeSnFilters('miniPo')}
      <div class="mini-list" style="margin-top:8px">${list.map((p)=>`<button type="button" class="mini-list-item" data-action="open-view-purchase" data-id="${p.id}">
        <strong class="rt-row-hd"><span>${escapeHtml(p.no)}</span>${tag(PO_STATUS[p.status]||p.status)}</strong>
        <span>${escapeHtml(p.createdAt)}</span>
        <span>${escapeHtml((p.lines||[]).map((l)=>`${productName(l.productId)}/${l.size}×${l.qty}`).join('，') || '—')}</span>
        <span class="muted">${escapeHtml(purchaseSnHaystack(p).filter((x)=>x!==p.no).join(' ')||'暂无号段')}</span>
      </button>`).join('') || emptyHint()}</div>`;
  }

  function miniSalesBody() {
    const f = ui.filters.miniSo || {};
    let list = ui.role === 'l2'
      ? db.sales.filter((s) => s.l2Id === currentL2Id())
      : db.sales.filter((s) => s.l1Id === currentL1Id() && s.channel !== 'direct');
    list = list.filter((s) => matchTimeSnFilter(s.createdAt, s.scanned || [], f));
    list = list.slice().sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
    const actions = ui.role === 'l2' ? '' : `<button class="btn btn-primary btn-block" data-action="open-order-cart" data-channel="sales" style="margin-bottom:10px">购物车式下单</button>`;
    return `${actions}
      ${ui.role==='l2'?`<div class="alert alert-info">本级销售记录（点开详情看商品与 SN）</div>`:''}
      ${miniTimeSnFilters('miniSo')}
      <div class="mini-list" style="margin-top:8px">${list.map((s)=>`<button type="button" class="mini-list-item" data-action="open-view-sale" data-id="${s.id}">
        <strong class="rt-row-hd"><span>${escapeHtml(s.no)}</span>${saleStatusTag(s.status)}</strong>
        <span>${tag(s.channel==='direct'?'直售':'分销')} ${escapeHtml(soProductDetail(s))}</span>
        <span>${(s.scanned||[]).length}/${s.planTotal} · ${escapeHtml(s.createdAt||'')}</span>
        <span class="muted">${escapeHtml((s.scanned||[]).join(' ')||'暂无 SN')}</span>
      </button>`).join('') || emptyHint()}</div>`;
  }

  function miniCendBody() {
    const f = ui.filters.miniCend || {};
    const list = listCendOrders().filter((o) => matchTimeSnFilter(o.createdAt, o.sns || [], f));
    return `<p class="mini-page-desc">C 端客户订单（直销激活 / 用户绑定）</p>
      ${miniTimeSnFilters('miniCend')}
      <div class="mini-list" style="margin-top:8px">${list.map((o)=>`<button type="button" class="mini-list-item" data-action="open-view-cend" data-id="${o.id}">
        <strong class="rt-row-hd"><span>${escapeHtml(o.no)}</span>${tag('C端','orange')}</strong>
        <span>${escapeHtml(o.phone)} · ${escapeHtml(o.addr)}</span>
        <span>${escapeHtml(o.detail)}</span>
        <span class="muted">${escapeHtml((o.sns||[]).join(' '))} · ${escapeHtml(o.createdAt||'')}</span>
      </button>`).join('') || emptyHint('暂无 C 端订单')}</div>`;
  }

  function miniAftersaleBody() {
    const pendingL2 = ui.role === 'l1'
      ? db.returns.filter((r) => r.type === 'l2_to_l1' && r.status === 'pending' && r.approverId === currentL1Id())
      : [];
    let list = ui.role === 'l2'
      ? db.returns.filter((r) => r.fromId === currentL2Id())
      : db.returns.filter((r) => r.fromId === currentL1Id() || r.approverId === currentL1Id() || (r.sns||[]).some((sn)=>db.sns.find(s=>s.sn===sn&&s.l1Id===currentL1Id())));
    const pendingCnt = list.filter((r) => r.status === 'pending').length;
    const statusTab = ui.tabs.miniRtStatus || 'all';
    if (statusTab !== 'all') list = list.filter((r) => r.status === statusTab);
    list = list.slice().sort((a, b) => {
      const pa = a.status === 'pending' ? 0 : 1;
      const pb = b.status === 'pending' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return parseTime(b.createdAt) - parseTime(a.createdAt);
    });
    return `${ui.role==='l2'?`<button class="btn btn-block" data-action="mini-create-return" style="margin-bottom:10px">向上申请退货</button>`:`<button class="btn btn-block" data-action="mini-create-return" style="margin-bottom:10px">申请退货</button>`}
      ${pendingL2.length?`<div class="alert alert-info">待审二级退一级 ${pendingL2.length} 单（点进详情审核）</div>`:''}
      ${miniSegHtml('miniRtStatus', [
        { id: 'all', title: '全部' },
        { id: 'pending', title: '待审核', badge: pendingCnt || null },
        { id: 'approved', title: '已通过' },
        { id: 'done', title: '已处理' },
      ])}
      <div class="mini-list">${list.map((r)=>`<button type="button" class="mini-list-item ${r.status==='pending'?'rt-pending':''}" data-action="open-view-return" data-id="${r.id}">
        <strong class="rt-row-hd"><span>${escapeHtml(r.no)}</span>${returnStatusTag(r.status)}</strong>
        <span>${tag(r.reasonType||'')} ${escapeHtml(r.reason||'')}</span>
        <span>${(r.sns||[]).map((sn)=>escapeHtml(sn)).join(' ')||escapeHtml(snsProductDetail(r.sns))}</span>
      </button>`).join('') || emptyHint()}</div>`;
  }

  function miniExceptionBody() {
    const dim = ui.tabs.miniEx || 'all';
    let list = db.exceptions.filter((e) => {
      const sn = db.sns.find((s) => s.sn === e.target);
      if (ui.role === 'l2') {
        return (sn && sn.l2Id === currentL2Id()) || String(e.target).includes(l2Name(currentL2Id()));
      }
      return (sn && sn.l1Id === currentL1Id()) || String(e.target).includes(l1Name(currentL1Id())) || String(e.detail || '').includes(l1Name(currentL1Id()));
    });
    if (dim !== 'all') list = list.filter((e) => exceptionDim(e) === dim);
    return `${miniSegHtml('miniEx', [
      { id: 'all', title: '全部' },
      { id: 'scan', title: '扫码' },
      { id: 'activate', title: '激活' },
      { id: 'stock', title: '库存' },
    ])}
      <div class="mini-list">${list.map((e)=>`<button type="button" class="mini-list-item ${e.status==='未处理'?'ex-bold':''}" data-action="open-view-exception" data-id="${e.id}">
        <strong>${escapeHtml(e.type)}</strong>
        <span>${tag(exceptionDim(e)==='scan'?'扫码':exceptionDim(e)==='stock'?'库存':'激活')}</span>
        <span>${escapeHtml(e.target)}</span>
        <span>${escapeHtml(e.detail)}</span>
        <span>${tag(e.status)}</span>
      </button>`).join('') || emptyHint()}</div>`;
  }

  function pageMiniBiz() {
    const items = ui.role === 'l2'
      ? [{ id: 'sales', title: '销售' }, { id: 'cend', title: 'C端订单' }]
      : [{ id: 'purchase', title: '采购' }, { id: 'sales', title: '销售' }, { id: 'cend', title: 'C端订单' }];
    const tab = ui.tabs.miniBiz || items[0].id;
    const cur = items.some((it) => it.id === tab) ? tab : items[0].id;
    const panel = cur === 'cend' ? miniCendBody() : cur === 'sales' ? miniSalesBody() : miniPurchaseBody();
    return `<div class="mini-page-title">业务</div>
      <p class="mini-page-desc">采购 / 销售 / C端客户订单</p>
      ${miniSegHtml('miniBiz', items)}
      <div class="mini-seg-panel">${panel}</div>`;
  }

  function pageMiniService() {
    const openExL1 = ui.role === 'l1'
      ? db.exceptions.filter((e) => e.status === '未处理' && (
        (db.sns.find((s) => s.sn === e.target)?.l1Id === currentL1Id())
        || String(e.target).includes(l1Name(currentL1Id()))
        || String(e.detail || '').includes(l1Name(currentL1Id()))
      )).length
      : 0;
    const openExL2 = ui.role === 'l2'
      ? db.exceptions.filter((e) => e.status === '未处理' && (
        (db.sns.find((s) => s.sn === e.target)?.l2Id === currentL2Id())
        || String(e.target).includes(l2Name(currentL2Id()))
      )).length
      : 0;
    const items = ui.role === 'l2'
      ? [{ id: 'return', title: '退货' }, { id: 'exception', title: '异常', badge: openExL2 || null }]
      : [{ id: 'return', title: '退货' }, { id: 'exception', title: '异常', badge: openExL1 || null }];
    const tab = ui.tabs.miniService || 'return';
    const cur = items.some((it) => it.id === tab) ? tab : items[0].id;
    return `<div class="mini-page-title">售后</div>
      <p class="mini-page-desc">退货与异常查看</p>
      ${miniSegHtml('miniService', items)}
      <div class="mini-seg-panel">${cur === 'exception' ? miniExceptionBody() : miniAftersaleBody()}</div>`;
  }

  function pageMiniPurchase() {
    return `<div class="mini-page-title">采购</div>${miniPurchaseBody()}`;
  }

  function pageMiniSales() {
    // 二级底栏「销售」：内含销售单 + C端订单
    if (ui.role === 'l2') {
      const tab = ui.tabs.miniSalesTab || 'sales';
      return `<div class="mini-page-title">销售</div>
        <p class="mini-page-desc">分销到货 / C端客户订单</p>
        ${miniSegHtml('miniSalesTab', [{ id: 'sales', title: '销售单' }, { id: 'cend', title: 'C端订单' }])}
        <div class="mini-seg-panel">${tab === 'cend' ? miniCendBody() : miniSalesBody()}</div>`;
    }
    return `<div class="mini-page-title">销售</div>${miniSalesBody()}`;
  }

  function pageMiniStock() {
    const type = ui.role === 'l2' ? 'l2' : 'l1';
    const id = type === 'l2' ? currentL2Id() : currentL1Id();
    const f = ui.filters.miniStock || {};
    const rows = getStockRows(type, id);
    const sns = getStockSns(type, id, f).slice(0, 80);
    return `<div class="mini-page-title">库存</div>
      <div class="form-field"><input class="field-input" placeholder="搜 SN" data-filter="miniStock:sn" value="${escapeHtml(f.sn||'')}" /></div>
      <div style="display:flex;gap:6px;margin:8px 0">
        <select class="field-input" data-filter="miniStock:size"><option value="">弹力带</option>${BAND_SIZES.map((s)=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="miniStock:belt"><option value="">腰带</option>${BELTS.map((s)=>`<option value="${s}" ${f.belt===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
      <div class="mini-list">${rows.map((r)=>`<div class="mini-list-item">
        <strong>${escapeHtml(productName(r.productId))}</strong>
        <span>${escapeHtml(r.size)} + ${escapeHtml(r.belt||'—')}</span>
        <span class="num">×${r.qty}</span>
      </div>`).join('')||emptyHint('暂无汇总')}</div>
      <div class="mini-section-title">在库 SN（${sns.length}）</div>
      <div class="mini-list">${sns.map((s)=>`<button type="button" class="mini-list-item" data-action="open-view-sn" data-id="${s.sn}">
        <strong>${escapeHtml(s.sn)}</strong>
        <span>${escapeHtml(s.size)}+${escapeHtml(s.belt||'—')}</span>
      </button>`).join('')||emptyHint('无 SN')}</div>`;
  }

  function pageCustomers() {
    const f = ui.filters.customers || {};
    const map = new Map();
    db.sns.filter((s) => s.user || s.prevUser).forEach((s) => {
      const u = s.user || s.prevUser;
      const phone = u.phone || '';
      const addr = (u.addr || '').replace(/\s+/g, '');
      const key = phone || addr || s.sn;
      if (!map.has(key)) map.set(key, { phone, addr: u.addr || '', phoneLoc: u.phoneLoc || '', sns: [], products: [] });
      const row = map.get(key);
      row.sns.push(s.sn);
      row.products.push(`${productName(s.productId)}/${s.size}`);
    });
    let rows = [...map.values()];
    // duplicate marks
    const phoneCount = {};
    const addrCount = {};
    rows.forEach((r) => {
      if (r.phone) phoneCount[r.phone] = (phoneCount[r.phone] || 0) + 1;
      if (r.addr) addrCount[r.addr.replace(/\s+/g,'')] = (addrCount[r.addr.replace(/\s+/g,'')] || 0) + 1;
    });
    // recount by actual purchases: same phone across multiple SN entries already in one row; mark if sns.length>1 or shared addr across phones
    const addrPhones = {};
    rows.forEach((r) => {
      const a = (r.addr || '').replace(/\s+/g, '');
      if (!a) return;
      addrPhones[a] = addrPhones[a] || new Set();
      if (r.phone) addrPhones[a].add(r.phone);
    });
    rows.forEach((r) => {
      r.dupPhone = (r.sns || []).length > 1;
      const a = (r.addr || '').replace(/\s+/g, '');
      r.dupAddr = !!(a && addrPhones[a] && addrPhones[a].size > 1);
      r.mark = r.dupPhone || r.dupAddr;
    });
    if (f.sn) rows = rows.filter((r) => r.sns.some((sn) => sn.toLowerCase().includes(f.sn.toLowerCase())));
    if (f.phone) rows = rows.filter((r) => (r.phone || '').includes(f.phone));
    if (f.addr) rows = rows.filter((r) => (r.addr || '').includes(f.addr));
    if (f.mark === '1') rows = rows.filter((r) => r.mark);
    return `${pageHeader('销售客户', '客户信息 · 购买商品/SN · 重复标记可筛')}
      ${filterBar(`
        <input class="field-input" placeholder="SN" data-filter="customers:sn" value="${escapeHtml(f.sn||'')}" />
        <input class="field-input" placeholder="手机号" data-filter="customers:phone" value="${escapeHtml(f.phone||'')}" />
        <input class="field-input" placeholder="地址" data-filter="customers:addr" value="${escapeHtml(f.addr||'')}" />
        <select class="field-input" data-filter="customers:mark"><option value="">标记</option><option value="1" ${f.mark==='1'?'selected':''}>仅重复</option></select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>手机</th><th>归属地</th><th>地址</th><th>商品</th><th>SN</th><th>标记</th></tr></thead>
        <tbody>${rows.map((r)=>`<tr>
          <td>${escapeHtml(r.phone||'—')}</td>
          <td>${escapeHtml(r.phoneLoc||'—')}</td>
          <td>${escapeHtml(r.addr||'—')}</td>
          <td>${escapeHtml([...new Set(r.products)].join('，'))}</td>
          <td>${r.sns.map((sn)=>`<code style="margin-right:4px">${escapeHtml(sn)}</code>`).join('')}</td>
          <td>${r.dupPhone?tag('重复手机','orange'):''} ${r.dupAddr?tag('重复地址','orange'):''} ${!r.mark?'—':''}</td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageMiniAftersale() { return pageMiniService(); }
  function pageMiniException() { return pageMiniService(); }

  function pageMiniMine() {
    const r = ROLES[ui.role];
    const subs = ui.role === 'l1' ? db.subAccounts.filter((s) => s.l1Id === currentL1Id()) : [];
    return `<div class="mini-page-title">我的</div>
      <div class="mini-profile">
        <span class="user-avatar">${r.avatar}</span>
        <div><strong>${escapeHtml(r.name)}</strong><div style="font-size:12px;color:var(--text-3)">${escapeHtml(r.account)}</div></div>
      </div>
      ${ui.role === 'l1' ? `
        <div class="mini-section-title">角色与权限 · 子账号（仅扫码）</div>
        <p class="mini-page-desc">对应后台「角色与权限」能力：一级可在此创建仅扫码子账号。</p>
        <button class="btn btn-primary btn-block" data-action="open-create-sub" style="margin-bottom:8px">+ 创建子账号</button>
        ${subs.map((s)=>`<div class="mini-list-row"><span>${escapeHtml(s.username)} · ${escapeHtml(s.name)}</span><span>${tag(s.status)}</span></div>`).join('') || emptyHint('暂无子账号')}
      ` : ''}
      <button class="btn btn-block" data-action="logout" style="margin-top:12px">退出登录</button>
      <button class="btn btn-block" data-action="reset-demo" style="margin-top:8px">重置演示数据</button>`;
  }

  function renderMiniSnCard(row) {
    if (!row) return emptyHint('未找到 SN');
    const st = snStatusMeta(row);
    const life = getSnLifecycle(row).slice(0, 8);
    return `<div class="mini-sn-card">
      <div class="mini-sn-hd"><span class="mini-sn-code">${escapeHtml(row.sn)}</span>${tag(st.label, st.tone)}</div>
      <div class="mini-sn-meta">
        <div><span>商品</span>${escapeHtml(productName(row.productId))}</div>
        <div><span>尺寸</span>${escapeHtml(row.size)} + ${escapeHtml(row.belt||'—')}</div>
        <div><span>一级</span>${escapeHtml(l1Name(row.l1Id))}</div>
        <div><span>二级</span>${escapeHtml(l2Name(row.l2Id))}</div>
      </div>
      <div class="mini-section-title">流转</div>
      <div class="mini-timeline">${life.map((e)=>`<div class="mini-tl-item type-${e.type||''}">
        <div class="mini-tl-dot"></div>
        <div><div class="mini-tl-title">${escapeHtml(e.title)}</div>
        <div class="mini-tl-desc">${escapeHtml(e.desc||'')}</div>
        <div class="mini-tl-time">${escapeHtml(e.time)}</div></div>
      </div>`).join('')}</div>
    </div>`;
  }

  const PAGES = {
    home: pageHome, 'agent-l1': pageAgentL1, 'agent-l2': pageAgentL2, 'agent-l2-audit': pageAgentL2Audit,
    'agent-pending': pageAgentPending, sn: pageSN, product: pageProduct, purchase: pagePurchase,
    sales: pageSales, stock: pageStock, return: pageReturn, exception: pageException, customers: pageCustomers,
    stats: pageStats, role: pageRole, log: pageLog,
    'l1-sales-detail': pageL1SalesDetail, 'l1-return-detail': pageL1ReturnDetail,
    'l2-sales-detail': pageL2SalesDetail, 'l2-return-detail': pageL2ReturnDetail,
    'mini-scan': pageMiniScan, 'mini-biz': pageMiniBiz, 'mini-purchase': pageMiniPurchase, 'mini-sales': pageMiniSales,
    'mini-stock': pageMiniStock, 'mini-service': pageMiniService, 'mini-aftersale': pageMiniAftersale, 'mini-exception': pageMiniException,
    'mini-mine': pageMiniMine,
  };
  /* ---------- Modals ---------- */
  function openModal(type, payload = {}) {
    ui.modal = { type, payload, draft: payload.draft || JSON.parse(JSON.stringify(payload.draftSeed || {})) };
    render();
  }
  function closeModal() { ui.modal = null; render(); }

  function entFieldsHtml(ent = {}) {
    return `<div class="form-grid">
      <div class="form-field span-2"><label>企业名称</label><input class="field-input" id="f-ent-company" value="${escapeHtml(ent.company||'')}" /></div>
      <div class="form-field"><label>信用代码</label><input class="field-input" id="f-ent-credit" value="${escapeHtml(ent.creditCode||'')}" /></div>
      <div class="form-field"><label>法人</label><input class="field-input" id="f-ent-legal" value="${escapeHtml(ent.legal||'')}" /></div>
      <div class="form-field"><label>电话</label><input class="field-input" id="f-ent-phone" value="${escapeHtml(ent.phone||'')}" /></div>
      <div class="form-field span-2"><label>地址</label><input class="field-input" id="f-ent-addr" value="${escapeHtml(ent.addr||'')}" /></div>
    </div>`;
  }
  function readEntFields() {
    return {
      company: $('#f-ent-company')?.value || '',
      creditCode: $('#f-ent-credit')?.value || '',
      legal: $('#f-ent-legal')?.value || '',
      phone: $('#f-ent-phone')?.value || '',
      addr: $('#f-ent-addr')?.value || '',
    };
  }

  function chips(list, selected, attr, occupied) {
    return `<div class="chips">${list.map((r) => {
      const on = (selected || []).includes(r);
      const occ = occupied && occupied.has(r) && !on;
      return `<button type="button" class="chip ${on?'on':''}" ${attr}="${r}" ${occ?'disabled style="opacity:.35"':''}>${escapeHtml(r)}${occ?'(占用)':''}</button>`;
    }).join('')}</div>`;
  }

  function modalAuditPo(p) {
    const draft = ui.modal.draft || p;
    const lines = draft.lines || [];
    const customs = draft.customLines || [];
    const parts = draft.parts || [];
    const segs = draft.segments || {};
    const match = segmentsMatch(draft);
    const cos = draft.cosign || { admin1: false, admin2: false };

    const lineBlock = (line, idx, kind) => {
      const key = lineSegKey(line);
      const arr = segs[key] || [''];
      return `<div class="audit-line" data-line-kind="${kind}" data-line-idx="${idx}">
        <div class="form-grid">
          <div class="form-field"><label>商品</label><select class="field-input" data-po-field="productId">${kitProducts().map((x)=>`<option value="${x.id}" ${x.id===line.productId?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div>
          <div class="form-field"><label>弹力带</label><select class="field-input" data-po-field="size">${BAND_SIZES.map((s)=>`<option value="${s}" ${s===line.size?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>腰带</label><select class="field-input" data-po-field="belt">${BELTS.map((s)=>`<option value="${s}" ${s===(line.belt||DEFAULT_BELT[line.size])?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>数量</label><input type="number" class="field-input" data-po-field="qty" value="${line.qty||0}" /></div>
        </div>
        <div class="form-field"><label>SN 号段（起止两个输入框）</label>
          ${arr.map((seg, si) => {
            const parts = String(seg || '').split('-');
            const from = parts[0] || '';
            const to = parts.length > 1 ? parts.slice(1).join('-') : '';
            return `<div class="segment-row" style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
              <input class="field-input" data-seg-from="${si}" value="${escapeHtml(from)}" placeholder="起始 SN" />
              <span class="muted">—</span>
              <input class="field-input" data-seg-to="${si}" value="${escapeHtml(to)}" placeholder="结束 SN" />
              <button type="button" class="btn btn-sm" data-action="po-add-seg" data-kind="${kind}" data-idx="${idx}">+</button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    };

    return {
      title: `审核采购单 ${p.no}`,
      body: `<div class="alert alert-info">段号数量须等于标准+非标总数；配件不计 SN。两位管理员会签通过后立即生效。</div>
        <h4>标准品</h4>${lines.map((l,i)=>lineBlock(l,i,'lines')).join('')||emptyHint('无标准行')}
        <h4>非标品（个性化） <button class="btn btn-sm" data-action="po-add-custom">+ 加行</button></h4>
        ${customs.map((l,i)=>lineBlock(l,i,'customLines')).join('')||'<div class="empty-hint">暂无非标，可点击加行</div>'}
        <h4>配件（无 SN）</h4>
        <div class="form-grid">${parts.map((pt,i)=>`
          <div class="form-field"><label>配件</label><select class="field-input" data-part-idx="${i}" data-part-field="partId">${partProducts().map((x)=>`<option value="${x.id}" ${x.id===pt.partId?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div>
          <div class="form-field"><label>规格</label><input class="field-input" data-part-idx="${i}" data-part-field="spec" value="${escapeHtml(pt.spec||'')}" /></div>
          <div class="form-field"><label>数量</label><input type="number" class="field-input" data-part-idx="${i}" data-part-field="qty" value="${pt.qty||0}" /></div>
        `).join('')||emptyHint('无配件')}</div>
        <div style="margin-top:10px" class="audit-match-live">需求 SN：<strong class="num">${purchaseNeedQty(draft)}</strong>　已填段号：<strong class="num">${purchaseSegCount(draft)}</strong>　${match?tag('数量匹配','green'):tag('数量不匹配','orange')}</div>
        <div style="margin-top:8px">会签：管理员1 ${cos.admin1?'✓':'○'}　管理员2 ${cos.admin2?'✓':'○'}</div>`,
      foot: `<button class="btn" data-action="close-modal">取消</button>
        <button class="btn btn-danger" data-action="po-reject">驳回</button>
        <button class="btn btn-primary" data-action="po-confirm" ${match?'':'disabled'}>确认（会签）</button>`,
    };
  }

  function modalContent() {
    if (!ui.modal) return '';
    const { type, payload, draft } = ui.modal;
    let title = '', body = '', foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="modal-ok">确定</button>`;

    if (type === 'view-agent-l1' || type === 'edit-l1') {
      const a = type === 'edit-l1' ? draft : db.agentsL1.find((x) => x.id === payload.id);
      const editing = type === 'edit-l1';
      const occ = occupiedMainAreas(a.id);
      title = editing ? '编辑一级代理' : `一级详情 · ${a.name}`;
      body = editing ? `<div class="form-grid">
          <div class="form-field"><label>名称</label><input class="field-input" id="f-name" value="${escapeHtml(a.name)}" /></div>
          <div class="form-field"><label>联系人</label><input class="field-input" id="f-contact" value="${escapeHtml(a.contact)}" /></div>
          <div class="form-field span-2"><label>主授权区域（多选） <button type="button" class="btn btn-sm" data-action="select-all-main">全选全国</button></label>${chips(ALL_REGIONS, a.mainAreas||[], 'data-toggle-main', occ)}</div>
          <div class="form-field span-2"><label>可销售范围 <button type="button" class="btn btn-sm" data-action="select-all-sale">全选</button></label>${chips(ALL_REGIONS, a.saleAreas||a.areas||[], 'data-toggle-sale')}</div>
          <div class="form-field span-2"><label>直销范围（城市） <button type="button" class="btn btn-sm" data-action="select-all-direct">全选当前可售城市</button></label>${chips((a.saleAreas||a.areas||[]).flatMap((r)=>CITY_MAP[r]||[]), a.directAreas||[], 'data-toggle-direct')}</div>
          <div class="form-field"><label>预警倍数</label><input type="number" step="0.1" class="field-input" id="f-warn" value="${a.warnMultiplier||1.5}" /></div>
          <div class="form-field"><label>报警粒度</label><select class="field-input" id="f-warn-mode">
            <option value="strict" ${(a.warnMode||'strict')==='strict'?'selected':''}>严格（强制处理）</option>
            <option value="soft" ${a.warnMode==='soft'?'selected':''}>软报警（仅记录）</option>
          </select></div>
        </div><h4>企业信息</h4>${entFieldsHtml(a.ent)}`
        : `<div class="detail-grid">
          <div><span>编码</span>${escapeHtml(a.code)}</div>
          <div><span>联系人</span>${escapeHtml(a.contact)}</div>
          <div><span>主授权</span>${escapeHtml((a.mainAreas||[]).join('、'))}</div>
          <div><span>可销售</span>${escapeHtml((a.saleAreas||a.areas||[]).join('、'))}</div>
          <div><span>直销城市</span>${escapeHtml((a.directAreas||[]).join('、'))}</div>
          <div><span>状态</span>${tag(a.status)}</div>
          <div><span>预警倍数</span>${a.warnMultiplier||1.5}</div>
          <div><span>报警粒度</span>${tag(a.warnMode==='soft'?'软报警':'严格', a.warnMode==='soft'?'gray':'orange')}</div>
        </div>
        <h4>企业信息</h4>
        <div class="detail-grid">
          <div><span>公司</span>${escapeHtml(a.ent?.company||'—')}</div>
          <div><span>信用代码</span>${escapeHtml(a.ent?.creditCode||'—')}</div>
          <div><span>法人</span>${escapeHtml(a.ent?.legal||'—')}</div>
          <div><span>电话</span>${escapeHtml(a.ent?.phone||'—')}</div>
          <div class="span-2"><span>地址</span>${escapeHtml(a.ent?.addr||'—')}</div>
        </div>`;
      foot = editing
        ? `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-l1">保存</button>`
        : `<button class="btn" data-action="close-modal">关闭</button>
           <button class="btn" data-action="edit-l1" data-id="${a.id}">编辑</button>
           <button class="btn btn-primary" data-go="l1-sales-detail" data-set-filter="l1-sales:l1Id=${a.id}">销售</button>
           <button class="btn btn-primary" data-go="l1-return-detail" data-set-filter="l1-return:l1Id=${a.id}">退货</button>
           <button class="btn btn-danger" data-action="disable-l1" data-id="${a.id}">${a.status==='启用'?'停用':'启用'}</button>`;
    } else if (type === 'create-l1') {
      title = '新建一级代理';
      const d = draft;
      body = `<div class="form-grid">
        <div class="form-field"><label>名称</label><input class="field-input" id="f-name" value="${escapeHtml(d.name||'')}" /></div>
        <div class="form-field"><label>联系人</label><input class="field-input" id="f-contact" value="${escapeHtml(d.contact||'')}" /></div>
        <div class="form-field span-2"><label>主授权区域（多选） <button type="button" class="btn btn-sm" data-action="select-all-main">全选全国</button></label>${chips(ALL_REGIONS, d.mainAreas||[], 'data-toggle-main', occupiedMainAreas())}</div>
        <div class="form-field span-2"><label>可销售范围 <button type="button" class="btn btn-sm" data-action="select-all-sale">全选</button></label>${chips(ALL_REGIONS, d.saleAreas||[], 'data-toggle-sale')}</div>
        <div class="form-field span-2"><label>直销范围（城市） <button type="button" class="btn btn-sm" data-action="select-all-direct">全选当前可售城市</button></label>${chips((d.saleAreas||[]).flatMap((r)=>CITY_MAP[r]||[]), d.directAreas||[], 'data-toggle-direct')}${!(d.saleAreas||[]).length?'<p class="muted" style="margin-top:6px">请先选择可销售范围，再全选直销城市</p>':''}</div>
      </div>${entFieldsHtml(d.ent||{})}`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-l1-ok">创建</button>`;
    } else if (type === 'view-agent-l2' || type === 'edit-l2') {
      const a = type === 'edit-l2' ? draft : db.agentsL2.find((x) => x.id === payload.id);
      const editing = type === 'edit-l2';
      title = editing ? '编辑二级代理' : `二级详情 · ${a.name}`;
      const cities = citiesForL1(a.parentId);
      body = editing ? `<div class="form-grid">
          <div class="form-field"><label>名称</label><input class="field-input" id="f-name" value="${escapeHtml(a.name)}" /></div>
          <div class="form-field"><label>类型</label><input class="field-input" value="${escapeHtml(a.type)}" readonly /></div>
          <div class="form-field span-2"><label>围栏城市 <button type="button" class="btn btn-sm" data-action="select-all-city">全选</button></label>${chips(cities.length?cities:['杭州市'], a.areas||[], 'data-toggle-city')}</div>
          <div class="form-field"><label>独立预警倍数</label><input type="number" step="0.1" class="field-input" id="f-warn" value="${a.warnMultiplier ?? ''}" placeholder="空=继承一级" /></div>
          <div class="form-field"><label>独立报警粒度</label><select class="field-input" id="f-warn-mode">
            <option value="" ${!a.warnMode?'selected':''}>继承一级</option>
            <option value="strict" ${a.warnMode==='strict'?'selected':''}>严格</option>
            <option value="soft" ${a.warnMode==='soft'?'selected':''}>软报警</option>
          </select></div>
        </div>${a.type==='法人'?entFieldsHtml(a.ent||{}):''}`
        : `<div class="detail-grid">
          <div><span>编码</span>${escapeHtml(a.code)}</div>
          <div><span>类型</span>${escapeHtml(a.type)}</div>
          <div><span>所属一级</span>${escapeHtml(l1Name(a.parentId))}</div>
          <div><span>城市</span>${escapeHtml((a.areas||[]).join('、')||'—')}</div>
          <div><span>状态</span>${tag(a.status)}</div>
          <div><span>报警</span>${a.warnMultiplier || a.warnMode ? `${a.warnMultiplier || '继承'}× / ${a.warnMode || '继承'}` : '继承一级'}</div>
        </div>${a.ent?`<h4>企业</h4><div class="detail-grid"><div class="span-2">${escapeHtml(a.ent.company||'')}</div></div>`:''}`;
      foot = editing
        ? `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-l2">保存</button>`
        : `<button class="btn" data-action="close-modal">关闭</button>
           <button class="btn" data-action="edit-l2" data-id="${a.id}">编辑</button>
           <button class="btn" data-action="toggle-l2" data-id="${a.id}">${a.status==='启用'?'停用':'启用'}</button>
           <button class="btn btn-primary" data-go="l2-sales-detail" data-set-filter="l2-sales:l2Id=${a.id}">销售</button>
           <button class="btn btn-primary" data-go="l2-return-detail" data-set-filter="l2-return:l2Id=${a.id}">退货</button>
           <button class="btn" data-action="open-rebind-l2" data-id="${a.id}">更改绑定</button>
           <button class="btn" data-action="edit-l2-fence" data-id="${a.id}">围栏设定</button>
           ${a.type==='法人'&&a.parentId?`<button class="btn btn-danger" data-action="unbind-l2" data-id="${a.id}">解绑法人</button>`:''}`;
    } else if (type === 'rebind-l2') {
      const a = db.agentsL2.find((x) => x.id === payload.id);
      const d = draft || {};
      if (!d.parentId) d.parentId = a.prevParentId || db.agentsL1.find((x) => x.status === '启用')?.id || '';
      const cities = citiesForL1(d.parentId);
      const cityOpts = cities.length ? cities : ['杭州市'];
      d.areas = (d.areas || a.prevAreas || a.areas || []).filter((c) => cityOpts.includes(c));
      ui.modal.draft = d;
      title = `重新绑定 · ${a.name}`;
      body = `<div class="form-field"><label>绑定一级</label>
        <select class="field-input" id="f-parent">${db.agentsL1.filter((x)=>x.status==='启用').map((x)=>`<option value="${x.id}" ${x.id===d.parentId?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>围栏城市 <button type="button" class="btn btn-sm" data-action="select-all-city">全选</button></label>
        ${chips(cityOpts, d.areas || [], 'data-toggle-city')}
        ${!cities.length ? '<p class="muted" style="margin-top:6px">该一级无可售城市，请先维护一级可销售范围</p>' : ''}
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="rebind-l2-ok" data-id="${a.id}">绑定</button>`;
    } else if (type === 'view-sn' || type === 'edit-sn') {
      const row = db.sns.find((s) => s.sn === payload.id);
      const st = snStatusMeta(row);
      const life = getSnLifecycle(row);
      const editing = type === 'edit-sn';
      title = `${editing ? '编辑 SN' : 'SN 详情'} · ${row.sn}`;
      body = `<div class="detail-grid">
          <div><span>SN</span>${escapeHtml(row.sn)}</div>
          <div><span>状态</span>${tag(st.label, st.tone)}</div>
          <div><span>商品</span>${escapeHtml(productName(row.productId))}</div>
          <div><span>弹力带</span>${escapeHtml(row.size)}</div>
          <div><span>腰带</span>${escapeHtml(row.belt || '—')}</div>
          <div><span>一级</span>${escapeHtml(l1Name(row.l1Id))}</div>
          <div><span>二级</span>${escapeHtml(l2Name(row.l2Id))}</div>
          <div><span>标签</span>${(row.tags||[]).map((t)=>tag(t,'orange')).join(' ')||'—'}</div>
        </div>
        ${editing ? `<h4 style="margin-top:12px">修改字段</h4>
        <div class="form-grid">
          <div class="form-field"><label>SN</label><input class="field-input" id="f-sn" value="${escapeHtml(row.sn)}" /></div>
          <div class="form-field"><label>弹力带尺码</label><select class="field-input" id="f-size">${BAND_SIZES.map((s)=>`<option value="${s}" ${s===row.size?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>腰带尺码</label><select class="field-input" id="f-belt">${BELTS.map((s)=>`<option value="${s}" ${s===row.belt?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>所属一级</label><select class="field-input" id="f-l1"><option value="">—</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${a.id===row.l1Id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select></div>
          <div class="form-field"><label>所属二级（调库）</label><select class="field-input" id="f-l2"><option value="">—</option>${db.agentsL2.filter((a)=>!a.pending).map((a)=>`<option value="${a.id}" ${a.id===row.l2Id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select></div>
        </div>
        <p class="muted">保存后自动记录：谁、什么时间、改了什么（无需手动打维修勾）。</p>` : `<p class="muted" style="margin-top:8px">详情只读；点击「修改」后可编辑。</p>`}
        <div class="mini-section-title">完整流转（${life.length}）</div>
        <div class="mini-timeline" style="max-height:360px;overflow:auto">${life.map((e)=>`<div class="mini-tl-item type-${e.type||''}"><div class="mini-tl-dot"></div><div><div class="mini-tl-title">${escapeHtml(e.title)}</div><div class="mini-tl-desc">${escapeHtml(e.desc||'')}</div><div class="mini-tl-time">${escapeHtml(e.time)}</div></div></div>`).join('')}</div>`;
      foot = editing
        ? `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-sn" data-id="${row.sn}">保存修改</button>`
        : `<button class="btn" data-action="close-modal">关闭</button>
           <button class="btn btn-primary" data-action="open-edit-sn" data-id="${row.sn}">修改</button>
           ${(row.frozen||row.status==='frozen')?`<button class="btn" data-action="reassign-frozen" data-id="${row.sn}">冷冻库重分配</button>`:''}`;
    } else if (type === 'reassign-frozen') {
      title = '冷冻库重新分配';
      body = `<p>SN：${escapeHtml(payload.id)}</p>
        <div class="form-field"><label>分配给一级</label>
          <select class="field-input" id="f-l1">${db.agentsL1.filter((a)=>a.status==='启用').map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select>
        </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="reassign-frozen-ok" data-id="${payload.id}">分配并解冻</button>`;
    } else if (type === 'audit-po' || type === 'view-purchase') {
      const p = db.purchases.find((x) => x.id === payload.id);
      if (type === 'audit-po') {
        if (!ui.modal.draft || ui.modal.draft.id !== p.id) {
          ui.modal.draft = JSON.parse(JSON.stringify(p));
        }
        const m = modalAuditPo(p);
        title = m.title; body = m.body; foot = m.foot;
      } else {
        title = `采购单 ${p.no}`;
        const lineTable = (title, rows) => `<h4>${title}</h4>
          <div class="page-card table-wrap"><table class="data">
            <thead><tr><th>商品</th><th>弹力带</th><th>腰带</th><th>数量</th><th>号段</th></tr></thead>
            <tbody>${(rows||[]).map((l)=>{
              const key = `${l.productId}_${l.size}_${l.belt || DEFAULT_BELT[l.size]}`;
              const seg = ((p.segments||{})[key]||[]).filter(Boolean).join('；') || '—';
              return `<tr><td>${escapeHtml(productName(l.productId))}</td><td>${escapeHtml(l.size)}</td><td>${escapeHtml(l.belt||DEFAULT_BELT[l.size]||'—')}</td><td class="num">${l.qty||0}</td><td>${escapeHtml(seg)}</td></tr>`;
            }).join('') || `<tr><td colspan="5">${emptyHint('无')}</td></tr>`}</tbody>
          </table></div>`;
        body = `<div class="detail-grid">
          <div><span>一级</span>${escapeHtml(l1Name(p.l1Id))}</div>
          <div><span>状态</span>${tag(PO_STATUS[p.status]||p.status)}</div>
          <div><span>会签</span>${(p.cosign?.admin1?'✓':'-')}/${(p.cosign?.admin2?'✓':'-')}</div>
          <div><span>时间</span>${escapeHtml(p.createdAt)}</div>
        </div>
        ${lineTable('标准品', p.lines)}
        ${lineTable('非标品', p.customLines)}
        <h4>配件</h4>
        <div class="page-card table-wrap"><table class="data">
          <thead><tr><th>配件</th><th>规格</th><th>数量</th></tr></thead>
          <tbody>${(p.parts||[]).map((x)=>`<tr><td>${escapeHtml(productName(x.partId))}</td><td>${escapeHtml(x.spec||'—')}</td><td class="num">${x.qty||0}</td></tr>`).join('') || `<tr><td colspan="3">${emptyHint('无配件')}</td></tr>`}</tbody>
        </table></div>`;
        foot = `<button class="btn" data-action="close-modal">关闭</button>${['pending','cosigning'].includes(p.status)?`<button class="btn btn-primary" data-action="open-audit-po" data-id="${p.id}">去审核</button>`:''}`;
      }
    } else if (type === 'view-sale') {
      const s = db.sales.find((x) => x.id === payload.id);
      title = `销售单 ${s.no}`;
      body = saleDetailHtml(s);
      foot = `<button class="btn" data-action="close-modal">关闭</button>`;
    } else if (type === 'view-cend') {
      const order = listCendOrders().find((o) => o.id === payload.id)
        || { id: payload.id, kind: String(payload.id).startsWith('CO_') ? 'bind' : 'sale', no: payload.id, sns: [], snRow: db.sns.find((x) => x.sn === String(payload.id).replace(/^CO_/, '')) };
      if (order.kind === 'bind' && !order.snRow && String(payload.id).startsWith('CO_')) {
        order.snRow = db.sns.find((x) => x.sn === String(payload.id).slice(3));
        order.sns = order.snRow ? [order.snRow.sn] : [];
        order.no = order.no || `CO${String(order.sns[0] || '').slice(-8)}`;
        order.createdAt = order.snRow?.soldAt || order.snRow?.bindAt || '';
      }
      title = `C端订单 ${order.no || ''}`.trim();
      body = cendOrderDetailHtml(order);
      foot = `<button class="btn" data-action="close-modal">关闭</button>`;
    } else if (type === 'view-return') {
      const r = db.returns.find((x) => x.id === payload.id);
      title = `退货单 ${r.no}`;
      body = `<div class="detail-grid">
        <div><span>类型</span>${escapeHtml(r.typeLabel||r.type)}</div>
        <div><span>理由</span>${tag(r.reasonType||'')} ${escapeHtml(r.reason||'')}</div>
        <div><span>明细</span>${escapeHtml(snsProductDetail(r.sns))}</div>
        <div><span>状态</span>${returnStatusTag(r.status)}</div>
        <div class="span-2"><span>SN码</span>${(r.sns||[]).map((sn)=>`<code style="margin-right:6px">${escapeHtml(sn)}</code>`).join('')||'—'}</div>
      </div>`;
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        ${r.status==='pending'?`<button class="btn btn-primary" data-action="approve-return" data-id="${r.id}">审核通过</button>
        <button class="btn btn-danger" data-action="reject-return" data-id="${r.id}">驳回</button>`:''}`;
    } else if (type === 'view-exception') {
      const e = db.exceptions.find((x) => x.id === payload.id);
      title = `异常详情 · ${e.type}`;
      const phoneHint = e.dupPhone || ((e.detail || '').match(/1[\d*]{6,10}/)?.[0] || '');
      const related = db.sns.filter((s) => {
        if (s.sn === e.target) return true;
        if (!s.user) return false;
        if (phoneHint && String(s.user.phone).includes(phoneHint.replace(/\*/g, '').slice(0, 3))) return true;
        return e.detail && e.detail.includes(String(s.user.phone));
      });
      body = `<div class="detail-grid">
        <div><span>时间</span>${escapeHtml(e.time)}</div>
        <div><span>维度</span>${tag(exceptionDim(e)==='scan'?'扫码异常':exceptionDim(e)==='stock'?'销售库存异常':'激活异常')}</div>
        <div><span>对象</span>${escapeHtml(e.target)}</div>
        <div><span>状态</span>${tag(e.status)}</div>
        <div class="span-2"><span>详情</span>${escapeHtml(e.detail)}</div>
        <div class="span-2"><span>解释</span>${escapeHtml(e.explain||'—')}</div>
      </div>
      ${/客户信息重复/.test(e.type) ? `<h4 style="margin-top:12px">重复客户关联 SN</h4>
        <div class="page-card table-wrap"><table class="data">
          <thead><tr><th>SN</th><th>手机</th><th>地址</th><th>归属地</th></tr></thead>
          <tbody>${related.map((s)=>`<tr class="row-clickable" data-row-action="view-sn" data-id="${s.sn}">
            <td>${escapeHtml(s.sn)}</td><td>${escapeHtml(s.user?.phone||'—')}</td>
            <td>${escapeHtml(s.user?.addr||'—')}</td><td>${escapeHtml(s.user?.phoneLoc||'—')}</td>
          </tr>`).join('') || `<tr><td colspan="4">${emptyHint()}</td></tr>`}</tbody>
        </table></div>` : ''}`;
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        ${e.status==='未处理'?`<button class="btn btn-primary" data-action="close-exception" data-id="${e.id}">标记已处理</button>`:''}`;
    } else if (type === 'view-l2-audit') {
      const a = db.agentsL2.find((x) => x.id === payload.id);
      title = `二级审核详情 · ${a.name}`;
      body = `<div class="detail-grid">
        <div><span>编码</span>${escapeHtml(a.code)}</div>
        <div><span>类型</span>${escapeHtml(a.type)}</div>
        <div><span>申请一级</span>${escapeHtml(l1Name(a.parentId))}</div>
        <div><span>城市</span>${escapeHtml((a.areas||[]).join('、'))}</div>
        <div><span>状态</span>${tag('待审核','orange')}</div>
      </div>${a.ent?`<h4>企业</h4><div class="detail-grid"><div class="span-2">${escapeHtml(a.ent.company||'')}</div></div>`:''}`;
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        <button class="btn btn-primary" data-action="audit-l2-ok" data-id="${a.id}">通过</button>
        <button class="btn btn-danger" data-action="audit-l2-reject" data-id="${a.id}">驳回</button>`;
    } else if (type === 'view-pending-l2') {
      const a = db.agentsL2.find((x) => x.id === payload.id);
      title = `待分配详情 · ${a.name}`;
      body = `<div class="detail-grid">
        <div><span>编码</span>${escapeHtml(a.code)}</div>
        <div><span>原一级</span>${escapeHtml(l1Name(a.prevParentId)||'—')}</div>
        <div><span>原城市</span>${escapeHtml((a.prevAreas||[]).join('、')||'—')}</div>
        <div><span>状态</span>${tag('待分配','orange')}</div>
      </div>`;
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        <button class="btn btn-primary" data-action="open-rebind-l2" data-id="${a.id}">重新绑定</button>`;
    } else if (type === 'scan-so') {
      const s = db.sales.find((x) => x.id === payload.id);
      title = `扫码出货 ${s.no}`;
      const canEdit = ui.role !== 'sub';
      body = `<p>${escapeHtml(l2Name(s.l2Id))} · 计划 <strong>${escapeHtml(planBySizeText(s.planBySize))}</strong> · 已扫 ${(s.scanned||[]).length}/${s.planTotal}</p>
        <div class="alert alert-info">支持号段起止录入（起始 SN — 结束 SN），也可单个扫码添加</div>
        <div class="form-field"><label>号段录入（起止两个输入框）</label>
          <div class="segment-row" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <input class="field-input" id="scan-seg-from" placeholder="起始 SN" style="flex:1;min-width:120px" />
            <span class="muted">—</span>
            <input class="field-input" id="scan-seg-to" placeholder="结束 SN" style="flex:1;min-width:120px" />
          </div>
        </div>
        <button class="btn btn-primary btn-block" data-action="scan-add-seg" data-id="${s.id}" style="margin-top:8px">按号段添加</button>
        <div class="form-field" style="margin-top:12px"><label>单个扫描 SN</label><input class="field-input" id="scan-sn-input" placeholder="输入单个 SN 回车或点添加" /></div>
        <button class="btn btn-block" data-action="scan-add-sn" data-id="${s.id}">添加单个</button>
        <div style="margin-top:8px">${(s.scanned||[]).map((sn)=>tag(sn,'green')).join(' ') || emptyHint('尚未扫描')}</div>
        ${canEdit?'':'<p class="mini-page-desc">子账号不可修改计划数量</p>'}`;
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        <button class="btn btn-primary" data-action="scan-confirm-so" data-id="${s.id}" ${(s.scanned||[]).length>=s.planTotal?'':'disabled'}>确认出货</button>`;
    } else if (type === 'create-so') {
      title = '创建分销出货单';
      const l1Id = currentL1Id() || db.agentsL1[0]?.id;
      const l2s = db.agentsL2.filter((a) => a.parentId === l1Id && a.auditStatus === 'approved' && !a.pending);
      body = `<div class="form-grid">
        ${!currentL1Id()?`<div class="form-field"><label>一级代理</label><select class="field-input" id="f-l1">${db.agentsL1.filter((a)=>a.status==='启用').map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></div>`:''}
        <div class="form-field"><label>二级代理</label><select class="field-input" id="f-l2">${l2s.map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></div>
        <div class="form-field"><label>商品</label><select class="field-input" id="f-pid">${kitProducts().map((p)=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
        ${BAND_SIZES.map((s)=>`<div class="form-field"><label>${s}</label><input type="number" class="field-input" data-size-qty="${s}" value="0" /></div>`).join('')}
        <div class="form-field span-2"><label>选配配件（无 SN，仅数量）</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <label>腰带配件 <input type="number" class="field-input" id="f-part-belt" value="0" style="width:80px" /></label>
            <label>主体硅胶带 <input type="number" class="field-input" id="f-part-sil" value="0" style="width:80px" /></label>
          </div>
        </div>
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-so-ok">创建并扫码</button>`;
    } else if (type === 'import-sn-seg') {
      title = '批量导入 SN 段号';
      body = `<div class="alert alert-info">支持上传 <strong>.xlsx / .xls / .csv / .txt</strong>，或从 Excel 复制粘贴。每行一个号段（如 RL202608010001-RL202608010010）。</div>
        <div class="form-grid">
          <div class="form-field"><label>所属一级</label><select class="field-input" id="f-l1">${db.agentsL1.map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></div>
          <div class="form-field"><label>商品</label><select class="field-input" id="f-pid">${kitProducts().map((p)=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
          <div class="form-field"><label>尺寸</label><select class="field-input" id="f-size">${BAND_SIZES.map((s)=>`<option value="${s}">${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>腰带</label><select class="field-input" id="f-belt">${BELTS.map((s)=>`<option value="${s}">${s}</option>`).join('')}</select></div>
          <div class="form-field span-2"><label>上传 Excel / CSV</label><input type="file" class="field-input" id="f-seg-file" accept=".xlsx,.xls,.csv,.txt" /></div>
          <div class="form-field span-2"><label>段号列表（可粘贴或由文件填充）</label><textarea class="field-input" id="f-seg-paste" rows="8" placeholder="每行一段">${escapeHtml(ui.form.segPaste || '')}</textarea></div>
        </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="import-sn-seg-ok">导入待入库</button>`;
    } else if (type === 'gen-sn') {
      title = '系统内部生成 SN（12.3）';
      body = `<div class="alert alert-info">不再依赖外部系统：按日期流水在本系统生成号段，状态为「原厂在库」。</div>
        <div class="form-grid">
          <div class="form-field"><label>所属一级</label><select class="field-input" id="f-l1">${db.agentsL1.map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></div>
          <div class="form-field"><label>商品</label><select class="field-input" id="f-pid">${kitProducts().map((p)=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
          <div class="form-field"><label>尺寸</label><select class="field-input" id="f-size">${BAND_SIZES.map((s)=>`<option value="${s}">${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>腰带</label><select class="field-input" id="f-belt">${BELTS.map((s)=>`<option value="${s}">${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>生成数量</label><input type="number" class="field-input" id="f-qty" value="10" min="1" max="200" /></div>
        </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="gen-sn-ok">生成</button>`;
    } else if (type === 'leave-exception') {
      title = '离开异常详情';
      body = `<p>当前筛选仍有 <strong>${payload.count || 0}</strong> 条<strong>未处理</strong>异常。</p>
        <p class="muted">选择「已处理并离开」后不再加粗提醒；选择「暂不处理」则保持粗体，其他管理员仍可见。</p>`;
      foot = `<button class="btn" data-action="leave-ex-stay">取消</button>
        <button class="btn" data-action="leave-ex-skip">暂不处理，离开</button>
        <button class="btn btn-primary" data-action="leave-ex-done">已处理并离开</button>`;
    } else if (type === 'ex-explain') {
      const e = db.exceptions.find((x) => x.id === payload.id);
      title = '填写超量下单解释';
      body = `<p>${escapeHtml(e?.type || '')} · ${escapeHtml(e?.target || '')}</p>
        <p class="muted">${escapeHtml(e?.detail || '')}</p>
        <div class="form-field"><label>一级解释说明</label><textarea class="field-input" id="f-explain" rows="3">${escapeHtml(e?.explain || '')}</textarea></div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-ex-explain" data-id="${payload.id}">保存解释</button>`;
    } else if (type === 'create-po') {
      title = '新建采购申请';
      if (!ui.modal.draft) ui.modal.draft = { customLines: [] };
      if (!ui.modal.draft.customLines) ui.modal.draft.customLines = [];
      const kits = kitProducts();
      const poPid = ui.modal.draft.productId || kits[0]?.id;
      ui.modal.draft.productId = poPid;
      const poProd = kits.find((p) => p.id === poPid) || kits[0];
      const stdKits = kitStdCombos(poProd);
      const bandOpts = (poProd?.sizes?.length) ? poProd.sizes : BAND_SIZES;
      const beltOpts = (poProd?.belts?.length) ? poProd.belts : BELTS;
      const customs = (ui.modal.draft.customLines || []).map((c) => ({
        ...c,
        size: bandOpts.includes(c.size) ? c.size : bandOpts[0],
        belt: beltOpts.includes(normalizeBelt(c.belt)) ? normalizeBelt(c.belt) : beltOpts[0],
      }));
      ui.modal.draft.customLines = customs;
      body = `<div class="alert alert-info">${escapeHtml(STANDARD_COMBO_NOTE)}<br>当前商品可选：弹力带 ${bandOpts.join('/')} · 腰带 ${beltOpts.map((b)=>String(b).replace(/^腰带/,'')).join('/')}；下单选项已按商品维护过滤。</div>
        <div class="form-grid">
        <div class="form-field span-2"><label>商品</label><select class="field-input" id="f-pid">${kits.map((p)=>`<option value="${p.id}" ${p.id===poPid?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></div>
        ${stdKits.map((k)=>`<div class="form-field"><label>标准 ${escapeHtml(k.label)}</label><input type="number" class="field-input" data-size-qty="${k.size}" data-std-belt="${k.belt}" value="0" /></div>`).join('') || `<p class="muted span-2">该商品未配置可用标品组合</p>`}
        </div>
        <h4 style="margin-top:12px">非标（可多款） <button type="button" class="btn btn-sm btn-primary" data-action="po-draft-add-custom">+ 新增非标行</button></h4>
        <div class="page-card table-wrap"><table class="data">
          <thead><tr><th>弹力带</th><th>腰带</th><th>数量</th><th></th></tr></thead>
          <tbody>${customs.map((c,i)=>`<tr>
            <td><select class="field-input" data-po-custom-size="${i}">${bandOpts.map((s)=>`<option value="${s}" ${s===c.size?'selected':''}>${s}</option>`).join('')}</select></td>
            <td><select class="field-input" data-po-custom-belt="${i}">${beltOpts.map((s)=>`<option value="${s}" ${s===normalizeBelt(c.belt)?'selected':''}>${s}</option>`).join('')}</select></td>
            <td><input type="number" class="field-input" data-po-custom-qty="${i}" value="${c.qty||0}" /></td>
            <td><button class="btn btn-sm" data-action="po-draft-del-custom" data-idx="${i}">删除</button></td>
          </tr>`).join('') || `<tr><td colspan="4">${emptyHint('点击「新增非标行」')}</td></tr>`}</tbody>
        </table></div>
        <div class="form-field" style="margin-top:10px"><label>选配配件（无 SN）</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <label>腰带配件 <input type="number" class="field-input" id="f-part-belt" value="0" style="width:80px" /></label>
            <label>主体硅胶带 <input type="number" class="field-input" id="f-part-qty" value="0" style="width:80px" /></label>
          </div>
        </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-po-ok">提交</button>`;
    } else if (type === 'edit-product' || type === 'create-product') {
      const cur = draft || db.products.find((x) => x.id === payload.id) || { type: payload.ptype || 'kit', sizes: [...BAND_SIZES], belts: [...BELTS], defaultBelt: { ...DEFAULT_BELT }, status: '上架' };
      const isKit = (cur.type || 'kit') === 'kit';
      if (isKit) {
        cur.sizes = cur.sizes || [...BAND_SIZES];
        cur.belts = cur.belts || [...BELTS];
        cur.defaultBelt = { ...DEFAULT_BELT, ...(cur.defaultBelt || {}) };
      }
      const combos = isKit ? kitStdCombos(cur) : [];
      title = type === 'edit-product' ? `修改商品 · ${cur.name || ''}` : `新建${isKit ? '套件' : '配件'}`;
      body = `<div class="form-grid">
        <div class="form-field"><label>编码</label><input class="field-input" id="f-pcode" value="${escapeHtml(cur.code||'')}" /></div>
        <div class="form-field"><label>名称</label><input class="field-input" id="f-pname" value="${escapeHtml(cur.name||'')}" /></div>
        <div class="form-field"><label>状态</label><select class="field-input" id="f-pstatus"><option value="上架" ${(cur.status||'上架')==='上架'?'selected':''}>上架</option><option value="下架" ${cur.status==='下架'?'selected':''}>下架</option></select></div>
        <div class="form-field"><label>产品线</label><select class="field-input" id="f-pline">${(db.productLines||[]).map((l)=>`<option value="${l.id}" ${(cur.productLineId||activeLineId())===l.id?'selected':''}>${escapeHtml(l.name)}</option>`).join('')}</select></div>
        <div class="form-field span-2"><label>说明</label><input class="field-input" id="f-pnote" value="${escapeHtml(cur.note||'')}" /></div>
        ${isKit ? `
          <div class="form-field span-2"><div class="alert alert-info" style="margin:0">${escapeHtml(STANDARD_COMBO_NOTE)}</div></div>
          <div class="form-field span-2"><label>① 弹力带尺码（多选）SS / S / M / L / LL</label>${chips(BAND_SIZES, cur.sizes||[], 'data-toggle-psize')}</div>
          <div class="form-field span-2"><label>② 腰带尺码（多选）S / M / L</label>${chips(BELTS, cur.belts||[], 'data-toggle-pbelt')}</div>
          <div class="form-field span-2"><label>③ 标品组合（由上面两组尺码自动交集；其他组合下单选非标）</label>
            <div class="page-card table-wrap" style="margin-top:6px"><table class="data">
              <thead><tr><th>档位</th><th>腰带</th><th>弹力带</th><th>组合说明</th></tr></thead>
              <tbody>${combos.map((k)=>`<tr>
                <td>${tag(k.grade,'orange')}</td>
                <td>${escapeHtml(k.belt)}</td>
                <td>${escapeHtml(k.size)}</td>
                <td>${escapeHtml(k.label)}</td>
              </tr>`).join('') || `<tr><td colspan="4">${emptyHint('请至少选中对应的腰带与弹力带尺码')}</td></tr>`}</tbody>
            </table></div>
          </div>` : `<div class="form-field span-2"><label>规格（逗号分隔）</label><input class="field-input" id="f-psizes" value="${escapeHtml((cur.sizes||[]).join(','))}" /></div>`}
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-product">${type==='edit-product'?'保存':'创建'}</button>`;
    } else if (type === 'order-cart') {
      const channel = payload.channel || draft?.channel || 'purchase';
      if (!ui.modal.draft) ui.modal.draft = { channel, customRows: [], nonstdGrade: '小', stdQty: {}, acc: {} };
      const d = ui.modal.draft;
      d.channel = channel;
      d.customRows = d.customRows || [];
      d.stdQty = d.stdQty || {};
      d.acc = d.acc || {};
      const kits = kitProducts();
      const cartPid = d.productId || kits[0]?.id;
      d.productId = cartPid;
      const cartProd = kits.find((p) => p.id === cartPid) || kits[0];
      const stdKits = kitStdCombos(cartProd);
      const nonstdOpts = nonstdGradesForProduct(cartProd);
      if (!nonstdOpts.some((g) => g.id === d.nonstdGrade)) d.nonstdGrade = nonstdOpts[0]?.id || '小';
      const bands = nonstdBandsForProductGrade(cartProd, d.nonstdGrade);
      Object.keys(d.stdQty).forEach((k) => { if (!stdKits.some((x) => x.key === k)) delete d.stdQty[k]; });
      d.customRows = d.customRows.filter((r) => {
        const g = nonstdOpts.find((x) => x.belt === normalizeBelt(r.belt) || x.id === r.grade);
        return g && g.bands.includes(r.size);
      });
      const l2Options = db.agentsL2.filter((a) => a.parentId === currentL1Id() && !a.pending);
      title = channel === 'sales' ? '提交销售单（购物车）' : '提交采购单（购物车）';
      body = `<div class="alert alert-info">${escapeHtml(STANDARD_COMBO_NOTE)}<br>当前商品可选：弹力带 ${(cartProd?.sizes||BAND_SIZES).join('/')} · 腰带 ${(cartProd?.belts||BELTS).map((b)=>String(b).replace(/^腰带/,'')).join('/')}；下单选项已按商品维护过滤。</div>
        <div class="form-grid">
          <div class="form-field span-2"><label>商品名称</label><select class="field-input" id="f-cart-pid">${kits.map((p)=>`<option value="${p.id}" ${p.id===cartPid?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></div>
          ${channel==='sales'?`<div class="form-field span-2"><label>二级代理</label><select class="field-input" id="f-cart-l2">${l2Options.map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}${l2Options.length?'':'<option value="">暂无可选二级</option>'}</select></div>`:''}
        </div>
        <h4>标准套件（${stdKits.length}）</h4>
        <div class="form-grid">
          ${stdKits.map((k)=>`<div class="form-field"><label>${escapeHtml(k.label)}</label>
            <input type="number" class="field-input" data-std-key="${k.key}" data-std-size="${k.size}" data-std-belt="${k.belt}" value="${d.stdQty[k.key]||0}" min="0" /></div>`).join('') || `<p class="muted">该商品未配置可用标品组合，请先在商品库勾选对应尺码</p>`}
        </div>
        <h4 style="margin-top:14px">非标套件</h4>
        ${nonstdOpts.length ? `<div class="form-grid">
          <div class="form-field"><label>腰带</label>
            <select class="field-input" id="f-cart-c-grade">
              ${nonstdOpts.map((g)=>`<option value="${g.id}" ${d.nonstdGrade===g.id?'selected':''}>${g.id}（${g.belt}）</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>弹力带</label>
            <select class="field-input" id="f-cart-c-size">${bands.map((s)=>`<option value="${s}">${s}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>数量</label><input type="number" class="field-input" id="f-cart-c-qty" value="1" min="1" /></div>
        </div>
        <p class="muted" style="margin:6px 0">非标仅展示「本商品已维护尺码」中排除标品后的组合。可多次添加。</p>
        <button class="btn btn-sm btn-primary" data-action="cart-add-custom">+ 添加</button>` : `<p class="muted">该商品无可下非标组合（腰带/弹力带尺码不足）</p>`}
        <div class="segment-rows" style="margin-top:8px">${d.customRows.map((r,i)=>`<div class="segment-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border,#eee)">
          <span>已添加：${escapeHtml(customComboLabel(r.belt, r.size))} ×${r.qty}</span>
          <button type="button" class="btn btn-sm" data-action="cart-del-custom" data-idx="${i}">删除</button>
        </div>`).join('') || emptyHint('暂无非标，点「+ 添加」')}</div>
        <h4 style="margin-top:14px">配件（非必选；勾选后须填尺码数量）</h4>
        <div class="page-card table-wrap"><table class="data">
          <thead><tr><th></th><th>配件</th><th>尺码</th><th>数量</th></tr></thead>
          <tbody>${partProducts().map((p)=>{
            const on = !!(d.acc[p.id]?.on);
            const sizes = (p.sizes && p.sizes.length) ? p.sizes : ['S','M','L'];
            return sizes.map((sz, si)=>`<tr>
              ${si===0?`<td rowspan="${sizes.length}"><input type="checkbox" data-acc-on="${p.id}" ${on?'checked':''} /></td>
                <td rowspan="${sizes.length}">${escapeHtml(p.name)}</td>`:''}
              <td>${escapeHtml(sz)}</td>
              <td><input type="number" class="field-input" data-acc-qty="${p.id}" data-acc-size="${sz}" value="${(d.acc[p.id]?.qty&&d.acc[p.id].qty[sz])||0}" min="0" ${on?'':'disabled'} style="width:80px" /></td>
            </tr>`).join('');
          }).join('') || `<tr><td colspan="4">${emptyHint('暂无配件')}</td></tr>`}</tbody>
        </table></div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button>
        <button class="btn btn-primary" data-action="cart-submit">提交${channel==='sales'?'销售单':'采购单'}</button>`;
    } else if (type === 'create-return') {
      title = '申请退货';
      body = `<div class="form-field"><label>理由类型</label><select class="field-input" id="f-rtype">${RETURN_REASONS.map((r)=>`<option value="${r.type}">${r.label}</option>`).join('')}</select></div>
        <div class="form-field"><label>说明</label><input class="field-input" id="f-reason" placeholder="可手写补充" /></div>
        <div class="form-field"><label>SN（逗号分隔）</label><input class="field-input" id="f-sns" placeholder="RL..." /></div>
        <div class="form-field"><label>类型</label><select class="field-input" id="f-ttype">
          ${ui.role==='l2'?`<option value="l2_to_l1">二级退一级</option><option value="user">用户退货再入库</option>`:`<option value="l1_to_factory">一级退原厂</option>`}
        </select></div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-return-ok">提交</button>`;
    } else if (type === 'create-account') {
      title = '新建账号';
      body = `<div class="form-grid">
        <div class="form-field"><label>用户名</label><input class="field-input" id="f-user" /></div>
        <div class="form-field"><label>姓名</label><input class="field-input" id="f-name" /></div>
        <div class="form-field"><label>角色</label><select class="field-input" id="f-role">${db.roles.map((r)=>`<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}</select></div>
        <div class="form-field"><label>密码</label><input class="field-input" id="f-pass" value="******" /></div>
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-account-ok">创建</button>`;
    } else if (type === 'create-sub') {
      title = '创建一级子账号（仅扫码）';
      const fixedL1 = ui.role === 'l1' ? currentL1Id() : null;
      body = `<div class="form-grid">
        ${fixedL1
          ? `<div class="form-field span-2"><label>所属一级</label><input class="field-input" value="${escapeHtml(l1Name(fixedL1))}" readonly /><input type="hidden" id="f-l1" value="${fixedL1}" /></div>`
          : `<div class="form-field"><label>所属一级</label><select class="field-input" id="f-l1">${db.agentsL1.map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></div>`}
        <div class="form-field"><label>用户名</label><input class="field-input" id="f-user" placeholder="scan_xx" /></div>
        <div class="form-field"><label>姓名</label><input class="field-input" id="f-name" /></div>
        <div class="form-field"><label>登录密码</label><input class="field-input" id="f-pass" type="password" value="******" /></div>
      </div>
      <p class="muted">子账号权限固定：仅销售扫码，不可改单、不可看其他菜单。</p>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-sub-ok">创建</button>`;
    } else if (type === 'edit-role') {
      const role = db.roles.find((r) => r.id === payload.id) || {};
      const selected = new Set(role.perms || []);
      const hasAll = selected.has('all');
      title = `编辑权限 · ${role.name || ''}`;
      body = `<p class="muted" style="margin-bottom:10px">勾选该角色可用权限；点「全部权限」将全选，上方说明实时同步。</p>
        <div class="form-field"><label>角色说明</label><input class="field-input" id="f-role-desc" value="${escapeHtml(role.desc || roleDescFromPerms(role.perms || []))}" /></div>
        <div class="perm-check-grid">
          ${ALL_PERMS.map((p) => {
            const on = hasAll || selected.has(p) || (p === 'all' && DETAIL_PERMS.every((x) => selected.has(x)));
            return `<label class="perm-check"><input type="checkbox" data-perm="${p}" ${on ? 'checked' : ''}/><span>${escapeHtml(permLabel(p))}</span><code>${escapeHtml(p)}</code></label>`;
          }).join('')}
        </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-role-perms" data-id="${escapeHtml(role.id)}">保存</button>`;
    } else {
      title = '提示';
      body = `<p>${escapeHtml(payload.message || type)}</p>`;
    }

    const wide = type === 'audit-po' || type === 'view-sn' || type === 'edit-sn' || type === 'view-agent-l1' || type === 'edit-l1' || type === 'view-agent-l2' || type === 'edit-l2' || type === 'order-cart' || type === 'view-exception';
    return `<div class="modal-mask" id="modal-mask"><div class="modal ${wide ? 'modal--wide' : ''}" id="modal-box">
      <div class="modal-hd"><strong>${escapeHtml(title)}</strong><button class="btn btn-sm btn-ghost" data-action="close-modal">×</button></div>
      <div class="modal-bd">${body}</div>
      <div class="modal-ft">${foot}</div>
    </div></div>`;
  }

  function syncOrderCartDraftFromDom() {
    if (!ui.modal || ui.modal.type !== 'order-cart') return;
    const d = ui.modal.draft || (ui.modal.draft = { customRows: [], nonstdGrade: '小', stdQty: {}, acc: {} });
    d.productId = $('#f-cart-pid')?.value || d.productId;
    d.nonstdGrade = $('#f-cart-c-grade')?.value || d.nonstdGrade || '小';
    d.stdQty = d.stdQty || {};
    document.querySelectorAll('[data-std-key]').forEach((inp) => {
      d.stdQty[inp.getAttribute('data-std-key')] = Number(inp.value) || 0;
    });
    d.acc = d.acc || {};
    partProducts().forEach((p) => {
      const on = !!document.querySelector(`[data-acc-on="${p.id}"]`)?.checked;
      const qty = {};
      document.querySelectorAll(`[data-acc-qty="${p.id}"]`).forEach((inp) => {
        qty[inp.getAttribute('data-acc-size')] = Number(inp.value) || 0;
      });
      d.acc[p.id] = { on, qty };
    });
  }

  /* ---------- Business actions ---------- */
  function syncDraftFromAuditDom() {
    if (!ui.modal || ui.modal.type !== 'audit-po') return;
    const draft = ui.modal.draft;
    document.querySelectorAll('.audit-line').forEach((el) => {
      const kind = el.getAttribute('data-line-kind');
      const idx = Number(el.getAttribute('data-line-idx'));
      const line = draft[kind][idx];
      if (!line) return;
      el.querySelectorAll('[data-po-field]').forEach((inp) => {
        const f = inp.getAttribute('data-po-field');
        line[f] = inp.type === 'number' ? Number(inp.value) : inp.value;
      });
      const key = lineSegKey(line);
      const segs = [];
      const fromInputs = [...el.querySelectorAll('[data-seg-from]')];
      fromInputs.forEach((fromEl) => {
        const si = fromEl.getAttribute('data-seg-from');
        const toEl = el.querySelector(`[data-seg-to="${si}"]`);
        const from = fromEl.value.trim();
        const to = (toEl?.value || '').trim();
        if (from && to) segs.push(`${from}-${to}`);
        else if (from) segs.push(from);
      });
      // legacy single input fallback
      el.querySelectorAll('[data-seg-idx]').forEach((inp) => { if (inp.value.trim()) segs.push(inp.value.trim()); });
      draft.segments = draft.segments || {};
      draft.segments[key] = segs.length ? segs : [''];
    });
    document.querySelectorAll('[data-part-idx]').forEach((inp) => {
      const i = Number(inp.getAttribute('data-part-idx'));
      const f = inp.getAttribute('data-part-field');
      if (!draft.parts[i]) return;
      draft.parts[i][f] = inp.type === 'number' ? Number(inp.value) : inp.value;
    });
  }

  function applyPurchaseApprove(p, finalize) {
    const allLines = [...(p.lines || []), ...(p.customLines || [])];
    allLines.forEach((line) => {
      const key = lineSegKey(line);
      const segArr = (p.segments || {})[key] || [];
      const sns = [];
      segArr.forEach((seg) => { const list = parseSegment(seg); if (list) sns.push(...list); });
      sns.forEach((sn) => {
        let row = db.sns.find((x) => x.sn === sn);
        if (!row) {
          row = {
            sn, productId: line.productId, size: line.size, belt: line.belt || DEFAULT_BELT[line.size],
            l1Id: p.l1Id, l2Id: null, status: 'l1', tags: line.belt && line.belt !== DEFAULT_BELT[line.size] ? ['个性化'] : [],
            frozen: false, factoryAt: null, soldAt: null, returnAt: null, user: null, events: [], reIn: false, resale: false,
          };
          db.sns.push(row);
        } else {
          row.status = 'l1'; row.l1Id = p.l1Id; row.size = line.size; row.belt = line.belt || row.belt; row.frozen = false;
        }
        pushSnEvent(row, '采购审核入库', p.no, 'purchase');
      });
      if (sns.length) {
        db.stockLogs.unshift({ id: uid('H'), agentType: 'l1', agentId: p.l1Id, productId: line.productId, size: line.size, delta: sns.length, reason: '采购入库', time: nowStr(), ref: p.no });
      }
    });
    p.status = 'approved';
    if (finalize) addLog(`采购单自动生效 ${p.no}`);
  }

  function approveReturn(id) {
    const r = db.returns.find((x) => x.id === id);
    if (!r || r.status !== 'pending') return;
    (r.sns || []).forEach((sn) => {
      const row = db.sns.find((x) => x.sn === sn);
      if (!row) return;
      if (r.type === 'user') {
        row.status = 'l2'; row.reIn = true; row.prevUser = row.user; row.user = null;
        row.tags = [...new Set([...(row.tags || []), '已退货'])];
        row.returnAt = nowStr();
        pushSnEvent(row, '用户退货再入库', r.no, 'return');
      } else if (r.type === 'l2_to_l1') {
        row.status = 'l1'; row.l2Id = null; row.reIn = false;
        row.tags = [...new Set([...(row.tags || []), '已退货'])];
        row.returnAt = nowStr();
        pushSnEvent(row, '二级退一级', r.no, 'return');
        db.stockLogs.unshift({ id: uid('H'), agentType: 'l1', agentId: row.l1Id, productId: row.productId, size: row.size, delta: 1, reason: '二级退货入库', time: nowStr(), ref: r.no });
      } else if (r.type === 'l1_to_factory') {
        row.status = 'frozen'; row.frozen = true; row.l1Id = null; row.l2Id = null;
        row.tags = [...new Set([...(row.tags || []), '已退货', '冷冻'])];
        row.returnAt = nowStr(); row.factoryAt = nowStr();
        pushSnEvent(row, '退原厂入冷冻库', r.no, 'factory');
        db.stockLogs.unshift({ id: uid('H'), agentType: 'l1', agentId: r.fromId, productId: row.productId, size: row.size, delta: -1, reason: '退货回原厂(冷冻)', time: nowStr(), ref: r.no });
      }
    });
    r.status = 'approved';
    addLog(`退货审批通过 ${r.no}`);
    saveStore();
    toast('已通过；退原厂 SN 已打冷冻标签');
    render();
  }

  function doDirectBind(sn, phone, addr, ipRegion) {
    const row = db.sns.find((x) => x.sn === sn);
    if (!row) return toast('SN 不存在', 'err');
    if (row.frozen || row.status === 'frozen') return toast('冷冻库 SN 不可扫码', 'err');
    if (!['l1', 'l2'].includes(row.status) && !(row.status === 'bound' && row.reIn && row.resale)) {
      return toast(`当前状态不可直销：${snStatusMeta(row).label}`, 'err');
    }
    const l1 = db.agentsL1.find((a) => a.id === (currentL1Id() || row.l1Id));
    if (!l1) return toast('未找到一级代理', 'err');
    const phonePrefix = String(phone).slice(0, 3);
    const phoneLoc = PHONE_LOC[phonePrefix] || '未知';
    // IP 必须落在直销围栏城市所属省份
    const ipInDirect = (l1.directAreas || []).some((c) => (CITY_MAP[ipRegion] || []).includes(c));
    const ipPass = ipInDirect || ((l1.directAreas || []).length === 0 && (l1.saleAreas || l1.areas || []).includes(ipRegion));
    if (!ipPass) {
      pushException('SN激活异常', sn, `跨区激活：IP ${ipRegion} 不在直销围栏 ${(l1.directAreas||[]).join('、')}`, 'activate');
    }
    // 手机归属地必须与 IP 地区一致
    const phonePass = phoneLoc !== '未知' && phoneLoc === ipRegion;
    if (!phonePass) {
      pushException('归属地异常', sn, `手机归属 ${phoneLoc} 与 IP 地区 ${ipRegion} 不一致`, 'activate');
    }
    const dup = db.sns.filter((s) => s.user && s.user.phone === phone && s.sn !== sn);
    if (dup.length) pushException('客户信息重复', sn, `手机号 ${phone} 已激活 ${dup.length} 次`, 'activate', { dupPhone: phone });
    const addrNorm = String(addr || '').replace(/\s+/g, '');
    if (addrNorm) {
      const addrDup = db.sns.filter((s) => s.user && String(s.user.addr || '').replace(/\s+/g, '') === addrNorm && s.user.phone !== phone && s.sn !== sn);
      if (addrDup.length) pushException('客户信息重复', sn, `同地址多客户：${addr} 已关联其他手机号`, 'activate');
    }

    row.status = 'bound';
    row.soldAt = nowStr();
    row.bindAt = nowStr();
    row.bindIpRegion = ipRegion;
    row.user = { phone, addr, phoneLoc };
    row.reIn = false;
    pushSnEvent(row, 'C端直销绑定', `${phone} · IP ${ipRegion}`, 'bind');
    db.sales.unshift({
      id: uid('SO'), no: `SO${todayCompact()}${String(++db.seq.so).padStart(3,'0')}`,
      channel: 'direct', l1Id: l1.id, l2Id: row.l2Id || null, productId: row.productId,
      planTotal: 1, planBySize: { [row.size]: 1 }, scanned: [sn], status: 'done', createdAt: nowStr(),
      customer: { phone, addr, phoneLoc },
    });
    db.stockLogs.unshift({ id: uid('H'), agentType: row.l2Id ? 'l2' : 'l1', agentId: row.l2Id || l1.id, productId: row.productId, size: row.size, delta: -1, reason: '直销出库', time: nowStr(), ref: sn });
    addLog(`直销激活 ${sn}`);
    ui.directStep = 1;
    ui.form.directSn = '';
    saveStore();
    toast(ipPass && phonePass ? '激活成功' : '已激活（存在异常，已记入异常管理）', ipPass && phonePass ? 'ok' : 'warn');
  }

  /* ---------- Render shells ---------- */
  function renderLogin() {
    const tab = ui.loginTab || 'platform';
    return `<div class="login-wrap"><div class="login-card login-card--wide">
      <div class="login-brand"><img src="assets/logo.svg" alt="" /><h1>锐涞经销商管理系统</h1></div>
      <p class="login-sub">平台后台 + 代理小程序 · 可走查原型 v6</p>
      <div class="login-tabs">
        <button type="button" class="${tab==='platform'?'active':''}" data-action="login-tab" data-tab-id="platform">平台后台</button>
        <button type="button" class="${tab==='mini'?'active':''}" data-action="login-tab" data-tab-id="mini">代理小程序</button>
      </div>
      ${tab === 'platform' ? `
        <div class="form-field"><label>管理员账号</label><input class="field-input" id="login-user" value="admin" autocomplete="username" /></div>
        <div class="form-field"><label>密码</label><input class="field-input" id="login-pass" type="password" value="demo" autocomplete="current-password" /></div>
        <p class="login-hint">演示：admin / demo（或 admin2）</p>
        <button class="btn btn-primary btn-block" id="btn-login">进入管理后台</button>
      ` : `
        <div class="form-field"><label>代理 ID</label><input class="field-input" id="login-user" value="agent_hd" placeholder="agent_hd / agent_hz / hd_scan_01" /></div>
        <div class="form-field"><label>密码</label><input class="field-input" id="login-pass" type="password" value="******" /></div>
        <p class="login-hint">演示账号：agent_hd（一级）· agent_hz（二级）· hd_scan_01（子账号）· 密码任意 ≥6 位或 ******</p>
        <button class="btn btn-primary btn-block" id="btn-login">进入小程序</button>
      `}
      <button class="btn btn-block" data-action="reset-demo" style="margin-top:8px">重置演示数据</button>
    </div></div>`;
  }

  function renderMini() {
    const tabs = miniTabs();
    const pageFn = PAGES[ui.route] || pageMiniScan;
    return `<div class="mini-stage">
      <div class="mini-phone">
        <div class="mini-phone-bar">
          <span>锐涞小程序</span>
          <div class="mini-role-switch">
            ${MINI_ROLES.map((r) => `<button type="button" class="mini-role-chip ${ui.role === r.role ? 'on' : ''}" data-action="mini-switch-role" data-role="${r.role}">${r.label}</button>`).join('')}
          </div>
        </div>
        <div class="mini-phone-body"><div class="mini-scroll">${pageFn()}</div></div>
        <nav class="mini-tabbar" aria-label="小程序导航">
          ${tabs.map((t) => `<button type="button" class="mini-tab ${miniTabIsActive(t.id) ? 'active' : ''}" data-go="${t.id}">
            <span class="mini-tab-ico">${MINI_TAB_ICONS[t.icon] || ''}</span><span class="mini-tab-label">${escapeHtml(t.title)}</span>
          </button>`).join('')}
        </nav>
      </div>
      <p class="mini-stage-hint">代理端仅小程序 · 底栏 4–5 项（玻璃态）· 顶栏可切换演示身份</p>
    </div>
    ${modalContent()}
    ${confirmOverlayHtml()}
    <div class="toast-wrap">${ui.toast ? `<div class="toast ${ui.toast.kind}">${escapeHtml(ui.toast.msg)}</div>` : ''}</div>`;
  }

  function renderApp() {
    if (ui.mode === 'mini') return renderMini();
    const menus = adminMenus();
    const title = TITLES[ui.route] || '页面';
    const pageFn = PAGES[ui.route] || pageHome;
    const role = ROLES.admin;
    const notes = db.notifications || [];
    const unread = notes.filter((n) => !n.read).length;
    return `<div class="app-bg"><div class="canvas">
      <header class="topbar">
        <div class="brand" data-go="home"><img src="assets/logo.svg" alt="" /><span>锐涞经销商管理系统</span></div>
        <div class="topbar-right">
          <div class="mode-switch">
            <button type="button" class="active" data-mode="admin">管理后台</button>
          </div>
          <div class="notify-wrap">
            <button type="button" class="notify-btn" data-action="toggle-notify">🔔${unread?`<span class="notify-badge">${unread}</span>`:''}</button>
            ${ui.notifyOpen ? `<div class="notify-panel">
              <div class="notify-hd"><strong>通知中心</strong><button class="btn btn-sm" data-action="mark-all-read">全部已读</button></div>
              ${notes.slice(0,20).map((n)=>`<button type="button" class="notify-item ${n.read?'':'unread'}" data-action="read-notify" data-id="${n.id}">
                <div class="notify-title">${escapeHtml(n.title)}</div>
                <div class="notify-body">${escapeHtml(n.body)}</div>
                <div class="notify-meta">${escapeHtml(n.time)}</div>
              </button>`).join('') || '<div class="empty-hint" style="padding:16px">暂无通知</div>'}
            </div>` : ''}
          </div>
          <div class="user" data-action="logout" title="退出"><span class="user-avatar">${role.avatar}</span><span class="user-name">${escapeHtml(ui.account || role.name)}</span></div>
        </div>
      </header>
      <div class="panel">
        <aside class="sidebar"><div class="sidebar-scroll">
          ${menus.map((g)=>`<div class="nav-group-title">${g.group}</div>${g.items.map((it)=>
            `<button class="nav-item ${ui.route===it.id?'active':''}" data-go="${it.id}">
              <span class="icon">${it.icon}</span><span>${it.title}</span>
              ${it.badge ? `<span class="menu-badge">${it.badge}</span>` : ''}
            </button>`).join('')}`).join('')}
        </div>
        <button class="sidebar-foot" data-action="logout">退出登录</button></aside>
        <main class="content ${ui.route==='stats'?'content--dash':''}">
          <div class="content-bar ${ui.route==='stats'?'content-bar--dash':''}"><span>首页</span><span class="sep">/</span><strong>${escapeHtml(title)}</strong></div>
          <div class="content-body ${ui.route==='stats'?'content-body--dash':''}"><div class="page page--scroll ${ui.route==='stats'?'page--dash':''}">${pageFn()}</div></div>
        </main>
      </div>
    </div>
    ${modalContent()}
    ${confirmOverlayHtml()}
    <div class="toast-wrap">${ui.toast?`<div class="toast ${ui.toast.kind}">${escapeHtml(ui.toast.msg)}</div>`:''}</div>
    </div>`;
  }

  function render() {
    ensureApprovedPendingEffect();
    document.getElementById('app').innerHTML = ui.loggedIn ? renderApp() : renderLogin();
    bindEvents();
  }

  function doNavigate(id) {
    if (!PAGES[id]) return toast('页面不存在', 'err');
    if (ui.mode === 'mini') {
      if (!miniAllowedRoutes().includes(id)) return toast('当前小程序角色无此页', 'err');
      // 旧路由兼容到合并后的底栏页
      if (id === 'mini-purchase' || id === 'mini-sales') {
        ui.tabs.miniBiz = id === 'mini-sales' ? 'sales' : 'purchase';
        id = ui.role === 'l1' ? 'mini-biz' : id;
      }
      if (id === 'mini-aftersale' || id === 'mini-exception') {
        ui.tabs.miniService = id === 'mini-exception' ? 'exception' : 'return';
        id = 'mini-service';
      }
    }
    ui.route = id;
    location.hash = id;
    ui.modal = null;
    ui.confirm = null;
    ui.notifyOpen = false;
    ui._skipExLeave = false;
    ui._pendingNav = null;
    render();
  }

  function navigate(id) {
    if (ui.route === 'exception' && id !== 'exception' && !ui._skipExLeave && ui.mode === 'admin') {
      const openIds = getOpenExceptionIdsInFilter();
      if (openIds.length) {
        ui._pendingNav = id;
        openModal('leave-exception', { count: openIds.length, ids: openIds });
        render();
        return;
      }
    }
    doNavigate(id);
  }

  function persistSession() {
    sessionStorage.setItem('ruilai_logged', ui.loggedIn ? '1' : '0');
    sessionStorage.setItem('ruilai_role', ui.role);
    sessionStorage.setItem('ruilai_mode', ui.mode);
    sessionStorage.setItem('ruilai_login_tab', ui.loginTab);
    sessionStorage.setItem('ruilai_account', ui.account || '');
    sessionStorage.setItem('ruilai_scan_mode', ui.scanMode || 'ship');
  }

  function doLogin() {
    const user = ($('#login-user')?.value || '').trim();
    const pass = ($('#login-pass')?.value || '').trim();
    if (ui.loginTab === 'platform') {
      const acc = db.accounts.find((a) => a.username === user && a.roleId === 'R1' && a.status === '启用');
      if (!acc || (pass !== acc.password && pass !== 'demo' && pass !== '******')) {
        return toast('平台账号或密码错误（演示：admin / demo）', 'err');
      }
      ui.loggedIn = true; ui.role = 'admin'; ui.mode = 'admin'; ui.account = acc.username; ui.route = 'home';
    } else {
      if (pass.length < 6 && pass !== '******') return toast('密码至少 6 位', 'err');
      const acc = db.accounts.find((a) => a.username === user && a.status === '启用');
      if (!acc || acc.roleId === 'R1') return toast('请使用代理账号登录小程序', 'err');
      const roleMap = { R2: 'l1', R3: 'sub', R4: 'l2' };
      ui.role = roleMap[acc.roleId] || 'l1';
      if (ui.role === 'l1') ROLES.l1 = { ...ROLES.l1, name: acc.name, account: acc.username, l1Id: acc.agentId };
      if (ui.role === 'l2') {
        const l2 = db.agentsL2.find((a) => a.id === acc.agentId);
        ROLES.l2 = { ...ROLES.l2, name: acc.name, account: acc.username, l2Id: acc.agentId, l1Id: l2?.parentId };
      }
      if (ui.role === 'sub') ROLES.sub = { ...ROLES.sub, name: acc.name, account: acc.username, l1Id: acc.agentId };
      ui.loggedIn = true; ui.mode = 'mini'; ui.account = acc.username; ui.route = 'mini-scan';
    }
    persistSession();
    location.hash = ui.route;
    addLog(ui.mode === 'mini' ? '登录小程序' : '登录后台', 'login');
    toast(`已登录：${ui.account}`);
    render();
  }

  function handleAction(action, el) {
    const id = el.getAttribute('data-id');
    switch (action) {
      case 'login-tab':
        ui.loginTab = el.getAttribute('data-tab-id');
        persistSession(); render(); break;
      case 'reset-demo':
        localStorage.removeItem(persistKey); db = seed(); saveStore(); toast('演示数据已重置 (v6)'); render(); break;
      case 'logout':
        ui.loggedIn = false; persistSession(); ui.modal = null; render(); break;
      case 'close-modal': closeModal(); break;
      case 'toggle-notify': ui.notifyOpen = !ui.notifyOpen; render(); break;
      case 'mark-all-read': (db.notifications||[]).forEach((n)=>n.read=true); saveStore(); render(); break;
      case 'read-notify': {
        const n = db.notifications.find((x)=>x.id===id); if (n) n.read = true; saveStore(); render(); break;
      }
      case 'apply-filter': render(); break;
      case 'open-create-l1':
        openModal('create-l1', { draftSeed: { name: '', contact: '', mainAreas: [], saleAreas: [], directAreas: [], ent: {} } }); break;
      case 'edit-l1': {
        const a = db.agentsL1.find((x)=>x.id===id);
        openModal('edit-l1', { id, draft: JSON.parse(JSON.stringify(a)) }); break;
      }
      case 'save-l1': {
        const d = ui.modal.draft;
        d.name = $('#f-name')?.value || d.name;
        d.contact = $('#f-contact')?.value || d.contact;
        d.warnMultiplier = Number($('#f-warn')?.value || d.warnMultiplier || 1.5);
        d.warnMode = $('#f-warn-mode')?.value || d.warnMode || 'strict';
        d.ent = readEntFields();
        d.areas = d.saleAreas || d.areas;
        const i = db.agentsL1.findIndex((x)=>x.id===d.id);
        if (i>=0) db.agentsL1[i] = d;
        addLog(`编辑一级 ${d.name}（报警 ${d.warnMode}/${d.warnMultiplier}）`); saveStore(); closeModal(); toast('已保存'); break;
      }
      case 'create-l1-ok': {
        const d = ui.modal.draft;
        d.name = $('#f-name')?.value; d.contact = $('#f-contact')?.value; d.ent = readEntFields();
        if (!d.name || !(d.mainAreas||[]).length) return toast('请填写名称与主授权区域', 'err');
        d.id = uid('L1'); d.code = `AG-L1-${String(db.agentsL1.length+1).padStart(3,'0')}`;
        d.status = '启用'; d.areas = d.saleAreas || [...d.mainAreas]; d.saleAreas = d.areas;
        d.directAreas = d.directAreas || []; d.warnMultiplier = 1.5; d.warnMode = 'strict';
        db.agentsL1.push(d); addLog(`创建一级 ${d.name}`); saveStore(); closeModal(); toast('已创建'); break;
      }
      case 'disable-l1':
        confirmDialog(
          `确认${db.agentsL1.find(a=>a.id===id)?.status==='启用'?'停用':'启用'}该一级代理？停用后下属法人二级将进入待分配。`,
          'disable-l1-ok',
          { id },
          { title: '一级代理状态确认', danger: db.agentsL1.find(a=>a.id===id)?.status==='启用' }
        );
        break;
      case 'confirm-cancel':
        closeConfirm(); break;
      case 'confirm-ok': {
        const conf = ui.confirm;
        if (!conf?.action) { closeConfirm(); break; }
        const act = conf.action;
        const pid = conf.payload?.id;
        ui.confirm = null;
        if (act === 'disable-l1-ok') {
          const a = db.agentsL1.find((x)=>x.id===pid);
          if (!a) { render(); break; }
          if (a.status === '启用') {
            a.status = '停用';
            db.agentsL2.filter((l)=>l.parentId===a.id && l.type==='法人').forEach((l)=>{
              l.pending = true; l.prevParentId = a.id; l.prevAreas = [...(l.areas||[])]; l.parentId = null; l.areas = [];
            });
            pushNotify('二级待分配', `${a.name} 停用，下属法人进入待分配`, '原厂');
            addLog(`停用一级 ${a.name}`);
          } else { a.status = '启用'; addLog(`启用一级 ${a.name}`); }
          saveStore(); toast('已更新'); render();
        } else if (act === 'po-reject-ok') {
          const p = db.purchases.find((x)=>x.id===pid);
          if (p) { p.status = 'rejected'; addLog(`驳回采购 ${p.no}`); saveStore(); toast('已驳回'); }
          ui.modal = null; render();
        } else if (act === 'po-confirm-ok') {
          finishPoConfirm(pid);
        } else if (act === 'revoke-po-ok') {
          const p = db.purchases.find((x)=>x.id===pid);
          if (p && p.status === 'approvedPending') { p.status = 'cosigning'; p.cosign = { admin1: false, admin2: false }; addLog(`撤销采购审核 ${p.no}`); saveStore(); toast('已撤销'); }
          render();
        } else if (act === 'close-ex-ok') {
          const e = db.exceptions.find((x)=>x.id===pid);
          if (e) { e.status = '已处理'; addLog(`处理异常 ${e.type}`); saveStore(); toast('已标记处理'); }
          ui.modal = null; render();
        } else if (act === 'toggle-l2-ok') {
          const a = db.agentsL2.find((x)=>x.id===pid);
          if (a) { a.status = a.status==='启用'?'停用':'启用'; addLog(`${a.status}二级 ${a.name}`); saveStore(); toast('已更新'); }
          render();
        } else if (act === 'unbind-l2-ok') {
          const a = db.agentsL2.find((x)=>x.id===pid);
          if (a && a.type==='法人') {
            a.pending = true; a.prevParentId = a.parentId; a.prevAreas = [...(a.areas||[])]; a.parentId = null; a.areas = [];
            pushNotify('二级待分配', `${a.name} 已解绑`, '原厂');
            addLog(`解绑二级 ${a.name}`); saveStore(); toast('已解绑并进入待分配');
          }
          ui.modal = null; render();
        } else if (act === 'audit-l2-ok') {
          const a = db.agentsL2.find((x)=>x.id===pid);
          if (a) { a.auditStatus = 'approved'; addLog(`二级审核通过 ${a.name}`); saveStore(); toast('已通过'); }
          ui.modal = null; render();
        } else if (act === 'audit-l2-reject-ok') {
          const a = db.agentsL2.find((x)=>x.id===pid);
          if (a) { a.auditStatus = 'rejected'; addLog(`二级审核驳回 ${a.name}`); saveStore(); toast('已驳回'); }
          ui.modal = null; render();
        } else if (act === 'approve-return-ok') {
          approveReturn(pid); ui.modal = null; render();
        } else if (act === 'reject-return-ok') {
          const r = db.returns.find((x)=>x.id===pid);
          if (r) { r.status = 'rejected'; addLog(`驳回退货 ${r.no}`); saveStore(); toast('已驳回'); }
          ui.modal = null; render();
        } else if (act === 'scan-confirm-so-ok') {
          finishScanConfirmSo(pid);
        } else if (act === 'rebind-l2-confirm-ok') {
          finishRebindL2(pid, conf.payload);
        } else {
          render();
        }
        break;
      }
      case 'edit-l2':
      case 'edit-l2-fence': {
        const a = db.agentsL2.find((x)=>x.id===id);
        openModal('edit-l2', { id, draft: JSON.parse(JSON.stringify(a)) }); break;
      }
      case 'save-l2': {
        const d = ui.modal.draft;
        d.name = $('#f-name')?.value || d.name;
        const wv = $('#f-warn')?.value;
        d.warnMultiplier = wv === '' || wv == null ? null : Number(wv);
        d.warnMode = $('#f-warn-mode')?.value || null;
        if (d.type==='法人') d.ent = readEntFields();
        const i = db.agentsL2.findIndex((x)=>x.id===d.id);
        if (i>=0) db.agentsL2[i] = d;
        addLog(`编辑二级 ${d.name}`); saveStore(); closeModal(); toast('已保存'); break;
      }
      case 'toggle-l2':
        confirmDialog('确认切换该二级代理启用状态？', 'toggle-l2-ok', { id }, { title: '二级代理状态确认' });
        break;
      case 'unbind-l2':
        confirmDialog('确认解绑该法人二级？将进入待分配池。', 'unbind-l2-ok', { id }, { title: '解绑确认', danger: true });
        break;
      case 'open-rebind-l2': {
        const a = db.agentsL2.find((x) => x.id === id);
        openModal('rebind-l2', {
          id,
          draftSeed: {
            parentId: a?.prevParentId || a?.parentId || db.agentsL1.find((x) => x.status === '启用')?.id || '',
            areas: [...(a?.prevAreas || a?.areas || [])],
          },
        });
        break;
      }
      case 'rebind-l2-ok': {
        const parentId = $('#f-parent')?.value || ui.modal.draft?.parentId;
        const cities = ui.modal.draft?.areas || [];
        if (!parentId) return toast('请选择绑定一级', 'err');
        if (!cities.length) return toast('请选择围栏城市（可用全选）', 'err');
        confirmDialog(`确认绑定到「${l1Name(parentId)}」并授权 ${cities.length} 个围栏城市？`, 'rebind-l2-confirm-ok', { id, parentId, cities }, { title: '确认绑定二级' });
        break;
      }
      case 'audit-l2-ok': {
        const a = db.agentsL2.find((x)=>x.id===id);
        confirmDialog(`确认通过二级代理「${a?.name || ''}」的审核？`, 'audit-l2-ok', { id }, { title: '二级审核通过', okText: '确认通过' });
        break;
      }
      case 'audit-l2-reject': {
        const a = db.agentsL2.find((x)=>x.id===id);
        confirmDialog(`确认驳回二级代理「${a?.name || ''}」？`, 'audit-l2-reject-ok', { id }, { title: '二级审核驳回', danger: true });
        break;
      }
      case 'open-audit-po': {
        const p = db.purchases.find((x)=>x.id===id);
        openModal('audit-po', { id, draft: JSON.parse(JSON.stringify(p)) }); break;
      }
      case 'po-add-custom': {
        syncDraftFromAuditDom();
        ui.modal.draft.customLines = ui.modal.draft.customLines || [];
        ui.modal.draft.customLines.push({ productId: 'P1', size: 'M', belt: '腰带S', qty: 1 });
        render(); break;
      }
      case 'po-add-seg': {
        syncDraftFromAuditDom();
        const kind = el.getAttribute('data-kind');
        const idx = Number(el.getAttribute('data-idx'));
        const line = ui.modal.draft[kind][idx];
        const key = lineSegKey(line);
        ui.modal.draft.segments[key] = ui.modal.draft.segments[key] || [''];
        ui.modal.draft.segments[key].push('');
        render(); break;
      }
      case 'po-reject':
        syncDraftFromAuditDom();
        ui.form._poDraft = JSON.parse(JSON.stringify(ui.modal.draft));
        confirmDialog(`确认驳回采购单 ${ui.modal.draft?.no || ''}？`, 'po-reject-ok', { id: ui.modal.draft.id }, { title: '采购单驳回', danger: true });
        break;
      case 'po-confirm':
        syncDraftFromAuditDom();
        if (!segmentsMatch(ui.modal.draft)) return toast('段号数量不匹配', 'err');
        ui.form._poDraft = JSON.parse(JSON.stringify(ui.modal.draft));
        confirmDialog(`确认对采购单 ${ui.modal.draft?.no || ''} 提交会签？两位管理员均确认后立即生效。`, 'po-confirm-ok', { id: ui.modal.draft.id }, { title: '采购会签确认', okText: '确认会签' });
        break;
      case 'revoke-po':
        confirmDialog('确认撤销审核？将回到会签中。', 'revoke-po-ok', { id }, { title: '撤销采购审核', danger: true });
        break;
      case 'save-sn': {
        const row = db.sns.find((s)=>s.sn===id);
        if (!row) { toast('找不到该 SN', 'err'); break; }
        const newSn = ($('#f-sn')?.value || '').trim().toUpperCase();
        const size = $('#f-size')?.value;
        const belt = normalizeBelt($('#f-belt')?.value);
        const l1Id = $('#f-l1')?.value || null;
        const l2Id = $('#f-l2')?.value || null;
        if (!newSn) return toast('SN 不能为空', 'err');
        if (newSn !== row.sn && db.sns.some((s)=>s.sn===newSn)) return toast('SN 段号重复', 'err');
        const changes = [];
        if (newSn !== row.sn) { changes.push(`SN ${row.sn}→${newSn}`); row.sn = newSn; }
        if (size && size !== row.size) { changes.push(`弹力带 ${row.size}→${size}`); row.size = size; }
        if (belt && belt !== row.belt) { changes.push(`腰带 ${row.belt}→${belt}`); row.belt = belt; }
        if (l1Id !== (row.l1Id || null)) { changes.push(`一级 ${l1Name(row.l1Id)}→${l1Name(l1Id)}`); row.l1Id = l1Id; }
        if (l2Id !== (row.l2Id || null)) {
          changes.push(`二级调库 ${l2Name(row.l2Id)}→${l2Name(l2Id)}`);
          row.l2Id = l2Id || null;
          if (l2Id && ['l1', 'warehouse'].includes(row.status)) row.status = 'l2';
          if (!l2Id && row.status === 'l2') row.status = 'l1';
        }
        if (!changes.length) { toast('未修改任何字段', 'warn'); break; }
        const who = (ROLES[ui.role]?.account || ui.account || 'admin');
        const when = nowStr();
        row.tags = [...new Set([...(row.tags||[]), '修改过'])];
        pushSnEvent(row, '管理员修改', `${who} 于 ${when}：${changes.join('；')}`, 'edit');
        addLog(`修改SN ${row.sn}：${changes.join('；')}`, 'edit');
        saveStore();
        closeModal();
        toast('已保存修改记录');
        break;
      }
      case 'open-import-sn-seg':
        ui.form.segPaste = '';
        openModal('import-sn-seg', {}); break;
      case 'open-gen-sn': openModal('gen-sn', {}); break;
      case 'gen-sn-ok': {
        const qty = Math.min(200, Math.max(1, Number($('#f-qty')?.value) || 0));
        if (!qty) return toast('请填写数量', 'err');
        const meta = { l1Id: $('#f-l1')?.value, productId: $('#f-pid')?.value, size: $('#f-size')?.value, belt: $('#f-belt')?.value };
        const list = nextInternalSnBatch(qty);
        list.forEach((sn) => {
          const row = {
            sn, productId: meta.productId, size: meta.size, belt: meta.belt,
            l1Id: meta.l1Id, l2Id: null, status: 'warehouse', tags: ['系统生成'],
            frozen: false, factoryAt: nowStr(), soldAt: null, returnAt: null, user: null, events: [], reIn: false, resale: false,
          };
          pushSnEvent(row, '系统内部生成', `${productName(meta.productId)} / ${meta.size}`, 'import');
          db.sns.push(row);
        });
        addLog(`系统生成SN ${list[0]}~${list[list.length - 1]} 共${list.length}条`);
        saveStore(); closeModal(); toast(`已生成 ${list.length} 条 SN`); break;
      }
      case 'import-sn-seg-ok': {
        const meta = { l1Id: $('#f-l1')?.value, productId: $('#f-pid')?.value, size: $('#f-size')?.value, belt: $('#f-belt')?.value };
        const text = $('#f-seg-paste')?.value || ui.form.segPaste || '';
        const result = importSnSegmentsFromText(text, meta);
        if (result.err) return toast(result.err, 'err');
        ui.form.segPaste = '';
        addLog(`批量导入SN段号 +${result.added}`);
        saveStore(); closeModal(); toast(`导入 ${result.added} 条${result.skipped ? `，跳过 ${result.skipped}` : ''}`); break;
      }
      case 'save-ex-rules': {
        db.exceptionMultiplier = Number($('#f-ex-mult')?.value || db.exceptionMultiplier || 1.5);
        db.exceptionRules = db.exceptionRules || {};
        db.exceptionRules.overOrderRatio = Number($('#f-ex-over')?.value || 1);
        db.exceptionRules.stockTurnover = Number($('#f-ex-turn')?.value || db.exceptionMultiplier);
        addLog(`更新异常标准 倍数${db.exceptionMultiplier} 超量比${db.exceptionRules.overOrderRatio} 周转${db.exceptionRules.stockTurnover}`);
        saveStore(); toast('异常标准已保存'); render(); break;
      }
      case 'switch-line': {
        db.activeProductLineId = id;
        addLog(`切换产品线 ${lineName(id)}`);
        saveStore(); toast(`当前产品线：${lineName(id)}`); render(); break;
      }
      case 'leave-ex-stay':
        ui._pendingNav = null; closeModal(); break;
      case 'leave-ex-skip': {
        const go = ui._pendingNav; ui._skipExLeave = true; closeModal(); if (go) doNavigate(go); break;
      }
      case 'leave-ex-done': {
        const ids = ui.modal?.payload?.ids || getOpenExceptionIdsInFilter();
        ids.forEach((eid) => {
          const e = db.exceptions.find((x) => x.id === eid);
          if (e && e.status === '未处理') e.status = '已处理';
        });
        addLog(`离开异常页：批量标记已处理 ${ids.length} 条`, 'exception');
        saveStore();
        const go = ui._pendingNav; ui._skipExLeave = true; closeModal(); if (go) doNavigate(go); break;
      }
      case 'edit-ex-explain': openModal('ex-explain', { id }); break;
      case 'save-ex-explain': {
        const e = db.exceptions.find((x) => x.id === id);
        if (e) {
          e.explain = $('#f-explain')?.value?.trim() || '';
          addLog(`填写超量解释 ${e.target}`);
          saveStore();
        }
        closeModal(); toast('解释已保存'); break;
      }
      case 'reassign-frozen': openModal('reassign-frozen', { id }); break;
      case 'reassign-frozen-ok': {
        const row = db.sns.find((s)=>s.sn===id);
        const l1Id = $('#f-l1')?.value;
        row.l1Id = l1Id; row.status = 'l1'; row.frozen = false;
        row.tags = (row.tags||[]).filter((t)=>t!=='冷冻');
        pushSnEvent(row, '冷冻库重分配', l1Name(l1Id), 'reassign');
        addLog(`冷冻SN重分配 ${id} → ${l1Name(l1Id)}`); saveStore(); closeModal(); toast('已解冻并分配'); break;
      }
      case 'approve-return': {
        const r = db.returns.find((x)=>x.id===id);
        confirmDialog(`确认审核通过退货单 ${r?.no || ''}？`, 'approve-return-ok', { id }, { title: '退货审核通过', okText: '确认通过' });
        break;
      }
      case 'reject-return': {
        const r = db.returns.find((x)=>x.id===id);
        confirmDialog(`确认驳回退货单 ${r?.no || ''}？`, 'reject-return-ok', { id }, { title: '退货驳回', danger: true });
        break;
      }
      case 'close-exception':
        confirmDialog('是否已处理？选择确定后该异常不再加粗提醒。', 'close-ex-ok', { id }, { title: '异常处理确认' });
        break;
      case 'save-ex-mult': {
        const v = Number(document.querySelector('[data-filter="exception:mult"]')?.value || db.exceptionMultiplier);
        db.exceptionMultiplier = v; saveStore(); toast(`预警倍数已设为 ${v}`); break;
      }
      case 'open-create-account': openModal('create-account', {}); break;
      case 'open-edit-role': openModal('edit-role', { id }); break;
      case 'save-role-perms': {
        const role = db.roles.find((r) => r.id === id);
        if (!role) return toast('角色不存在', 'err');
        const perms = [...document.querySelectorAll('[data-perm]:checked')].map((el) => el.getAttribute('data-perm'));
        if (!perms.length) return toast('请至少勾选一项权限', 'err');
        // 勾选「全部权限」或明细全勾时以 all 为准
        role.perms = (perms.includes('all') || DETAIL_PERMS.every((p) => perms.includes(p))) ? ['all'] : perms.filter((p) => p !== 'all');
        const desc = $('#f-role-desc')?.value?.trim() || roleDescFromPerms(role.perms);
        role.desc = desc;
        addLog(`编辑角色权限 ${role.name}`);
        saveStore();
        closeModal();
        toast('角色权限已更新');
        break;
      }
      case 'create-account-ok': {
        const username = $('#f-user')?.value?.trim();
        const name = $('#f-name')?.value?.trim();
        const roleId = $('#f-role')?.value;
        const password = $('#f-pass')?.value || '******';
        if (!username) return toast('请填写用户名', 'err');
        db.accounts.push({ id: uid('ACC'), username, name, roleId, status: '启用', password });
        addLog(`创建账号 ${username}`); saveStore(); closeModal(); toast('已创建'); break;
      }
      case 'toggle-account': {
        const a = db.accounts.find((x)=>x.id===id); a.status = a.status==='启用'?'停用':'启用'; saveStore(); render(); break;
      }
      case 'open-create-sub': openModal('create-sub', {}); break;
      case 'create-sub-ok': {
        const l1Id = $('#f-l1')?.value;
        const username = $('#f-user')?.value?.trim();
        const name = $('#f-name')?.value?.trim();
        const password = $('#f-pass')?.value || '******';
        if (!username) return toast('请填写用户名', 'err');
        if (db.accounts.some((a) => a.username === username)) return toast('用户名已存在', 'err');
        db.subAccounts.push({ id: uid('SUB'), l1Id, username, name, status: '启用' });
        db.accounts.push({ id: uid('ACC'), username, name, roleId: 'R3', agentId: l1Id, status: '启用', password });
        addLog(`创建子账号 ${username}`); saveStore(); closeModal(); toast('已创建子账号（仅扫码）'); break;
      }
      case 'toggle-sub': {
        const s = db.subAccounts.find((x)=>x.id===id); s.status = s.status==='启用'?'停用':'启用';
        const acc = db.accounts.find((a)=>a.username===s.username); if (acc) acc.status = s.status;
        saveStore(); render(); break;
      }
      case 'sort-col': {
        const key = el.getAttribute('data-sort-key');
        const scope = el.getAttribute('data-sort-scope');
        if (ui.sort[scope] === key) ui.sort[`${scope}-dir`] = ui.sort[`${scope}-dir`]==='asc'?'desc':'asc';
        else { ui.sort[scope] = key; ui.sort[`${scope}-dir`] = 'asc'; }
        render(); break;
      }
      case 'mini-switch-role': {
        ui.role = el.getAttribute('data-role');
        ui.route = ui.role === 'sub' ? 'mini-scan' : (miniTabs()[0]?.id || 'mini-scan');
        persistSession(); render(); break;
      }
      case 'set-scan-mode':
        ui.scanMode = el.getAttribute('data-scan-mode') || el.getAttribute('data-mode');
        ui.directStep = 1;
        persistSession(); render(); break;
      case 'mini-create-so': openModal('create-so', {}); break;
      case 'create-so-ok': {
        const l2Id = $('#f-l2')?.value;
        const productId = $('#f-pid')?.value;
        const planBySize = {}; let planTotal = 0;
        document.querySelectorAll('[data-size-qty]').forEach((inp) => {
          const q = Number(inp.value)||0; if (q>0) { planBySize[inp.getAttribute('data-size-qty')] = q; planTotal += q; }
        });
        if (!planTotal) return toast('请填写数量', 'err');
        const parts = [];
        const pb = Number($('#f-part-belt')?.value) || 0;
        const ps = Number($('#f-part-sil')?.value) || 0;
        if (pb > 0) parts.push({ partId: 'PART-BELT', spec: '配件', qty: pb });
        if (ps > 0) parts.push({ partId: 'PART-SIL', spec: 'M', qty: ps });
        const so = {
          id: uid('SO'), no: `SO${todayCompact()}${String(++db.seq.so).padStart(3,'0')}`, channel: 'distribute',
          l1Id: currentL1Id() || $('#f-l1')?.value || db.agentsL2.find((a)=>a.id===l2Id)?.parentId, l2Id, productId, planTotal, planBySize, parts, scanned: [], status: 'scanning', createdAt: nowStr(),
        };
        // 8.6 / 12.2：按一级+二级报警粒度与超量比触发
        const cfg = resolveWarnConfig(so.l1Id, l2Id);
        const overRatio = Number(cfg.rules.overOrderRatio || 1);
        const l2Stock = db.sns.filter((x) => x.l2Id === l2Id && x.status === 'l2' && !x.frozen && x.productId === productId).length;
        if (l2Stock > 0 && planTotal >= Math.max(1, Math.ceil(l2Stock * overRatio))) {
          pushException('超量下单预警', l2Name(l2Id), `二级在库 ${l2Stock} 仍出货 ${planTotal}（超量比 ${overRatio}，代理倍数 ${cfg.mult}）`, 'scan', { mode: cfg.mode });
        }
        db.sales.unshift(so); saveStore(); openModal('scan-so', { id: so.id }); break;
      }
      case 'mini-open-scan-so': openModal('scan-so', { id }); break;
      case 'scan-add-sn': {
        const s = db.sales.find((x)=>x.id===id);
        if (!s) break;
        const sn = $('#scan-sn-input')?.value?.trim().toUpperCase();
        const r = tryAddSnToSale(s, sn);
        if (!r.ok) return toast(r.msg, 'err');
        if ($('#scan-sn-input')) $('#scan-sn-input').value = '';
        saveStore(); render(); toast(`已添加 ${r.msg}`); break;
      }
      case 'scan-add-seg': {
        const s = db.sales.find((x)=>x.id===id);
        if (!s) break;
        const from = $('#scan-seg-from')?.value?.trim().toUpperCase();
        const to = $('#scan-seg-to')?.value?.trim().toUpperCase();
        if (!from) return toast('请填写起始 SN', 'err');
        const seg = to ? `${from}-${to}` : from;
        const list = parseSegment(seg);
        if (!list || !list.length) return toast('号段格式无效（示例 RL…0001 — RL…0010）', 'err');
        let okN = 0;
        const errs = [];
        for (const sn of list) {
          if ((s.scanned || []).length >= s.planTotal) { errs.push('已达计划总数'); break; }
          const r = tryAddSnToSale(s, sn);
          if (r.ok) okN += 1;
          else errs.push(r.msg);
        }
        if ($('#scan-seg-from')) $('#scan-seg-from').value = '';
        if ($('#scan-seg-to')) $('#scan-seg-to').value = '';
        saveStore(); render();
        if (okN) toast(`号段已添加 ${okN} 个`);
        if (!okN) toast(errs[0] || '未能添加', 'err');
        else if (errs.length) toast(`部分失败：${errs[0]}`, 'warn');
        break;
      }
      case 'scan-confirm-so': {
        const s = db.sales.find((x)=>x.id===id);
        if (!s) return toast('销售单不存在', 'err');
        if ((s.scanned||[]).length < s.planTotal) return toast('未扫满', 'err');
        confirmDialog(`确认完成出货 ${s.no}（已扫 ${(s.scanned||[]).length}/${s.planTotal}）？`, 'scan-confirm-so-ok', { id }, { title: '确认出货', okText: '确认出货' });
        break;
      }
      case 'mini-direct-bind': {
        db.demoIpRegion = $('#demo-ip')?.value || db.demoIpRegion;
        doDirectBind(ui.form.directSn || $('#direct-sn')?.value?.trim().toUpperCase(), $('#direct-phone')?.value?.trim(), $('#direct-addr')?.value?.trim(), db.demoIpRegion);
        render(); break;
      }
      case 'mini-direct-step1': {
        const sn = $('#direct-sn')?.value?.trim().toUpperCase();
        const row = db.sns.find((x) => x.sn === sn);
        if (!row) return toast('SN 不存在', 'err');
        if (row.frozen || row.status === 'frozen') return toast('冷冻库 SN 不可扫码', 'err');
        if (!['l1', 'l2'].includes(row.status) && !(row.status === 'bound' && row.reIn && row.resale)) {
          return toast(`当前状态不可直销：${snStatusMeta(row).label}`, 'err');
        }
        ui.form.directSn = sn;
        ui.directStep = 2;
        toast('SN 已确认，请填写客户信息');
        render(); break;
      }
      case 'mini-direct-back':
        ui.directStep = 1; render(); break;
      case 'open-edit-sn':
        openModal('edit-sn', { id }); break;
      case 'open-view-sn':
        openModal('view-sn', { id }); break;
      case 'select-all-main': {
        if (!ui.modal?.draft) break;
        const occ = occupiedMainAreas(ui.modal.draft.id);
        ui.modal.draft.mainAreas = ALL_REGIONS.filter((r) => !occ.has(r));
        render(); break;
      }
      case 'select-all-sale': {
        if (!ui.modal?.draft) break;
        ui.modal.draft.saleAreas = [...ALL_REGIONS];
        render(); break;
      }
      case 'select-all-direct': {
        if (!ui.modal?.draft) break;
        const areas = ui.modal.draft.saleAreas || ui.modal.draft.areas || [];
        ui.modal.draft.directAreas = areas.flatMap((r) => CITY_MAP[r] || []);
        render(); break;
      }
      case 'select-all-city': {
        if (!ui.modal?.draft) break;
        const parentId = ui.modal.draft.parentId || $('#f-parent')?.value;
        const list = citiesForL1(parentId);
        ui.modal.draft.areas = list.length ? [...list] : ['杭州市'];
        render(); break;
      }
      case 'open-create-product':
        openModal('create-product', { ptype: el.getAttribute('data-ptype') || 'kit', draftSeed: { type: el.getAttribute('data-ptype') || 'kit', sizes: [...BAND_SIZES], belts: [...BELTS], defaultBelt: { ...DEFAULT_BELT }, status: '上架', productLineId: activeLineId(), code: '', name: '', note: '' } });
        break;
      case 'open-edit-product': {
        const p = db.products.find((x) => x.id === id);
        const draft = JSON.parse(JSON.stringify(p));
        if (draft.type === 'kit') {
          draft.sizes = draft.sizes || [...BAND_SIZES];
          draft.belts = draft.belts || [...BELTS];
          draft.defaultBelt = { ...DEFAULT_BELT, ...(draft.defaultBelt || {}) };
        }
        openModal('edit-product', { id, draft }); break;
      }
      case 'save-product': {
        const d = ui.modal.draft || {};
        d.code = $('#f-pcode')?.value?.trim() || d.code;
        d.name = $('#f-pname')?.value?.trim() || d.name;
        d.status = $('#f-pstatus')?.value || d.status || '上架';
        d.productLineId = $('#f-pline')?.value || d.productLineId || activeLineId();
        d.note = $('#f-pnote')?.value || '';
        d.type = d.type || 'kit';
        if (d.type !== 'kit') d.sizes = ($('#f-psizes')?.value || '').split(/[,，]/).map((x) => x.trim()).filter(Boolean);
        else {
          if (!(d.sizes || []).length) return toast('请至少选择一个弹力带尺码', 'err');
          if (!(d.belts || []).length) return toast('请至少选择一个腰带尺码', 'err');
          d.defaultBelt = { ...DEFAULT_BELT, ...(d.defaultBelt || {}) };
          // 按标品规则固化 defaultBelt
          STANDARD_KITS.forEach((k) => {
            if ((d.sizes || []).includes(k.size) && (d.belts || []).includes(k.belt)) d.defaultBelt[k.size] = k.belt;
          });
        }
        if (!d.code || !d.name) return toast('请填写编码与名称', 'err');
        if (ui.modal.type === 'edit-product') {
          const i = db.products.findIndex((x) => x.id === d.id);
          if (i >= 0) db.products[i] = d;
          addLog(`修改商品 ${d.name}`);
        } else {
          d.id = uid('P');
          db.products.push(d);
          addLog(`创建商品 ${d.name}`);
        }
        saveStore(); closeModal(); toast('已保存'); break;
      }
      case 'open-order-cart':
        openModal('order-cart', { channel: el.getAttribute('data-channel') || 'purchase', draftSeed: { channel: el.getAttribute('data-channel') || 'purchase', customRows: [], nonstdGrade: '小', stdQty: {}, acc: {} } });
        break;
      case 'cart-add-custom': {
        syncOrderCartDraftFromDom();
        const cartPid = ui.modal.draft.productId || $('#f-cart-pid')?.value || kitProducts()[0]?.id;
        const cartProd = kitProducts().find((p) => p.id === cartPid) || kitProducts()[0];
        const grade = ui.modal.draft.nonstdGrade || '小';
        const gradeOpt = nonstdGradesForProduct(cartProd).find((g) => g.id === grade);
        if (!gradeOpt) return toast('当前商品无此非标腰带档', 'err');
        const belt = gradeOpt.belt;
        const size = $('#f-cart-c-size')?.value;
        const qty = Number($('#f-cart-c-qty')?.value) || 0;
        if (!size) return toast('请选择弹力带', 'err');
        if (!qty) return toast('请填写非标数量', 'err');
        if (!gradeOpt.bands.includes(size)) return toast('该腰带档位不可选此弹力带（或不在商品维护尺码内）', 'err');
        ui.modal.draft.customRows = ui.modal.draft.customRows || [];
        ui.modal.draft.customRows.push({ belt, size, qty, grade });
        if ($('#f-cart-c-qty')) $('#f-cart-c-qty').value = '1';
        render(); toast('已添加非标行'); break;
      }
      case 'cart-del-custom': {
        const idx = Number(el.getAttribute('data-idx'));
        (ui.modal.draft.customRows || []).splice(idx, 1);
        render(); break;
      }
      case 'cart-submit': {
        syncOrderCartDraftFromDom();
        const channel = ui.modal.draft?.channel || ui.modal.payload?.channel || 'purchase';
        const cartPid = $('#f-cart-pid')?.value || kitProducts()[0]?.id;
        const lines = [];
        document.querySelectorAll('[data-std-size]').forEach((inp) => {
          const q = Number(inp.value) || 0;
          if (q > 0) lines.push({ productId: cartPid, size: inp.getAttribute('data-std-size'), belt: inp.getAttribute('data-std-belt'), qty: q });
        });
        const customRows = ui.modal.draft?.customRows || [];
        const customLines = customRows.map((r) => ({ productId: cartPid, size: r.size, belt: r.belt, qty: r.qty }));
        const parts = [];
        let accErr = '';
        partProducts().forEach((p) => {
          const on = document.querySelector(`[data-acc-on="${p.id}"]`)?.checked;
          if (!on) return;
          let any = 0;
          document.querySelectorAll(`[data-acc-qty="${p.id}"]`).forEach((inp) => {
            const pq = Number(inp.value) || 0;
            if (pq > 0) {
              any += pq;
              parts.push({ partId: p.id, name: p.name, spec: inp.getAttribute('data-acc-size') || '', qty: pq });
            }
          });
          if (!any) accErr = `已勾选配件「${p.name}」但未填尺码数量`;
        });
        if (accErr) return toast(accErr, 'err');
        if (!lines.length && !customLines.length && !parts.length) return toast('请至少填写标准套件、非标或配件', 'err');
        if (channel === 'sales') {
          const l2Id = $('#f-cart-l2')?.value;
          if (!l2Id) return toast('请选择二级代理', 'err');
          const planBySize = {};
          let planTotal = 0;
          lines.forEach((l) => { planBySize[l.size] = (planBySize[l.size] || 0) + l.qty; planTotal += l.qty; });
          customLines.forEach((r) => { planBySize[r.size] = (planBySize[r.size] || 0) + r.qty; planTotal += r.qty; });
          if (!planTotal) return toast('销售单需至少一件套件（含非标）', 'err');
          db.sales.unshift({
            id: uid('SO'), no: `SO${todayCompact()}${String(++db.seq.so).padStart(3, '0')}`,
            channel: 'distribute', l1Id: currentL1Id(), l2Id, productId: cartPid,
            planTotal, planBySize, parts, scanned: [], status: 'scanning', createdAt: nowStr(),
          });
          addLog('购物车提交销售单');
          closeModal(); toast('已创建销售单，可去扫码出货');
        } else {
          db.purchases.unshift({
            id: uid('PO'), no: `PO${todayCompact()}${String(++db.seq.po).padStart(3, '0')}`, l1Id: currentL1Id() || 'L1A',
            lines, customLines, parts, status: 'pending', createdAt: nowStr(), segments: {}, cosign: { admin1: false, admin2: false },
          });
          addLog('购物车提交采购申请');
          closeModal(); toast('已提交采购申请');
        }
        saveStore(); render(); break;
      }
      case 'view-dup-customer':
        openModal('view-exception', { id }); break;
      case 'open-view-purchase': openModal('view-purchase', { id }); break;
      case 'open-view-sale': openModal('view-sale', { id }); break;
      case 'open-view-cend': openModal('view-cend', { id }); break;
      case 'open-view-return': openModal('view-return', { id }); break;
      case 'open-view-exception': openModal('view-exception', { id }); break;
      case 'po-draft-add-custom': {
        if (!ui.modal.draft) ui.modal.draft = { customLines: [] };
        ui.modal.draft.customLines = ui.modal.draft.customLines || [];
        const poProd = kitProducts().find((p) => p.id === (ui.modal.draft.productId || $('#f-pid')?.value)) || kitProducts()[0];
        const nonstd = nonstdGradesForProduct(poProd)[0];
        const size = nonstd?.bands?.[0] || (poProd?.sizes?.[0] || 'M');
        const belt = nonstd?.belt || (poProd?.belts?.[0] || '腰带S');
        ui.modal.draft.customLines.push({ size, belt, qty: 1 });
        render(); break;
      }
      case 'po-draft-del-custom': {
        const idx = Number(el.getAttribute('data-idx'));
        (ui.modal.draft.customLines || []).splice(idx, 1);
        render(); break;
      }
      case 'mini-create-po': openModal('create-po', { draftSeed: { customLines: [] } }); break;
      case 'create-po-ok': {
        const productId = $('#f-pid')?.value;
        const lines = [];
        document.querySelectorAll('[data-size-qty]').forEach((inp) => {
          const q = Number(inp.value)||0;
          if (q>0) lines.push({
            productId,
            size: inp.getAttribute('data-size-qty'),
            belt: inp.getAttribute('data-std-belt') || DEFAULT_BELT[inp.getAttribute('data-size-qty')],
            qty: q,
          });
        });
        const customLines = [];
        document.querySelectorAll('[data-po-custom-qty]').forEach((inp) => {
          const i = inp.getAttribute('data-po-custom-qty');
          const q = Number(inp.value) || 0;
          if (q <= 0) return;
          const size = document.querySelector(`[data-po-custom-size="${i}"]`)?.value || 'M';
          const belt = normalizeBelt(document.querySelector(`[data-po-custom-belt="${i}"]`)?.value);
          customLines.push({ productId, size, belt, qty: q });
        });
        const parts = [];
        const pb = Number($('#f-part-belt')?.value) || 0;
        const pq = Number($('#f-part-qty')?.value)||0;
        if (pb > 0) parts.push({ partId: 'PART-BELT', spec: '配件', qty: pb });
        if (pq>0) parts.push({ partId: 'PART-SIL', spec: 'M', qty: pq });
        if (!lines.length && !customLines.length) return toast('请填写标准数量或新增非标行', 'err');
        db.purchases.unshift({
          id: uid('PO'), no: `PO${todayCompact()}${String(++db.seq.po).padStart(3,'0')}`, l1Id: currentL1Id() || 'L1A',
          lines, customLines, parts, status: 'pending', createdAt: nowStr(), segments: {}, cosign: { admin1: false, admin2: false },
        });
        addLog('提交采购申请'); saveStore(); closeModal(); toast('已提交，等待平台审核'); break;
      }
      case 'mini-create-return': openModal('create-return', {}); break;
      case 'create-return-ok': {
        const sns = ($('#f-sns')?.value||'').split(/[,，\s]+/).map((x)=>x.trim().toUpperCase()).filter(Boolean);
        const type = $('#f-ttype')?.value;
        const labels = { l2_to_l1: '二级退一级', l1_to_factory: '一级退原厂', user: '用户退货再入库' };
        db.returns.unshift({
          id: uid('RT'), no: `RT${todayCompact()}${String(++db.seq.rt).padStart(2,'0')}`, type, typeLabel: labels[type],
          fromId: ui.role==='l2'?currentL2Id():currentL1Id(),
          fromName: ROLES[ui.role].name, approverId: ui.role==='l2'?currentL1Id():null,
          sns, status: 'pending', createdAt: nowStr(), reason: $('#f-reason')?.value||'', reasonType: $('#f-rtype')?.value,
        });
        saveStore(); closeModal(); toast('退货已提交'); break;
      }
      default: break;
    }
  }

  function finishPoConfirm(id) {
    const draft = ui.form._poDraft || (ui.modal?.type === 'audit-po' ? ui.modal.draft : null);
    const p = db.purchases.find((x) => x.id === id);
    if (!p) { render(); return; }
    if (draft && draft.id === id) {
      Object.assign(p, {
        lines: draft.lines, customLines: draft.customLines, parts: draft.parts, segments: draft.segments, cosign: draft.cosign || p.cosign,
      });
    }
    p.cosign = p.cosign || { admin1: false, admin2: false };
    if (ui.account === 'admin2') { p.cosign.admin2 = true; p.cosign.admin2At = nowStr(); }
    else { p.cosign.admin1 = true; p.cosign.admin1At = nowStr(); }
    // Demo convenience: if admin already signed and clicks again with only one signature, keep waiting for admin2
    if (p.cosign.admin1 && p.cosign.admin2) {
      addLog(`采购双人会签完成 ${p.no}`);
      applyPurchaseApprove(p);
      toast('会签完成，采购单已生效');
    } else {
      p.status = 'cosigning';
      addLog(`采购会签签字 ${p.no} by ${ui.account}`);
      toast('已签字，等待另一管理员确认（可用 admin2 / demo 登录）');
    }
    ui.form._poDraft = null;
    saveStore();
    ui.modal = null;
    render();
  }

  function finishScanConfirmSo(id) {
    const s = db.sales.find((x) => x.id === id);
    if (!s) { render(); return; }
    if ((s.scanned || []).length < s.planTotal) { toast('未扫满', 'err'); render(); return; }
    s.scanned.forEach((sn) => {
      const row = db.sns.find((x) => x.sn === sn);
      row.status = 'l2'; row.l2Id = s.l2Id;
      pushSnEvent(row, '销售转入二级', s.no, 'sales');
    });
    s.status = 'done';
    db.stockLogs.unshift({ id: uid('H'), agentType: 'l2', agentId: s.l2Id, productId: s.productId, size: Object.keys(s.planBySize)[0], delta: s.scanned.length, reason: '销售转入', time: nowStr(), ref: s.no });
    const cfg = resolveWarnConfig(s.l1Id, s.l2Id);
    const turn = Number(cfg.rules.stockTurnover || cfg.mult || 1.5);
    const l1Left = db.sns.filter((x) => x.l1Id === s.l1Id && x.status === 'l1' && !x.frozen).length;
    const l2Now = db.sns.filter((x) => x.l2Id === s.l2Id && x.status === 'l2' && !x.frozen).length;
    if (l1Left > 0 && l2Now > l1Left * turn) {
      pushException('销售库存异常', l2Name(s.l2Id), `二级在库 ${l2Now} 超过一级在库 ${l1Left} × 周转比 ${turn}`, 'stock', { mode: cfg.mode });
    }
    addLog(`完成出货 ${s.no}`);
    saveStore();
    ui.modal = null;
    toast('出货完成');
    render();
  }

  function finishRebindL2(id, payload = {}) {
    const a = db.agentsL2.find((x) => x.id === id);
    if (!a) { render(); return; }
    const parentId = payload.parentId || $('#f-parent')?.value || ui.modal?.draft?.parentId;
    const cities = payload.cities || ui.modal?.draft?.areas || [];
    if (!parentId || !cities.length) { toast('绑定信息不完整', 'err'); render(); return; }
    a.parentId = parentId;
    a.areas = [...cities];
    a.pending = false;
    a.auditStatus = 'approved';
    addLog(`重新绑定二级 ${a.name} → ${l1Name(parentId)}`);
    saveStore();
    ui.modal = null;
    toast('已绑定');
    render();
  }

  function bindEvents() {
    $('#btn-login')?.addEventListener('click', doLogin);
    $('#login-pass')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

    document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      const set = el.getAttribute('data-set-filter');
      if (set) {
        const [scopeField, val] = set.split('=');
        const [scope, field] = scopeField.split(':');
        ui.filters[scope] = ui.filters[scope] || {};
        ui.filters[scope][field] = val;
      }
      navigate(el.getAttribute('data-go'));
    }));

    document.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => {
      const [key, id] = el.getAttribute('data-tab').split(':');
      ui.tabs[key] = id;
      render();
    }));

    document.querySelectorAll('[data-filter]').forEach((el) => {
      const apply = () => {
        const [key, field] = el.getAttribute('data-filter').split(':');
        ui.filters[key] = ui.filters[key] || {};
        ui.filters[key][field] = el.value;
      };
      el.addEventListener('change', () => { apply(); render(); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { apply(); render(); } });
    });

    document.querySelectorAll('[data-action]').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      handleAction(el.getAttribute('data-action'), el);
    }));

    document.querySelectorAll('[data-row-action]').forEach((el) => el.addEventListener('click', () => {
      const act = el.getAttribute('data-row-action');
      const id = el.getAttribute('data-id');
      openModal(act, { id });
    }));

    // 仅顶栏「管理后台」切换；勿绑定扫码卡片的 data-mode=ship|direct|query
    document.querySelectorAll('.mode-switch [data-mode]').forEach((el) => el.addEventListener('click', () => {
      ui.mode = 'admin';
      persistSession();
      navigate('home');
    }));

    // 角色权限编辑：点「全部」全选；说明实时同步勾选结果
    if (ui.modal?.type === 'edit-role') {
      const syncRoleDesc = () => {
        const boxes = [...document.querySelectorAll('[data-perm]')];
        const checked = boxes.filter((el) => el.checked).map((el) => el.getAttribute('data-perm'));
        const desc = $('#f-role-desc');
        if (desc) desc.value = roleDescFromPerms(checked);
      };
      document.querySelectorAll('[data-perm]').forEach((el) => {
        el.addEventListener('change', () => {
          const key = el.getAttribute('data-perm');
          const allBox = document.querySelector('[data-perm="all"]');
          const detailBoxes = [...document.querySelectorAll('[data-perm]')].filter((x) => x.getAttribute('data-perm') !== 'all');
          if (key === 'all') {
            detailBoxes.forEach((x) => { x.checked = el.checked; });
          } else if (allBox) {
            allBox.checked = detailBoxes.length > 0 && detailBoxes.every((x) => x.checked);
          }
          syncRoleDesc();
        });
      });
      syncRoleDesc();
    }

    // chip toggles in modal
    const syncL1Draft = () => {
      if (!ui.modal?.draft) return;
      if ($('#f-name')) ui.modal.draft.name = $('#f-name').value;
      if ($('#f-contact')) ui.modal.draft.contact = $('#f-contact').value;
    };
    document.querySelectorAll('[data-toggle-main]').forEach((el) => el.addEventListener('click', () => {
      if (el.disabled) return;
      syncL1Draft();
      const r = el.getAttribute('data-toggle-main');
      const set = new Set(ui.modal.draft.mainAreas || []);
      if (set.has(r)) set.delete(r); else set.add(r);
      ui.modal.draft.mainAreas = [...set];
      render();
    }));
    document.querySelectorAll('[data-toggle-sale]').forEach((el) => el.addEventListener('click', () => {
      syncL1Draft();
      const r = el.getAttribute('data-toggle-sale');
      const set = new Set(ui.modal.draft.saleAreas || []);
      if (set.has(r)) set.delete(r); else set.add(r);
      ui.modal.draft.saleAreas = [...set];
      render();
    }));
    document.querySelectorAll('[data-toggle-direct]').forEach((el) => el.addEventListener('click', () => {
      syncL1Draft();
      const r = el.getAttribute('data-toggle-direct');
      const set = new Set(ui.modal.draft.directAreas || []);
      if (set.has(r)) set.delete(r); else set.add(r);
      ui.modal.draft.directAreas = [...set];
      render();
    }));
    document.querySelectorAll('[data-toggle-city]').forEach((el) => el.addEventListener('click', () => {
      if (!ui.modal?.draft) return;
      const r = el.getAttribute('data-toggle-city');
      const set = new Set(ui.modal.draft.areas || []);
      if (set.has(r)) set.delete(r); else set.add(r);
      ui.modal.draft.areas = [...set];
      render();
    }));
    if (ui.modal?.type === 'rebind-l2') {
      $('#f-parent')?.addEventListener('change', () => {
        if (!ui.modal?.draft) return;
        ui.modal.draft.parentId = $('#f-parent').value;
        const opts = citiesForL1(ui.modal.draft.parentId);
        ui.modal.draft.areas = (ui.modal.draft.areas || []).filter((c) => opts.includes(c));
        render();
      });
    }
    document.querySelectorAll('[data-toggle-psize]').forEach((el) => el.addEventListener('click', () => {
      if (!ui.modal?.draft) return;
      const r = el.getAttribute('data-toggle-psize');
      const set = new Set(ui.modal.draft.sizes || []);
      if (set.has(r)) set.delete(r); else set.add(r);
      ui.modal.draft.sizes = [...set];
      render();
    }));
    document.querySelectorAll('[data-toggle-pbelt]').forEach((el) => el.addEventListener('click', () => {
      if (!ui.modal?.draft) return;
      const r = el.getAttribute('data-toggle-pbelt');
      const set = new Set(ui.modal.draft.belts || []);
      if (set.has(r)) set.delete(r); else set.add(r);
      ui.modal.draft.belts = [...set];
      render();
    }));

    $('#modal-mask')?.addEventListener('click', (e) => { if (e.target.id === 'modal-mask' && !ui.confirm) closeModal(); });
    $('#confirm-mask')?.addEventListener('click', (e) => { if (e.target.id === 'confirm-mask') closeConfirm(); });
    $('#scan-sn-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const btn = document.querySelector('[data-action="scan-add-sn"]');
        if (btn) handleAction('scan-add-sn', btn);
      }
    });


    if (ui.modal?.type === 'order-cart') {
      $('#f-cart-pid')?.addEventListener('change', () => {
        syncOrderCartDraftFromDom();
        ui.modal.draft.productId = $('#f-cart-pid').value;
        ui.modal.draft.stdQty = {};
        ui.modal.draft.customRows = [];
        render();
      });
      $('#f-cart-c-grade')?.addEventListener('change', () => {
        syncOrderCartDraftFromDom();
        ui.modal.draft.nonstdGrade = $('#f-cart-c-grade').value;
        render();
      });
      document.querySelectorAll('[data-acc-on]').forEach((chk) => {
        chk.addEventListener('change', () => { syncOrderCartDraftFromDom(); render(); });
      });
      document.querySelectorAll('[data-std-key], [data-acc-qty]').forEach((inp) => {
        inp.addEventListener('change', () => syncOrderCartDraftFromDom());
      });
    }
    if (ui.modal?.type === 'create-po') {
      $('#f-pid')?.addEventListener('change', () => {
        if (!ui.modal.draft) ui.modal.draft = { customLines: [] };
        ui.modal.draft.productId = $('#f-pid').value;
        ui.modal.draft.customLines = [];
        render();
      });
    }

    // live update audit po segments match（input 即时同步，避免只填起始就 render 冲掉结束框）
    if (ui.modal?.type === 'audit-po') {
      const refreshAuditMatch = () => {
        syncDraftFromAuditDom();
        const draft = ui.modal.draft;
        const need = purchaseNeedQty(draft);
        const got = purchaseSegCount(draft);
        const match = need > 0 && got === need;
        const box = document.querySelector('.audit-match-live');
        if (box) {
          box.innerHTML = `需求 SN：<strong class="num">${need}</strong>　已填段号：<strong class="num">${got}</strong>　${match ? tag('数量匹配','green') : tag('数量不匹配','orange')}`;
        }
        const btn = document.querySelector('[data-action="po-confirm"]');
        if (btn) btn.disabled = !match;
      };
      document.querySelectorAll('.audit-line input, .audit-line select, [data-part-idx]').forEach((inp) => {
        inp.addEventListener('input', refreshAuditMatch);
        inp.addEventListener('change', () => { refreshAuditMatch(); });
      });
    }

    // Excel / CSV 文件导入填充文本框
    $('#f-seg-file')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const name = file.name.toLowerCase();
      const fill = (text) => {
        const lines = extractSegLines(text);
        ui.form.segPaste = lines.join('\n');
        const ta = $('#f-seg-paste');
        if (ta) ta.value = ui.form.segPaste;
        toast(`已从 ${file.name} 识别 ${lines.length} 行`);
      };
      if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = () => fill(String(reader.result || ''));
        reader.readAsText(file);
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        if (typeof XLSX === 'undefined') return toast('Excel 解析库未加载，请用 CSV 或粘贴', 'err');
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const wb = XLSX.read(reader.result, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            fill(rows.map((r) => (r || []).join('\t')).join('\n'));
          } catch (_) {
            toast('Excel 解析失败', 'err');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        toast('请上传 .xlsx / .xls / .csv / .txt', 'err');
      }
    });
  }

  /* ---------- Boot ---------- */
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace(/^#/, '');
    if (id && PAGES[id] && ui.loggedIn) {
      if (ui.route === 'exception' && id !== 'exception' && !ui._skipExLeave && ui.mode === 'admin') {
        const openIds = getOpenExceptionIdsInFilter();
        if (openIds.length) {
          history.replaceState(null, '', `#${ui.route}`);
          ui._pendingNav = id;
          openModal('leave-exception', { count: openIds.length, ids: openIds });
          render();
          return;
        }
      }
      ui.route = id;
      render();
    }
  });

  if (ui.loggedIn && location.hash) {
    const id = location.hash.replace(/^#/, '');
    if (PAGES[id]) ui.route = id;
  }

  render();
})();
