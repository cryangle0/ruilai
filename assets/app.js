(() => {
  /* =========================================================
   * 锐涞经销商管理系统 · 可走查完整交互原型 v6
   * ========================================================= */

  const BAND_SIZES = ['SS', 'S', 'M', 'L', 'LL'];
  const BELTS = ['腰带SS', '腰带S', '腰带M', '腰带L', '腰带LL'];
  const DEFAULT_BELT = Object.fromEntries(BAND_SIZES.map((s, i) => [s, BELTS[i]]));
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
    pending: '待审核', cosigning: '会签中', approvedPending: '待生效', approved: '已生效', rejected: '已驳回',
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
  function monthStart() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-01`;
  }
  function todayDate() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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
    const products = [
      { id: 'P1', code: 'P-1001', name: '锐涞经典款套件', type: 'kit', sizes: kitSizes, defaultBelt: { ...DEFAULT_BELT }, status: '上架', note: '弹力带+腰带必配' },
      { id: 'P2', code: 'P-1002', name: '锐涞运动款套件', type: 'kit', sizes: kitSizes, defaultBelt: { ...DEFAULT_BELT }, status: '上架', note: '弹力带+腰带必配' },
      { id: 'PART-BELT', code: 'PART-BELT', name: '腰带规格', type: 'part', sizes: BELTS, status: '上架', note: '配件·不生成SN' },
      { id: 'PART-SIL', code: 'PART-SIL', name: '主体硅胶带', type: 'part', sizes: BAND_SIZES, status: '上架', note: '配件·不生成SN' },
    ];

    const agentsL1 = [
      {
        id: 'L1A', code: 'AG-L1-001', name: '华东锐涞总代', contact: '张伟', phone: '13800001111',
        mainAreas: ['浙江', '上海'], areas: ['浙江', '上海', '江苏'], saleAreas: ['浙江', '上海', '江苏'],
        directAreas: ['杭州市', '宁波市', '上海市', '苏州市'],
        warnMultiplier: 1.5, status: '启用',
        ent: { company: '杭州华东锐涞贸易有限公司', creditCode: '91330100MA27XQ001A', legal: '张伟', phone: '0571-88001234', addr: '杭州市西湖区文三路 100 号' },
      },
      {
        id: 'L1B', code: 'AG-L1-002', name: '华南渠道中心', contact: '李娜', phone: '13900002222',
        mainAreas: ['广东'], areas: ['广东', '福建'], saleAreas: ['广东', '福建'],
        directAreas: ['广州市', '深圳市', '厦门市'],
        warnMultiplier: 1.5, status: '启用',
        ent: { company: '广州华南渠道管理有限公司', creditCode: '91440100MA59XK002B', legal: '李娜', phone: '020-38001234', addr: '广州市天河区体育西路 8 号' },
      },
      {
        id: 'L1C', code: 'AG-L1-003', name: '华北联合代理', contact: '王强', phone: '13600003333',
        mainAreas: ['北京'], areas: ['北京', '河北', '天津'], saleAreas: ['北京', '河北', '天津'],
        directAreas: ['北京市', '天津市', '石家庄市'],
        warnMultiplier: 2.0, status: '启用',
        ent: { company: '北京华北联合商贸有限公司', creditCode: '91110100MA01XT003C', legal: '王强', phone: '010-56001234', addr: '北京市朝阳区建国路 88 号' },
      },
    ];

    const agentsL2 = [
      { id: 'L2A', code: 'AG-L2-101', name: '杭州城西专营', type: '法人', parentId: 'L1A', areas: ['杭州市'], status: '启用', pending: false, auditStatus: 'approved', protocolOk: true,
        ent: { company: '杭州城西专营商贸有限公司', creditCode: '91330106MA2BXQ101D', legal: '陈晨', phone: '0571-87654321', addr: '杭州市西湖区古墩路 200 号' } },
      { id: 'L2B', code: 'AG-L2-102', name: '宁波海曙店', type: '个人', parentId: 'L1A', areas: ['宁波市'], status: '启用', pending: false, auditStatus: 'approved', protocolOk: true },
      { id: 'L2C', code: 'AG-L2-201', name: '广州天河渠道', type: '法人', parentId: 'L1B', areas: ['广州市'], status: '启用', pending: false, auditStatus: 'approved', protocolOk: true,
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
        sns.push(mkSn(sn, { size: 'M', l1Id: 'L1A', l2Id: 'L2A', status: 'l2', reIn: true, tags: ['已退货'],
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
          customLines: [], parts: [], status: 'approvedPending', createdAt: '2026-08-07 09:00',
          segments: { 'P2_M_腰带M': ['RL202608070001-RL202608070006'] },
          cosign: { admin1: true, admin2: true, admin1At: '2026-08-07 09:10', admin2At: '2026-08-07 09:20' },
          approvedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' '),
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
          planTotal: 2, planBySize: { M: 2 }, scanned: ['RL202607200001', 'RL202607200002'], status: 'done', createdAt: '2026-07-25 12:00' },
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
        { id: 'EX1', time: '2026-07-25 12:05', type: '归属地异常', target: 'RL202607200004', detail: '手机归属广东 · 地址「杭州市西湖区」不匹配', notify: '一级+原厂', status: '未处理', dim: 'sn' },
        { id: 'EX2', time: '2026-07-28 11:02', type: 'SN激活异常', target: 'RL202607210001', detail: '跨区激活：IP 浙江 不在授权直销区', notify: '一级+原厂', status: '未处理', dim: 'sn' },
        { id: 'EX3', time: '2026-08-02 16:10', type: '销售库存异常', target: '广州天河渠道 · 锐涞运动款LL', detail: '本次新增 5 > 预警线（区间销量 × 倍数）', notify: '一级+原厂', status: '未处理', dim: 'stock' },
        { id: 'EX4', time: '2026-07-22 10:40', type: '销售库存异常', target: '宁波海曙店 · 锐涞经典款L', detail: '本次新增 4 > 预警线', notify: '一级+原厂', status: '已处理', dim: 'stock' },
        { id: 'EX5', time: '2026-08-05 09:20', type: '超量下单预警', target: '杭州城西专营', detail: '2级库存充足仍大量申请下单，需一级填写说明', notify: '一级+原厂', status: '未处理', dim: 'nonSn', explain: '' },
        { id: 'EX6', time: '2026-08-06 14:00', type: '采购超量', target: 'PO20260807021', detail: '标准品申请量超过预警倍数', notify: '原厂', status: '未处理', dim: 'nonSn' },
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
        { time: nowStr(), account: 'admin', role: '平台管理员', action: '登录后台', ip: '10.0.1.8', ok: true, type: 'login' },
      ],
      subAccounts: [
        { id: 'SUB1', l1Id: 'L1A', username: 'hd_scan_01', name: '仓管小陈', status: '启用' },
        { id: 'SUB2', l1Id: 'L1A', username: 'hd_scan_02', name: '仓管小周', status: '启用' },
        { id: 'SUB3', l1Id: 'L1B', username: 'hn_scan_01', name: '华南仓管阿强', status: '启用' },
      ],
      seq: { po: 32, so: 101, rt: 7, snBatch: 1, notify: 4 },
    };
  }

  const persistKey = 'ruilai_proto_v6';
  function loadStore() {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.accounts) parsed.accounts = seed().accounts;
        (parsed.sns || []).forEach((s) => {
          if (!s.belt) s.belt = DEFAULT_BELT[s.size] || '腰带M';
          if (!s.tags) s.tags = [];
          if (s.frozen === undefined) s.frozen = s.status === 'frozen';
          if (!s.events) s.events = [];
        });
        (parsed.agentsL1 || []).forEach((a) => {
          if (!a.mainAreas) a.mainAreas = a.mainArea ? [a.mainArea] : [];
          if (!a.saleAreas) a.saleAreas = a.areas || [];
          if (!a.directAreas) a.directAreas = [];
          if (!a.warnMultiplier) a.warnMultiplier = 1.5;
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
        });
        (parsed.sales || []).forEach((s) => { if (!s.channel) s.channel = s.l2Id ? 'distribute' : 'direct'; });
        (parsed.returns || []).forEach((r) => { if (!r.reasonType) r.reasonType = '其他'; });
        (parsed.exceptions || []).forEach((e) => {
          if (!e.dim || e.dim === 'activate') e.dim = /库存|压货/.test(e.type) ? 'stock' : (/超量|采购|下单/.test(e.type) ? 'nonSn' : 'sn');
          if (e.status === '已关闭') e.status = '已处理';
        });
        return parsed;
      }
    } catch (_) {}
    return seed();
  }
  function saveStore() { localStorage.setItem(persistKey, JSON.stringify(db)); }

  let db = loadStore();

  const ui = {
    loggedIn: sessionStorage.getItem('ruilai_logged') === '1',
    role: sessionStorage.getItem('ruilai_role') || 'admin',
    mode: sessionStorage.getItem('ruilai_mode') || 'admin', // admin | mini
    loginTab: sessionStorage.getItem('ruilai_login_tab') || 'platform', // platform | mini
    account: sessionStorage.getItem('ruilai_account') || '',
    route: (location.hash.replace(/^#/, '') || 'home'),
    modal: null,
    toast: null,
    tabs: {},
    filters: {},
    form: {},
    notifyOpen: false,
    sort: {},
    scanMode: sessionStorage.getItem('ruilai_scan_mode') || 'ship', // ship | direct | query
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
    sales: '销售单管理', stock: '库存管理', return: '返货管理', exception: '异常管理',
    stats: '数据统计', role: '角色与权限', log: '操作日志',
    'l1-sales-detail': '一级销售详情', 'l1-return-detail': '一级退货详情',
    'mini-scan': '扫码', 'mini-purchase': '采购', 'mini-sales': '销售', 'mini-stock': '库存',
    'mini-aftersale': '售后', 'mini-exception': '异常', 'mini-mine': '我的',
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
  function kitProducts() { return db.products.filter((p) => p.type === 'kit'); }
  function partProducts() { return db.products.filter((p) => p.type === 'part'); }

  function soProductDetail(s) {
    const map = {};
    (s.scanned || []).forEach((sn) => {
      const row = db.sns.find((x) => x.sn === sn);
      if (!row) return;
      const k = `${row.productId}_${row.size}_${row.belt || ''}`;
      map[k] = (map[k] || 0) + 1;
    });
    const parts = Object.entries(map).map(([k, q]) => {
      const [pid, size, belt] = k.split('_');
      return `${productName(pid)}/${size}${belt ? '+' + belt : ''}×${q}`;
    });
    if (parts.length) return parts.join('，');
    if (s.planBySize && Object.keys(s.planBySize).length) {
      return Object.entries(s.planBySize).filter(([, q]) => q).map(([sz, q]) => `${sz}×${q}`).join('，') || '—';
    }
    return '—';
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
    if (e.dim === 'nonSn' || e.dim === 'sn' || e.dim === 'stock') return e.dim;
    if (/库存|压货/.test(e.type)) return 'stock';
    if (/超量|采购|下单/.test(e.type)) return 'nonSn';
    return 'sn';
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

  function pushException(type, target, detail, dim) {
    const d = dim || exceptionDim({ type });
    db.exceptions.unshift({ id: uid('EX'), time: nowStr(), type, target, detail, notify: '一级+原厂', status: '未处理', dim: d });
    pushNotify(`预警：${type}`, `${target} · ${detail}`, '一级+原厂');
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
    if (!has('生成并导入码库')) ev.push({ time: `${base} 09:00`, title: '生成并导入码库', desc: `${productName(row.productId)} / ${row.size}+${row.belt || ''} · ${l1Name(row.l1Id)}`, type: 'import' });
    if (row.status !== 'warehouse' && !has('采购审核入库')) ev.push({ time: `${base} 10:30`, title: '采购审核入库', desc: '进入一级代理库存', type: 'purchase' });
    if ((row.l2Id || row.status === 'l2' || row.status === 'bound') && !ev.some((e) => e.type === 'sales')) {
      const so = db.sales.find((s) => (s.scanned || []).includes(row.sn));
      ev.push({ time: so?.createdAt || `${base} 15:00`, title: so?.channel === 'direct' ? '直销扫码' : '销售转入二级', desc: `${so ? so.no + ' · ' : ''}${l2Name(row.l2Id)}`, type: 'sales' });
    }
    if ((row.status === 'bound' || row.bindAt) && !ev.some((e) => e.type === 'bind')) {
      ev.push({ time: row.bindAt || row.soldAt || `${base} 18:00`, title: 'C端销售绑定', desc: `${row.user?.phone || '—'} · IP ${row.bindIpRegion || '—'}`, type: 'bind' });
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
  function pendingPoCount() {
    return db.purchases.filter((p) => ['pending', 'cosigning'].includes(p.status)).length;
  }
  function openExCount() {
    return db.exceptions.filter((e) => e.status === '未处理').length;
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
      if (p.status === 'approvedPending' && p.approvedAt) {
        const end = parseTime(p.approvedAt) + 24 * 3600 * 1000;
        if (Date.now() >= end) {
          applyPurchaseApprove(p, true);
          changed = true;
        }
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
  function metricCard(label, value, go, extra = '') {
    const attr = go ? ` data-go="${go}" style="cursor:pointer"` : '';
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
  function confirmDialog(message, action, payload = {}) {
    openModal('confirm', { message, action, ...payload });
  }

  function adminMenus() {
    const pending = pendingL2Count();
    return [
      { group: '概览', items: [{ id: 'home', title: '工作台', icon: '⌂' }] },
      { group: '渠道', items: [
        { id: 'agent-l1', title: '一级代理商', icon: '①' },
        { id: 'agent-l2', title: '二级代理商', icon: '②' },
        { id: 'agent-l2-audit', title: '二级审核', icon: '✓' },
        { id: 'agent-pending', title: '待分配(法人)', icon: '⌛', badge: pending },
      ]},
      { group: '货品', items: [
        { id: 'sn', title: 'SN码库', icon: '#' },
        { id: 'product', title: '商品库', icon: '▣' },
        { id: 'purchase', title: '采购单管理', icon: '▤' },
        { id: 'sales', title: '销售单管理', icon: '▥' },
        { id: 'stock', title: '库存管理', icon: '▦' },
      ]},
      { group: '售后与风控', items: [
        { id: 'return', title: '返货管理', icon: '↩' },
        { id: 'exception', title: '异常管理', icon: '⚠' },
        { id: 'stats', title: '数据统计', icon: '▤' },
      ]},
      { group: '系统', items: [
        { id: 'role', title: '角色与权限', icon: '⚙' },
        { id: 'log', title: '操作日志', icon: '≡' },
      ]},
    ];
  }

  function miniTabs() {
    if (ui.role === 'sub') {
      return [{ id: 'mini-scan', title: '销售扫码', icon: '▦' }, { id: 'mini-mine', title: '我的', icon: '☺' }];
    }
    if (ui.role === 'l2') {
      return [
        { id: 'mini-scan', title: '扫码查询', icon: '▦' },
        { id: 'mini-stock', title: '库存', icon: '▣' },
        { id: 'mini-sales', title: '销售', icon: '▤' },
        { id: 'mini-aftersale', title: '售后', icon: '↩' },
        { id: 'mini-mine', title: '我的', icon: '☺' },
      ];
    }
    return [
      { id: 'mini-scan', title: '扫码', icon: '▦' },
      { id: 'mini-purchase', title: '采购', icon: '▤' },
      { id: 'mini-sales', title: '销售', icon: '▥' },
      { id: 'mini-stock', title: '库存', icon: '▣' },
      { id: 'mini-aftersale', title: '售后', icon: '↩' },
      { id: 'mini-exception', title: '异常', icon: '⚠' },
      { id: 'mini-mine', title: '我的', icon: '☺' },
    ];
  }

  /* ---------- Pages: Admin ---------- */
  function pageHome() {
    const pendingL2 = pendingL2Count();
    const pendingPo = pendingPoCount();
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
          <button class="todo-row" data-go="agent-l2-audit"><span>二级审核待处理</span><span class="todo-count">${db.agentsL2.filter((a) => a.auditStatus === 'pending').length}</span></button>
          <button class="todo-row" data-go="purchase"><span>采购单待审核/会签</span><span class="todo-count">${pendingPo}</span></button>
          <button class="todo-row" data-go="exception"><span>未处理异常</span><span class="todo-count ${openEx ? 'hot' : ''}">${openEx}</span></button>
          <button class="todo-row" data-go="return"><span>退货待审批</span><span class="todo-count">${db.returns.filter((r) => r.status === 'pending').length}</span></button>
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
          <th>授权城市</th><th>状态</th>
        </tr></thead>
        <tbody>${rows.map((a)=>`<tr class="row-clickable" data-row-action="view-agent-l2" data-id="${a.id}">
          <td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${tag(a.type, a.type==='法人'?'blue':'gray')}</td>
          <td>${escapeHtml(l1Name(a.parentId))}</td><td>${escapeHtml((a.areas||[]).join('、')||'—')}</td>
          <td>${tag(a.status, a.status==='启用'?'green':'gray')}</td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageAgentL2Audit() {
    const rows = db.agentsL2.filter((a) => a.auditStatus === 'pending');
    return `${pageHeader('二级审核', '一级创建后由平台审核')}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>类型</th><th>申请一级</th><th>城市</th><th>操作</th></tr></thead>
        <tbody>${rows.map((a)=>`<tr>
          <td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.type)}</td>
          <td>${escapeHtml(l1Name(a.parentId))}</td><td>${escapeHtml((a.areas||[]).join('、'))}</td>
          <td class="ops">
            <button class="btn btn-sm btn-primary" data-action="audit-l2-ok" data-id="${a.id}">通过</button>
            <button class="btn btn-sm btn-danger" data-action="audit-l2-reject" data-id="${a.id}">驳回</button>
          </td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint('暂无待审')}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageAgentPending() {
    const rows = db.agentsL2.filter((a) => a.pending && a.type === '法人');
    return `${pageHeader('待分配二级（仅法人）', `共 ${rows.length} 家待重新绑定一级`)}
      <div class="alert alert-info">一级停用/撤区后，其下属法人二级进入待分配池，需管理员重新绑定。</div>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>原一级</th><th>原城市</th><th>操作</th></tr></thead>
        <tbody>${rows.map((a)=>`<tr>
          <td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td>
          <td>${escapeHtml(l1Name(a.prevParentId)||'—')}</td>
          <td>${escapeHtml((a.prevAreas||[]).join('、')||'—')}</td>
          <td class="ops"><button class="btn btn-sm btn-primary" data-action="open-rebind-l2" data-id="${a.id}">重新绑定</button></td>
        </tr>`).join('') || `<tr><td colspan="5">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageProduct() {
    const kits = kitProducts();
    const parts = partProducts();
    return `${pageHeader('商品库', '套件 = 弹力带 + 腰带；配件不生成 SN')}
      <div class="alert alert-info">个性化规格：同尺寸弹力带可搭配不同腰带（如 M 配 腰带S），采购时在非标行配置，仍生成 SN。</div>
      <h3 class="section-title">套件商品</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>弹力带尺寸</th><th>默认腰带</th><th>状态</th><th>说明</th></tr></thead>
        <tbody>${kits.map((p)=>`<tr>
          <td>${escapeHtml(p.code)}</td><td>${escapeHtml(p.name)}</td>
          <td>${(p.sizes||[]).map((s)=>tag(s,'blue')).join(' ')}</td>
          <td>${BAND_SIZES.map((s)=>`${s}→${(p.defaultBelt||DEFAULT_BELT)[s]}`).join('；')}</td>
          <td>${tag(p.status, p.status==='上架'?'green':'gray')}</td>
          <td>${escapeHtml(p.note||'')}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <h3 class="section-title" style="margin-top:16px">配件（无 SN）</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>规格</th><th>状态</th><th>说明</th></tr></thead>
        <tbody>${parts.map((p)=>`<tr>
          <td>${escapeHtml(p.code)}</td><td>${escapeHtml(p.name)}</td>
          <td>${(p.sizes||[]).map((s)=>tag(s)).join(' ')}</td>
          <td>${tag(p.status,'green')}</td><td>${escapeHtml(p.note||'')}</td>
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
    if (f.status) rows = rows.filter((s) => (f.status === 'frozen' ? (s.frozen || s.status === 'frozen') : s.status === f.status));
    if (f.from || f.to) {
      rows = rows.filter((s) => inDateRange(s.soldAt || s.factoryAt || s.returnAt || s.bindAt || '', f.from, f.to)
        || (!s.soldAt && !s.factoryAt && !s.returnAt));
    }
    rows = rows.slice(0, 200);
    return `${pageHeader('SN码库', '多维筛选 · 点击行查看生命周期/编辑')}
      ${filterBar(`
        <input class="field-input" placeholder="SN" data-filter="sn:sn" value="${escapeHtml(f.sn||'')}" />
        <select class="field-input" data-filter="sn:l1"><option value="">一级</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${f.l1===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:l2"><option value="">二级</option>${db.agentsL2.map((a)=>`<option value="${a.id}" ${f.l2===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:size"><option value="">尺寸</option>${BAND_SIZES.map((s)=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:belt"><option value="">腰带</option>${BELTS.map((s)=>`<option value="${s}" ${f.belt===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:status"><option value="">状态</option>${Object.entries(SN_STATUS_LABEL).map(([k,v])=>`<option value="${k}" ${f.status===k?'selected':''}>${v}</option>`).join('')}</select>
        <input type="date" class="field-input" data-filter="sn:from" value="${escapeHtml(f.from||'')}" />
        <input type="date" class="field-input" data-filter="sn:to" value="${escapeHtml(f.to||'')}" />
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
      { id: 'approvedPending', title: '待生效' },
      { id: 'approved', title: '已生效' },
      { id: 'rejected', title: '已驳回' },
    ];
    return `${pageHeader('采购单管理', '一站式审核：标准/非标/配件 + 段号 + 双人会签')}
      ${tabsHtml('purchase', tabItems)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>一级</th><th>标准行</th><th>非标</th><th>配件</th><th>状态</th><th>会签</th><th>时间</th><th>操作</th></tr></thead>
        <tbody>${rows.map((p)=>{
          const cos = p.cosign || {};
          const cd = p.status === 'approvedPending' ? `<div class="countdown">${countdownText(p.approvedAt)}</div>` : '';
          return `<tr class="row-clickable" data-row-action="view-purchase" data-id="${p.id}">
            <td>${escapeHtml(p.no)}</td><td>${escapeHtml(l1Name(p.l1Id))}</td>
            <td>${(p.lines||[]).map((l)=>`${l.size}×${l.qty}`).join('，')||'—'}</td>
            <td>${(p.customLines||[]).map((l)=>`${l.size}+${l.belt}×${l.qty}`).join('，')||'—'}</td>
            <td>${(p.parts||[]).map((x)=>`${productName(x.partId)}/${x.spec}×${x.qty}`).join('，')||'—'}</td>
            <td>${tag(PO_STATUS[p.status]||p.status)}${cd}</td>
            <td>${cos.admin1?'✓':'-'}/${cos.admin2?'✓':'-'}</td>
            <td>${escapeHtml(p.createdAt)}</td>
            <td class="ops" onclick="event.stopPropagation()">
              ${['pending','cosigning'].includes(p.status)?`<button class="btn btn-sm btn-primary" data-action="open-audit-po" data-id="${p.id}">审核</button>`:''}
              ${p.status==='approvedPending'?`<button class="btn btn-sm btn-danger" data-action="revoke-po" data-id="${p.id}">撤销</button>`:''}
            </td>
          </tr>`;
        }).join('') || `<tr><td colspan="9">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageSales() {
    const f = ui.filters.sales || {};
    let rows = db.sales.slice();
    if (f.channel) rows = rows.filter((s) => s.channel === f.channel);
    if (f.l1) rows = rows.filter((s) => s.l1Id === f.l1);
    if (f.status) rows = rows.filter((s) => s.status === f.status);
    return `${pageHeader('销售单管理', '分销 / 直售 · 点击行查看详情')}
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
    const agents = agentType === 'l1' ? db.agentsL1 : db.agentsL2.filter((a) => !a.pending);
    return `${pageHeader('库存管理', '按代理维度汇总在库 SN')}
      ${filterBar(`
        <select class="field-input" data-filter="stock:type"><option value="l1" ${agentType==='l1'?'selected':''}>一级</option><option value="l2" ${agentType==='l2'?'selected':''}>二级</option></select>
        <select class="field-input" data-filter="stock:agent">${agents.map((a)=>`<option value="${a.id}" ${a.id===agentId?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>商品</th><th>尺寸</th><th>腰带</th><th>数量</th></tr></thead>
        <tbody>${rows.map((r)=>`<tr>
          <td>${escapeHtml(productName(r.productId))}</td><td>${escapeHtml(r.size)}</td>
          <td>${escapeHtml(r.belt||'—')}</td><td class="num">${r.qty}</td>
        </tr>`).join('') || `<tr><td colspan="4">${emptyHint()}</td></tr>`}</tbody>
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
    return `${pageHeader('返货管理', '理由筛选 · 审批后退原厂进入冷冻库')}
      ${filterBar(`
        <select class="field-input" data-filter="return:reasonType"><option value="">退货理由</option>${RETURN_REASONS.map((r)=>`<option value="${r.type}" ${f.reasonType===r.type?'selected':''}>${r.label}</option>`).join('')}</select>
        <select class="field-input" data-filter="return:status"><option value="">状态</option><option value="pending" ${f.status==='pending'?'selected':''}>待审</option><option value="approved" ${f.status==='approved'?'selected':''}>已通过</option></select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>单号</th><th>类型</th><th>来源</th><th>理由</th><th>商品明细</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
        <tbody>${rows.map((r)=>`<tr class="row-clickable" data-row-action="view-return" data-id="${r.id}">
          <td>${escapeHtml(r.no)}</td><td>${escapeHtml(r.typeLabel||r.type)}</td>
          <td>${escapeHtml(r.fromName||'')}</td>
          <td>${tag(r.reasonType||'其他')} ${escapeHtml(r.reason||'')}</td>
          <td>${escapeHtml(snsProductDetail(r.sns))}</td>
          <td>${tag(r.status)}</td><td>${escapeHtml(r.createdAt)}</td>
          <td class="ops" onclick="event.stopPropagation()">
            ${r.status==='pending'?`<button class="btn btn-sm btn-primary" data-action="approve-return" data-id="${r.id}">通过</button>
            <button class="btn btn-sm" data-action="reject-return" data-id="${r.id}">驳回</button>`:''}
          </td>
        </tr>`).join('') || `<tr><td colspan="8">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageException() {
    const dim = ui.tabs.exception || 'nonSn';
    const f = ui.filters.exception || {};
    let rows = db.exceptions.filter((e) => exceptionDim(e) === dim);
    if (f.status) rows = rows.filter((e) => e.status === f.status);
    if (f.l1) {
      const name = l1Name(f.l1);
      rows = rows.filter((e) => {
        const sn = db.sns.find((s) => s.sn === e.target);
        return (sn && sn.l1Id === f.l1) || String(e.target).includes(name);
      });
    }
    const counts = {
      nonSn: db.exceptions.filter((e) => exceptionDim(e) === 'nonSn' && e.status === '未处理').length,
      sn: db.exceptions.filter((e) => exceptionDim(e) === 'sn' && e.status === '未处理').length,
      stock: db.exceptions.filter((e) => exceptionDim(e) === 'stock' && e.status === '未处理').length,
    };
    return `${pageHeader('异常管理', '未处理加粗 · 关闭时确认是否已处理')}
      ${tabsHtml('exception', [
        { id: 'nonSn', title: '非SN异常', badge: counts.nonSn || null },
        { id: 'sn', title: 'SN异常', badge: counts.sn || null },
        { id: 'stock', title: '销售库存异常', badge: counts.stock || null },
      ])}
      ${filterBar(`
        <select class="field-input" data-filter="exception:status"><option value="">状态</option><option value="未处理" ${f.status==='未处理'?'selected':''}>未处理</option><option value="已处理" ${f.status==='已处理'?'selected':''}>已处理</option></select>
        <select class="field-input" data-filter="exception:l1"><option value="">关联一级</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${f.l1===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <label style="font-size:12px;color:var(--text-2)">预警倍数 <input class="field-input" style="width:80px" type="number" step="0.1" value="${db.exceptionMultiplier}" data-filter="exception:mult" /></label>
        <button class="btn btn-sm" data-action="save-ex-mult">保存标准</button>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>时间</th><th>类型</th><th>对象</th><th>详情</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${rows.map((e)=>{
          const bold = e.status === '未处理' ? 'ex-bold' : '';
          return `<tr class="${bold}">
            <td>${escapeHtml(e.time)}</td><td>${escapeHtml(e.type)}</td>
            <td>${escapeHtml(e.target)}</td><td>${escapeHtml(e.detail)}</td>
            <td>${tag(e.status, e.status==='未处理'?'orange':'green')}</td>
            <td class="ops">${e.status==='未处理'?`<button class="btn btn-sm" data-action="close-exception" data-id="${e.id}">处理</button>`:'—'}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageStats() {
    const from = (ui.filters.stats || {}).from || monthStart();
    const to = (ui.filters.stats || {}).to || todayDate();
    const poAll = db.purchases.filter((p) => p.status === 'approved' || p.status === 'approvedPending');
    const poMonth = poAll.filter((p) => inDateRange(p.createdAt, from, to));
    const poQty = (list) => list.reduce((n, p) => n + purchaseNeedQty(p), 0);
    const soDist = db.sales.filter((s) => s.channel === 'distribute' && s.status === 'done');
    const soDir = db.sales.filter((s) => s.channel === 'direct' && s.status === 'done');
    const qty = (list, fr, t) => list.filter((s) => inDateRange(s.createdAt, fr, t)).reduce((n, s) => n + (s.scanned || []).length, 0);
    const exOpen = db.exceptions.filter((e) => e.status === '未处理').length;
    const exAll = db.exceptions.length;
    const actMonth = db.sns.filter((s) => s.status === 'bound' && inDateRange(s.soldAt || s.bindAt, from, to)).length;
    return `${pageHeader('数据统计', '点击指标跳转对应列表并带筛选')}
      ${filterBar(`
        <input type="date" class="field-input" data-filter="stats:from" value="${from}" />
        <input type="date" class="field-input" data-filter="stats:to" value="${to}" />
      `)}
      <h3 class="section-title">采购报表 (PO)</h3>
      <div class="metric-grid">
        ${metricCard('区间采购量', poQty(poMonth), 'purchase')}
        ${metricCard('历史采购总量', poQty(poAll), 'purchase')}
      </div>
      <h3 class="section-title">销售报表 (SO)</h3>
      <div class="metric-grid">
        ${metricCard('分销·区间', qty(soDist, from, to), 'sales')}
        ${metricCard('分销·历史', qty(soDist), 'sales')}
        ${metricCard('直销·区间', qty(soDir, from, to), 'sales')}
        ${metricCard('直销·历史', qty(soDir), 'sales')}
      </div>
      <h3 class="section-title">激活 / 异常 (ACT / EX)</h3>
      <div class="metric-grid">
        ${metricCard('区间激活', actMonth, 'sn')}
        ${metricCard('历史激活', db.sns.filter((s)=>s.status==='bound').length, 'sn')}
        ${metricCard('未处理异常', exOpen, 'exception')}
        ${metricCard('异常总量', exAll, 'exception')}
      </div>`;
  }

  function pageRole() {
    return `${pageHeader('角色与权限', '创建账号 / 一级子账号（仅扫码）', '<button class="btn btn-primary" data-action="open-create-account">新建账号</button>')}
      <h3 class="section-title">角色</h3>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>角色</th><th>说明</th><th>权限</th><th>账号数</th></tr></thead>
        <tbody>${db.roles.map((r)=>`<tr>
          <td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.desc)}</td>
          <td>${(r.perms||[]).map((p)=>tag(p)).join(' ')}</td>
          <td class="num">${db.accounts.filter((a)=>a.roleId===r.id).length}</td>
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
    return `${pageHeader('操作日志', '审核、改码、调库、异常处理等')}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>时间</th><th>账号</th><th>角色</th><th>动作</th><th>IP</th><th>结果</th></tr></thead>
        <tbody>${db.logs.slice(0,100).map((l)=>`<tr>
          <td>${escapeHtml(l.time)}</td><td>${escapeHtml(l.account)}</td><td>${escapeHtml(l.role)}</td>
          <td>${escapeHtml(l.action)}</td><td>${escapeHtml(l.ip)}</td>
          <td>${tag(l.ok?'成功':'失败', l.ok?'green':'red')}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
  }

  /* ---------- Mini pages ---------- */
  function pageMiniScan() {
    if (ui.role === 'sub') {
      return pageMiniShipScan(true);
    }
    if (ui.role === 'l2') {
      return `<div class="mini-page-title">扫码查询</div>
        <p class="mini-page-desc">拍摄/输入 SN 查询产品信息（只读）</p>
        <div class="form-field"><input class="field-input" id="mini-q-sn" placeholder="输入或扫描 SN" /></div>
        <button class="btn btn-primary btn-block" data-action="mini-query-sn">查询</button>
        <div id="mini-query-result" style="margin-top:12px"></div>`;
    }
    const mode = ui.scanMode || 'ship';
    return `<div class="mini-page-title">扫码</div>
      <p class="mini-page-desc">三种入口：出货 / 直销 / 查询</p>
      <div class="scan-mode-grid">
        <button type="button" class="scan-mode-card ${mode==='ship'?'on':''}" data-action="set-scan-mode" data-mode="ship"><strong>出货扫码</strong><span>分销给二级</span></button>
        <button type="button" class="scan-mode-card ${mode==='direct'?'on':''}" data-action="set-scan-mode" data-mode="direct"><strong>直销激活</strong><span>C端绑定</span></button>
        <button type="button" class="scan-mode-card ${mode==='query'?'on':''}" data-action="set-scan-mode" data-mode="query"><strong>查询扫码</strong><span>拍码查信息</span></button>
      </div>
      <div style="margin-top:14px">${mode==='ship'?pageMiniShipScan(false):mode==='direct'?pageMiniDirectScan():pageMiniQueryScan()}</div>`;
  }

  function pageMiniShipScan(subOnly) {
    const open = db.sales.filter((s) => s.l1Id === currentL1Id() && s.channel === 'distribute' && s.status === 'scanning');
    return `${subOnly?'<div class="mini-page-title">销售扫码</div><p class="mini-page-desc">子账号仅可扫码出货，不可改单</p>':''}
      ${!subOnly?`<button class="btn btn-primary btn-block" data-action="mini-create-so" style="margin-bottom:10px">创建分销出货单</button>`:''}
      <div class="mini-list">${open.map((s)=>`<button type="button" class="mini-list-item" data-action="mini-open-scan-so" data-id="${s.id}">
        <strong>${escapeHtml(s.no)}</strong>
        <span>${escapeHtml(l2Name(s.l2Id))} · ${escapeHtml(soProductDetail(s))}</span>
        <span>${(s.scanned||[]).length}/${s.planTotal}</span>
      </button>`).join('') || emptyHint('暂无进行中出货单')}</div>`;
  }

  function pageMiniDirectScan() {
    return `<div class="form-field"><label>SN</label><input class="field-input" id="direct-sn" placeholder="扫描 SN" /></div>
      <div class="form-field"><label>客户手机</label><input class="field-input" id="direct-phone" placeholder="11位手机号" value="13800138000" /></div>
      <div class="form-field"><label>地址</label><input class="field-input" id="direct-addr" value="杭州市西湖区文一路1号" /></div>
      <div class="form-field"><label>演示IP地区</label>
        <select class="field-input" id="demo-ip">${ALL_REGIONS.map((r)=>`<option value="${r}" ${db.demoIpRegion===r?'selected':''}>${r}</option>`).join('')}</select>
      </div>
      <button class="btn btn-primary btn-block" data-action="mini-direct-bind">校验并激活</button>
      <p class="mini-page-desc">双重校验：IP 是否在直销范围；手机号归属地是否在授权区域。任一不匹配生成异常。</p>`;
  }

  function pageMiniQueryScan() {
    return `<div class="form-field"><input class="field-input" id="mini-q-sn" placeholder="输入或扫描 SN" /></div>
      <button class="btn btn-primary btn-block" data-action="mini-query-sn">查询</button>`;
  }

  function pageMiniPurchase() {
    const list = db.purchases.filter((p) => p.l1Id === currentL1Id());
    return `<div class="mini-page-title">采购</div>
      <p class="mini-page-desc">发起采购申请（标准/非标/配件）</p>
      <button class="btn btn-primary btn-block" data-action="mini-create-po">新建采购申请</button>
      <div class="mini-list" style="margin-top:12px">${list.map((p)=>`<div class="mini-list-item">
        <strong>${escapeHtml(p.no)}</strong>
        <span>${tag(PO_STATUS[p.status]||p.status)} ${escapeHtml(p.createdAt)}</span>
        <span>${(p.lines||[]).map((l)=>`${l.size}×${l.qty}`).join('，')}</span>
      </div>`).join('')}</div>`;
  }

  function pageMiniSales() {
    if (ui.role === 'l2') {
      const list = db.sales.filter((s) => s.l2Id === currentL2Id());
      return `<div class="mini-page-title">销售</div>
        <div class="alert alert-info">向一级发起下单申请：只读提示，当前账号无操作权限</div>
        <div class="mini-list">${list.map((s)=>`<div class="mini-list-item"><strong>${escapeHtml(s.no)}</strong><span>${escapeHtml(soProductDetail(s))}</span></div>`).join('')||emptyHint()}</div>`;
    }
    const list = db.sales.filter((s) => s.l1Id === currentL1Id());
    return `<div class="mini-page-title">销售</div>
      <div class="mini-list">${list.map((s)=>`<div class="mini-list-item">
        <strong>${escapeHtml(s.no)}</strong>
        <span>${tag(s.channel==='direct'?'直售':'分销')} ${escapeHtml(soProductDetail(s))}</span>
        <span>${(s.scanned||[]).length}/${s.planTotal} · ${escapeHtml(s.status)}</span>
      </div>`).join('')}</div>`;
  }

  function pageMiniStock() {
    const type = ui.role === 'l2' ? 'l2' : 'l1';
    const id = type === 'l2' ? currentL2Id() : currentL1Id();
    const rows = getStockRows(type, id);
    return `<div class="mini-page-title">库存</div>
      <div class="mini-list">${rows.map((r)=>`<div class="mini-list-item">
        <strong>${escapeHtml(productName(r.productId))}</strong>
        <span>${escapeHtml(r.size)} + ${escapeHtml(r.belt||'—')}</span>
        <span class="num">×${r.qty}</span>
      </div>`).join('')||emptyHint('暂无库存')}</div>`;
  }

  function pageMiniAftersale() {
    const list = ui.role === 'l2'
      ? db.returns.filter((r) => r.fromId === currentL2Id())
      : db.returns.filter((r) => r.fromId === currentL1Id() || r.approverId === currentL1Id() || (r.sns||[]).some((sn)=>db.sns.find(s=>s.sn===sn&&s.l1Id===currentL1Id())));
    return `<div class="mini-page-title">售后</div>
      <button class="btn btn-block" data-action="mini-create-return" style="margin-bottom:10px">申请退货</button>
      <div class="mini-list">${list.map((r)=>`<div class="mini-list-item">
        <strong>${escapeHtml(r.no)}</strong>
        <span>${tag(r.reasonType||'')} ${escapeHtml(r.reason||'')}</span>
        <span>${escapeHtml(r.status)} · ${escapeHtml(snsProductDetail(r.sns))}</span>
      </div>`).join('')||emptyHint()}</div>`;
  }

  function pageMiniException() {
    const list = db.exceptions.filter((e) => {
      const sn = db.sns.find((s) => s.sn === e.target);
      return (sn && sn.l1Id === currentL1Id()) || String(e.target).includes(l1Name(currentL1Id()));
    });
    return `<div class="mini-page-title">异常</div>
      <div class="mini-list">${list.map((e)=>`<div class="mini-list-item ${e.status==='未处理'?'ex-bold':''}">
        <strong>${escapeHtml(e.type)}</strong>
        <span>${escapeHtml(e.target)}</span>
        <span>${escapeHtml(e.detail)}</span>
        <span>${tag(e.status)}</span>
      </div>`).join('')||emptyHint()}</div>`;
  }

  function pageMiniMine() {
    const r = ROLES[ui.role];
    return `<div class="mini-page-title">我的</div>
      <div class="mini-profile">
        <span class="user-avatar">${r.avatar}</span>
        <div><strong>${escapeHtml(r.name)}</strong><div style="font-size:12px;color:var(--text-3)">${escapeHtml(r.account)}</div></div>
      </div>
      <button class="btn btn-block" data-action="logout">退出登录</button>
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
    sales: pageSales, stock: pageStock, return: pageReturn, exception: pageException,
    stats: pageStats, role: pageRole, log: pageLog,
    'l1-sales-detail': pageL1SalesDetail, 'l1-return-detail': pageL1ReturnDetail,
    'mini-scan': pageMiniScan, 'mini-purchase': pageMiniPurchase, 'mini-sales': pageMiniSales,
    'mini-stock': pageMiniStock, 'mini-aftersale': pageMiniAftersale, 'mini-exception': pageMiniException,
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
        <div class="form-field"><label>SN 段号（可多行，数量须匹配）</label>
          ${arr.map((seg, si)=>`<div style="display:flex;gap:6px;margin-bottom:6px">
            <input class="field-input" data-seg-idx="${si}" value="${escapeHtml(seg)}" placeholder="RL202608010001-RL202608010010" />
            <button type="button" class="btn btn-sm" data-action="po-add-seg" data-kind="${kind}" data-idx="${idx}">+</button>
          </div>`).join('')}
        </div>
      </div>`;
    };

    return {
      title: `审核采购单 ${p.no}`,
      body: `<div class="alert alert-info">段号数量须等于标准+非标总数；配件不计 SN。确认需双管理员会签，通过后 24h 可撤销。</div>
        <h4>标准品</h4>${lines.map((l,i)=>lineBlock(l,i,'lines')).join('')||emptyHint('无标准行')}
        <h4>非标品（个性化） <button class="btn btn-sm" data-action="po-add-custom">+ 加行</button></h4>
        ${customs.map((l,i)=>lineBlock(l,i,'customLines')).join('')||'<div class="empty-hint">暂无非标，可点击加行</div>'}
        <h4>配件（无 SN）</h4>
        <div class="form-grid">${parts.map((pt,i)=>`
          <div class="form-field"><label>配件</label><select class="field-input" data-part-idx="${i}" data-part-field="partId">${partProducts().map((x)=>`<option value="${x.id}" ${x.id===pt.partId?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div>
          <div class="form-field"><label>规格</label><input class="field-input" data-part-idx="${i}" data-part-field="spec" value="${escapeHtml(pt.spec||'')}" /></div>
          <div class="form-field"><label>数量</label><input type="number" class="field-input" data-part-idx="${i}" data-part-field="qty" value="${pt.qty||0}" /></div>
        `).join('')||emptyHint('无配件')}</div>
        <div style="margin-top:10px">需求 SN：<strong class="num">${purchaseNeedQty(draft)}</strong>　已填段号：<strong class="num">${purchaseSegCount(draft)}</strong>　${match?tag('数量匹配','green'):tag('数量不匹配','orange')}</div>
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

    if (type === 'confirm') {
      title = '请确认';
      body = `<p>${escapeHtml(payload.message || '确认执行该操作？')}</p>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="confirm-ok">确定</button>`;
    } else if (type === 'view-agent-l1' || type === 'edit-l1') {
      const a = type === 'edit-l1' ? draft : db.agentsL1.find((x) => x.id === payload.id);
      const editing = type === 'edit-l1';
      const occ = occupiedMainAreas(a.id);
      title = editing ? '编辑一级代理' : `一级详情 · ${a.name}`;
      body = editing ? `<div class="form-grid">
          <div class="form-field"><label>名称</label><input class="field-input" id="f-name" value="${escapeHtml(a.name)}" /></div>
          <div class="form-field"><label>联系人</label><input class="field-input" id="f-contact" value="${escapeHtml(a.contact)}" /></div>
          <div class="form-field span-2"><label>主授权区域（多选）</label>${chips(ALL_REGIONS, a.mainAreas||[], 'data-toggle-main', occ)}</div>
          <div class="form-field span-2"><label>可销售范围</label>${chips(ALL_REGIONS, a.saleAreas||a.areas||[], 'data-toggle-sale')}</div>
          <div class="form-field span-2"><label>直销范围（城市）</label>${chips((a.saleAreas||a.areas||[]).flatMap((r)=>CITY_MAP[r]||[]), a.directAreas||[], 'data-toggle-direct')}</div>
          <div class="form-field"><label>预警倍数</label><input type="number" step="0.1" class="field-input" id="f-warn" value="${a.warnMultiplier||1.5}" /></div>
        </div><h4>企业信息</h4>${entFieldsHtml(a.ent)}`
        : `<div class="detail-grid">
          <div><span>编码</span>${escapeHtml(a.code)}</div>
          <div><span>联系人</span>${escapeHtml(a.contact)}</div>
          <div><span>主授权</span>${escapeHtml((a.mainAreas||[]).join('、'))}</div>
          <div><span>可销售</span>${escapeHtml((a.saleAreas||a.areas||[]).join('、'))}</div>
          <div><span>直销城市</span>${escapeHtml((a.directAreas||[]).join('、'))}</div>
          <div><span>状态</span>${tag(a.status)}</div>
          <div><span>预警倍数</span>${a.warnMultiplier||1.5}</div>
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
           <button class="btn btn-danger" data-action="disable-l1" data-id="${a.id}">${a.status==='启用'?'停用':'启用'}</button>`;
    } else if (type === 'create-l1') {
      title = '新建一级代理';
      const d = draft;
      body = `<div class="form-grid">
        <div class="form-field"><label>名称</label><input class="field-input" id="f-name" value="${escapeHtml(d.name||'')}" /></div>
        <div class="form-field"><label>联系人</label><input class="field-input" id="f-contact" value="${escapeHtml(d.contact||'')}" /></div>
        <div class="form-field span-2"><label>主授权区域</label>${chips(ALL_REGIONS, d.mainAreas||[], 'data-toggle-main', occupiedMainAreas())}</div>
        <div class="form-field span-2"><label>可销售范围</label>${chips(ALL_REGIONS, d.saleAreas||[], 'data-toggle-sale')}</div>
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
          <div class="form-field span-2"><label>围栏城市</label>${chips(cities.length?cities:['杭州市'], a.areas||[], 'data-toggle-city')}</div>
        </div>${a.type==='法人'?entFieldsHtml(a.ent||{}):''}`
        : `<div class="detail-grid">
          <div><span>编码</span>${escapeHtml(a.code)}</div>
          <div><span>类型</span>${escapeHtml(a.type)}</div>
          <div><span>所属一级</span>${escapeHtml(l1Name(a.parentId))}</div>
          <div><span>城市</span>${escapeHtml((a.areas||[]).join('、')||'—')}</div>
          <div><span>状态</span>${tag(a.status)}</div>
        </div>${a.ent?`<h4>企业</h4><div class="detail-grid"><div class="span-2">${escapeHtml(a.ent.company||'')}</div></div>`:''}`;
      foot = editing
        ? `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-l2">保存</button>`
        : `<button class="btn" data-action="close-modal">关闭</button>
           <button class="btn" data-action="edit-l2" data-id="${a.id}">编辑</button>
           <button class="btn" data-action="toggle-l2" data-id="${a.id}">${a.status==='启用'?'停用':'启用'}</button>
           ${a.type==='法人'&&a.parentId?`<button class="btn btn-danger" data-action="unbind-l2" data-id="${a.id}">解绑法人</button>`:''}
           <button class="btn" data-action="open-rebind-l2" data-id="${a.id}">更改绑定</button>
           <button class="btn" data-action="edit-l2-fence" data-id="${a.id}">围栏设定</button>`;
    } else if (type === 'rebind-l2') {
      const a = db.agentsL2.find((x) => x.id === payload.id);
      title = `重新绑定 · ${a.name}`;
      body = `<div class="form-field"><label>绑定一级</label>
        <select class="field-input" id="f-parent">${db.agentsL1.filter((x)=>x.status==='启用').map((x)=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>授权城市（多选，先选一级后在保存时取可选城市）</label>
        <input class="field-input" id="f-cities" placeholder="如 杭州市,宁波市" value="${escapeHtml((a.prevAreas||a.areas||[]).join(','))}" />
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="rebind-l2-ok" data-id="${a.id}">绑定</button>`;
    } else if (type === 'view-sn') {
      const row = db.sns.find((s) => s.sn === payload.id);
      const st = snStatusMeta(row);
      const life = getSnLifecycle(row);
      title = `SN 详情 · ${row.sn}`;
      body = `${renderMiniSnCard(row)}
        <h4 style="margin-top:12px">编辑（留审计日志）</h4>
        <div class="form-grid">
          <div class="form-field"><label>SN</label><input class="field-input" id="f-sn" value="${escapeHtml(row.sn)}" /></div>
          <div class="form-field"><label>尺寸</label><select class="field-input" id="f-size">${BAND_SIZES.map((s)=>`<option value="${s}" ${s===row.size?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>腰带</label><select class="field-input" id="f-belt">${BELTS.map((s)=>`<option value="${s}" ${s===row.belt?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="form-field"><label>所属一级</label><select class="field-input" id="f-l1"><option value="">—</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${a.id===row.l1Id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select></div>
        </div>
        <div class="mini-section-title">完整流转（${life.length}）</div>
        <div class="mini-timeline" style="max-height:220px;overflow:auto">${life.map((e)=>`<div class="mini-tl-item type-${e.type||''}"><div class="mini-tl-dot"></div><div><div class="mini-tl-title">${escapeHtml(e.title)}</div><div class="mini-tl-desc">${escapeHtml(e.desc||'')}</div><div class="mini-tl-time">${escapeHtml(e.time)}</div></div></div>`).join('')}</div>`;
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        <button class="btn btn-primary" data-action="save-sn" data-id="${row.sn}">保存修改</button>
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
        body = `<div class="detail-grid">
          <div><span>一级</span>${escapeHtml(l1Name(p.l1Id))}</div>
          <div><span>状态</span>${tag(PO_STATUS[p.status]||p.status)}</div>
          <div><span>会签</span>${(p.cosign?.admin1?'✓':'-')}/${(p.cosign?.admin2?'✓':'-')}</div>
          <div><span>时间</span>${escapeHtml(p.createdAt)}</div>
        </div>
        <h4>标准</h4><pre style="white-space:pre-wrap;font-size:12px">${escapeHtml(JSON.stringify(p.lines,null,2))}</pre>
        <h4>非标</h4><pre style="white-space:pre-wrap;font-size:12px">${escapeHtml(JSON.stringify(p.customLines,null,2))}</pre>
        <h4>配件</h4><pre style="white-space:pre-wrap;font-size:12px">${escapeHtml(JSON.stringify(p.parts,null,2))}</pre>`;
        foot = `<button class="btn" data-action="close-modal">关闭</button>${['pending','cosigning'].includes(p.status)?`<button class="btn btn-primary" data-action="open-audit-po" data-id="${p.id}">去审核</button>`:''}`;
      }
    } else if (type === 'view-sale') {
      const s = db.sales.find((x) => x.id === payload.id);
      title = `销售单 ${s.no}`;
      body = `<div class="detail-grid">
        <div><span>渠道</span>${tag(s.channel==='direct'?'直售':'分销')}</div>
        <div><span>一级</span>${escapeHtml(l1Name(s.l1Id))}</div>
        <div><span>二级</span>${s.l2Id?escapeHtml(l2Name(s.l2Id)):'—'}</div>
        <div><span>明细</span>${escapeHtml(soProductDetail(s))}</div>
        <div><span>计划</span>${JSON.stringify(s.planBySize)}</div>
        <div><span>已扫</span>${(s.scanned||[]).length}/${s.planTotal}</div>
      </div>
      <div style="margin-top:8px;font-size:12px">${(s.scanned||[]).map((sn)=>tag(sn)).join(' ')}</div>`;
    } else if (type === 'view-return') {
      const r = db.returns.find((x) => x.id === payload.id);
      title = `退货单 ${r.no}`;
      body = `<div class="detail-grid">
        <div><span>类型</span>${escapeHtml(r.typeLabel||r.type)}</div>
        <div><span>理由</span>${tag(r.reasonType||'')} ${escapeHtml(r.reason||'')}</div>
        <div><span>明细</span>${escapeHtml(snsProductDetail(r.sns))}</div>
        <div><span>状态</span>${tag(r.status)}</div>
      </div>`;
    } else if (type === 'scan-so') {
      const s = db.sales.find((x) => x.id === payload.id);
      title = `扫码出货 ${s.no}`;
      const canEdit = ui.role !== 'sub';
      body = `<p>${escapeHtml(l2Name(s.l2Id))} · 计划 ${JSON.stringify(s.planBySize)} · 已扫 ${(s.scanned||[]).length}/${s.planTotal}</p>
        <div class="form-field"><label>扫描 SN</label><input class="field-input" id="scan-sn-input" placeholder="输入 SN 回车或点添加" /></div>
        <button class="btn btn-primary" data-action="scan-add-sn" data-id="${s.id}">添加</button>
        <div style="margin-top:8px">${(s.scanned||[]).map((sn)=>tag(sn,'green')).join(' ')}</div>
        ${canEdit?'':'<p class="mini-page-desc">子账号不可修改计划数量</p>'}`;
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        <button class="btn btn-primary" data-action="scan-confirm-so" data-id="${s.id}" ${(s.scanned||[]).length>=s.planTotal?'':'disabled'}>确认出货</button>`;
    } else if (type === 'create-so') {
      title = '创建分销出货单';
      const l2s = db.agentsL2.filter((a) => a.parentId === currentL1Id() && a.auditStatus === 'approved' && !a.pending);
      body = `<div class="form-grid">
        <div class="form-field"><label>二级代理</label><select class="field-input" id="f-l2">${l2s.map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></div>
        <div class="form-field"><label>商品</label><select class="field-input" id="f-pid">${kitProducts().map((p)=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
        ${BAND_SIZES.map((s)=>`<div class="form-field"><label>${s}</label><input type="number" class="field-input" data-size-qty="${s}" value="0" /></div>`).join('')}
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-so-ok">创建并扫码</button>`;
    } else if (type === 'create-po') {
      title = '新建采购申请';
      body = `<div class="form-grid">
        <div class="form-field"><label>商品</label><select class="field-input" id="f-pid">${kitProducts().map((p)=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
        ${BAND_SIZES.map((s)=>`<div class="form-field"><label>标准 ${s}</label><input type="number" class="field-input" data-size-qty="${s}" value="0" /></div>`).join('')}
        <div class="form-field"><label>非标：弹力带</label><select class="field-input" id="f-csize">${BAND_SIZES.map((s)=>`<option value="${s}">${s}</option>`).join('')}</select></div>
        <div class="form-field"><label>非标：腰带</label><select class="field-input" id="f-cbelt">${BELTS.map((s)=>`<option value="${s}">${s}</option>`).join('')}</select></div>
        <div class="form-field"><label>非标数量</label><input type="number" class="field-input" id="f-cqty" value="0" /></div>
        <div class="form-field"><label>配件硅胶带数量</label><input type="number" class="field-input" id="f-part-qty" value="0" /></div>
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-po-ok">提交</button>`;
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
      title = '创建一级子账号';
      body = `<div class="form-grid">
        <div class="form-field"><label>所属一级</label><select class="field-input" id="f-l1">${db.agentsL1.map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></div>
        <div class="form-field"><label>用户名</label><input class="field-input" id="f-user" /></div>
        <div class="form-field"><label>姓名</label><input class="field-input" id="f-name" /></div>
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-sub-ok">创建</button>`;
    } else {
      title = '提示';
      body = `<p>${escapeHtml(payload.message || type)}</p>`;
    }

    const wide = type === 'audit-po' || type === 'view-sn' || type === 'view-agent-l1' || type === 'edit-l1';
    return `<div class="modal-mask" id="modal-mask"><div class="modal ${wide ? 'modal--wide' : ''}" id="modal-box">
      <div class="modal-hd"><strong>${escapeHtml(title)}</strong><button class="btn btn-sm btn-ghost" data-action="close-modal">×</button></div>
      <div class="modal-bd">${body}</div>
      <div class="modal-ft">${foot}</div>
    </div></div>`;
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
    // IP vs directAreas: map city to region roughly — demo uses province match against saleAreas / direct city region
    const ipOk = (l1.saleAreas || l1.areas || []).includes(ipRegion)
      || (l1.directAreas || []).some((c) => (CITY_MAP[ipRegion] || []).includes(c) || c.startsWith(ipRegion.slice(0, 2)));
    // Better: check if any direct city belongs to ipRegion
    const ipInDirect = (l1.directAreas || []).some((c) => (CITY_MAP[ipRegion] || []).includes(c));
    const ipPass = ipInDirect || (l1.directAreas || []).length === 0;
    if (!ipPass) {
      pushException('SN激活异常', sn, `跨区激活：IP ${ipRegion} 不在直销范围 ${(l1.directAreas||[]).join('、')}`, 'sn');
    }
    const phonePass = (l1.saleAreas || l1.areas || []).includes(phoneLoc);
    if (!phonePass) {
      pushException('归属地异常', sn, `手机归属 ${phoneLoc} 不在授权区域`, 'sn');
    }
    // duplicate phone check
    const dup = db.sns.filter((s) => s.user && s.user.phone === phone && s.sn !== sn);
    if (dup.length) pushException('客户信息重复', sn, `手机号 ${phone} 已激活 ${dup.length} 次`, 'sn');

    row.status = 'bound';
    row.soldAt = nowStr();
    row.bindAt = nowStr();
    row.bindIpRegion = ipRegion;
    row.user = { phone, addr, phoneLoc };
    row.reIn = false;
    if (!row.l2Id && row.status) { /* direct from l1 */ }
    pushSnEvent(row, 'C端直销绑定', `${phone} · IP ${ipRegion}`, 'bind');
    db.sales.unshift({
      id: uid('SO'), no: `SO${todayCompact()}${String(++db.seq.so).padStart(3,'0')}`,
      channel: 'direct', l1Id: l1.id, l2Id: null, productId: row.productId,
      planTotal: 1, planBySize: { [row.size]: 1 }, scanned: [sn], status: 'done', createdAt: nowStr(),
    });
    db.stockLogs.unshift({ id: uid('H'), agentType: row.l2Id ? 'l2' : 'l1', agentId: row.l2Id || l1.id, productId: row.productId, size: row.size, delta: -1, reason: '直销出库', time: nowStr(), ref: sn });
    addLog(`直销激活 ${sn}`);
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
        <nav class="mini-tabbar">
          ${tabs.map((t) => `<button type="button" class="mini-tab ${ui.route === t.id ? 'active' : ''}" data-go="${t.id}">
            <span class="mini-tab-ico">${t.icon}</span><span>${t.title}</span>
          </button>`).join('')}
        </nav>
      </div>
      <p class="mini-stage-hint">代理端仅小程序 · 顶栏可切换演示身份 · 与后台数据同步</p>
    </div>
    ${modalContent()}
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
    ensureApprovedPendingEffect();
    document.getElementById('app').innerHTML = ui.loggedIn ? renderApp() : renderLogin();
    bindEvents();
  }

  function navigate(id) {
    if (!PAGES[id]) return toast('页面不存在', 'err');
    if (ui.mode === 'mini') {
      const allowed = miniTabs().map((t) => t.id);
      if (!allowed.includes(id)) return toast('当前小程序角色无此页', 'err');
    }
    ui.route = id;
    location.hash = id;
    ui.modal = null;
    ui.notifyOpen = false;
    render();
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
        d.ent = readEntFields();
        d.areas = d.saleAreas || d.areas;
        const i = db.agentsL1.findIndex((x)=>x.id===d.id);
        if (i>=0) db.agentsL1[i] = d;
        addLog(`编辑一级 ${d.name}`); saveStore(); closeModal(); toast('已保存'); break;
      }
      case 'create-l1-ok': {
        const d = ui.modal.draft;
        d.name = $('#f-name')?.value; d.contact = $('#f-contact')?.value; d.ent = readEntFields();
        if (!d.name || !(d.mainAreas||[]).length) return toast('请填写名称与主授权区域', 'err');
        d.id = uid('L1'); d.code = `AG-L1-${String(db.agentsL1.length+1).padStart(3,'0')}`;
        d.status = '启用'; d.areas = d.saleAreas || [...d.mainAreas]; d.saleAreas = d.areas;
        d.directAreas = d.directAreas || []; d.warnMultiplier = 1.5;
        db.agentsL1.push(d); addLog(`创建一级 ${d.name}`); saveStore(); closeModal(); toast('已创建'); break;
      }
      case 'disable-l1':
        confirmDialog(`确认${db.agentsL1.find(a=>a.id===id)?.status==='启用'?'停用':'启用'}该一级代理？停用后下属法人二级将进入待分配。`, 'disable-l1-ok', { id }); break;
      case 'confirm-ok': {
        const act = ui.modal.payload.action;
        const pid = ui.modal.payload.id;
        closeModal();
        if (act === 'disable-l1-ok') {
          const a = db.agentsL1.find((x)=>x.id===pid);
          if (!a) break;
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
          if (p) { p.status = 'rejected'; addLog(`驳回采购 ${p.no}`); saveStore(); toast('已驳回'); render(); }
        } else if (act === 'po-confirm-ok') {
          finishPoConfirm(pid);
        } else if (act === 'revoke-po-ok') {
          const p = db.purchases.find((x)=>x.id===pid);
          if (p && p.status === 'approvedPending') { p.status = 'cosigning'; p.cosign = { admin1: false, admin2: false }; addLog(`撤销采购审核 ${p.no}`); saveStore(); toast('已撤销'); render(); }
        } else if (act === 'close-ex-ok') {
          const e = db.exceptions.find((x)=>x.id===pid);
          if (e) { e.status = '已处理'; addLog(`处理异常 ${e.type}`); saveStore(); toast('已标记处理'); render(); }
        } else if (act === 'toggle-l2-ok') {
          const a = db.agentsL2.find((x)=>x.id===pid);
          if (a) { a.status = a.status==='启用'?'停用':'启用'; addLog(`${a.status}二级 ${a.name}`); saveStore(); toast('已更新'); render(); }
        } else if (act === 'unbind-l2-ok') {
          const a = db.agentsL2.find((x)=>x.id===pid);
          if (a && a.type==='法人') {
            a.pending = true; a.prevParentId = a.parentId; a.prevAreas = [...(a.areas||[])]; a.parentId = null; a.areas = [];
            pushNotify('二级待分配', `${a.name} 已解绑`, '原厂');
            addLog(`解绑二级 ${a.name}`); saveStore(); toast('已解绑并进入待分配'); render();
          }
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
        if (d.type==='法人') d.ent = readEntFields();
        const i = db.agentsL2.findIndex((x)=>x.id===d.id);
        if (i>=0) db.agentsL2[i] = d;
        addLog(`编辑二级 ${d.name}`); saveStore(); closeModal(); toast('已保存'); break;
      }
      case 'toggle-l2':
        confirmDialog('确认切换该二级代理启用状态？', 'toggle-l2-ok', { id }); break;
      case 'unbind-l2':
        confirmDialog('确认解绑该法人二级？将进入待分配池。', 'unbind-l2-ok', { id }); break;
      case 'open-rebind-l2': openModal('rebind-l2', { id }); break;
      case 'rebind-l2-ok': {
        const a = db.agentsL2.find((x)=>x.id===id);
        const parentId = $('#f-parent')?.value;
        const cities = ($('#f-cities')?.value || '').split(/[,，]/).map((x)=>x.trim()).filter(Boolean);
        a.parentId = parentId; a.areas = cities; a.pending = false; a.auditStatus = 'approved';
        addLog(`重新绑定二级 ${a.name} → ${l1Name(parentId)}`); saveStore(); closeModal(); toast('已绑定'); break;
      }
      case 'audit-l2-ok': {
        const a = db.agentsL2.find((x)=>x.id===id); a.auditStatus = 'approved'; addLog(`二级审核通过 ${a.name}`); saveStore(); toast('已通过'); render(); break;
      }
      case 'audit-l2-reject': {
        const a = db.agentsL2.find((x)=>x.id===id); a.auditStatus = 'rejected'; addLog(`二级审核驳回 ${a.name}`); saveStore(); toast('已驳回'); render(); break;
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
        confirmDialog('确认驳回该采购单？', 'po-reject-ok', { id: ui.modal.draft.id }); break;
      case 'po-confirm':
        syncDraftFromAuditDom();
        if (!segmentsMatch(ui.modal.draft)) return toast('段号数量不匹配', 'err');
        ui.form._poDraft = JSON.parse(JSON.stringify(ui.modal.draft));
        confirmDialog('确认提交会签？两位管理员均确认后进入 24h 待生效。', 'po-confirm-ok', { id: ui.modal.draft.id }); break;
      case 'revoke-po':
        confirmDialog('确认撤销审核？将回到会签中。', 'revoke-po-ok', { id }); break;
      case 'save-sn': {
        const row = db.sns.find((s)=>s.sn===id);
        const newSn = $('#f-sn')?.value?.trim();
        const size = $('#f-size')?.value;
        const belt = $('#f-belt')?.value;
        const l1Id = $('#f-l1')?.value || null;
        if (newSn !== row.sn && db.sns.some((s)=>s.sn===newSn)) return toast('SN 段号重复', 'err');
        const changes = [];
        if (newSn !== row.sn) { changes.push(`SN ${row.sn}→${newSn}`); row.sn = newSn; }
        if (size !== row.size) { changes.push(`尺寸 ${row.size}→${size}`); row.size = size; }
        if (belt !== row.belt) { changes.push(`腰带 ${row.belt}→${belt}`); row.belt = belt; }
        if (l1Id !== row.l1Id) { changes.push(`一级 ${l1Name(row.l1Id)}→${l1Name(l1Id)}`); row.l1Id = l1Id; }
        if (changes.length) {
          row.tags = [...new Set([...(row.tags||[]), '修改过'])];
          pushSnEvent(row, '管理员修改', changes.join('；'), 'edit');
          addLog(`修改SN ${changes.join('；')}`);
          saveStore(); toast('已保存并记日志');
        }
        closeModal(); break;
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
      case 'approve-return': approveReturn(id); break;
      case 'reject-return': {
        const r = db.returns.find((x)=>x.id===id); if (r) { r.status = 'rejected'; addLog(`驳回退货 ${r.no}`); saveStore(); toast('已驳回'); render(); }
        break;
      }
      case 'close-exception':
        confirmDialog('是否已处理？选择确定后该异常不再加粗提醒。', 'close-ex-ok', { id }); break;
      case 'save-ex-mult': {
        const v = Number(document.querySelector('[data-filter="exception:mult"]')?.value || db.exceptionMultiplier);
        db.exceptionMultiplier = v; saveStore(); toast(`预警倍数已设为 ${v}`); break;
      }
      case 'open-create-account': openModal('create-account', {}); break;
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
        if (!username) return toast('请填写用户名', 'err');
        db.subAccounts.push({ id: uid('SUB'), l1Id, username, name, status: '启用' });
        db.accounts.push({ id: uid('ACC'), username, name, roleId: 'R3', agentId: l1Id, status: '启用', password: '******' });
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
        ui.scanMode = el.getAttribute('data-mode'); persistSession(); render(); break;
      case 'mini-create-so': openModal('create-so', {}); break;
      case 'create-so-ok': {
        const l2Id = $('#f-l2')?.value;
        const productId = $('#f-pid')?.value;
        const planBySize = {}; let planTotal = 0;
        document.querySelectorAll('[data-size-qty]').forEach((inp) => {
          const q = Number(inp.value)||0; if (q>0) { planBySize[inp.getAttribute('data-size-qty')] = q; planTotal += q; }
        });
        if (!planTotal) return toast('请填写数量', 'err');
        const so = { id: uid('SO'), no: `SO${todayCompact()}${String(++db.seq.so).padStart(3,'0')}`, channel: 'distribute', l1Id: currentL1Id(), l2Id, productId, planTotal, planBySize, scanned: [], status: 'scanning', createdAt: nowStr() };
        db.sales.unshift(so); saveStore(); openModal('scan-so', { id: so.id }); break;
      }
      case 'mini-open-scan-so': openModal('scan-so', { id }); break;
      case 'scan-add-sn': {
        const s = db.sales.find((x)=>x.id===id);
        const sn = $('#scan-sn-input')?.value?.trim().toUpperCase();
        if (!sn) return;
        const row = db.sns.find((x)=>x.sn===sn);
        if (!row) return toast('SN 不存在', 'err');
        if (row.frozen || row.status==='frozen') return toast('冷冻 SN 无效', 'err');
        if (row.l1Id !== s.l1Id || row.status !== 'l1') return toast('SN 不在本一级库存', 'err');
        const need = s.planBySize[row.size] || 0;
        const got = (s.scanned||[]).filter((x)=>db.sns.find(y=>y.sn===x)?.size===row.size).length;
        if (got >= need) return toast(`尺寸 ${row.size} 已扫满`, 'err');
        if ((s.scanned||[]).includes(sn)) return toast('已扫描', 'warn');
        s.scanned.push(sn); saveStore(); render(); break;
      }
      case 'scan-confirm-so': {
        const s = db.sales.find((x)=>x.id===id);
        if ((s.scanned||[]).length < s.planTotal) return toast('未扫满', 'err');
        s.scanned.forEach((sn) => {
          const row = db.sns.find((x)=>x.sn===sn);
          row.status = 'l2'; row.l2Id = s.l2Id;
          pushSnEvent(row, '销售转入二级', s.no, 'sales');
        });
        s.status = 'done';
        db.stockLogs.unshift({ id: uid('H'), agentType: 'l2', agentId: s.l2Id, productId: s.productId, size: Object.keys(s.planBySize)[0], delta: s.scanned.length, reason: '销售转入', time: nowStr(), ref: s.no });
        addLog(`完成出货 ${s.no}`); saveStore(); closeModal(); toast('出货完成'); break;
      }
      case 'mini-direct-bind': {
        db.demoIpRegion = $('#demo-ip')?.value || db.demoIpRegion;
        doDirectBind($('#direct-sn')?.value?.trim().toUpperCase(), $('#direct-phone')?.value?.trim(), $('#direct-addr')?.value?.trim(), db.demoIpRegion);
        render(); break;
      }
      case 'mini-query-sn': {
        const sn = $('#mini-q-sn')?.value?.trim().toUpperCase();
        const row = db.sns.find((x)=>x.sn===sn);
        const box = document.getElementById('mini-query-result') || document.querySelector('.mini-scroll');
        if (box && box.id === 'mini-query-result') box.innerHTML = renderMiniSnCard(row);
        else openModal('view-sn', { id: sn });
        break;
      }
      case 'mini-create-po': openModal('create-po', {}); break;
      case 'create-po-ok': {
        const productId = $('#f-pid')?.value;
        const lines = [];
        document.querySelectorAll('[data-size-qty]').forEach((inp) => {
          const q = Number(inp.value)||0; if (q>0) lines.push({ productId, size: inp.getAttribute('data-size-qty'), belt: DEFAULT_BELT[inp.getAttribute('data-size-qty')], qty: q });
        });
        const customLines = [];
        const cq = Number($('#f-cqty')?.value)||0;
        if (cq>0) customLines.push({ productId, size: $('#f-csize')?.value, belt: $('#f-cbelt')?.value, qty: cq });
        const parts = [];
        const pq = Number($('#f-part-qty')?.value)||0;
        if (pq>0) parts.push({ partId: 'PART-SIL', spec: 'M', qty: pq });
        if (!lines.length && !customLines.length) return toast('请填写数量', 'err');
        db.purchases.unshift({
          id: uid('PO'), no: `PO${todayCompact()}${String(++db.seq.po).padStart(3,'0')}`, l1Id: currentL1Id(),
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
    const draft = ui.form._poDraft;
    const p = db.purchases.find((x) => x.id === id);
    if (!p) return;
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
      p.status = 'approvedPending';
      p.approvedAt = nowStr();
      addLog(`采购双人会签完成 ${p.no}，进入24h待生效`);
      toast('会签完成，24小时后自动生效（期间可撤销）');
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

    document.querySelectorAll('[data-mode]').forEach((el) => el.addEventListener('click', () => {
      // admin only — no agent desktop
      ui.mode = 'admin';
      persistSession();
      navigate('home');
    }));

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
      const r = el.getAttribute('data-toggle-city');
      const set = new Set(ui.modal.draft.areas || []);
      if (set.has(r)) set.delete(r); else set.add(r);
      ui.modal.draft.areas = [...set];
      render();
    }));

    $('#modal-mask')?.addEventListener('click', (e) => { if (e.target.id === 'modal-mask') closeModal(); });
    $('#scan-sn-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const btn = document.querySelector('[data-action="scan-add-sn"]');
        if (btn) handleAction('scan-add-sn', btn);
      }
    });

    // live update audit po segments match
    if (ui.modal?.type === 'audit-po') {
      document.querySelectorAll('.audit-line input, .audit-line select').forEach((inp) => {
        inp.addEventListener('change', () => { syncDraftFromAuditDom(); render(); });
      });
    }
  }

  /* ---------- Boot ---------- */
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace(/^#/, '');
    if (id && PAGES[id] && ui.loggedIn) {
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
