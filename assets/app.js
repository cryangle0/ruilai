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
  function productCompAName(p) { return (p && p.compAName) || productComponents(p)[0]?.name || '腰带'; }
  function productCompBName(p) { return (p && p.compBName) || productComponents(p)[1]?.name || '弹力带'; }
  function productBelts(p) {
    const comps = p && p.type === 'kit' ? productComponents(p) : null;
    if (comps && comps[0]) return [...(comps[0].sizes || [])];
    return (p && p.belts && p.belts.length) ? p.belts : [...BELTS];
  }
  function productSizes(p) {
    if (p && p.type === 'kit') {
      const comps = productComponents(p);
      if (comps[1]) return [...(comps[1].sizes || [])];
    }
    return (p && p.sizes && p.sizes.length) ? p.sizes : [...BAND_SIZES];
  }
  function uniqueSizes(list) {
    const out = [];
    (list || []).forEach((s) => {
      const v = String(s || '').trim();
      if (v && !out.includes(v)) out.push(v);
    });
    return out;
  }
  function normalizeComponent(c, i) {
    const id = (c && c.id) || `c${i}`;
    const name = ((c && c.name) || `组件${i + 1}`).trim() || `组件${i + 1}`;
    let pool = uniqueSizes((c && (c.pool || c.sizePool)) || (c && c.sizes) || []);
    let sizes = uniqueSizes((c && c.sizes) || []);
    if (!pool.length && sizes.length) pool = [...sizes];
    if (!pool.length) pool = i === 0 ? [...BELTS] : (i === 1 ? [...BAND_SIZES] : ['S', 'M', 'L']);
    sizes = sizes.filter((s) => pool.includes(s));
    if (!sizes.length) sizes = [...pool];
    return { id, name, pool, sizes };
  }
  function syncLegacyFromComponents(p) {
    if (!p || !Array.isArray(p.components)) return p;
    const comps = p.components;
    p.compAName = comps[0]?.name || '腰带';
    p.compBName = comps[1]?.name || (comps.length > 1 ? '弹力带' : '');
    p.belts = [...(comps[0]?.sizes || [])];
    p.sizes = [...(comps[1]?.sizes || (comps[0]?.sizes || []))];
    p.beltPool = [...(comps[0]?.pool || [])];
    p.sizePool = [...(comps[1]?.pool || [])];
    return p;
  }
  function productComponents(p) {
    if (!p) return [];
    if (p.type === 'single') {
      const pool = uniqueSizes(p.sizePool || p.sizes || ['S', 'M', 'L']);
      let sizes = uniqueSizes(p.sizes || []);
      sizes = sizes.filter((s) => pool.includes(s));
      if (!sizes.length) sizes = [...pool];
      return [{ id: 'c0', name: '规格', pool, sizes }];
    }
    if (p.type !== 'kit') return [];
    if (Array.isArray(p.components) && p.components.length) {
      p.components = p.components.map((c, i) => normalizeComponent(c, i));
      syncLegacyFromComponents(p);
      return p.components;
    }
    const aPool = uniqueSizes(p.beltPool || p.belts || BELTS);
    let aSizes = uniqueSizes(p.belts || aPool).filter((s) => aPool.includes(s));
    if (!aSizes.length) aSizes = [...aPool];
    const bPool = uniqueSizes(p.sizePool || p.sizes || BAND_SIZES);
    let bSizes = uniqueSizes(p.sizes || bPool).filter((s) => bPool.includes(s));
    if (!bSizes.length) bSizes = [...bPool];
    p.components = [
      { id: 'c0', name: p.compAName || '腰带', pool: aPool.length ? aPool : [...BELTS], sizes: aSizes },
      { id: 'c1', name: p.compBName || '弹力带', pool: bPool.length ? bPool : [...BAND_SIZES], sizes: bSizes },
    ];
    syncLegacyFromComponents(p);
    return p.components;
  }
  function comboKey(belt, size, extras) {
    const base = `${normalizeBelt(belt)}__${size}`;
    if (!extras || !Object.keys(extras).length) return base;
    const extra = Object.keys(extras).sort().map((k) => `${k}:${extras[k]}`).join('|');
    return `${base}__${extra}`;
  }
  function comboPicksKey(comps, picks) {
    return (comps || []).map((c) => `${c.id}:${(picks && picks[c.id]) || ''}`).join('|');
  }
  function comboLabel(p, grade, belt, size, picks) {
    const comps = productComponents(p);
    const g = grade ? `${grade}（` : '';
    const ge = grade ? '）' : '';
    if (picks && comps.length) {
      const parts = comps.map((c) => `${c.name}${picks[c.id] || ''}`).join('+');
      return `${g}${parts}${ge}`;
    }
    const a = productCompAName(p);
    const b = productCompBName(p);
    return `${g}${a}${normalizeBelt(belt)}+${b}${size}${ge}`;
  }
  function stdComboPicks(k, comps) {
    const list = comps || [];
    if (k && k.picks && typeof k.picks === 'object') {
      const picks = { ...k.picks };
      list.forEach((c, i) => {
        if (picks[c.id] == null) {
          if (i === 0) picks[c.id] = normalizeBelt(k.belt);
          else if (i === 1) picks[c.id] = k.size;
        }
      });
      return picks;
    }
    const picks = {};
    list.forEach((c, i) => {
      if (i === 0) picks[c.id] = normalizeBelt(k?.belt);
      else if (i === 1) picks[c.id] = k?.size || '';
      else picks[c.id] = '';
    });
    return picks;
  }
  function normalizeStdCombo(p, k) {
    const comps = productComponents(p);
    const picks = stdComboPicks(k, comps);
    const belt = normalizeBelt(picks[comps[0]?.id] || k?.belt);
    const size = picks[comps[1]?.id] || k?.size || '';
    const extras = {};
    comps.slice(2).forEach((c) => { if (picks[c.id]) extras[c.id] = picks[c.id]; });
    return {
      key: comboPicksKey(comps, picks) || comboKey(belt, size, extras),
      grade: (k && k.grade) || '',
      belt,
      size,
      picks,
      label: comboLabel(p, k?.grade, belt, size, picks),
    };
  }
  function defaultStdCombosFromSizes(p) {
    if (!p) return [];
    const comps = productComponents(p);
    if (comps.length !== 2) return [];
    const sizes = new Set(comps[1].sizes || []);
    const belts = new Set((comps[0].sizes || []).map(normalizeBelt));
    return STANDARD_KITS
      .filter((k) => sizes.has(k.size) && belts.has(normalizeBelt(k.belt)))
      .map((k) => normalizeStdCombo(p, {
        ...k,
        picks: { [comps[0].id]: normalizeBelt(k.belt), [comps[1].id]: k.size },
      }));
  }
  /** 标准套件组合随上方尺码动态裁剪/刷新说明，避免残留写死旧组合 */
  function pruneStdCombos(d) {
    if (!d || d.type !== 'kit') return [];
    const comps = productComponents(d);
    d.stdCombos = (d.stdCombos || [])
      .map((k) => normalizeStdCombo(d, k))
      .filter((k) => comps.every((c) => (c.sizes || []).includes(k.picks[c.id])));
    syncLegacyFromComponents(d);
    return d.stdCombos;
  }
  function ensureProductStdCombos(p) {
    if (!p || p.type !== 'kit') return [];
    productComponents(p);
    if (Array.isArray(p.stdCombos) && p.stdCombos.length) {
      return pruneStdCombos(p);
    }
    return defaultStdCombosFromSizes(p);
  }
  function kitStdCombos(p) {
    return ensureProductStdCombos(p);
  }
  function isSellableProduct(p) {
    return !!p && (p.type === 'kit' || p.type === 'single');
  }
  function productTypeLabel(p) {
    if (!p) return '—';
    if (p.type === 'kit') return '套件';
    if (p.type === 'single') return '单品';
    if (p.type === 'part') return '配件';
    return p.type || '—';
  }
  function productTypeTone(p) {
    if (p?.type === 'kit') return 'blue';
    if (p?.type === 'single') return 'green';
    return 'gray';
  }
  function nonstdGradesForProduct(p) {
    if (!p || p.type !== 'kit') return [];
    const sizes = productSizes(p);
    const belts = productBelts(p).map(normalizeBelt);
    const std = new Set(kitStdCombos(p).map((k) => comboKey(k.belt, k.size)));
    // 旧医疗腰带商品：优先用全局非标档位规则
    const classic = belts.every((b) => BELTS.includes(b)) && sizes.every((s) => BAND_SIZES.includes(s));
    if (classic && !(p && p.stdCombos && p.stdCombos.length && p.compAName && p.compAName !== '腰带')) {
      return NONSTD_GRADES
        .filter((g) => belts.includes(g.belt))
        .map((g) => ({ ...g, bands: g.bands.filter((b) => sizes.includes(b) && !std.has(comboKey(g.belt, b))) }))
        .filter((g) => g.bands.length > 0);
    }
    // 自定义组件：每个 A 尺码下，排除标品后的 B 尺码均为非标
    return belts.map((belt) => {
      const bands = sizes.filter((s) => !std.has(comboKey(belt, s)));
      return { id: String(belt), belt, bands };
    }).filter((g) => g.bands.length > 0);
  }
  function nonstdBandsForProductGrade(p, gradeId) {
    const g = nonstdGradesForProduct(p).find((x) => x.id === gradeId || x.belt === normalizeBelt(gradeId));
    return g ? g.bands : [];
  }
  function componentSizeLabel(compName, size) {
    const n = String(compName || '');
    const s = String(size || '');
    if (!s) return n;
    if (n && s.startsWith(n)) return s;
    return `${n}${s}`;
  }
  function nonstdGradeOptionLabel(p, g) {
    const short = componentSizeLabel(productCompAName(p), g.belt);
    if (g.id && g.id !== g.belt) return `${g.id}（${short}）`;
    return short;
  }
  function customComboLabel(belt, size, p) {
    const nb = normalizeBelt(belt);
    const g = nonstdGradesForProduct(p || {}).find((x) => x.belt === nb);
    const a = productCompAName(p);
    const b = productCompBName(p);
    const aPart = componentSizeLabel(a, nb);
    return `${g && g.id !== g.belt ? g.id + '（' + aPart + '）' : aPart} + ${componentSizeLabel(b, size)}`;
  }
  function productComboNote(p) {
    if (!p) return STANDARD_COMBO_NOTE;
    if (p.type === 'single') {
      return `单品按尺码下单（有 SN）。当前可选尺码：${productSizes(p).join('/') || '—'}`;
    }
    const comps = productComponents(p);
    const std = kitStdCombos(p);
    const stdHint = std.length
      ? `标品 ${std.length} 档：${std.map((k) => k.label).join('；')}。`
      : '尚未配置标品组合，下单时仅可下非标。';
    const optHint = comps.length
      ? comps.map((c) => `${c.name} ${(c.sizes || []).join('/')}`).join(' · ')
      : `${productCompAName(p)} ${productBelts(p).join('/')} · ${productCompBName(p)} ${productSizes(p).join('/')}`;
    return `${stdHint}其他组合请下非标。当前可选：${optHint}`;
  }
  function syncProductDraftFromDom() {
    if (!ui.modal || (ui.modal.type !== 'create-product' && ui.modal.type !== 'edit-product')) return;
    const d = ui.modal.draft || (ui.modal.draft = {});
    d.code = $('#f-pcode')?.value?.trim() ?? d.code;
    d.name = $('#f-pname')?.value?.trim() ?? d.name;
    d.status = $('#f-pstatus')?.value || d.status || '上架';
    d.note = $('#f-pnote')?.value ?? d.note;
    if (d.type === 'kit') {
      const comps = productComponents(d);
      comps.forEach((c, i) => {
        const name = document.querySelector(`[data-comp-name="${i}"]`)?.value;
        if (name != null) c.name = name.trim() || c.name;
      });
      d.components = comps;
      (d.stdCombos || []).forEach((k, i) => {
        const grade = document.querySelector(`[data-std-grade="${i}"]`)?.value;
        if (grade != null) k.grade = grade.trim();
        const picks = stdComboPicks(k, comps);
        comps.forEach((c) => {
          const sel = document.querySelector(`[data-std-pick="${i}"][data-comp-id="${c.id}"]`);
          if (sel) picks[c.id] = sel.value;
        });
        Object.assign(k, normalizeStdCombo(d, { ...k, picks, grade: k.grade }));
      });
      pruneStdCombos(d);
    } else if (d.type === 'single') {
      // sizes/pool 由 chips 维护
    } else if (d.type === 'part') {
      d.sizes = ($('#f-psizes')?.value || '').split(/[,，]/).map((x) => x.trim()).filter(Boolean);
    }
  }
  function normalizeBelt(b) {
    if (b == null || b === '') return '';
    const s = String(b).trim();
    if (!s) return '';
    if (BELTS.includes(s)) return s;
    if (/^腰带/.test(s)) return s;
    // 仅对「腰带S/M/L」短写做兼容，不强制改写自定义尺码（如袜子 S）
    if (s === '腰带S' || s === '腰带M' || s === '腰带L') return s;
    return s;
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
  const RETURN_TYPES = [
    { id: 'l1_to_factory', label: '一级退原厂' },
    { id: 'l2_to_l1', label: '二级退一级' },
    { id: 'user', label: '用户退货再入库' },
    { id: 'self', label: '自行售后处理' },
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
    const classicStd = STANDARD_KITS.map((k) => ({ ...k }));
    const products = [
      {
        id: 'P1', code: 'P-1001', name: '锐涞经典款套件', type: 'kit',
        components: [
          { id: 'c0', name: '腰带', pool: [...BELTS], sizes: [...BELTS] },
          { id: 'c1', name: '弹力带', pool: kitSizes, sizes: [...kitSizes] },
        ],
        compAName: '腰带', compBName: '弹力带', sizes: kitSizes, belts: [...BELTS],
        stdCombos: classicStd, defaultBelt: { ...DEFAULT_BELT }, status: '上架', note: '弹力带+腰带必配 · 标品五档',
      },
      {
        id: 'P2', code: 'P-1002', name: '锐涞运动款套件', type: 'kit',
        components: [
          { id: 'c0', name: '腰带', pool: [...BELTS], sizes: [...BELTS] },
          { id: 'c1', name: '弹力带', pool: kitSizes, sizes: [...kitSizes] },
        ],
        compAName: '腰带', compBName: '弹力带', sizes: kitSizes, belts: [...BELTS],
        stdCombos: classicStd.map((k) => ({ ...k })), defaultBelt: { ...DEFAULT_BELT }, status: '上架', note: '弹力带+腰带必配 · 标品五档',
      },
      {
        id: 'P-SOCK', code: 'P-SOCK-01', name: '袜子+鞋套套件', type: 'kit',
        components: [
          { id: 'c0', name: '袜子', pool: ['S', 'M', 'L'], sizes: ['S', 'M', 'L'] },
          { id: 'c1', name: '鞋套', pool: ['S', 'M', 'L'], sizes: ['S', 'M', 'L'] },
        ],
        compAName: '袜子', compBName: '鞋套', sizes: ['S', 'M', 'L'], belts: ['S', 'M', 'L'],
        stdCombos: [
          { key: comboKey('S', 'S'), grade: '小', belt: 'S', size: 'S', picks: { c0: 'S', c1: 'S' }, label: '小（袜子S+鞋套S）' },
          { key: comboKey('M', 'M'), grade: '中', belt: 'M', size: 'M', picks: { c0: 'M', c1: 'M' }, label: '中（袜子M+鞋套M）' },
          { key: comboKey('L', 'L'), grade: '大', belt: 'L', size: 'L', picks: { c0: 'L', c1: 'L' }, label: '大（袜子L+鞋套L）' },
        ],
        status: '上架', note: '自定义双组件标品示例',
      },
      {
        id: 'P-SINGLE', code: 'P-SINGLE-01', name: '锐涞护膝单品', type: 'single',
        sizePool: ['S', 'M', 'L'], sizes: ['S', 'M', 'L'], status: '上架', note: '单品·有SN·按尺码下单',
      },
      { id: 'PART-BELT', code: 'PART-BELT', name: '腰带规格', type: 'part', sizes: [...BELTS], status: '上架', note: '配件·不生成SN' },
      { id: 'PART-SIL', code: 'PART-SIL', name: '主体硅胶带', type: 'part', sizes: [...BAND_SIZES], status: '上架', note: '配件·不生成SN' },
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
    const customers = buildCustomersFromSns(sns);

    return {
      exceptionMultiplier: 1.5,
      exceptionRules: {
        overOrderRatio: 1.0,   // 仅二级：在库充足仍超量申请分销单 → 销售库存异常
        stockTurnover: 1.5,    // 仅二级：周转/压货预警系数（一级分销给二级不触发）
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
        { id: 'RT7', no: `RT${todayCompact()}07`, type: 'l1_to_factory', typeLabel: '一级退原厂', fromId: 'L1A', fromName: '华东锐涞总代',
          sns: ['RL202608010042', 'RL202608010043'], status: 'pending', createdAt: '2026-08-08 10:20', reason: '包装破损，申请退原厂', reasonType: '批次' },
        { id: 'RT8', no: `RT${todayCompact()}08`, type: 'l1_to_factory', typeLabel: '一级退原厂', fromId: 'L1A', fromName: '华东锐涞总代',
          sns: ['RL202608010055'], status: 'pending', createdAt: '2026-08-09 14:05', reason: '客诉升级，一级集中退原厂', reasonType: '投诉' },
        { id: 'RT9', no: `RT${todayCompact()}09`, type: 'l1_to_factory', typeLabel: '一级退原厂', fromId: 'L1B', fromName: '华南渠道中心',
          sns: ['RL202608020020', 'RL202608020021'], status: 'pending', createdAt: '2026-08-10 09:40', reason: '质量问题：弹力带老化', reasonType: '质量' },
      ],
      exceptions: [
        { id: 'EX1', time: '2026-07-25 12:05', type: '归属地异常', target: 'RL202607200004', detail: '手机归属广东 · IP地区浙江不一致', notify: '一级+原厂', status: '未处理', dim: 'activate' },
        { id: 'EX2', time: '2026-07-28 11:02', type: 'SN激活异常', target: 'RL202607210001', detail: '跨区激活：IP 浙江 不在直销围栏', notify: '一级+原厂', status: '未处理', dim: 'activate' },
        { id: 'EX3', time: '2026-08-02 16:10', type: '销售库存异常', target: '广州天河渠道 · 锐涞运动款LL', detail: '本次新增 5 > 预警线（区间销量 × 倍数）', notify: '一级+原厂', status: '未处理', dim: 'stock' },
        { id: 'EX4', time: '2026-07-22 10:40', type: '销售库存异常', target: '宁波海曙店 · 锐涞经典款L', detail: '本次新增 4 > 预警线', notify: '一级+原厂', status: '已处理', dim: 'stock' },
        { id: 'EX5', time: '2026-08-05 09:20', type: '超量下单预警', target: '杭州城西专营', detail: '2级库存充足仍大量申请下单，需一级填写说明', notify: '一级+原厂', status: '未处理', dim: 'stock', explain: '' },
        { id: 'EX6', time: '2026-08-06 14:00', type: '扫码尺码不匹配', target: 'RL202608010001', detail: '出货计划 M，实扫 SN 为 L', notify: '原厂', status: '未处理', dim: 'scan' },
        { id: 'EX7', time: '2026-08-07 10:10', type: '客户信息重复', target: 'RL202607200003', detail: '手机号 138****1003 已激活 1 次 · 可查看历史绑定', notify: '一级+原厂', status: '未处理', dim: 'activate', dupPhone: '138****1003' },
      ],
      notifications: [
        { id: 'N1', time: nowStr(), title: '预警：归属地异常', body: 'RL202607200004 · 手机归属不匹配', to: '一级+原厂', read: false },
        { id: 'N2', time: '2026-08-04 09:01', title: '退货待审', body: '杭州城西专营提交二级退一级', to: '一级', read: false },
        { id: 'N3', time: '2026-08-06 11:01', title: '二级待分配', body: '金华法人渠道待重新绑定一级', to: '原厂', read: false },
        { id: 'N4', time: '2026-08-09 14:06', title: '一级退原厂待审', body: '华东锐涞总代提交一级退原厂 3 单待平台审核', to: '原厂', read: false },
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
      customers,
      seq: { po: 32, so: 101, rt: 10, snBatch: 1, notify: 5, cu: customers.length },
    };
  }

  const persistKey = 'ruilai_proto_v13';
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
          migrateProductShape(p);
        });
        if (!(parsed.products || []).some((p) => p.id === 'P-SOCK')) {
          parsed.products = parsed.products || [];
          parsed.products.push({
            id: 'P-SOCK', code: 'P-SOCK-01', name: '袜子+鞋套套件', type: 'kit',
            compAName: '袜子', compBName: '鞋套', sizes: ['S', 'M', 'L'], belts: ['S', 'M', 'L'],
            stdCombos: [
              { key: comboKey('S', 'S'), grade: '小', belt: 'S', size: 'S', label: '小（袜子S+鞋套S）' },
              { key: comboKey('M', 'M'), grade: '中', belt: 'M', size: 'M', label: '中（袜子M+鞋套M）' },
              { key: comboKey('L', 'L'), grade: '大', belt: 'L', size: 'L', label: '大（袜子L+鞋套L）' },
            ],
            status: '上架', note: '自定义双组件标品示例',
          });
        }
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
          if (a.exNoAlarm === undefined) a.exNoAlarm = false;
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
          // 超量下单 / 库存压货 → 销售库存异常（兼容旧数据误标为扫码）
          if (/超量|库存|压货|周转|下单预警/.test(e.type || '')) e.dim = 'stock';
          else if (!e.dim) {
            e.dim = /激活|归属地|客户信息|跨区/.test(e.type) ? 'activate'
              : (/扫码|尺码不匹配/.test(e.type) ? 'scan' : 'activate');
          }
          if (e.status === '已关闭') e.status = '已处理';
        });
        if (!parsed.logs) parsed.logs = seed().logs;
        normalizeDemoLogTimes(parsed.logs);
        ensureCustomersStore(parsed);
        return parsed;
      }
    } catch (_) {}
    const fresh = seed();
    ensureCustomersStore(fresh);
    return fresh;
  }
  function saveStore() { localStorage.setItem(persistKey, JSON.stringify(db)); }

  let db = loadStore();
  normalizeDemoLogTimes(db.logs);
  ensureCustomersStore(db);
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
    userMenuOpen: false,
    sort: {},
    selected: {}, // e.g. { 'agent-l2': { L2A: true } }
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
    'mini-mine-l2': '二级代理', 'mini-mine-sub': '子账号', 'mini-mine-customers': '客户',
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
    // 可下单主商品：套件 + 单品（配件无 SN，走 parts）
    return db.products.filter((p) => isSellableProduct(p) && p.status === '上架');
  }
  function partProducts() {
    return db.products.filter((p) => p.type === 'part' && p.status === '上架');
  }
  function lineName(id) { return (db.productLines || []).find((l) => l.id === id)?.name || id; }
  function migrateProductShape(p) {
    if (!p) return p;
    if (p.type === 'kit') {
      productComponents(p);
      if (!Array.isArray(p.stdCombos) || !p.stdCombos.length) p.stdCombos = ensureProductStdCombos(p);
      else pruneStdCombos(p);
    } else if (p.type === 'single') {
      const pool = uniqueSizes(p.sizePool || p.sizes || ['S', 'M', 'L']);
      let sizes = uniqueSizes(p.sizes || []).filter((s) => pool.includes(s));
      if (!sizes.length) sizes = [...pool];
      p.sizePool = pool;
      p.sizes = sizes;
      p.belts = [];
      p.stdCombos = [];
      p.components = undefined;
      delete p.compAName;
      delete p.compBName;
      delete p.defaultBelt;
    }
    return p;
  }

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

  function returnProductRows(snList) {
    const map = new Map();
    (snList || []).forEach((sn) => {
      const row = db.sns.find((x) => x.sn === sn);
      if (!row) {
        const k = `__miss__${sn}`;
        if (!map.has(k)) map.set(k, { productId: '', size: '—', belt: '', qty: 0, sns: [], missing: sn });
        const g = map.get(k);
        g.qty += 1;
        g.sns.push(sn);
        return;
      }
      const k = `${row.productId}_${row.size}_${row.belt || ''}`;
      if (!map.has(k)) {
        map.set(k, { productId: row.productId, size: row.size, belt: row.belt || '', qty: 0, sns: [] });
      }
      const g = map.get(k);
      g.qty += 1;
      g.sns.push(sn);
    });
    return [...map.values()];
  }

  function canAuditReturn(r) {
    if (!r || r.status !== 'pending') return false;
    // 二级 / 子账号：不可审核（二级退一级由一级审）
    if (ui.role === 'l2' || ui.role === 'sub') return false;
    // 向上申请（一级退原厂）：仅原厂 PC 后台审核
    if (r.type === 'l1_to_factory') {
      return ui.mode === 'admin' && ui.role === 'admin';
    }
    // 二级退一级：一级代理审核
    if (r.type === 'l2_to_l1') {
      if (ui.role === 'l1') return !r.approverId || r.approverId === currentL1Id();
      return ui.mode === 'admin' && ui.role === 'admin';
    }
    // 其他类型：一级小程序或后台可审
    if (ui.role === 'l1' || (ui.mode === 'admin' && ui.role === 'admin')) return true;
    return false;
  }

  function returnDetailHtml(r) {
    const products = returnProductRows(r.sns);
    const snRows = (r.sns || []).map((sn) => {
      const row = db.sns.find((x) => x.sn === sn);
      const st = snStatusMeta(row);
      return {
        sn,
        product: row ? productName(row.productId) : '—',
        spec: row ? stockSpecText(row.size, row.belt) : '—',
        statusLabel: row ? st.label : '未找到',
        statusTone: row ? st.tone : 'gray',
      };
    });
    return `<div class="detail-grid">
        <div><span>类型</span>${escapeHtml(r.typeLabel || r.type)}</div>
        <div><span>理由</span>${tag(r.reasonType || '')} ${escapeHtml(r.reason || '')}</div>
        <div><span>来源</span>${escapeHtml(r.fromName || '—')}</div>
        <div><span>状态</span>${returnStatusTag(r.status)}</div>
        <div><span>时间</span>${escapeHtml(r.createdAt || '—')}</div>
      </div>
      <h4 style="margin-top:12px">商品明细（${products.length}）</h4>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>商品名称</th><th>规格</th><th>数量</th></tr></thead>
        <tbody>${products.map((p) => `<tr>
          <td>${escapeHtml(p.missing ? `未知SN ${p.missing}` : productName(p.productId))}</td>
          <td>${escapeHtml(p.missing ? '—' : stockSpecText(p.size, p.belt))}</td>
          <td class="num">${p.qty}</td>
        </tr>`).join('') || `<tr><td colspan="3">${emptyHint('无商品明细')}</td></tr>`}</tbody>
      </table></div>
      <h4 style="margin-top:12px">SN码（${snRows.length}）</h4>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>SN</th><th>商品名称</th><th>规格</th><th>状态</th></tr></thead>
        <tbody>${snRows.map((row) => `<tr>
          <td><code>${escapeHtml(row.sn)}</code></td>
          <td>${escapeHtml(row.product)}</td>
          <td>${escapeHtml(row.spec)}</td>
          <td>${tag(row.statusLabel, row.statusTone)}</td>
        </tr>`).join('') || `<tr><td colspan="4">${emptyHint('暂无 SN')}</td></tr>`}</tbody>
      </table></div>`;
  }

  function exceptionDim(e) {
    // 三类：扫码异常 / 激活异常 / 销售库存异常（仅二级库存风险；一级分销给二级不属此类）
    // 超量下单预警一律归销售库存（兼容旧 dim=scan）
    if (/超量|库存|压货|周转|下单预警/.test(e.type || '')) return 'stock';
    if (e.dim === 'scan' || e.dim === 'activate' || e.dim === 'stock') return e.dim;
    if (e.dim === 'nonSn') return 'scan';
    if (e.dim === 'sn') return 'activate';
    if (/激活|归属地|客户信息|跨区/.test(e.type || '')) return 'activate';
    if (/扫码|尺码不匹配/.test(e.type || '')) return 'scan';
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
    const snRows = (order.sns || []).map((sn) => db.sns.find((x) => x.sn === sn)).filter(Boolean);
    if (!snRows.length && order.snRow) snRows.push(order.snRow);
    const u = snRows[0]?.user || snRows[0]?.prevUser || {};
    const productMap = {};
    snRows.forEach((row) => {
      const key = `${row.productId}_${row.size}_${row.belt || ''}`;
      if (!productMap[key]) {
        productMap[key] = { productId: row.productId, size: row.size, belt: row.belt || '—', qty: 0 };
      }
      productMap[key].qty += 1;
    });
    const productRows = Object.values(productMap);
    return `<div class="detail-grid">
        <div><span>订单号</span>${escapeHtml(order.no)}</div>
        <div><span>状态</span>${tag(snRows[0]?.status === 'bound' ? '已到货' : '已归档', 'green')}</div>
        <div><span>客户手机</span>${escapeHtml(u.phone || '—')}</div>
        <div><span>归属地</span>${escapeHtml(u.phoneLoc || '—')}</div>
        <div class="span-2"><span>地址</span>${escapeHtml(u.addr || '—')}</div>
        <div><span>时间</span>${escapeHtml(order.createdAt || '—')}</div>
        <div><span>代理</span>${escapeHtml(snRows[0]?.l2Id ? l2Name(snRows[0].l2Id) : l1Name(snRows[0]?.l1Id))}</div>
      </div>
      <h4 style="margin-top:12px">商品明细</h4>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>商品</th><th>弹力带</th><th>腰带</th><th>数量</th></tr></thead>
        <tbody>${productRows.map((r)=>`<tr>
          <td>${escapeHtml(productName(r.productId))}</td>
          <td>${escapeHtml(r.size)}</td>
          <td>${escapeHtml(r.belt)}</td>
          <td class="num">${r.qty}</td>
        </tr>`).join('') || `<tr><td colspan="4">${emptyHint('无商品明细')}</td></tr>`}</tbody>
      </table></div>
      <h4 style="margin-top:12px">SN码（${snRows.length}）</h4>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>SN</th><th>尺码</th><th>腰带</th><th>客户</th></tr></thead>
        <tbody>${snRows.map((row)=>{
          const cu = row.user || row.prevUser;
          return `<tr>
            <td><code>${escapeHtml(row.sn)}</code></td>
            <td>${escapeHtml(row.size || '—')}</td>
            <td>${escapeHtml(row.belt || '—')}</td>
            <td>${escapeHtml(cu ? `${cu.phone || ''} ${cu.addr || ''}`.trim() : '—')}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="4">${emptyHint('暂无 SN')}</td></tr>`}</tbody>
      </table></div>`;
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

  function stockSpecText(size, belt) {
    const b = belt ? String(belt).replace(/^腰带/, '') : '';
    return b ? `${size}+腰带${b}` : String(size || '—');
  }

  function parseReturnSns(text) {
    return String(text || '').split(/[,，\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
  }

  /** 退货单：SN 上方商品名称 / 规格详情（始终表格） */
  function returnSnDetailHtml(snsText) {
    const sns = parseReturnSns(snsText);
    const rows = sns.length
      ? sns.map((sn) => {
        const s = db.sns.find((x) => x.sn === sn);
        if (!s) {
          return `<tr>
            <td class="num">${escapeHtml(sn)}</td>
            <td colspan="3"><span class="muted">未找到该 SN</span></td>
          </tr>`;
        }
        const st = snStatusMeta(s);
        return `<tr>
          <td class="num">${escapeHtml(sn)}</td>
          <td>${escapeHtml(productName(s.productId))}</td>
          <td>${escapeHtml(stockSpecText(s.size, s.belt))}</td>
          <td>${tag(st.label, st.tone)}</td>
        </tr>`;
      }).join('')
      : `<tr><td colspan="4" class="muted" style="text-align:center">填写下方 SN 后自动带出商品名称、规格等详情</td></tr>`;
    return `<div class="page-card table-wrap" id="return-sn-detail" style="margin-bottom:10px">
      <div class="table-caption">商品详情${sns.length ? `（${sns.length}）` : ''}</div>
      <table class="data">
        <thead><tr><th>SN</th><th>商品名称</th><th>规格</th><th>状态</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  /** 库存汇总行：商品 + 一/二级代理 + 规格 + 数量 */
  function getStockSummaryRows(f = {}) {
    const map = new Map();
    db.sns.forEach((s) => {
      if (s.frozen || s.status === 'frozen' || s.status === 'warehouse' || s.status === 'bound' || s.status === 'factory') return;
      let agentType = '';
      let agentId = '';
      let l1Id = s.l1Id || null;
      let l2Id = null;
      if (s.status === 'l1') {
        agentType = 'l1';
        agentId = s.l1Id;
        l2Id = null;
      } else if (s.status === 'l2' || s.reIn) {
        agentType = 'l2';
        agentId = s.l2Id;
        l2Id = s.l2Id;
      } else return;
      if (!agentId) return;
      if (f.type && f.type !== agentType) return;
      if (f.agent) {
        if (f.type === 'l1' && l1Id !== f.agent) return;
        if (f.type === 'l2' && l2Id !== f.agent) return;
        if (!f.type && l1Id !== f.agent && l2Id !== f.agent) return;
      }
      if (f.productId && s.productId !== f.productId) return;
      if (f.size && s.size !== f.size) return;
      if (f.belt && s.belt !== f.belt) return;
      if (f.l1 && l1Id !== f.l1) return;
      if (f.l2 && l2Id !== f.l2) return;
      const key = `${agentType}_${agentId}_${s.productId}_${s.size}_${s.belt || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          agentType,
          agentId,
          l1Id,
          l2Id,
          productId: s.productId,
          size: s.size,
          belt: s.belt || '',
          qty: 0,
          sns: [],
        });
      }
      const row = map.get(key);
      row.qty += 1;
      row.sns.push(s.sn);
    });
    return [...map.values()];
  }

  function stockRowLogs(row) {
    return (db.stockLogs || []).filter((h) => {
      if (h.productId !== row.productId) return false;
      if (h.size && row.size && h.size !== row.size) return false;
      if (row.agentType === 'l1') return h.agentType === 'l1' && h.agentId === row.l1Id;
      return (h.agentType === 'l2' && h.agentId === row.l2Id)
        || (h.agentType === 'l1' && h.agentId === row.l1Id && /销售转入|退货|出库/.test(h.reason || ''));
    }).slice(0, 40);
  }

  function pushNotify(title, body, to = '一级+原厂') {
    db.notifications = db.notifications || [];
    db.notifications.unshift({ id: uid('N'), time: nowStr(), title, body, to, read: false });
  }

  function resolveWarnConfig(l1Id, l2Id) {
    const l1 = db.agentsL1.find((a) => a.id === l1Id);
    const l2 = l2Id ? db.agentsL2.find((a) => a.id === l2Id) : null;
    const mult = Number(l2?.warnMultiplier || l1?.warnMultiplier || db.exceptionMultiplier || 1.5);
    const rules = db.exceptionRules || { overOrderRatio: 1.0, stockTurnover: mult };
    if (l2?.exNoAlarm) return { mult, mode: 'off', rules, l1, l2 };
    const mode = l2?.warnMode || l1?.warnMode || 'strict';
    return { mult, mode, rules, l1, l2 };
  }

  function resolveL2IdForException(target, opts = {}) {
    if (opts.l2Id) return opts.l2Id;
    const byName = db.agentsL2.find((a) => a.name === target || String(target || '').includes(a.name));
    if (byName) return byName.id;
    const sn = db.sns.find((s) => s.sn === target);
    return sn?.l2Id || null;
  }

  function agentExNoAlarm(l2Id) {
    if (!l2Id) return false;
    return !!db.agentsL2.find((a) => a.id === l2Id)?.exNoAlarm;
  }

  function pushException(type, target, detail, dim, opts = {}) {
    const d = dim || exceptionDim({ type });
    let mode = opts.mode || 'strict';
    const l2Id = resolveL2IdForException(target, opts);
    if (mode !== 'off' && agentExNoAlarm(l2Id)) mode = 'off';
    // off=异常不报警：只落库，默认已处理，不推送未处理预警
    const status = mode === 'off' ? '已处理' : (mode === 'soft' ? '仅记录' : '未处理');
    const row = {
      id: uid('EX'), time: nowStr(), type, target, detail,
      notify: (mode === 'off' || mode === 'soft') ? '仅记录' : '一级+原厂',
      status, dim: d, warnMode: mode, explain: '', l2Id: l2Id || undefined,
    };
    if (opts.dupPhone) row.dupPhone = opts.dupPhone;
    db.exceptions.unshift(row);
    if (mode === 'strict') pushNotify(`预警：${type}`, `${target} · ${detail}`, '一级+原厂');
    const logLabel = mode === 'off' ? '异常不报警记录' : (mode === 'soft' ? '软报警记录' : '触发异常');
    addLog(`${logLabel} ${type} · ${target}`, mode === 'strict' ? 'exception' : 'warn');
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

  /** SN 销售渠道：优先取关联销售单，否则按二级归属推断；未进入分销/直售则为空 */
  function snChannelOf(row) {
    if (!row) return '';
    if (row.channel === 'direct' || row.channel === 'distribute') return row.channel;
    const so = (db.sales || []).find((s) => (s.scanned || []).includes(row.sn));
    if (so) return so.channel || (so.l2Id ? 'distribute' : 'direct');
    if (row.status === 'bound' && !row.l2Id) return 'direct';
    if (row.l2Id || row.status === 'l2') return 'distribute';
    return '';
  }
  function snChannelMeta(row) {
    const c = snChannelOf(row);
    if (c === 'direct') return { id: 'direct', label: '直售', tone: 'orange' };
    if (c === 'distribute') return { id: 'distribute', label: '分销', tone: 'blue' };
    return { id: '', label: '—', tone: 'gray' };
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
        <div class="confirm-bd"><p style="white-space:pre-wrap;margin:0;line-height:1.55">${escapeHtml(c.message)}</p></div>
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
    if (ui.role === 'l1') {
      return [...base, 'mini-purchase', 'mini-sales', 'mini-aftersale', 'mini-exception', 'mini-mine-l2', 'mini-mine-sub', 'mini-mine-customers'];
    }
    if (ui.role === 'l2') return [...base, 'mini-aftersale', 'mini-exception', 'mini-mine-customers'];
    return base;
  }

  function miniTabIsActive(tabId) {
    const r = ui.route;
    if (tabId === 'mini-biz') return ['mini-biz', 'mini-purchase', 'mini-sales'].includes(r);
    if (tabId === 'mini-service') return ['mini-service', 'mini-aftersale', 'mini-exception'].includes(r);
    if (tabId === 'mini-mine') return ['mini-mine', 'mini-mine-l2', 'mini-mine-sub', 'mini-mine-customers'].includes(r);
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
    if (f.name) {
      const q = f.name.toLowerCase();
      rows = rows.filter((a) => [a.name, a.code, a.contact].join(' ').toLowerCase().includes(q));
    }
    if (f.region) {
      const q = f.region.toLowerCase();
      rows = rows.filter((a) => [...(a.mainAreas || []), ...(a.saleAreas || a.areas || []), ...(a.directAreas || [])]
        .join(' ').toLowerCase().includes(q));
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
        <input class="field-input" placeholder="搜索名称/编码" data-filter="agent-l1:name" value="${escapeHtml(f.name || '')}" />
        <input class="field-input" placeholder="搜索区域" data-filter="agent-l1:region" value="${escapeHtml(f.region || '')}" />
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
    const inRange = all.filter((s) => inDateRange(s.createdAt, from, to));
    const list = inRange.filter((s) => s.channel === channel);
    const distN = inRange.filter((s) => s.channel === 'distribute').length;
    const dirN = inRange.filter((s) => s.channel === 'direct').length;
    return `${pageHeader('一级销售详情', `${l1Name(l1Id)} · 默认当月可改区间`, '<button class="btn" data-go="agent-l1">返回列表</button>')}
      ${filterBar(`
        <select class="field-input" data-filter="l1-sales:l1Id">${db.agentsL1.map((a)=>`<option value="${a.id}" ${a.id===l1Id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input type="date" class="field-input" data-filter="l1-sales:from" value="${from}" />
        <input type="date" class="field-input" data-filter="l1-sales:to" value="${to}" />
      `)}
      <div class="metric-grid">${metricCard('当月销量', monthQty)}${metricCard('历史总量', histQty)}</div>
      ${tabsHtml('l1-sales', [
        { id: 'distribute', title: '分销', badge: distN || null },
        { id: 'direct', title: '直售', badge: dirN || null },
      ])}
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
    const sel = ui.selected['agent-l2'] || (ui.selected['agent-l2'] = {});
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
    const allOn = rows.length > 0 && rows.every((a) => !!sel[a.id]);
    const selN = rows.filter((a) => sel[a.id]).length;
    return `${pageHeader('二级代理商', '点击行进入详情（含解绑/改绑/围栏）；勾选后可设异常不报警')}
      ${filterBar(`
        <input class="field-input" placeholder="搜索" data-filter="agent-l2:q" value="${escapeHtml(f.q||'')}" />
        <select class="field-input" data-filter="agent-l2:type"><option value="">类型</option><option value="法人" ${f.type==='法人'?'selected':''}>法人</option><option value="个人" ${f.type==='个人'?'selected':''}>个人</option></select>
        <select class="field-input" data-filter="agent-l2:parent"><option value="">所属一级</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${f.parent===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <input class="field-input" placeholder="所属地域/城市" data-filter="agent-l2:region" value="${escapeHtml(f.region||'')}" />
        <button type="button" class="btn btn-sm btn-primary" data-action="l2-ex-no-alarm" ${selN ? '' : 'disabled'} title="所选二级出现异常时只记录且默认已处理">异常不报警${selN ? ` (${selN})` : ''}</button>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr>
          <th class="col-check"><input type="checkbox" data-action="toggle-l2-sel-all" ${allOn ? 'checked' : ''} title="全选当前列表" /></th>
          <th>编码</th><th>名称</th><th>类型</th>
          <th class="sortable" data-action="sort-col" data-sort-key="parent" data-sort-scope="agent-l2">所属一级${sortMark('parent')}</th>
          <th>授权城市</th><th>状态</th><th>操作</th>
        </tr></thead>
        <tbody>${rows.map((a)=>`<tr class="row-clickable" data-row-action="view-agent-l2" data-id="${a.id}">
          <td class="col-check" onclick="event.stopPropagation()"><input type="checkbox" data-action="toggle-l2-sel" data-id="${a.id}" ${sel[a.id] ? 'checked' : ''} /></td>
          <td>${escapeHtml(a.code)}</td>
          <td>${escapeHtml(a.name)}${a.exNoAlarm ? ` ${tag('不报警', 'gray')}` : ''}</td>
          <td>${tag(a.type, a.type==='法人'?'blue':'gray')}</td>
          <td>${escapeHtml(l1Name(a.parentId))}</td><td>${escapeHtml((a.areas||[]).join('、')||'—')}</td>
          <td>${tag(a.status, a.status==='启用'?'green':'gray')}</td>
          <td class="ops" onclick="event.stopPropagation()">
            <button class="btn btn-sm" data-go="l2-sales-detail" data-set-filter="l2-sales:l2Id=${a.id}">销售</button>
            <button class="btn btn-sm" data-go="l2-return-detail" data-set-filter="l2-return:l2Id=${a.id}">退货</button>
          </td>
        </tr>`).join('') || `<tr><td colspan="8">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageAgentL2Audit() {
    const f = ui.filters['agent-l2-audit'] || {};
    const tab = ui.tabs['agent-l2-audit'] || 'pending';
    const pendingN = db.agentsL2.filter((a) => a.auditStatus === 'pending').length;
    const approvedN = db.agentsL2.filter((a) => a.auditStatus === 'approved' && !a.pending).length;
    const rejectedN = db.agentsL2.filter((a) => a.auditStatus === 'rejected').length;
    let rows = db.agentsL2.filter((a) => {
      if (tab === 'pending') return a.auditStatus === 'pending';
      if (tab === 'approved') return a.auditStatus === 'approved' && !a.pending;
      if (tab === 'rejected') return a.auditStatus === 'rejected';
      return ['pending', 'approved', 'rejected'].includes(a.auditStatus);
    });
    if (f.l1) {
      const q = String(f.l1).toLowerCase();
      rows = rows.filter((a) => l1Name(a.parentId).toLowerCase().includes(q)
        || l1Name(a.prevParentId).toLowerCase().includes(q));
    }
    const statusCell = (a) => {
      if (a.auditStatus === 'pending') return tag('待审核', 'orange');
      if (a.auditStatus === 'rejected') return tag('已驳回', 'red');
      return tag('已通过', 'green');
    };
    const emptyMsg = tab === 'pending' ? '暂无待审' : tab === 'approved' ? '暂无已通过' : tab === 'rejected' ? '暂无已驳回' : '暂无数据';
    return `${pageHeader('二级审核', '点击行进入详情，审核操作在详情内')}
      ${tabsHtml('agent-l2-audit', [
        { id: 'pending', title: '待审核', badge: pendingN || null },
        { id: 'approved', title: '已通过', badge: approvedN || null },
        { id: 'rejected', title: '已驳回', badge: rejectedN || null },
        { id: 'all', title: '全部', badge: pendingN + approvedN + rejectedN || null },
      ])}
      ${filterBar(`
        <input class="field-input" placeholder="搜索一级代理名称" data-filter="agent-l2-audit:l1" value="${escapeHtml(f.l1 || '')}" />
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>类型</th><th>申请一级</th><th>城市</th><th>状态</th></tr></thead>
        <tbody>${rows.map((a)=>`<tr class="row-clickable" data-row-action="view-l2-audit" data-id="${a.id}">
          <td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.type)}</td>
          <td>${escapeHtml(l1Name(a.parentId))}</td><td>${escapeHtml((a.areas||[]).join('、'))}</td>
          <td>${statusCell(a)}</td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint(emptyMsg)}</td></tr>`}</tbody>
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
    const f = ui.filters.product || {};
    const tab = ui.tabs.product || 'all';
    let rows = db.products.slice();
    if (tab === 'kit') rows = rows.filter((p) => p.type === 'kit');
    if (tab === 'single') rows = rows.filter((p) => p.type === 'single');
    if (tab === 'part') rows = rows.filter((p) => p.type === 'part');
    if (f.q) {
      const q = String(f.q).toLowerCase();
      rows = rows.filter((p) => [p.code, p.name, p.compAName, p.compBName, p.note].join(' ').toLowerCase().includes(q));
    }
    if (f.status) rows = rows.filter((p) => p.status === f.status);
    const kitN = db.products.filter((p) => p.type === 'kit').length;
    const singleN = db.products.filter((p) => p.type === 'single').length;
    const partN = db.products.filter((p) => p.type === 'part').length;
    return `${pageHeader('商品库', '套件 / 单品（有SN）/ 配件；点击行编辑',
      '<button class="btn btn-primary" data-action="open-create-product" data-ptype="kit">新建套件</button><button class="btn btn-primary" data-action="open-create-product" data-ptype="single">新建单品</button><button class="btn" data-action="open-create-product" data-ptype="part">新建配件</button>')}
      ${tabsHtml('product', [
        { id: 'all', title: '全部', badge: db.products.length || null },
        { id: 'kit', title: '套件', badge: kitN || null },
        { id: 'single', title: '单品', badge: singleN || null },
        { id: 'part', title: '配件', badge: partN || null },
      ])}
      ${filterBar(`
        <input class="field-input" placeholder="搜索编码/名称/组件" data-filter="product:q" value="${escapeHtml(f.q || '')}" />
        <select class="field-input" data-filter="product:status"><option value="">状态</option><option value="上架" ${f.status==='上架'?'selected':''}>上架</option><option value="下架" ${f.status==='下架'?'selected':''}>下架</option></select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>编码</th><th>名称</th><th>类型</th><th>组件/规格</th><th>标品组合</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${rows.map((p)=>{
          const isKit = p.type === 'kit';
          const isSingle = p.type === 'single';
          const comps = isKit
            ? productComponents(p).map((c) => `${escapeHtml(c.name)}(${(c.sizes || []).join('/')})`).join(' + ')
            : (p.sizes || []).map((s) => tag(s)).join(' ') || '—';
          const std = isKit ? kitStdCombos(p) : [];
          return `<tr class="row-clickable" data-row-action="open-edit-product" data-id="${p.id}">
            <td>${escapeHtml(p.code)}</td>
            <td>${escapeHtml(p.name)}</td>
            <td>${tag(productTypeLabel(p), productTypeTone(p))}</td>
            <td>${comps}</td>
            <td>${isKit ? (std.map((k)=>tag(k.grade ? (k.grade + '·' + (k.label || '')) : (k.label || k.key), 'orange')).join(' ') || '—') : (isSingle ? '按尺码' : '—')}</td>
            <td>${tag(p.status, p.status==='上架'?'green':'gray')}</td>
            <td class="ops" onclick="event.stopPropagation()">
              <button class="btn btn-sm" data-action="open-edit-product" data-id="${p.id}">修改</button>
              <button class="btn btn-sm" data-action="delete-product" data-id="${p.id}">删除</button>
            </td>
          </tr>`;
        }).join('') || `<tr><td colspan="7">${emptyHint('暂无商品')}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageSN() {
    const f = ui.filters.sn || {};
    let rows = db.sns.slice();
    if (f.sn) rows = rows.filter((s) => s.sn.toLowerCase().includes(f.sn.toLowerCase()));
    if (f.productName) {
      const q = String(f.productName).toLowerCase();
      rows = rows.filter((s) => productName(s.productId).toLowerCase().includes(q));
    }
    if (f.productId) rows = rows.filter((s) => s.productId === f.productId);
    if (f.l1) rows = rows.filter((s) => s.l1Id === f.l1);
    if (f.l2) rows = rows.filter((s) => s.l2Id === f.l2);
    if (f.size) rows = rows.filter((s) => s.size === f.size);
    if (f.belt) rows = rows.filter((s) => s.belt === f.belt);
    if (f.channel) rows = rows.filter((s) => snChannelOf(s) === f.channel);
    if (f.status) rows = rows.filter((s) => (f.status === 'frozen' ? (s.frozen || s.status === 'frozen') : s.status === f.status));
    if (f.factoryFrom || f.factoryTo) rows = rows.filter((s) => inDateRange(s.factoryAt || '', f.factoryFrom, f.factoryTo));
    if (f.soldFrom || f.soldTo) rows = rows.filter((s) => inDateRange(s.soldAt || s.bindAt || '', f.soldFrom, f.soldTo));
    if (f.returnFrom || f.returnTo) rows = rows.filter((s) => inDateRange(s.returnAt || '', f.returnFrom, f.returnTo));
    if ((f.from || f.to) && !(f.factoryFrom || f.soldFrom || f.returnFrom)) {
      rows = rows.filter((s) => inDateRange(s.soldAt || s.factoryAt || s.returnAt || s.bindAt || '', f.from, f.to));
    }
    rows = rows.slice(0, 200);
    return `${pageHeader('SN码库', '多维筛选 · 点击行查看生命周期/编辑', '<button class="btn" data-action="open-import-sn-seg">Excel导入段号</button>')}
      ${filterBar(`
        <input class="field-input" placeholder="SN" data-filter="sn:sn" value="${escapeHtml(f.sn||'')}" />
        <input class="field-input" placeholder="商品名称" data-filter="sn:productName" value="${escapeHtml(f.productName||'')}" />
        <select class="field-input" data-filter="sn:l1"><option value="">一级</option>${db.agentsL1.map((a)=>`<option value="${a.id}" ${f.l1===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:l2"><option value="">二级</option>${db.agentsL2.map((a)=>`<option value="${a.id}" ${f.l2===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:size"><option value="">弹力带尺码</option>${BAND_SIZES.map((s)=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:belt"><option value="">腰带尺码</option>${BELTS.map((s)=>`<option value="${s}" ${f.belt===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:status"><option value="">状态</option>${Object.entries(SN_STATUS_LABEL).map(([k,v])=>`<option value="${k}" ${f.status===k?'selected':''}>${v}</option>`).join('')}</select>
        <select class="field-input" data-filter="sn:channel"><option value="">渠道</option><option value="distribute" ${f.channel==='distribute'?'selected':''}>分销</option><option value="direct" ${f.channel==='direct'?'selected':''}>直售</option></select>
        <label class="muted">出厂</label><input type="date" class="field-input" data-filter="sn:factoryFrom" value="${escapeHtml(f.factoryFrom||'')}" /><input type="date" class="field-input" data-filter="sn:factoryTo" value="${escapeHtml(f.factoryTo||'')}" />
        <label class="muted">销售</label><input type="date" class="field-input" data-filter="sn:soldFrom" value="${escapeHtml(f.soldFrom||'')}" /><input type="date" class="field-input" data-filter="sn:soldTo" value="${escapeHtml(f.soldTo||'')}" />
        <label class="muted">退货</label><input type="date" class="field-input" data-filter="sn:returnFrom" value="${escapeHtml(f.returnFrom||'')}" /><input type="date" class="field-input" data-filter="sn:returnTo" value="${escapeHtml(f.returnTo||'')}" />
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>SN</th><th>商品</th><th>尺寸</th><th>腰带</th><th>渠道</th><th>一级</th><th>二级</th><th>状态</th><th>历史标签</th></tr></thead>
        <tbody>${rows.map((s)=>{
          const st = snStatusMeta(s);
          const ch = snChannelMeta(s);
          const hist = snHistoryTags(s);
          return `<tr class="row-clickable" data-row-action="view-sn" data-id="${s.sn}">
            <td class="num">${escapeHtml(s.sn)}</td>
            <td>${escapeHtml(productName(s.productId))}</td>
            <td>${escapeHtml(s.size)}</td><td>${escapeHtml(s.belt||'—')}</td>
            <td>${ch.id ? tag(ch.label, ch.tone) : '—'}</td>
            <td>${escapeHtml(l1Name(s.l1Id))}</td><td>${escapeHtml(l2Name(s.l2Id))}</td>
            <td>${tag(st.label, st.tone)}</td>
            <td>${hist.map((t)=>tag(t,'orange')).join(' ')||'—'}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="9">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }
  function pagePurchase() {
    const tab = ui.tabs.purchase || 'all';
    let rows = db.purchases.slice();
    if (tab !== 'all') rows = rows.filter((p) => p.status === tab);
    const poN = (st) => db.purchases.filter((p) => p.status === st).length;
    const tabItems = [
      { id: 'all', title: '全部', badge: db.purchases.length || null },
      { id: 'pending', title: '待审核', badge: poN('pending') || null },
      { id: 'cosigning', title: '会签中', badge: poN('cosigning') || null },
      { id: 'approved', title: '已生效', badge: poN('approved') || null },
      { id: 'rejected', title: '已驳回', badge: poN('rejected') || null },
    ];
    return `${pageHeader('采购单管理', '一站式审核：标准/非标/配件 + 段号起止 + 双人会签即生效（下单仅一级小程序）')}
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
    const tab = ui.tabs.stock || 'summary';
    const agentType = f.type || '';
    const agentId = f.agent || '';
    const summaryRows = getStockSummaryRows(f);
    const snFilterType = agentType || 'l1';
    const snFilterAgent = agentId || (snFilterType === 'l1' ? db.agentsL1[0]?.id : db.agentsL2[0]?.id);
    const snRows = getStockSns(snFilterType, snFilterAgent, f).slice(0, 200);
    const agents = agentType === 'l2'
      ? db.agentsL2.filter((a) => !a.pending).map((a) => ({ id: a.id, label: a.name }))
      : agentType === 'l1'
        ? db.agentsL1.map((a) => ({ id: a.id, label: a.name }))
        : [
          ...db.agentsL1.map((a) => ({ id: a.id, label: `一级 · ${a.name}` })),
          ...db.agentsL2.filter((a) => !a.pending).map((a) => ({ id: a.id, label: `二级 · ${a.name}` })),
        ];
    const logs = db.stockLogs.slice(0, 40);
    let table = '';
    if (tab === 'sn') {
      table = `<div class="page-card table-wrap"><table class="data">
        <thead><tr><th>SN</th><th>商品</th><th>一级代理名称</th><th>二级代理名称</th><th>规格</th><th>状态</th></tr></thead>
        <tbody>${snRows.map((s)=>{
          const st = snStatusMeta(s);
          return `<tr class="row-clickable" data-row-action="view-sn" data-id="${s.sn}">
            <td class="num">${escapeHtml(s.sn)}</td>
            <td>${escapeHtml(productName(s.productId))}</td>
            <td>${escapeHtml(l1Name(s.l1Id))}</td>
            <td>${escapeHtml(s.l2Id ? l2Name(s.l2Id) : '—')}</td>
            <td>${escapeHtml(stockSpecText(s.size, s.belt))}</td>
            <td>${tag(st.label, st.tone)}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
    } else if (tab === 'flow') {
      table = `<div class="page-card table-wrap"><table class="data">
        <thead><tr><th>时间</th><th>代理</th><th>商品</th><th>变动</th><th>原因</th><th>单号</th></tr></thead>
        <tbody>${logs.map((h)=>`<tr>
          <td>${escapeHtml(h.time)}</td>
          <td>${escapeHtml(h.agentType==='l1'?l1Name(h.agentId):l2Name(h.agentId))}</td>
          <td>${escapeHtml(productName(h.productId))}/${escapeHtml(h.size)}</td>
          <td class="num">${h.delta>0?'+':''}${h.delta}</td>
          <td>${escapeHtml(h.reason)}</td><td>${escapeHtml(h.ref||'')}</td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
    } else {
      table = `<div class="page-card table-wrap"><div class="table-caption">在库 SN 明细（${summaryRows.length}）</div><table class="data">
        <thead><tr><th>商品</th><th>一级代理名称</th><th>二级代理名称</th><th>规格</th><th>数量</th><th>操作</th></tr></thead>
        <tbody>${summaryRows.map((r)=>`<tr class="row-clickable" data-row-action="view-stock" data-id="${escapeHtml(r.id)}">
          <td>${escapeHtml(productName(r.productId))}</td>
          <td>${escapeHtml(l1Name(r.l1Id))}</td>
          <td>${escapeHtml(r.l2Id ? l2Name(r.l2Id) : '—')}</td>
          <td>${escapeHtml(stockSpecText(r.size, r.belt))}</td>
          <td class="num">${r.qty}</td>
          <td class="ops" onclick="event.stopPropagation()"><button class="btn btn-sm" data-action="open-view-stock" data-id="${escapeHtml(r.id)}">详情</button></td>
        </tr>`).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
    }
    return `${pageHeader('库存管理', '按商品/代理/规格汇总；详情可看流水与 SN，SN 可跳转码库')}
      ${tabsHtml('stock', [
        { id: 'summary', title: '在库 SN 明细', badge: summaryRows.length || null },
        { id: 'sn', title: 'SN 列表', badge: snRows.length || null },
        { id: 'flow', title: '库存流水', badge: logs.length || null },
      ])}
      ${filterBar(`
        <select class="field-input" data-filter="stock:type"><option value="" ${!agentType?'selected':''}>全部层级</option><option value="l1" ${agentType==='l1'?'selected':''}>一级</option><option value="l2" ${agentType==='l2'?'selected':''}>二级</option></select>
        <select class="field-input" data-filter="stock:agent"><option value="">全部代理</option>${agents.map((a)=>`<option value="${a.id}" ${a.id===agentId?'selected':''}>${escapeHtml(a.label)}</option>`).join('')}</select>
        <select class="field-input" data-filter="stock:productId"><option value="">商品</option>${kitProducts().map((p)=>`<option value="${p.id}" ${f.productId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select>
        <select class="field-input" data-filter="stock:size"><option value="">弹力带尺码</option>${BAND_SIZES.map((s)=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
        <select class="field-input" data-filter="stock:belt"><option value="">腰带尺码</option>${BELTS.map((s)=>`<option value="${s}" ${f.belt===s?'selected':''}>${s}</option>`).join('')}</select>
        ${tab==='sn'?`<input class="field-input" placeholder="SN" data-filter="stock:sn" value="${escapeHtml(f.sn||'')}" />`:''}
      `)}
      ${table}`;
  }

  function pageReturn() {
    const f = ui.filters.return || {};
    const tab = ui.tabs.return || (f.status || 'all');
    if (f.status && !ui.tabs.return) ui.tabs.return = f.status;
    let rows = db.returns.slice();
    if (f.type) rows = rows.filter((r) => r.type === f.type);
    if (f.reasonType) rows = rows.filter((r) => r.reasonType === f.reasonType);
    if (tab && tab !== 'all') rows = rows.filter((r) => r.status === tab);
    rows.sort((a, b) => {
      const pa = a.status === 'pending' ? 0 : 1;
      const pb = b.status === 'pending' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return parseTime(b.createdAt) - parseTime(a.createdAt);
    });
    const monthQty = db.returns.filter((r) => inDateRange(r.createdAt, monthStart(), todayDate())).reduce((n, r) => n + (r.sns || []).length, 0);
    const histQty = db.returns.reduce((n, r) => n + (r.sns || []).length, 0);
    const rtN = (st) => db.returns.filter((r) => r.status === st).length;
    return `${pageHeader('返货管理', '列表含 SN · 统计可点进详情', '<button class="btn" data-go="stats">数据统计</button>')}
      <div class="metric-grid" style="margin-bottom:10px">
        ${metricCard('本月退货件数', monthQty, 'return')}
        ${metricCard('历史退货件数', histQty, 'return')}
        ${metricCard('待审单', rtN('pending'), 'return', 'tab:return:pending')}
      </div>
      ${tabsHtml('return', [
        { id: 'all', title: '全部', badge: db.returns.length || null },
        { id: 'pending', title: '待审核', badge: rtN('pending') || null },
        { id: 'approved', title: '已通过', badge: rtN('approved') || null },
        { id: 'done', title: '已处理', badge: rtN('done') || null },
        { id: 'rejected', title: '已驳回', badge: rtN('rejected') || null },
      ])}
      ${filterBar(`
        <select class="field-input" data-filter="return:type"><option value="">类型</option>${RETURN_TYPES.map((t)=>`<option value="${t.id}" ${f.type===t.id?'selected':''}>${t.label}</option>`).join('')}</select>
        <select class="field-input" data-filter="return:reasonType"><option value="">退货理由</option>${RETURN_REASONS.map((r)=>`<option value="${r.type}" ${f.reasonType===r.type?'selected':''}>${r.label}</option>`).join('')}</select>
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
    return `${pageHeader('异常管理', '扫码 / 激活 / 销售库存（仅二级）· 未处理加粗')}
      <div class="page-card" style="margin-bottom:12px;padding:14px;border:1px solid var(--primary);background:rgba(15,118,110,.04)">
        <div style="font-weight:600;margin-bottom:8px">异常标准配置（平台可改 · 仅针对二级）</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <label style="font-size:12px">全局倍数 <input class="field-input" style="width:70px" type="number" step="0.1" value="${db.exceptionMultiplier}" id="f-ex-mult" /></label>
          <label style="font-size:12px">超量比 <input class="field-input" style="width:70px" type="number" step="0.1" value="${rules.overOrderRatio}" id="f-ex-over" /></label>
          <label style="font-size:12px">周转比 <input class="field-input" style="width:70px" type="number" step="0.1" value="${rules.stockTurnover}" id="f-ex-turn" /></label>
          <button class="btn btn-sm btn-primary" data-action="save-ex-rules">保存标准</button>
          <span class="muted">一级分销给二级不触发库存异常；二级详情可单独设严格/软报警</span>
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
            <td>${escapeHtml(e.time)}</td><td>${escapeHtml(e.type)}${e.warnMode==='off'?tag('不报警','gray'):(e.warnMode==='soft'?tag('软','gray'):'')}</td>
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
    const tab = ui.tabs.role || 'roles';
    let table = '';
    if (tab === 'accounts') {
      table = `<div class="page-card table-wrap"><table class="data">
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
        }).join('') || `<tr><td colspan="6">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
    } else if (tab === 'subs') {
      table = `<div class="page-card table-wrap"><table class="data">
        <thead><tr><th>用户名</th><th>姓名</th><th>所属一级</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${db.subAccounts.map((s)=>`<tr>
          <td>${escapeHtml(s.username)}</td><td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(l1Name(s.l1Id))}</td>
          <td>${tag(s.status, s.status==='启用'?'green':'gray')}</td>
          <td class="ops"><button class="btn btn-sm" data-action="toggle-sub" data-id="${s.id}">${s.status==='启用'?'停用':'启用'}</button></td>
        </tr>`).join('') || `<tr><td colspan="5">${emptyHint('暂无子账号')}</td></tr>`}</tbody>
      </table></div>`;
    } else {
      table = `<div class="page-card table-wrap"><table class="data">
        <thead><tr><th>角色</th><th>说明</th><th>权限</th><th>账号数</th><th>操作</th></tr></thead>
        <tbody>${db.roles.map((r)=>`<tr>
          <td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.desc)}</td>
          <td>${(r.perms||[]).map((p)=>tag(permLabel(p))).join(' ') || '—'}</td>
          <td class="num">${db.accounts.filter((a)=>a.roleId===r.id).length}</td>
          <td class="ops"><button class="btn btn-sm" data-action="open-edit-role" data-id="${r.id}">编辑权限</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    }
    return `${pageHeader('角色与权限', '查看账号 / 编辑角色权限。二级代理账号与一级子账号请由一级在小程序「我的」创建')}
      <div class="alert alert-info">后台不再提供「创建二级代理账号 / 创建一级子账号」；启停仍可在此管理。</div>
      ${tabsHtml('role', [
        { id: 'roles', title: '角色', badge: db.roles.length || null },
        { id: 'accounts', title: '账号', badge: db.accounts.length || null },
        { id: 'subs', title: '一级子账号', badge: db.subAccounts.length || null },
      ])}
      ${table}`;
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
      ${!subOnly?`<button class="btn btn-primary btn-block" data-action="open-order-cart" data-channel="sales" style="margin-bottom:10px">创建销售单</button>`:''}
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
      <button class="btn btn-primary btn-block" data-action="open-order-cart" data-channel="purchase">新建采购申请</button>
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
    const actions = ui.role === 'l2' ? '' : `<button class="btn btn-primary btn-block" data-action="open-order-cart" data-channel="sales" style="margin-bottom:10px">创建销售单</button>`;
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
    const rtAll = list.slice();
    const rtN = (st) => rtAll.filter((r) => r.status === st).length;
    const typeTab = (ui.tabs.miniRtType === 'upward') ? 'upward' : 'l2_apply';
    if (ui.role === 'l1' && ui.tabs.miniRtType !== typeTab) ui.tabs.miniRtType = typeTab;
    const typeN = (t) => {
      if (t === 'l2_apply') return rtAll.filter((r) => r.type === 'l2_to_l1').length;
      if (t === 'upward') return rtAll.filter((r) => r.type === 'l1_to_factory').length;
      return rtAll.length;
    };
    const statusTab = ui.tabs.miniRtStatus || 'all';
    // 类型 tab（二级申请 / 向上申请）仅一级可见
    if (ui.role === 'l1') {
      if (typeTab === 'upward') list = list.filter((r) => r.type === 'l1_to_factory');
      else list = list.filter((r) => r.type === 'l2_to_l1');
    }
    if (statusTab !== 'all') list = list.filter((r) => r.status === statusTab);
    list = list.slice().sort((a, b) => {
      const pa = a.status === 'pending' ? 0 : 1;
      const pb = b.status === 'pending' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return parseTime(b.createdAt) - parseTime(a.createdAt);
    });
    return `${ui.role==='l2'
        ? `<button class="btn btn-block" data-action="mini-create-return" style="margin-bottom:8px">向上申请退货</button>
           <button class="btn btn-block btn-primary" data-action="mini-create-cend-return" style="margin-bottom:10px">创建C端用户退货单</button>`
        : `<button class="btn btn-block" data-action="mini-create-return" style="margin-bottom:8px">申请退货</button>
           <button class="btn btn-block btn-primary" data-action="mini-create-cend-return" style="margin-bottom:10px">创建C端用户退货单</button>`}
      ${pendingL2.length?`<div class="alert alert-info">待审二级退一级 ${pendingL2.length} 单（点进详情审核）</div>`:''}
      ${ui.role === 'l1' ? miniSegHtml('miniRtType', [
        { id: 'l2_apply', title: '二级申请', badge: typeN('l2_apply') || null },
        { id: 'upward', title: '向上申请', badge: typeN('upward') || null },
      ]) : ''}
      ${miniSegHtml('miniRtStatus', [
        { id: 'all', title: '全部', badge: (ui.role === 'l1'
          ? rtAll.filter((r) => (typeTab === 'upward' ? r.type === 'l1_to_factory' : r.type === 'l2_to_l1')).length
          : rtAll.length) || null },
        { id: 'pending', title: '待审核', badge: (ui.role === 'l1'
          ? rtAll.filter((r) => (typeTab === 'upward' ? r.type === 'l1_to_factory' : r.type === 'l2_to_l1') && r.status === 'pending')
          : rtAll.filter((r) => r.status === 'pending')).length || null },
        { id: 'approved', title: '已通过', badge: (ui.role === 'l1'
          ? rtAll.filter((r) => (typeTab === 'upward' ? r.type === 'l1_to_factory' : r.type === 'l2_to_l1') && r.status === 'approved')
          : rtAll.filter((r) => r.status === 'approved')).length || null },
        { id: 'done', title: '已处理', badge: (ui.role === 'l1'
          ? rtAll.filter((r) => (typeTab === 'upward' ? r.type === 'l1_to_factory' : r.type === 'l2_to_l1') && r.status === 'done')
          : rtAll.filter((r) => r.status === 'done')).length || null },
      ])}
      <div class="mini-list">${list.map((r)=>`<button type="button" class="mini-list-item ${r.status==='pending'?'rt-pending':''}" data-action="open-view-return" data-id="${r.id}">
        <strong class="rt-row-hd"><span>${escapeHtml(r.no)}</span>${returnStatusTag(r.status)}</strong>
        <span>${tag(r.reasonType||'')} ${escapeHtml(r.reason||'')}</span>
        <span class="muted">${escapeHtml(r.typeLabel || r.type)}</span>
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
    const exAll = list.slice();
    const exN = (d) => (d === 'all' ? exAll.length : exAll.filter((e) => exceptionDim(e) === d).length);
    if (dim !== 'all') list = list.filter((e) => exceptionDim(e) === dim);
    return `${miniSegHtml('miniEx', [
      { id: 'all', title: '全部', badge: exN('all') || null },
      { id: 'scan', title: '扫码', badge: exN('scan') || null },
      { id: 'activate', title: '激活', badge: exN('activate') || null },
      { id: 'stock', title: '库存', badge: exN('stock') || null },
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
    const tab = ui.tabs.miniStock || 'product';
    const rows = getStockRows(type, id).filter((r) => {
      if (f.size && r.size !== f.size) return false;
      if (f.belt && r.belt !== f.belt) return false;
      return true;
    });
    const snAll = getStockSns(type, id, f);
    const sns = snAll.slice(0, 80);
    const panel = tab === 'sn'
      ? `<div class="form-field"><input class="field-input" placeholder="搜 SN" data-filter="miniStock:sn" value="${escapeHtml(f.sn||'')}" /></div>
        <div style="display:flex;gap:6px;margin:8px 0">
          <select class="field-input" data-filter="miniStock:size"><option value="">弹力带</option>${BAND_SIZES.map((s)=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
          <select class="field-input" data-filter="miniStock:belt"><option value="">腰带</option>${BELTS.map((s)=>`<option value="${s}" ${f.belt===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
        <div class="mini-list">${sns.map((s)=>`<button type="button" class="mini-list-item" data-action="open-view-sn" data-id="${s.sn}">
          <strong>${escapeHtml(s.sn)}</strong>
          <span>${escapeHtml(productName(s.productId))} · ${escapeHtml(s.size)}+${escapeHtml(s.belt||'—')}</span>
        </button>`).join('')||emptyHint('无 SN')}</div>`
      : `<div style="display:flex;gap:6px;margin:8px 0">
          <select class="field-input" data-filter="miniStock:size"><option value="">弹力带</option>${BAND_SIZES.map((s)=>`<option value="${s}" ${f.size===s?'selected':''}>${s}</option>`).join('')}</select>
          <select class="field-input" data-filter="miniStock:belt"><option value="">腰带</option>${BELTS.map((s)=>`<option value="${s}" ${f.belt===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
        <div class="mini-list">${rows.map((r)=>{
          const stockId = `${type}_${id}_${r.productId}_${r.size}_${r.belt || ''}`;
          return `<button type="button" class="mini-list-item" data-action="open-view-stock" data-id="${escapeHtml(stockId)}">
          <strong>${escapeHtml(productName(r.productId))}</strong>
          <span>${escapeHtml(r.size)} + ${escapeHtml(r.belt||'—')}</span>
          <span class="num">×${r.qty}</span>
        </button>`;
        }).join('')||emptyHint('暂无汇总')}</div>`;
    return `<div class="mini-page-title">库存</div>
      <p class="mini-page-desc">点商品可看流水与 SN 详情 · 商品汇总与在库 SN 分开展示</p>
      ${miniSegHtml('miniStock', [
        { id: 'product', title: '商品', badge: rows.length || null },
        { id: 'sn', title: '在库SN', badge: snAll.length || null },
      ])}
      <div class="mini-seg-panel">${panel}</div>`;
  }

  function buildCustomersFromSns(snsList) {
    const map = new Map();
    let n = 0;
    (snsList || []).forEach((s) => {
      const u = s.user || s.prevUser;
      if (!u) return;
      const phone = u.phone || '';
      const key = phone || String(u.addr || '').replace(/\s+/g, '') || s.sn;
      if (!map.has(key)) {
        n += 1;
        map.set(key, {
          id: `CU${String(n).padStart(3, '0')}`,
          name: '',
          phone,
          addr: u.addr || '',
          phoneLoc: u.phoneLoc || '',
          note: '',
          sns: [],
          createdAt: s.soldAt || s.bindAt || s.returnAt || nowStr(),
          updatedAt: s.soldAt || s.bindAt || s.returnAt || nowStr(),
        });
      }
      const c = map.get(key);
      if (!c.sns.includes(s.sn)) c.sns.push(s.sn);
    });
    return [...map.values()];
  }

  function ensureCustomersStore(store) {
    if (!store) return;
    store.seq = store.seq || {};
    if (!Array.isArray(store.customers) || !store.customers.length) {
      store.customers = buildCustomersFromSns(store.sns || []);
    }
    store.customers.forEach((c, i) => {
      if (!c.id) c.id = `CU${String(i + 1).padStart(3, '0')}`;
      if (!Array.isArray(c.sns)) c.sns = [];
      if (c.name == null) c.name = '';
      if (c.note == null) c.note = '';
      if (!c.createdAt) c.createdAt = nowStr();
      if (!c.updatedAt) c.updatedAt = c.createdAt;
    });
    const maxN = store.customers.reduce((m, c) => {
      const n = Number(String(c.id || '').replace(/\D/g, '')) || 0;
      return Math.max(m, n);
    }, 0);
    if (!store.seq.cu || store.seq.cu < maxN) store.seq.cu = maxN;
  }

  function enrichCustomer(c) {
    const products = [];
    const snRows = [];
    (c.sns || []).forEach((sn) => {
      const s = db.sns.find((x) => x.sn === sn);
      if (!s) return;
      snRows.push(s);
      products.push(`${productName(s.productId)}/${s.size}${s.belt ? '+' + s.belt : ''}`);
    });
    return {
      ...c,
      products: [...new Set(products)],
      snRows,
      dupPhone: (c.sns || []).length > 1,
    };
  }

  function listAdminCustomers() {
    ensureCustomersStore(db);
    const rows = (db.customers || []).map(enrichCustomer);
    const addrPhones = {};
    rows.forEach((r) => {
      const a = (r.addr || '').replace(/\s+/g, '');
      if (!a) return;
      addrPhones[a] = addrPhones[a] || new Set();
      if (r.phone) addrPhones[a].add(r.phone);
    });
    rows.forEach((r) => {
      const a = (r.addr || '').replace(/\s+/g, '');
      r.dupAddr = !!(a && addrPhones[a] && addrPhones[a].size > 1);
      r.mark = r.dupPhone || r.dupAddr;
    });
    return rows;
  }

  function syncCustomerToSns(c) {
    const payload = { phone: c.phone || '', addr: c.addr || '', phoneLoc: c.phoneLoc || '' };
    (c.sns || []).forEach((sn) => {
      const s = db.sns.find((x) => x.sn === sn);
      if (!s) return;
      if (s.user) s.user = { ...s.user, ...payload };
      else if (s.prevUser) s.prevUser = { ...s.prevUser, ...payload };
      else s.user = { ...payload };
    });
  }

  function readCustomerForm() {
    const sns = String($('#f-cu-sns')?.value || '')
      .split(/[,，\s]+/)
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);
    return {
      name: ($('#f-cu-name')?.value || '').trim(),
      phone: ($('#f-cu-phone')?.value || '').trim(),
      phoneLoc: ($('#f-cu-loc')?.value || '').trim(),
      addr: ($('#f-cu-addr')?.value || '').trim(),
      note: ($('#f-cu-note')?.value || '').trim(),
      sns,
    };
  }

  function customerFormHtml(c = {}) {
    return `<div class="form-grid">
      <div class="form-field"><label>姓名/备注名</label><input class="field-input" id="f-cu-name" value="${escapeHtml(c.name || '')}" placeholder="可选" /></div>
      <div class="form-field"><label>手机号</label><input class="field-input" id="f-cu-phone" value="${escapeHtml(c.phone || '')}" placeholder="138****0000" /></div>
      <div class="form-field"><label>归属地</label><input class="field-input" id="f-cu-loc" value="${escapeHtml(c.phoneLoc || '')}" placeholder="如：浙江" /></div>
      <div class="form-field span-2"><label>地址</label><input class="field-input" id="f-cu-addr" value="${escapeHtml(c.addr || '')}" placeholder="收货/绑定地址" /></div>
      <div class="form-field span-2"><label>关联 SN（逗号分隔）</label><input class="field-input" id="f-cu-sns" value="${escapeHtml((c.sns || []).join(','))}" placeholder="RL..." /></div>
      <div class="form-field span-2"><label>备注</label><input class="field-input" id="f-cu-note" value="${escapeHtml(c.note || '')}" placeholder="可手写补充" /></div>
    </div>`;
  }

  function customerDetailHtml(c) {
    const row = enrichCustomer(c);
    const addrPhones = {};
    listAdminCustomers().forEach((r) => {
      const a = (r.addr || '').replace(/\s+/g, '');
      if (!a) return;
      addrPhones[a] = addrPhones[a] || new Set();
      if (r.phone) addrPhones[a].add(r.phone);
    });
    const a = (row.addr || '').replace(/\s+/g, '');
    const dupAddr = !!(a && addrPhones[a] && addrPhones[a].size > 1);
    return `<div class="detail-grid">
        <div><span>姓名</span>${escapeHtml(row.name || '—')}</div>
        <div><span>手机</span>${escapeHtml(row.phone || '—')}</div>
        <div><span>归属地</span>${escapeHtml(row.phoneLoc || '—')}</div>
        <div><span>标记</span>${row.dupPhone ? tag('重复手机', 'orange') : ''}${dupAddr ? tag('重复地址', 'orange') : ''}${!(row.dupPhone || dupAddr) ? '—' : ''}</div>
        <div class="span-2"><span>地址</span>${escapeHtml(row.addr || '—')}</div>
        <div class="span-2"><span>备注</span>${escapeHtml(row.note || '—')}</div>
        <div><span>创建</span>${escapeHtml(row.createdAt || '—')}</div>
        <div><span>更新</span>${escapeHtml(row.updatedAt || '—')}</div>
      </div>
      <h4 style="margin-top:12px">商品明细</h4>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>商品</th><th>规格</th><th>数量</th></tr></thead>
        <tbody>${(() => {
          const map = {};
          row.snRows.forEach((s) => {
            const k = `${s.productId}_${s.size}_${s.belt || ''}`;
            if (!map[k]) map[k] = { productId: s.productId, size: s.size, belt: s.belt || '', qty: 0 };
            map[k].qty += 1;
          });
          const entries = Object.values(map);
          return entries.map((p) => `<tr>
            <td>${escapeHtml(productName(p.productId))}</td>
            <td>${escapeHtml(stockSpecText(p.size, p.belt))}</td>
            <td class="num">${p.qty}</td>
          </tr>`).join('') || `<tr><td colspan="3">${emptyHint('暂无关联商品')}</td></tr>`;
        })()}</tbody>
      </table></div>
      <h4 style="margin-top:12px">关联 SN（${(row.sns || []).length}）</h4>
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>SN</th><th>商品</th><th>规格</th><th>状态</th><th></th></tr></thead>
        <tbody>${(row.sns || []).map((sn) => {
          const s = db.sns.find((x) => x.sn === sn);
          const st = snStatusMeta(s);
          return `<tr>
            <td><code>${escapeHtml(sn)}</code></td>
            <td>${escapeHtml(s ? productName(s.productId) : '—')}</td>
            <td>${escapeHtml(s ? stockSpecText(s.size, s.belt) : '—')}</td>
            <td>${s ? tag(st.label, st.tone) : tag('未找到', 'gray')}</td>
            <td class="ops"><button class="btn btn-sm" data-action="open-view-sn" data-id="${escapeHtml(sn)}">详情</button></td>
          </tr>`;
        }).join('') || `<tr><td colspan="5">${emptyHint('暂无关联 SN')}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageCustomers() {
    const f = ui.filters.customers || {};
    let rows = listAdminCustomers();
    if (f.sn) rows = rows.filter((r) => (r.sns || []).some((sn) => sn.toLowerCase().includes(f.sn.toLowerCase())));
    if (f.phone) rows = rows.filter((r) => (r.phone || '').includes(f.phone) || (r.name || '').includes(f.phone));
    if (f.addr) rows = rows.filter((r) => (r.addr || '').includes(f.addr));
    if (f.mark === '1') rows = rows.filter((r) => r.mark);
    return `${pageHeader('销售客户', '点击行看详情（编辑 / 删除在详情内）',
      '<button class="btn btn-primary" data-action="open-create-customer">新建客户</button>')}
      ${filterBar(`
        <input class="field-input" placeholder="SN" data-filter="customers:sn" value="${escapeHtml(f.sn||'')}" />
        <input class="field-input" placeholder="手机/姓名" data-filter="customers:phone" value="${escapeHtml(f.phone||'')}" />
        <input class="field-input" placeholder="地址" data-filter="customers:addr" value="${escapeHtml(f.addr||'')}" />
        <select class="field-input" data-filter="customers:mark"><option value="">标记</option><option value="1" ${f.mark==='1'?'selected':''}>仅重复</option></select>
      `)}
      <div class="page-card table-wrap"><table class="data">
        <thead><tr><th>姓名</th><th>手机</th><th>归属地</th><th>地址</th><th>商品</th><th>SN</th><th>标记</th></tr></thead>
        <tbody>${rows.map((r)=>`<tr class="row-clickable" data-row-action="view-customer" data-id="${escapeHtml(r.id)}">
          <td>${escapeHtml(r.name || '—')}</td>
          <td>${escapeHtml(r.phone||'—')}</td>
          <td>${escapeHtml(r.phoneLoc||'—')}</td>
          <td>${escapeHtml(r.addr||'—')}</td>
          <td>${escapeHtml((r.products || []).join('，') || '—')}</td>
          <td>${(r.sns||[]).map((sn)=>`<code style="margin-right:4px">${escapeHtml(sn)}</code>`).join('')||'—'}</td>
          <td>${r.dupPhone?tag('重复手机','orange'):''} ${r.dupAddr?tag('重复地址','orange'):''} ${!r.mark?'—':''}</td>
        </tr>`).join('') || `<tr><td colspan="7">${emptyHint()}</td></tr>`}</tbody>
      </table></div>`;
  }

  function pageMiniAftersale() { return pageMiniService(); }
  function pageMiniException() { return pageMiniService(); }

  function miniMineSubHd(title) {
    return `<div class="mini-sub-hd">
      <button type="button" class="mini-sub-back" data-go="mini-mine">‹ 返回</button>
      <strong>${escapeHtml(title)}</strong>
      <span class="mini-sub-hd-spacer"></span>
    </div>`;
  }

  function pageMiniMineL2() {
    if (ui.role !== 'l1') return `${miniMineSubHd('二级代理')}${emptyHint('仅一级可管理二级代理')}`;
    const l1Id = currentL1Id();
    const l2q = (ui.filters.miniL2 || {}).q || '';
    let l2rows = db.agentsL2.filter((a) => a.parentId === l1Id || (a.pending && a.prevParentId === l1Id));
    if (l2q) {
      const q = l2q.toLowerCase();
      l2rows = l2rows.filter((a) => [a.name, a.code, a.type, ...(a.areas || [])].join(' ').toLowerCase().includes(q));
    }
    const l2Acc = (a) => db.accounts.find((x) => x.roleId === 'R4' && x.agentId === a.id);
    return `${miniMineSubHd('二级代理')}
      <p class="mini-page-desc">维护下属二级信息与登录账号；新建后进入平台「二级审核」。</p>
      <button class="btn btn-primary btn-block" data-action="open-create-l2-mini">+ 创建二级代理</button>
      <input class="field-input" style="margin:8px 0" placeholder="搜索名称/编码/城市" data-filter="miniL2:q" value="${escapeHtml(l2q)}" />
      <div class="mini-agent-list">
        ${l2rows.map((a) => {
          const acc = l2Acc(a);
          const audit = a.pending ? '待分配' : (a.auditStatus === 'pending' ? '待审核' : (a.auditStatus === 'rejected' ? '已驳回' : '已通过'));
          const tone = a.pending || a.auditStatus === 'pending' ? 'orange' : (a.auditStatus === 'rejected' ? 'red' : 'green');
          return `<div class="mini-agent-card">
            <div class="mini-agent-card-hd">
              <div>
                <strong>${escapeHtml(a.name)}</strong>
                <div class="mini-agent-meta">${escapeHtml(a.code)} · ${escapeHtml(a.type)} · ${escapeHtml((a.areas || []).join('、') || '未设城市')}</div>
                <div class="mini-agent-meta">登录：${escapeHtml(acc?.username || '未创建账号')}</div>
              </div>
              <div class="mini-agent-tags">${tag(a.status, a.status==='启用'?'green':'gray')} ${tag(audit, tone)}</div>
            </div>
            <div class="mini-agent-ops">
              <button class="btn btn-sm" data-action="open-edit-l2-mini" data-id="${a.id}">编辑</button>
              <button class="btn btn-sm" data-action="toggle-l2-mini" data-id="${a.id}">${a.status==='启用'?'停用':'启用'}</button>
              <button class="btn btn-sm btn-danger" data-action="delete-l2-mini" data-id="${a.id}">删除</button>
            </div>
          </div>`;
        }).join('') || emptyHint('暂无二级代理，点上方创建')}
      </div>`;
  }

  function pageMiniMineSub() {
    if (ui.role !== 'l1') return `${miniMineSubHd('子账号')}${emptyHint('仅一级可管理子账号')}`;
    const l1Id = currentL1Id();
    const subs = db.subAccounts.filter((s) => s.l1Id === l1Id);
    return `${miniMineSubHd('子账号')}
      <p class="mini-page-desc">一级可创建仅扫码子账号，不可改单。</p>
      <button class="btn btn-primary btn-block" data-action="open-create-sub" style="margin-bottom:8px">+ 创建子账号</button>
      <div class="mini-mine-block">
        ${subs.map((s)=>`<div class="mini-list-row"><span>${escapeHtml(s.username)} · ${escapeHtml(s.name)}</span>
          <span><button class="btn btn-sm" data-action="toggle-sub" data-id="${s.id}">${s.status==='启用'?'停用':'启用'}</button></span>
        </div>`).join('') || emptyHint('暂无子账号')}
      </div>`;
  }

  function listMiniCustomers() {
    const map = new Map();
    const inScope = (s) => {
      if (ui.role === 'l2') return s.l2Id === currentL2Id();
      if (ui.role === 'l1') return s.l1Id === currentL1Id();
      return false;
    };
    db.sns.filter((s) => (s.user || s.prevUser) && inScope(s)).forEach((s) => {
      const u = s.user || s.prevUser;
      const phone = u.phone || '';
      const addr = (u.addr || '').replace(/\s+/g, '');
      const key = phone || addr || s.sn;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          phone,
          addr: u.addr || '',
          phoneLoc: u.phoneLoc || '',
          sns: [],
          products: [],
        });
      }
      const row = map.get(key);
      row.sns.push(s.sn);
      row.products.push(`${productName(s.productId)}/${s.size}${s.belt ? '+' + s.belt : ''}`);
    });
    const rows = [...map.values()];
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
    rows.sort((a, b) => (b.sns.length - a.sns.length) || String(a.phone).localeCompare(String(b.phone)));
    return rows;
  }

  function pageMiniMineCustomers() {
    if (ui.role !== 'l1' && ui.role !== 'l2') {
      return `${miniMineSubHd('客户')}${emptyHint('当前角色无客户列表')}`;
    }
    const f = ui.filters.miniCustomers || {};
    let rows = listMiniCustomers();
    if (f.q) {
      const q = f.q.toLowerCase();
      rows = rows.filter((r) =>
        [r.phone, r.addr, r.phoneLoc, ...(r.sns || []), ...(r.products || [])].join(' ').toLowerCase().includes(q));
    }
    if (f.mark === '1') rows = rows.filter((r) => r.mark);
    return `${miniMineSubHd('客户')}
      <p class="mini-page-desc">${ui.role === 'l2' ? '本二级相关 C 端客户' : '本一级体系下 C 端客户'} · 可搜手机/地址/SN</p>
      <input class="field-input" style="margin-bottom:8px" placeholder="搜索手机/地址/SN/商品" data-filter="miniCustomers:q" value="${escapeHtml(f.q || '')}" />
      <select class="field-input" style="margin-bottom:10px" data-filter="miniCustomers:mark">
        <option value="">全部客户</option>
        <option value="1" ${f.mark === '1' ? 'selected' : ''}>仅重复标记</option>
      </select>
      <div class="mini-list">${rows.map((r) => {
        const sn0 = r.sns[0] || '';
        return `<button type="button" class="mini-list-item" data-action="open-view-cend" data-id="CO_${escapeHtml(sn0)}">
          <strong class="rt-row-hd"><span>${escapeHtml(r.phone || '未留手机')}</span>
            ${r.dupPhone ? tag('重复手机', 'orange') : ''}${r.dupAddr ? tag('重复地址', 'orange') : ''}
          </strong>
          <span>${escapeHtml(r.addr || '—')} · ${escapeHtml(r.phoneLoc || '归属地未知')}</span>
          <span>${escapeHtml([...new Set(r.products)].join('，') || '—')}</span>
          <span class="muted">${escapeHtml((r.sns || []).join(' '))}</span>
        </button>`;
      }).join('') || emptyHint('暂无客户')}</div>`;
  }

  function pageMiniMine() {
    const r = ROLES[ui.role];
    const l1Id = currentL1Id();
    const l2Count = ui.role === 'l1'
      ? db.agentsL2.filter((a) => a.parentId === l1Id || (a.pending && a.prevParentId === l1Id)).length
      : 0;
    const subCount = ui.role === 'l1' ? db.subAccounts.filter((s) => s.l1Id === l1Id).length : 0;
    const customerCount = (ui.role === 'l1' || ui.role === 'l2') ? listMiniCustomers().length : 0;
    const entries = [];
    if (ui.role === 'l1') {
      entries.push(`<button type="button" class="mini-mine-entry" data-go="mini-mine-l2">
            <span class="mini-mine-entry-text">
              <strong>二级代理</strong>
              <span>维护下属二级与登录账号 · ${l2Count} 个</span>
            </span>
            <span class="mini-mine-entry-arrow">›</span>
          </button>
          <button type="button" class="mini-mine-entry" data-go="mini-mine-sub">
            <span class="mini-mine-entry-text">
              <strong>子账号</strong>
              <span>仅扫码权限 · ${subCount} 个</span>
            </span>
            <span class="mini-mine-entry-arrow">›</span>
          </button>`);
    }
    if (ui.role === 'l1' || ui.role === 'l2') {
      entries.push(`<button type="button" class="mini-mine-entry" data-go="mini-mine-customers">
            <span class="mini-mine-entry-text">
              <strong>客户</strong>
              <span>C 端客户信息 · ${customerCount} 位</span>
            </span>
            <span class="mini-mine-entry-arrow">›</span>
          </button>`);
    }
    return `<div class="mini-mine-page">
      <div class="mini-mine-main">
        <div class="mini-page-title">我的</div>
        <div class="mini-profile">
          <span class="user-avatar">${r.avatar}</span>
          <div><strong>${escapeHtml(r.name)}</strong><div style="font-size:12px;color:var(--text-3)">${escapeHtml(r.account)}</div></div>
        </div>
        ${entries.length
          ? `<div class="mini-mine-entries">${entries.join('')}</div>`
          : `<div class="mini-mine-block"><p class="mini-page-desc" style="margin:0">账号信息与演示操作</p></div>`}
      </div>
      <div class="mini-mine-footer">
        <button class="btn btn-block" data-action="logout">退出登录</button>
        <button class="btn btn-block" data-action="reset-demo">重置演示数据</button>
      </div>
    </div>`;
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
    'mini-mine': pageMiniMine, 'mini-mine-l2': pageMiniMineL2, 'mini-mine-sub': pageMiniMineSub,
    'mini-mine-customers': pageMiniMineCustomers,
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

  /** 选项是否已全部勾选（用于全选按钮高亮） */
  function isAllSelected(options, selected) {
    const opts = options || [];
    if (!opts.length) return false;
    const set = new Set(selected || []);
    return opts.every((x) => set.has(x));
  }

  /** 全选/取消全选按钮：全选态用主题底色，文案切为「取消全选」 */
  function selectAllBtn(action, label, allOn) {
    const text = allOn ? '取消全选' : (label || '全选');
    return `<button type="button" class="btn btn-sm select-all-btn ${allOn ? 'btn-primary on' : ''}" data-action="${action}" aria-pressed="${allOn ? 'true' : 'false'}">${escapeHtml(text)}</button>`;
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
      if (editing) {
        const mainOpts = ALL_REGIONS.filter((r) => !occ.has(r) || (a.mainAreas || []).includes(r));
        const saleSel = a.saleAreas || a.areas || [];
        const directOpts = saleSel.flatMap((r) => CITY_MAP[r] || []);
        body = `<div class="form-grid">
          <div class="form-field"><label>名称</label><input class="field-input" id="f-name" value="${escapeHtml(a.name)}" /></div>
          <div class="form-field"><label>联系人</label><input class="field-input" id="f-contact" value="${escapeHtml(a.contact)}" /></div>
          <div class="form-field span-2"><label>主授权区域（多选） ${selectAllBtn('select-all-main', '全选全国', isAllSelected(mainOpts, a.mainAreas))}</label>${chips(ALL_REGIONS, a.mainAreas||[], 'data-toggle-main', occ)}</div>
          <div class="form-field span-2"><label>可销售范围 ${selectAllBtn('select-all-sale', '全选', isAllSelected(ALL_REGIONS, saleSel))}</label>${chips(ALL_REGIONS, saleSel, 'data-toggle-sale')}</div>
          <div class="form-field span-2"><label>直销范围（城市） ${selectAllBtn('select-all-direct', '全选当前可售城市', isAllSelected(directOpts, a.directAreas))}</label>${chips(directOpts, a.directAreas||[], 'data-toggle-direct')}</div>
          <div class="form-field"><label>预警倍数</label><input type="number" step="0.1" class="field-input" id="f-warn" value="${a.warnMultiplier||1.5}" /></div>
          <div class="form-field"><label>报警粒度</label><select class="field-input" id="f-warn-mode">
            <option value="strict" ${(a.warnMode||'strict')==='strict'?'selected':''}>严格（强制处理）</option>
            <option value="soft" ${a.warnMode==='soft'?'selected':''}>软报警（仅记录）</option>
          </select></div>
        </div><h4>企业信息</h4>${entFieldsHtml(a.ent)}`;
      } else {
        body = `<div class="detail-grid">
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
      }
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
        <div class="form-field span-2"><label>主授权区域（多选） ${selectAllBtn('select-all-main', '全选全国', isAllSelected(ALL_REGIONS.filter((r)=>!occupiedMainAreas().has(r)), d.mainAreas))}</label>${chips(ALL_REGIONS, d.mainAreas||[], 'data-toggle-main', occupiedMainAreas())}</div>
        <div class="form-field span-2"><label>可销售范围 ${selectAllBtn('select-all-sale', '全选', isAllSelected(ALL_REGIONS, d.saleAreas))}</label>${chips(ALL_REGIONS, d.saleAreas||[], 'data-toggle-sale')}</div>
        <div class="form-field span-2"><label>直销范围（城市） ${selectAllBtn('select-all-direct', '全选当前可售城市', isAllSelected((d.saleAreas||[]).flatMap((r)=>CITY_MAP[r]||[]), d.directAreas))}</label>${chips((d.saleAreas||[]).flatMap((r)=>CITY_MAP[r]||[]), d.directAreas||[], 'data-toggle-direct')}${!(d.saleAreas||[]).length?'<p class="muted" style="margin-top:6px">请先选择可销售范围，再全选直销城市</p>':''}</div>
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
          <div class="form-field span-2"><label>围栏城市 ${selectAllBtn('select-all-city', '全选', isAllSelected(cities.length?cities:['杭州市'], a.areas))}</label>${chips(cities.length?cities:['杭州市'], a.areas||[], 'data-toggle-city')}</div>
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
          <div><span>报警</span>${a.exNoAlarm ? tag('异常不报警', 'gray') : (a.warnMultiplier || a.warnMode ? `${a.warnMultiplier || '继承'}× / ${a.warnMode || '继承'}` : '继承一级')}</div>
        </div>${a.ent?`<h4>企业</h4><div class="detail-grid"><div class="span-2">${escapeHtml(a.ent.company||'')}</div></div>`:''}
        ${a.exNoAlarm ? '<p class="muted" style="margin-top:8px">该二级已设「异常不报警」：新异常只记录且默认已处理，不推送未处理预警。</p>' : ''}`;
      foot = editing
        ? `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-l2">保存</button>`
        : `<button class="btn" data-action="close-modal">关闭</button>
           <button class="btn" data-action="edit-l2" data-id="${a.id}">编辑</button>
           <button class="btn" data-action="toggle-l2" data-id="${a.id}">${a.status==='启用'?'停用':'启用'}</button>
           ${a.exNoAlarm
             ? `<button class="btn" data-action="l2-ex-alarm-on" data-id="${a.id}">恢复异常报警</button>`
             : `<button class="btn" data-action="l2-ex-no-alarm-one" data-id="${a.id}">异常不报警</button>`}
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
      const cityOpts = cities.length ? cities : [];
      const rawAreas = Array.isArray(d.areas) && d.areas.length
        ? d.areas
        : [...(a.prevAreas || a.areas || [])];
      d.areas = rawAreas.filter((c) => cityOpts.includes(c));
      ui.modal.draft = d;
      const dropped = rawAreas.filter((c) => !cityOpts.includes(c));
      title = `重新绑定 · ${a.name}`;
      body = `<div class="form-field"><label>绑定一级</label>
        <select class="field-input" id="f-parent">${db.agentsL1.filter((x)=>x.status==='启用').map((x)=>`<option value="${x.id}" ${x.id===d.parentId?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>授权城市（点击多选） ${selectAllBtn('select-all-city', '全选', isAllSelected(cityOpts, d.areas))}</label>
        ${cityOpts.length
          ? chips(cityOpts, d.areas || [], 'data-toggle-city')
          : '<p class="muted" style="margin-top:6px">该一级暂无可售城市，请先在一级详情维护可销售范围</p>'}
        ${dropped.length ? `<p class="muted" style="margin-top:6px">原城市「${escapeHtml(dropped.join('、'))}」不在当前一级可售范围内，已取消勾选</p>` : ''}
        <p class="muted" style="margin-top:6px">切换绑定一级后，可选城市会随一级可销售范围更新</p>
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
    } else if (type === 'view-stock') {
      const row = getStockSummaryRows({}).find((r) => r.id === payload.id)
        || getStockSummaryRows(ui.filters.stock || {}).find((r) => r.id === payload.id);
      if (!row) {
        title = '库存详情';
        body = emptyHint('未找到该库存行');
        foot = `<button class="btn" data-action="close-modal">关闭</button>`;
      } else {
        const flow = stockRowLogs(row);
        title = `库存详情 · ${productName(row.productId)}`;
        body = `<div class="detail-grid">
          <div><span>商品</span>${escapeHtml(productName(row.productId))}</div>
          <div><span>规格</span>${escapeHtml(stockSpecText(row.size, row.belt))}</div>
          <div><span>一级代理名称</span>${escapeHtml(l1Name(row.l1Id))}</div>
          <div><span>二级代理名称</span>${escapeHtml(row.l2Id ? l2Name(row.l2Id) : '—')}</div>
          <div><span>数量</span><strong class="num">${row.qty}</strong></div>
          <div><span>层级</span>${tag(row.agentType === 'l2' ? '二级在库' : '一级在库', row.agentType === 'l2' ? 'blue' : 'green')}</div>
        </div>
        <h4 style="margin-top:12px">流水（${flow.length}）</h4>
        <div class="page-card table-wrap"><table class="data">
          <thead><tr><th>时间</th><th>代理</th><th>变动</th><th>原因</th><th>单号</th></tr></thead>
          <tbody>${flow.map((h)=>`<tr>
            <td>${escapeHtml(h.time)}</td>
            <td>${escapeHtml(h.agentType==='l1'?l1Name(h.agentId):l2Name(h.agentId))}</td>
            <td class="num">${h.delta>0?'+':''}${h.delta}</td>
            <td>${escapeHtml(h.reason)}</td>
            <td>${escapeHtml(h.ref||'—')}</td>
          </tr>`).join('') || `<tr><td colspan="5">${emptyHint('暂无流水')}</td></tr>`}</tbody>
        </table></div>
        <h4 style="margin-top:12px">SN码（${row.sns.length}）</h4>
        <p class="muted" style="margin:0 0 8px">${ui.mode === 'mini' ? '点击 SN 查看详情' : '点击 SN 跳转码库并按该码筛选'}</p>
        <div class="page-card table-wrap"><table class="data">
          <thead><tr><th>SN</th><th>规格</th><th>状态</th><th></th></tr></thead>
          <tbody>${row.sns.map((sn)=>{
            const s = db.sns.find((x) => x.sn === sn);
            const st = snStatusMeta(s);
            const snBtn = ui.mode === 'mini'
              ? `<button type="button" class="btn btn-sm btn-ghost" data-action="open-view-sn" data-id="${escapeHtml(sn)}" style="font-family:var(--font-num)">${escapeHtml(sn)}</button>`
              : `<button type="button" class="btn btn-sm btn-ghost" data-action="goto-sn-one" data-sn="${escapeHtml(sn)}" style="font-family:var(--font-num)">${escapeHtml(sn)}</button>`;
            return `<tr>
              <td>${snBtn}</td>
              <td>${escapeHtml(stockSpecText(s?.size || row.size, s?.belt || row.belt))}</td>
              <td>${tag(st.label, st.tone)}</td>
              <td class="ops"><button class="btn btn-sm" data-action="open-view-sn" data-id="${escapeHtml(sn)}">详情</button></td>
            </tr>`;
          }).join('') || `<tr><td colspan="4">${emptyHint('暂无 SN')}</td></tr>`}</tbody>
        </table></div>`;
        foot = ui.mode === 'mini'
          ? `<button class="btn" data-action="close-modal">关闭</button>
            <button class="btn btn-primary" data-action="goto-mini-stock-sn" data-size="${escapeHtml(row.size || '')}" data-belt="${escapeHtml(row.belt || '')}">查看在库 SN</button>`
          : `<button class="btn" data-action="close-modal">关闭</button>
            <button class="btn btn-primary" data-action="goto-sn-filtered" data-product="${escapeHtml(row.productId || '')}" data-l1="${escapeHtml(row.l1Id || '')}" data-l2="${escapeHtml(row.l2Id || '')}" data-size="${escapeHtml(row.size || '')}" data-belt="${escapeHtml(row.belt || '')}" data-status="${row.agentType === 'l2' ? 'l2' : 'l1'}">在 SN 码库查看</button>`;
      }
    } else if (type === 'view-sale') {
      const s = db.sales.find((x) => x.id === payload.id);
      title = `销售单 ${s.no}`;
      body = saleDetailHtml(s);
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        ${s.status === 'scanning' && ui.role !== 'l2' ? `<button class="btn btn-primary" data-action="mini-open-scan-so" data-id="${s.id}">去扫码</button>` : ''}`;
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
      body = returnDetailHtml(r);
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        ${canAuditReturn(r) ? `<button class="btn btn-primary" data-action="approve-return" data-id="${r.id}">审核通过</button>
        <button class="btn btn-danger" data-action="reject-return" data-id="${r.id}">驳回</button>` : ''}`;
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
      const st = a.auditStatus === 'pending' ? tag('待审核', 'orange')
        : a.auditStatus === 'rejected' ? tag('已驳回', 'red')
        : tag('已通过', 'green');
      const acc = db.accounts.find((x) => x.roleId === 'R4' && x.agentId === a.id);
      title = `二级审核详情 · ${a.name}`;
      body = `<div class="detail-grid">
        <div><span>编码</span>${escapeHtml(a.code)}</div>
        <div><span>类型</span>${escapeHtml(a.type)}</div>
        <div><span>申请一级</span>${escapeHtml(l1Name(a.parentId))}</div>
        <div><span>城市</span>${escapeHtml((a.areas||[]).join('、'))}</div>
        <div><span>登录账号</span>${escapeHtml(acc?.username || '—')}</div>
        <div><span>状态</span>${st}</div>
      </div>${a.ent?`<h4>企业</h4><div class="detail-grid"><div class="span-2">${escapeHtml(a.ent.company||'')}</div></div>`:''}`;
      foot = `<button class="btn" data-action="close-modal">关闭</button>
        ${a.auditStatus === 'pending' ? `<button class="btn btn-primary" data-action="audit-l2-ok" data-id="${a.id}">通过</button>
        <button class="btn btn-danger" data-action="audit-l2-reject" data-id="${a.id}">驳回</button>` : ''}`;
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
        <div class="alert alert-info">逐个扫码或输入单个 SN 添加</div>
        <div class="form-field"><label>扫描 SN</label><input class="field-input" id="scan-sn-input" placeholder="输入单个 SN 回车或点添加" /></div>
        <button class="btn btn-primary btn-block" data-action="scan-add-sn" data-id="${s.id}">添加</button>
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
      const isSingle = poProd?.type === 'single';
      const stdKits = isSingle ? [] : kitStdCombos(poProd);
      const bandOpts = (poProd?.sizes?.length) ? poProd.sizes : BAND_SIZES;
      const beltOpts = (poProd?.belts?.length) ? poProd.belts : BELTS;
      const customs = isSingle ? [] : (ui.modal.draft.customLines || []).map((c) => ({
        ...c,
        size: bandOpts.includes(c.size) ? c.size : bandOpts[0],
        belt: beltOpts.includes(normalizeBelt(c.belt)) ? normalizeBelt(c.belt) : beltOpts[0],
      }));
      ui.modal.draft.customLines = customs;
      const aName = productCompAName(poProd);
      const bName = productCompBName(poProd);
      body = `<div class="alert alert-info">${escapeHtml(productComboNote(poProd))}</div>
        <div class="form-grid">
        <div class="form-field span-2"><label>商品</label><select class="field-input" id="f-pid">${kits.map((p)=>`<option value="${p.id}" ${p.id===poPid?'selected':''}>${escapeHtml(p.name)}${p.type==='single'?'（单品）':''}</option>`).join('')}</select></div>
        ${isSingle
          ? bandOpts.map((s)=>`<div class="form-field"><label>尺码 ${escapeHtml(s)}</label><input type="number" class="field-input" data-size-qty="${s}" data-std-belt="" value="0" /></div>`).join('') || `<p class="muted span-2">请先维护单品尺码</p>`
          : (stdKits.map((k)=>`<div class="form-field"><label>标准 ${escapeHtml(k.label)}</label><input type="number" class="field-input" data-size-qty="${k.size}" data-std-belt="${k.belt}" value="0" /></div>`).join('') || `<p class="muted span-2">该商品未配置可用标品组合</p>`)}
        </div>
        ${isSingle ? '' : `
        <h4 style="margin-top:12px">非标（可多款） <button type="button" class="btn btn-sm btn-primary" data-action="po-draft-add-custom">+ 新增非标行</button></h4>
        <div class="page-card table-wrap"><table class="data">
          <thead><tr><th>${escapeHtml(bName)}</th><th>${escapeHtml(aName)}</th><th>数量</th><th></th></tr></thead>
          <tbody>${customs.map((c,i)=>`<tr>
            <td><select class="field-input" data-po-custom-size="${i}">${bandOpts.map((s)=>`<option value="${s}" ${s===c.size?'selected':''}>${s}</option>`).join('')}</select></td>
            <td><select class="field-input" data-po-custom-belt="${i}">${beltOpts.map((s)=>`<option value="${s}" ${s===normalizeBelt(c.belt)?'selected':''}>${s}</option>`).join('')}</select></td>
            <td><input type="number" class="field-input" data-po-custom-qty="${i}" value="${c.qty||0}" /></td>
            <td><button class="btn btn-sm" data-action="po-draft-del-custom" data-idx="${i}">删除</button></td>
          </tr>`).join('') || `<tr><td colspan="4">${emptyHint('点击「新增非标行」')}</td></tr>`}</tbody>
        </table></div>`}
        <div class="form-field" style="margin-top:10px"><label>选配配件（无 SN）</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <label>腰带配件 <input type="number" class="field-input" id="f-part-belt" value="0" style="width:80px" /></label>
            <label>主体硅胶带 <input type="number" class="field-input" id="f-part-qty" value="0" style="width:80px" /></label>
          </div>
        </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="create-po-ok">提交</button>`;
    } else if (type === 'edit-product' || type === 'create-product') {
      const cur = draft || db.products.find((x) => x.id === payload.id) || { type: payload.ptype || 'kit', sizes: [...BAND_SIZES], belts: [...BELTS], status: '上架' };
      if (!ui.modal.draft) ui.modal.draft = cur;
      const d = ui.modal.draft;
      const isKit = (d.type || 'kit') === 'kit';
      const isSingle = d.type === 'single';
      let comps = [];
      if (isKit) {
        comps = productComponents(d);
        if (!Array.isArray(d.stdCombos)) d.stdCombos = ensureProductStdCombos(d);
        else pruneStdCombos(d);
        comps = productComponents(d);
      } else if (isSingle) {
        const pool = uniqueSizes(d.sizePool || d.sizes || ['S', 'M', 'L']);
        let sizes = uniqueSizes(d.sizes || []).filter((s) => pool.includes(s));
        if (!sizes.length) sizes = [...pool];
        d.sizePool = pool;
        d.sizes = sizes;
      }
      const combos = isKit ? (d.stdCombos || []).map((k) => normalizeStdCombo(d, k)) : [];
      d.stdCombos = isKit ? combos : d.stdCombos;
      const typeTitle = isKit ? '套件' : (isSingle ? '单品' : '配件');
      const singlePool = isSingle ? (d.sizePool || d.sizes || []) : [];
      const singleSizes = isSingle ? (d.sizes || []) : [];
      title = type === 'edit-product' ? `修改商品 · ${d.name || ''}` : `新建${typeTitle}`;
      const kitCompsHtml = comps.map((c, ci) => {
        const pool = c.pool || [];
        const selected = c.sizes || [];
        const allOn = isAllSelected(pool, selected);
        return `<div class="form-field span-2" style="border:1px solid var(--border,#e8e8e8);border-radius:8px;padding:12px;margin-top:4px">
          <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
            <div class="form-field" style="flex:1;min-width:180px;margin:0"><label>组件 ${ci + 1} 名称</label>
              <input class="field-input" data-comp-name="${ci}" value="${escapeHtml(c.name)}" placeholder="如：腰带 / 袜子 / 包装" /></div>
            ${comps.length > 2 ? `<button type="button" class="btn btn-sm" data-action="product-del-comp" data-idx="${ci}">删除组件</button>` : ''}
          </div>
          <div style="margin-top:10px"><label>${escapeHtml(c.name || ('组件' + (ci + 1)))}尺码 ${selectAllBtn('select-all-comp-size', '全选', allOn).replace('data-action="select-all-comp-size"', `data-action="select-all-comp-size" data-idx="${ci}"`)}</label>
            ${chips(pool, selected, 'data-toggle-comp-size').replace(/data-toggle-comp-size="/g, `data-toggle-comp-size="${ci}|`)}
            <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
              <input class="field-input" data-add-comp-size="${ci}" placeholder="新增尺码，如 S / 42号" style="flex:1" />
              <button type="button" class="btn btn-sm btn-primary" data-action="product-add-comp-size" data-idx="${ci}">+ 添加尺码</button>
            </div>
          </div>
        </div>`;
      }).join('');
      const stdHead = `<th>档位</th>${comps.map((c) => `<th>${escapeHtml(c.name)}</th>`).join('')}<th>组合说明</th><th></th>`;
      const stdRows = combos.map((k, i) => {
        const picks = k.picks || {};
        const sels = comps.map((c) => `<td><select class="field-input" data-std-pick="${i}" data-comp-id="${escapeHtml(c.id)}">${(c.sizes || []).map((s) => `<option value="${escapeHtml(s)}" ${picks[c.id] === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}</select></td>`).join('');
        return `<tr>
          <td><input class="field-input" data-std-grade="${i}" value="${escapeHtml(k.grade || '')}" style="width:72px" /></td>
          ${sels}
          <td class="muted">${escapeHtml(k.label || '')}</td>
          <td><button type="button" class="btn btn-sm" data-action="product-del-std" data-idx="${i}">删除</button></td>
        </tr>`;
      }).join('') || `<tr><td colspan="${comps.length + 3}">${emptyHint('暂无标品（取消勾选尺码后，无效组合会自动移除）')}</td></tr>`;
      const stdAdd = `<div class="form-grid" style="margin-top:10px">
        <div class="form-field"><label>档位</label><input class="field-input" id="f-std-grade" placeholder="小/中/大" value="中" /></div>
        ${comps.map((c) => `<div class="form-field"><label>${escapeHtml(c.name)}</label><select class="field-input" id="f-std-pick-${escapeHtml(c.id)}">${(c.sizes || []).map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}</select></div>`).join('')}
        <div class="form-field" style="display:flex;align-items:flex-end"><button type="button" class="btn btn-primary btn-block" data-action="product-add-std">+ 添加标品</button></div>
      </div>`;
      body = `<div class="form-grid">
        <div class="form-field"><label>编码</label><input class="field-input" id="f-pcode" value="${escapeHtml(d.code || '')}" /></div>
        <div class="form-field"><label>商品名称</label><input class="field-input" id="f-pname" value="${escapeHtml(d.name || '')}" placeholder="${isSingle ? '如：护膝单品' : '如：袜子+鞋套套件'}" /></div>
        <div class="form-field"><label>状态</label><select class="field-input" id="f-pstatus"><option value="上架" ${(d.status || '上架') === '上架' ? 'selected' : ''}>上架</option><option value="下架" ${d.status === '下架' ? 'selected' : ''}>下架</option></select></div>
        <div class="form-field"><label>说明</label><input class="field-input" id="f-pnote" value="${escapeHtml(d.note || '')}" /></div>
        ${isKit ? `
          <div class="form-field span-2"><div class="alert alert-info" style="margin:0">可配置多个组件：先命名并勾选尺码，再配置「标准套件」组合。全选/取消全选只改勾选，不会删掉已添加的尺码。未列入标品的组合，下单时走非标（前两组件）。</div></div>
          ${kitCompsHtml}
          <div class="form-field span-2"><button type="button" class="btn" data-action="product-add-comp">+ 添加组件</button></div>
          <div class="form-field span-2"><label>标准套件组合（随上方已选尺码动态展示）
            <button type="button" class="btn btn-sm" data-action="product-gen-std" style="margin-left:8px">按当前尺码生成默认标品</button>
          </label>
            <div class="page-card table-wrap" style="margin-top:6px"><table class="data">
              <thead><tr>${stdHead}</tr></thead>
              <tbody>${stdRows}</tbody>
            </table></div>
            ${stdAdd}
          </div>` : isSingle ? `
          <div class="form-field span-2"><div class="alert alert-info" style="margin:0">单品：仅维护尺码规格，下单按尺码数量；生成 SN，无双组件/标品组合。</div></div>
          <div class="form-field span-2"><label>规格尺码 ${selectAllBtn('select-all-psize', '全选', isAllSelected(singlePool, singleSizes))}</label>
            ${chips(singlePool, singleSizes, 'data-toggle-psize')}
            <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
              <input class="field-input" id="f-add-bsize" placeholder="新增尺码，如 XL" style="flex:1" />
              <button type="button" class="btn btn-sm btn-primary" data-action="product-add-bsize">+ 添加尺码</button>
            </div>
          </div>` : `<div class="form-field span-2"><label>规格尺码（逗号分隔）</label><input class="field-input" id="f-psizes" value="${escapeHtml((d.sizes || []).join(','))}" placeholder="S,M,L" /></div>`}
      </div>`;
      foot = `<button class="btn" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="save-product">${type === 'edit-product' ? '保存' : '创建'}</button>`;

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
      const isSingle = cartProd?.type === 'single';
      const stdKits = isSingle ? [] : kitStdCombos(cartProd);
      const singleSizes = isSingle ? productSizes(cartProd) : [];
      const nonstdOpts = isSingle ? [] : nonstdGradesForProduct(cartProd);
      if (!nonstdOpts.some((g) => g.id === d.nonstdGrade)) d.nonstdGrade = nonstdOpts[0]?.id || '小';
      const bands = nonstdBandsForProductGrade(cartProd, d.nonstdGrade);
      if (isSingle) {
        Object.keys(d.stdQty).forEach((k) => { if (!singleSizes.includes(k)) delete d.stdQty[k]; });
        d.customRows = [];
      } else {
        Object.keys(d.stdQty).forEach((k) => { if (!stdKits.some((x) => x.key === k)) delete d.stdQty[k]; });
        d.customRows = d.customRows.filter((r) => {
          const g = nonstdOpts.find((x) => x.belt === normalizeBelt(r.belt) || x.id === r.grade);
          return g && g.bands.includes(r.size);
        });
      }
      const l2Options = db.agentsL2.filter((a) => a.parentId === currentL1Id() && !a.pending);
      const aName = productCompAName(cartProd);
      const bName = productCompBName(cartProd);
      title = channel === 'sales' ? '提交销售单（购物车）' : '提交采购单（购物车）';
      body = `<div class="alert alert-info">${escapeHtml(productComboNote(cartProd))}</div>
        <div class="form-grid">
          <div class="form-field span-2"><label>商品名称</label><select class="field-input" id="f-cart-pid">${kits.map((p)=>`<option value="${p.id}" ${p.id===cartPid?'selected':''}>${escapeHtml(p.name)}${p.type==='single'?'（单品）':''}</option>`).join('')}</select></div>
          ${channel==='sales'?`<div class="form-field span-2"><label>二级代理</label><select class="field-input" id="f-cart-l2">${l2Options.map((a)=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}${l2Options.length?'':'<option value="">暂无可选二级</option>'}</select></div>`:''}
        </div>
        ${isSingle ? `
        <h4>尺码数量（${singleSizes.length}）</h4>
        <div class="form-grid">
          ${singleSizes.map((s)=>`<div class="form-field"><label>${escapeHtml(s)}</label>
            <input type="number" class="field-input" data-std-key="${s}" data-std-size="${s}" data-std-belt="" value="${d.stdQty[s]||0}" min="0" /></div>`).join('') || `<p class="muted">该单品未维护尺码</p>`}
        </div>` : `
        <h4>标准套件（${stdKits.length}）</h4>
        <div class="form-grid">
          ${stdKits.map((k)=>`<div class="form-field"><label>${escapeHtml(k.label)}</label>
            <input type="number" class="field-input" data-std-key="${k.key}" data-std-size="${k.size}" data-std-belt="${k.belt}" value="${d.stdQty[k.key]||0}" min="0" /></div>`).join('') || `<p class="muted">该商品未配置可用标品组合，请先在商品库添加标品</p>`}
        </div>
        <h4 style="margin-top:14px">非标套件</h4>
        ${nonstdOpts.length ? `<div class="form-grid">
          <div class="form-field"><label>${escapeHtml(aName)}</label>
            <select class="field-input" id="f-cart-c-grade">
              ${nonstdOpts.map((g)=>`<option value="${g.id}" ${d.nonstdGrade===g.id?'selected':''}>${escapeHtml(nonstdGradeOptionLabel(cartProd, g))}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>${escapeHtml(bName)}</label>
            <select class="field-input" id="f-cart-c-size">${bands.map((s)=>`<option value="${s}">${escapeHtml(s)}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>数量</label><input type="number" class="field-input" id="f-cart-c-qty" value="1" min="1" /></div>
        </div>
        <p class="muted" style="margin:6px 0">非标仅展示「本商品已维护尺码」中排除标品后的组合。可多次添加。</p>
        <button class="btn btn-sm btn-primary" data-action="cart-add-custom">+ 添加</button>` : `<p class="muted">该商品无可下非标组合（${escapeHtml(aName)}/${escapeHtml(bName)}尺码不足）</p>`}
        <div class="segment-rows" style="margin-top:8px">${d.customRows.map((r,i)=>`<div class="segment-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border,#eee)">
          <span>已添加：${escapeHtml(customComboLabel(r.belt, r.size, cartProd))} ×${r.qty}</span>
          <button type="button" class="btn btn-sm" data-action="cart-del-custom" data-idx="${i}">删除</button>
        </div>`).join('') || emptyHint('暂无非标，点「+ 添加」')}</div>`}
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
    } else if (type === 'view-customer') {
      const c = (db.customers || []).find((x) => x.id === payload.id);
      if (!c) {
        title = '客户详情';
        body = emptyHint('未找到该客户');
        foot = `<button class="btn" data-action="close-modal">关闭</button>`;
      } else {
        title = `客户详情 · ${c.phone || c.name || c.id}`;
        body = customerDetailHtml(c);
        foot = `<button class="btn" data-action="close-modal">关闭</button>
          <button class="btn" data-action="open-edit-customer" data-id="${escapeHtml(c.id)}">编辑</button>
          <button class="btn btn-danger" data-action="delete-customer" data-id="${escapeHtml(c.id)}">删除</button>`;
      }
    } else if (type === 'create-customer' || type === 'edit-customer') {
      const editing = type === 'edit-customer';
      const c = editing
        ? ((db.customers || []).find((x) => x.id === payload.id) || ui.modal.draft || {})
        : (ui.modal.draft || {});
      title = editing ? `编辑客户 · ${c?.phone || c?.name || c?.id || ''}` : '新建客户';
      body = customerFormHtml(c || {});
      foot = `<button class="btn" data-action="close-modal">取消</button>
        <button class="btn btn-primary" data-action="${editing ? 'save-customer' : 'create-customer-ok'}" ${editing ? `data-id="${escapeHtml(c?.id || '')}"` : ''}>${editing ? '保存' : '创建'}</button>`;
    } else if (type === 'create-return') {
      const cend = payload.mode === 'cend';
      const draft = ui.modal.draft || {};
      const snsText = draft.snsText || '';
      const reasonType = draft.reasonType || (cend ? '投诉' : '');
      title = cend ? '创建C端用户退货单' : '申请退货';
      body = `<div class="form-field"><label>理由类型</label><select class="field-input" id="f-rtype">${RETURN_REASONS.map((r)=>`<option value="${r.type}" ${reasonType===r.type?'selected':''}>${r.label}</option>`).join('')}</select></div>
        <div class="form-field"><label>说明</label><input class="field-input" id="f-reason" placeholder="可手写补充" value="${escapeHtml(draft.reason || '')}" /></div>
        ${returnSnDetailHtml(snsText)}
        <div class="form-field"><label>SN（逗号分隔）</label><input class="field-input" id="f-sns" placeholder="RL..." value="${escapeHtml(snsText)}" /></div>
        <div class="form-field"><label>类型</label>${cend
          ? `<input class="field-input" value="用户退货再入库" readonly /><input type="hidden" id="f-ttype" value="user" />`
          : `<select class="field-input" id="f-ttype">
          ${ui.role==='l2'?`<option value="l2_to_l1">二级退一级</option><option value="user">用户退货再入库</option>`:`<option value="l1_to_factory">一级退原厂</option><option value="user">用户退货再入库</option>`}
        </select>`}</div>`;
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
    } else if (type === 'create-l2-mini' || type === 'edit-l2-mini') {
      const editing = type === 'edit-l2-mini';
      const d = draft || {};
      d.type = d.type || '个人';
      d.areas = d.areas || [];
      d.ent = d.ent || {};
      const cities = citiesForL1(currentL1Id());
      const cityOpts = cities.length ? cities : ['杭州市'];
      const acc = editing ? (db.accounts.find((x) => x.roleId === 'R4' && x.agentId === d.id) || {}) : {};
      title = editing ? `编辑二级 · ${d.name || ''}` : '创建二级代理';
      body = `<div class="form-grid">
        <div class="form-field"><label>名称</label><input class="field-input" id="f-l2-name" value="${escapeHtml(d.name || '')}" placeholder="如 杭州城西专营" /></div>
        <div class="form-field"><label>类型</label>
          <select class="field-input" id="f-l2-type">
            <option value="个人" ${d.type==='个人'?'selected':''}>个人</option>
            <option value="法人" ${d.type==='法人'?'selected':''}>法人</option>
          </select>
        </div>
        ${editing ? `<div class="form-field"><label>状态</label>
          <select class="field-input" id="f-l2-status">
            <option value="启用" ${d.status!=='停用'?'selected':''}>启用</option>
            <option value="停用" ${d.status==='停用'?'selected':''}>停用</option>
          </select></div>
          <div class="form-field"><label>编码</label><input class="field-input" value="${escapeHtml(d.code || '')}" readonly /></div>` : ''}
        <div class="form-field span-2"><label>围栏城市 ${selectAllBtn('select-all-city', '全选', isAllSelected(cityOpts, d.areas))}</label>
          ${chips(cityOpts, d.areas || [], 'data-toggle-city')}
          ${!cities.length ? '<p class="muted" style="margin-top:6px">一级无可售城市，请先在后台维护一级可销售范围</p>' : ''}
        </div>
        <div class="form-field"><label>登录用户名</label><input class="field-input" id="f-l2-user" value="${escapeHtml(d.username || acc.username || '')}" placeholder="如 hz_agent" /></div>
        <div class="form-field"><label>${editing ? '登录密码（留空不改）' : '登录密码'}</label><input class="field-input" id="f-l2-pass" type="password" value="${editing ? '' : '******'}" placeholder="${editing ? '不修改请留空' : ''}" /></div>
      </div>
      ${d.type === '法人' ? `<h4 style="margin-top:12px">企业信息</h4>${entFieldsHtml(d.ent || {})}` : '<p class="muted" style="margin-top:8px">个人类型无需填写企业信息。</p>'}
      <p class="muted" style="margin-top:8px">${editing ? '保存后同步更新二级登录账号。' : '创建后进入平台「二级审核」，通过后方可正常使用。'}</p>`;
      foot = `<button class="btn" data-action="close-modal">取消</button>
        <button class="btn btn-primary" data-action="${editing ? 'save-l2-mini' : 'create-l2-mini-ok'}" ${editing ? `data-id="${d.id}"` : ''}>${editing ? '保存' : '创建'}</button>`;
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

    const wide = type === 'audit-po' || type === 'view-sn' || type === 'edit-sn' || type === 'view-agent-l1' || type === 'edit-l1' || type === 'view-agent-l2' || type === 'edit-l2' || type === 'order-cart' || type === 'view-exception' || type === 'create-product' || type === 'edit-product' || type === 'view-stock' || type === 'view-return' || type === 'view-customer' || type === 'create-customer' || type === 'edit-customer';
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

  /** 直销激活预检：硬错误阻断；软异常需二次确认后再记异常并激活 */
  function analyzeDirectBind(sn, phone, addr, ipRegion) {
    const row = db.sns.find((x) => x.sn === sn);
    if (!row) return { err: 'SN 不存在' };
    if (row.frozen || row.status === 'frozen') return { err: '冷冻库 SN 不可扫码' };
    if (!['l1', 'l2'].includes(row.status) && !(row.status === 'bound' && row.reIn && row.resale)) {
      return { err: `当前状态不可直销：${snStatusMeta(row).label}` };
    }
    const l1 = db.agentsL1.find((a) => a.id === (currentL1Id() || row.l1Id));
    if (!l1) return { err: '未找到一级代理' };
    if (!phone) return { err: '请填写手机号' };
    const phonePrefix = String(phone).slice(0, 3);
    const phoneLoc = PHONE_LOC[phonePrefix] || '未知';
    const ipInDirect = (l1.directAreas || []).some((c) => (CITY_MAP[ipRegion] || []).includes(c));
    const ipPass = ipInDirect || ((l1.directAreas || []).length === 0 && (l1.saleAreas || l1.areas || []).includes(ipRegion));
    const exOpts = { l2Id: row.l2Id || (ui.role === 'l2' ? currentL2Id() : null) || undefined };
    const issues = [];
    if (!ipPass) {
      issues.push({ type: 'SN激活异常', detail: `跨区激活：IP ${ipRegion} 不在直销围栏 ${(l1.directAreas || []).join('、') || '（未配置）'}`, dim: 'activate', opts: { ...exOpts } });
    }
    const phonePass = phoneLoc !== '未知' && phoneLoc === ipRegion;
    if (!phonePass) {
      issues.push({ type: '归属地异常', detail: `手机归属 ${phoneLoc} 与 IP 地区 ${ipRegion} 不一致`, dim: 'activate', opts: { ...exOpts } });
    }
    const dup = db.sns.filter((s) => s.user && s.user.phone === phone && s.sn !== sn);
    if (dup.length) {
      issues.push({ type: '客户信息重复', detail: `手机号 ${phone} 已激活 ${dup.length} 次`, dim: 'activate', opts: { ...exOpts, dupPhone: phone } });
    }
    const addrNorm = String(addr || '').replace(/\s+/g, '');
    if (addrNorm) {
      const addrDup = db.sns.filter((s) => s.user && String(s.user.addr || '').replace(/\s+/g, '') === addrNorm && s.user.phone !== phone && s.sn !== sn);
      if (addrDup.length) {
        issues.push({ type: '客户信息重复', detail: `同地址多客户：${addr} 已关联其他手机号`, dim: 'activate', opts: { ...exOpts } });
      }
    }
    return { row, l1, phoneLoc, issues };
  }

  function doDirectBind(sn, phone, addr, ipRegion) {
    const a = analyzeDirectBind(sn, phone, addr, ipRegion);
    if (a.err) return toast(a.err, 'err');
    const { row, l1, phoneLoc, issues } = a;
    (issues || []).forEach((it) => pushException(it.type, sn, it.detail, it.dim, it.opts || {}));

    row.status = 'bound';
    row.channel = row.l2Id ? 'distribute' : 'direct';
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
    addLog(`直销激活 ${sn}${issues.length ? `（异常 ${issues.length}）` : ''}`);
    ui.directStep = 1;
    ui.form.directSn = '';
    saveStore();
    toast(issues.length ? `已激活（已记录 ${issues.length} 条异常）` : '激活成功', issues.length ? 'warn' : 'ok');
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
          <div class="user-wrap">
            <button type="button" class="user" data-action="toggle-user-menu" title="账号菜单">
              <span class="user-avatar">${role.avatar}</span>
              <span class="user-name">${escapeHtml(ui.account || role.name)}</span>
              <span class="user-caret">▾</span>
            </button>
            ${ui.userMenuOpen ? `<div class="user-menu">
              <div class="user-menu-hd">
                <strong>${escapeHtml(role.name)}</strong>
                <span class="muted">${escapeHtml(ui.account || role.account || '')}</span>
              </div>
              <button type="button" class="user-menu-item user-menu-item--danger" data-action="logout">退出登录</button>
            </div>` : ''}
          </div>
        </div>
      </header>
      <div class="panel">
        <aside class="sidebar"><div class="sidebar-scroll">
          ${menus.map((g)=>`<div class="nav-group-title">${g.group}</div>${g.items.map((it)=>
            `<button class="nav-item ${ui.route===it.id?'active':''}" data-go="${it.id}">
              <span class="icon">${it.icon}</span><span>${it.title}</span>
              ${it.badge ? `<span class="menu-badge">${it.badge}</span>` : ''}
            </button>`).join('')}`).join('')}
        </div></aside>
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
    ui.userMenuOpen = false;
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
        confirmDialog('确认重置全部演示数据？当前本地改动将丢失且不可恢复。', 'reset-demo-ok', {}, { title: '重置演示数据', danger: true, okText: '确认重置' });
        break;
      case 'logout':
        confirmDialog('确认退出当前账号？', 'logout-ok', {}, { title: '退出登录', okText: '确认退出' });
        break;
      case 'close-modal': closeModal(); break;
      case 'toggle-notify':
        ui.notifyOpen = !ui.notifyOpen;
        if (ui.notifyOpen) ui.userMenuOpen = false;
        render();
        break;
      case 'toggle-user-menu':
        ui.userMenuOpen = !ui.userMenuOpen;
        if (ui.userMenuOpen) ui.notifyOpen = false;
        render();
        break;
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
        } else if (act === 'audit-l2-approve-ok') {
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
        } else if (act === 'delete-product-ok') {
          const i = db.products.findIndex((x) => x.id === pid);
          if (i >= 0) {
            const name = db.products[i].name;
            db.products.splice(i, 1);
            addLog(`删除商品 ${name}`);
            saveStore();
            toast('已删除');
          }
          render();
        } else if (act === 'create-customer-confirm-ok') {
          const form = conf.payload?.form || {};
          ensureCustomersStore(db);
          const next = (db.seq.cu = (db.seq.cu || 0) + 1);
          const row = {
            id: `CU${String(next).padStart(3, '0')}`,
            ...form,
            createdAt: nowStr(),
            updatedAt: nowStr(),
          };
          db.customers.unshift(row);
          syncCustomerToSns(row);
          addLog(`新建客户 ${row.phone || row.name || row.id}`);
          saveStore();
          ui.modal = null;
          toast('客户已创建');
          render();
        } else if (act === 'save-customer-confirm-ok') {
          const c = (db.customers || []).find((x) => x.id === pid);
          const form = conf.payload?.form || {};
          if (c) {
            Object.assign(c, form, { updatedAt: nowStr() });
            syncCustomerToSns(c);
            addLog(`编辑客户 ${c.phone || c.name || c.id}`);
            saveStore();
            toast('客户已保存');
          }
          ui.modal = null;
          render();
        } else if (act === 'delete-customer-ok') {
          const i = (db.customers || []).findIndex((x) => x.id === pid);
          if (i >= 0) {
            const c = db.customers[i];
            db.customers.splice(i, 1);
            addLog(`删除客户 ${c.phone || c.name || c.id}`);
            saveStore();
            toast('已删除客户');
          }
          ui.modal = null;
          render();
        } else if (act === 'delete-l2-mini-ok') {
          finishDeleteL2Mini(pid);
        } else if (act === 'toggle-account-ok') {
          const a = db.accounts.find((x) => x.id === pid);
          if (a) { a.status = a.status === '启用' ? '停用' : '启用'; addLog(`${a.status}账号 ${a.username}`); saveStore(); toast('已更新'); }
          render();
        } else if (act === 'toggle-sub-ok') {
          const s = db.subAccounts.find((x) => x.id === pid);
          if (s) {
            s.status = s.status === '启用' ? '停用' : '启用';
            const acc = db.accounts.find((a) => a.username === s.username);
            if (acc) acc.status = s.status;
            addLog(`${s.status}子账号 ${s.username}`); saveStore(); toast('已更新');
          }
          render();
        } else if (act === 'toggle-l2-mini-ok') {
          const a = db.agentsL2.find((x) => x.id === pid);
          if (a && a.parentId === currentL1Id()) {
            a.status = a.status === '启用' ? '停用' : '启用';
            const acc = db.accounts.find((x) => x.roleId === 'R4' && x.agentId === a.id);
            if (acc) acc.status = a.status;
            addLog(`${a.status}二级 ${a.name}`); saveStore(); toast('已更新');
          }
          render();
        } else if (act === 'reset-demo-ok') {
          localStorage.removeItem(persistKey); db = seed(); saveStore(); toast('演示数据已重置 (v6)'); render();
        } else if (act === 'logout-ok') {
          ui.loggedIn = false; persistSession(); ui.modal = null; ui.confirm = null; render();
        } else if (act === 'reassign-frozen-confirm-ok') {
          finishReassignFrozen(pid, conf.payload?.l1Id);
        } else if (act === 'cart-submit-ok') {
          finishCartSubmit(conf.payload || {});
        } else if (act === 'save-sn-ok') {
          finishSaveSn(conf.payload || {});
        } else if (act === 'gen-sn-confirm-ok') {
          finishGenSn(conf.payload || {});
        } else if (act === 'import-sn-confirm-ok') {
          finishImportSn(conf.payload || {});
        } else if (act === 'save-role-perms-ok') {
          finishSaveRolePerms(pid, conf.payload || {});
        } else if (act === 'create-po-confirm-ok') {
          finishCreatePo(conf.payload || {});
        } else if (act === 'create-return-confirm-ok') {
          finishCreateReturn(conf.payload || {});
        } else if (act === 'create-so-confirm-ok') {
          finishCreateSo(conf.payload || {});
        } else if (act === 'mini-direct-bind-ok') {
          const p = conf.payload || {};
          doDirectBind(p.sn, p.phone, p.addr, p.region);
          render();
        } else if (act === 'l2-ex-no-alarm-ok') {
          finishL2ExNoAlarm(conf.payload?.ids || []);
        } else if (act === 'l2-ex-alarm-on-ok') {
          const a = db.agentsL2.find((x) => x.id === pid);
          if (a) {
            a.exNoAlarm = false;
            addLog(`恢复二级异常报警 ${a.name}`);
            saveStore();
            toast('已恢复异常报警');
          }
          render();
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
      case 'toggle-l2-sel': {
        const map = ui.selected['agent-l2'] || (ui.selected['agent-l2'] = {});
        if (map[id]) delete map[id]; else map[id] = true;
        render(); break;
      }
      case 'toggle-l2-sel-all': {
        const f = ui.filters['agent-l2'] || {};
        let rows = db.agentsL2.filter((a) => !a.pending && a.auditStatus === 'approved');
        if (f.q) {
          const q = f.q.toLowerCase();
          rows = rows.filter((a) => [a.name, a.code, ...(a.areas || [])].join(' ').toLowerCase().includes(q));
        }
        if (f.type) rows = rows.filter((a) => a.type === f.type);
        if (f.parent) rows = rows.filter((a) => a.parentId === f.parent);
        if (f.region) rows = rows.filter((a) => (a.areas || []).some((c) => c.includes(f.region)) || citiesForL1(a.parentId).includes(f.region));
        const map = ui.selected['agent-l2'] || (ui.selected['agent-l2'] = {});
        const allOn = rows.length > 0 && rows.every((a) => !!map[a.id]);
        if (allOn) rows.forEach((a) => { delete map[a.id]; });
        else rows.forEach((a) => { map[a.id] = true; });
        render(); break;
      }
      case 'l2-ex-no-alarm': {
        const map = ui.selected['agent-l2'] || {};
        const ids = Object.keys(map).filter((k) => map[k]);
        if (!ids.length) return toast('请先勾选二级代理', 'warn');
        confirmDialog(
          `确认对已选 ${ids.length} 个二级设置「异常不报警」？之后其异常只做记录，状态默认已处理，不再推送未处理预警。`,
          'l2-ex-no-alarm-ok',
          { ids },
          { title: '异常不报警', okText: '确认设置' }
        );
        break;
      }
      case 'l2-ex-no-alarm-one':
        confirmDialog(
          `确认对「${db.agentsL2.find((x)=>x.id===id)?.name || ''}」设置异常不报警？`,
          'l2-ex-no-alarm-ok',
          { ids: [id] },
          { title: '异常不报警', okText: '确认设置' }
        );
        break;
      case 'l2-ex-alarm-on':
        confirmDialog(
          `确认恢复「${db.agentsL2.find((x)=>x.id===id)?.name || ''}」的异常报警？`,
          'l2-ex-alarm-on-ok',
          { id },
          { title: '恢复异常报警', okText: '确认恢复' }
        );
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
        confirmDialog(`确认通过二级代理「${a?.name || ''}」的审核？`, 'audit-l2-approve-ok', { id }, { title: '二级审核通过', okText: '确认通过' });
        break;
      }
      case 'audit-l2-reject': {
        const a = db.agentsL2.find((x)=>x.id===id);
        confirmDialog(`确认驳回二级代理「${a?.name || ''}」？`, 'audit-l2-reject-ok', { id }, { title: '二级审核驳回', danger: true, okText: '确认驳回' });
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
        if (newSn !== row.sn) changes.push(`SN ${row.sn}→${newSn}`);
        if (size && size !== row.size) changes.push(`弹力带 ${row.size}→${size}`);
        if (belt && belt !== row.belt) changes.push(`腰带 ${row.belt}→${belt}`);
        if (l1Id !== (row.l1Id || null)) changes.push(`一级 ${l1Name(row.l1Id)}→${l1Name(l1Id)}`);
        if (l2Id !== (row.l2Id || null)) changes.push(`二级调库 ${l2Name(row.l2Id)}→${l2Name(l2Id)}`);
        if (!changes.length) { toast('未修改任何字段', 'warn'); break; }
        confirmDialog(`确认保存 SN「${row.sn}」修改？${changes.join('；')}`, 'save-sn-ok', { id, newSn, size, belt, l1Id, l2Id, changes }, { title: '保存 SN 修改', okText: '确认保存' });
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
        confirmDialog(`确认系统生成 ${qty} 条 SN？`, 'gen-sn-confirm-ok', { qty, meta }, { title: '生成 SN 确认', okText: '确认生成' });
        break;
      }
      case 'import-sn-seg-ok': {
        const meta = { l1Id: $('#f-l1')?.value, productId: $('#f-pid')?.value, size: $('#f-size')?.value, belt: $('#f-belt')?.value };
        const text = $('#f-seg-paste')?.value || ui.form.segPaste || '';
        if (!(text || '').trim()) return toast('请粘贴号段', 'err');
        confirmDialog('确认按粘贴内容导入 SN 段号到待入库？', 'import-sn-confirm-ok', { meta, text }, { title: '导入 SN 确认', okText: '确认导入' });
        break;
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
        const l1Id = $('#f-l1')?.value;
        if (!l1Id) return toast('请选择一级代理', 'err');
        confirmDialog(`确认将冷冻 SN「${id}」分配给「${l1Name(l1Id)}」并解冻？`, 'reassign-frozen-confirm-ok', { id, l1Id }, { title: '冷冻库重分配', okText: '确认分配' });
        break;
      }
      case 'approve-return': {
        const r = db.returns.find((x)=>x.id===id);
        if (!canAuditReturn(r)) return toast('当前角色无权审核该退货单', 'err');
        confirmDialog(`确认审核通过退货单 ${r?.no || ''}？`, 'approve-return-ok', { id }, { title: '退货审核通过', okText: '确认通过' });
        break;
      }
      case 'reject-return': {
        const r = db.returns.find((x)=>x.id===id);
        if (!canAuditReturn(r)) return toast('当前角色无权审核该退货单', 'err');
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
      case 'open-create-account':
        return toast('后台已关闭新建账号；二级代理 / 子账号请由一级在小程序「我的」创建', 'err');
      case 'open-edit-role': openModal('edit-role', { id }); break;
      case 'open-create-l2-mini': {
        if (ui.role !== 'l1') return toast('仅一级可创建二级代理', 'err');
        openModal('create-l2-mini', {
          draftSeed: { name: '', type: '个人', areas: [], username: '', password: '******', ent: {}, parentId: currentL1Id() },
        });
        break;
      }
      case 'open-edit-l2-mini': {
        if (ui.role !== 'l1') return toast('仅一级可编辑二级代理', 'err');
        const a = db.agentsL2.find((x) => x.id === id);
        if (!a || (a.parentId !== currentL1Id() && !(a.pending && a.prevParentId === currentL1Id()))) {
          return toast('无权编辑该二级', 'err');
        }
        const acc = db.accounts.find((x) => x.roleId === 'R4' && x.agentId === a.id);
        openModal('edit-l2-mini', {
          id,
          draft: JSON.parse(JSON.stringify({
            ...a,
            username: acc?.username || '',
            password: '',
            ent: a.ent || {},
            areas: [...(a.areas || [])],
          })),
        });
        break;
      }
      case 'create-l2-mini-ok': {
        if (ui.role !== 'l1') return toast('仅一级可创建二级代理', 'err');
        syncMiniL2DraftFromDom();
        const d = ui.modal.draft || {};
        const name = (d.name || '').trim();
        const username = (d.username || '').trim();
        const password = d.password || '******';
        const areas = d.areas || [];
        if (!name) return toast('请填写二级名称', 'err');
        if (!username) return toast('请填写登录用户名', 'err');
        if (db.accounts.some((a) => a.username === username)) return toast('用户名已存在', 'err');
        if (!areas.length) return toast('请选择围栏城市', 'err');
        const l2Id = uid('L2');
        const code = `AG-L2-${String(100 + db.agentsL2.length + 1)}`;
        const row = {
          id: l2Id,
          code,
          name,
          type: d.type === '法人' ? '法人' : '个人',
          parentId: currentL1Id(),
          areas: [...areas],
          status: '启用',
          pending: false,
          auditStatus: 'pending',
          protocolOk: true,
          warnMultiplier: null,
          warnMode: null,
          ent: d.type === '法人' ? (d.ent || {}) : null,
        };
        db.agentsL2.push(row);
        db.accounts.push({
          id: uid('ACC'), username, name, roleId: 'R4', agentId: l2Id, status: '启用', password,
        });
        pushNotify('二级待审核', `${l1Name(currentL1Id())} 新建二级「${name}」待审核`, '原厂');
        addLog(`一级创建二级 ${name} / ${username}`);
        saveStore(); closeModal(); toast('已创建，等待平台二级审核'); break;
      }
      case 'save-l2-mini': {
        if (ui.role !== 'l1') return toast('仅一级可编辑二级代理', 'err');
        syncMiniL2DraftFromDom();
        const d = ui.modal.draft || {};
        const a = db.agentsL2.find((x) => x.id === d.id);
        if (!a) return toast('二级不存在', 'err');
        const name = (d.name || '').trim();
        const username = (d.username || '').trim();
        if (!name) return toast('请填写二级名称', 'err');
        if (!username) return toast('请填写登录用户名', 'err');
        if (!((d.areas || []).length)) return toast('请选择围栏城市', 'err');
        if (db.accounts.some((x) => x.username === username && x.agentId !== a.id)) return toast('用户名已被占用', 'err');
        a.name = name;
        a.type = d.type === '法人' ? '法人' : '个人';
        a.areas = [...(d.areas || [])];
        a.status = d.status === '停用' ? '停用' : '启用';
        a.ent = a.type === '法人' ? (d.ent || {}) : null;
        let acc = db.accounts.find((x) => x.roleId === 'R4' && x.agentId === a.id);
        if (!acc) {
          acc = { id: uid('ACC'), username, name, roleId: 'R4', agentId: a.id, status: a.status, password: d.password || '******' };
          db.accounts.push(acc);
        } else {
          acc.username = username;
          acc.name = name;
          acc.status = a.status;
          if (d.password) acc.password = d.password;
        }
        addLog(`一级编辑二级 ${a.name}`);
        saveStore(); closeModal(); toast('已保存'); break;
      }
      case 'toggle-l2-mini': {
        if (ui.role !== 'l1') return toast('仅一级可操作', 'err');
        const a = db.agentsL2.find((x) => x.id === id);
        if (!a || a.parentId !== currentL1Id()) return toast('无权操作', 'err');
        confirmDialog(`确认${a.status === '启用' ? '停用' : '启用'}二级「${a.name}」？`, 'toggle-l2-mini-ok', { id }, { title: '二级状态确认', danger: a.status === '启用' });
        break;
      }
      case 'delete-l2-mini': {
        if (ui.role !== 'l1') return toast('仅一级可操作', 'err');
        const a = db.agentsL2.find((x) => x.id === id);
        if (!a || (a.parentId !== currentL1Id() && !(a.pending && a.prevParentId === currentL1Id()))) {
          return toast('无权删除', 'err');
        }
        confirmDialog(`确认删除二级「${a.name}」及其登录账号？不可恢复。`, 'delete-l2-mini-ok', { id }, { title: '删除二级代理', danger: true, okText: '确认删除' });
        break;
      }
      case 'save-role-perms': {
        const role = db.roles.find((r) => r.id === id);
        if (!role) return toast('角色不存在', 'err');
        const perms = [...document.querySelectorAll('[data-perm]:checked')].map((el) => el.getAttribute('data-perm'));
        if (!perms.length) return toast('请至少勾选一项权限', 'err');
        const nextPerms = (perms.includes('all') || DETAIL_PERMS.every((p) => perms.includes(p))) ? ['all'] : perms.filter((p) => p !== 'all');
        const desc = $('#f-role-desc')?.value?.trim() || roleDescFromPerms(nextPerms);
        confirmDialog(`确认更新角色「${role.name}」的权限配置？`, 'save-role-perms-ok', { id, perms: nextPerms, desc }, { title: '保存角色权限', okText: '确认保存' });
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
        const a = db.accounts.find((x)=>x.id===id);
        if (!a) break;
        confirmDialog(`确认${a.status==='启用'?'停用':'启用'}账号「${a.username}」？`, 'toggle-account-ok', { id }, { title: '账号状态确认', danger: a.status==='启用' });
        break;
      }
      case 'open-create-sub':
        if (ui.mode !== 'mini' || ui.role !== 'l1') return toast('请在一级小程序「我的」中创建子账号', 'err');
        openModal('create-sub', {});
        break;
      case 'create-sub-ok': {
        if (ui.mode !== 'mini' || ui.role !== 'l1') return toast('请在一级小程序「我的」中创建子账号', 'err');
        const l1Id = $('#f-l1')?.value || currentL1Id();
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
        const s = db.subAccounts.find((x)=>x.id===id);
        if (!s) break;
        confirmDialog(`确认${s.status==='启用'?'停用':'启用'}子账号「${s.username}」？`, 'toggle-sub-ok', { id }, { title: '子账号状态确认', danger: s.status==='启用' });
        break;
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
        if (!l2Id) return toast('请选择二级代理', 'err');
        const parts = [];
        const pb = Number($('#f-part-belt')?.value) || 0;
        const ps = Number($('#f-part-sil')?.value) || 0;
        if (pb > 0) parts.push({ partId: 'PART-BELT', spec: '配件', qty: pb });
        if (ps > 0) parts.push({ partId: 'PART-SIL', spec: 'M', qty: ps });
        const l1Id = currentL1Id() || $('#f-l1')?.value || db.agentsL2.find((a)=>a.id===l2Id)?.parentId;
        confirmDialog(`确认创建销售单并进入扫码出货（计划 ${planTotal} 件）？`, 'create-so-confirm-ok', { l1Id, l2Id, productId, planTotal, planBySize, parts }, { title: '创建销售单', okText: '确认创建' });
        break;
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
      case 'scan-confirm-so': {
        const s = db.sales.find((x)=>x.id===id);
        if (!s) return toast('销售单不存在', 'err');
        if ((s.scanned||[]).length < s.planTotal) return toast('未扫满', 'err');
        confirmDialog(`确认完成出货 ${s.no}（已扫 ${(s.scanned||[]).length}/${s.planTotal}）？`, 'scan-confirm-so-ok', { id }, { title: '确认出货', okText: '确认出货' });
        break;
      }
      case 'mini-direct-bind': {
        db.demoIpRegion = $('#demo-ip')?.value || db.demoIpRegion;
        const sn = ui.form.directSn || $('#direct-sn')?.value?.trim().toUpperCase();
        const phone = $('#direct-phone')?.value?.trim();
        const addr = $('#direct-addr')?.value?.trim();
        const region = db.demoIpRegion;
        if (!sn) return toast('请先确认 SN', 'err');
        if (!phone) return toast('请填写手机号', 'err');
        const check = analyzeDirectBind(sn, phone, addr, region);
        if (check.err) return toast(check.err, 'err');
        const payload = { sn, phone, addr, region };
        if (check.issues.length) {
          const reasonText = check.issues.map((it, i) => `${i + 1}. 【${it.type}】${it.detail}`).join('\n');
          confirmDialog(
            `检测到 ${check.issues.length} 项激活异常，需二次确认：\n\n${reasonText}\n\n确认后将生成异常记录并继续激活；取消则不激活、不记异常。`,
            'mini-direct-bind-ok',
            payload,
            { title: '激活异常确认', danger: true, okText: '确认并激活', cancelText: '取消' },
          );
        } else {
          confirmDialog(
            `确认激活 SN「${sn}」并绑定客户？\n手机：${phone}\nIP 地区：${region}`,
            'mini-direct-bind-ok',
            payload,
            { title: '直销激活确认', okText: '确认激活' },
          );
        }
        break;
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
        const available = ALL_REGIONS.filter((r) => !occ.has(r));
        ui.modal.draft.mainAreas = isAllSelected(available, ui.modal.draft.mainAreas) ? [] : [...available];
        render(); break;
      }
      case 'select-all-sale': {
        if (!ui.modal?.draft) break;
        ui.modal.draft.saleAreas = isAllSelected(ALL_REGIONS, ui.modal.draft.saleAreas) ? [] : [...ALL_REGIONS];
        render(); break;
      }
      case 'select-all-direct': {
        if (!ui.modal?.draft) break;
        const areas = ui.modal.draft.saleAreas || ui.modal.draft.areas || [];
        const cities = areas.flatMap((r) => CITY_MAP[r] || []);
        if (!cities.length) return toast('请先选择可销售范围', 'warn');
        ui.modal.draft.directAreas = isAllSelected(cities, ui.modal.draft.directAreas) ? [] : [...cities];
        render(); break;
      }
      case 'select-all-city': {
        if (!ui.modal?.draft) break;
        if (ui.modal.type === 'create-l2-mini' || ui.modal.type === 'edit-l2-mini') syncMiniL2DraftFromDom();
        if (ui.modal.type === 'rebind-l2' && $('#f-parent')?.value) {
          ui.modal.draft.parentId = $('#f-parent').value;
        }
        const parentId = ui.modal.draft.parentId || $('#f-parent')?.value || currentL1Id();
        const list = citiesForL1(parentId);
        const opts = list.length ? list : (ui.modal.type === 'rebind-l2' ? [] : ['杭州市']);
        if (!opts.length) return toast('当前一级无可选城市', 'warn');
        ui.modal.draft.areas = isAllSelected(opts, ui.modal.draft.areas) ? [] : [...opts];
        ui.modal.draft.parentId = parentId || ui.modal.draft.parentId;
        render(); break;
      }
      case 'select-all-psize': {
        // 单品：全选/取消全选只改勾选，不删尺码池
        if (!ui.modal?.draft) break;
        syncProductDraftFromDom();
        const d = ui.modal.draft;
        const pool = uniqueSizes(d.sizePool || d.sizes || ['S', 'M', 'L']);
        d.sizePool = pool;
        d.sizes = isAllSelected(pool, d.sizes || []) ? [] : [...pool];
        render(); break;
      }
      case 'select-all-comp-size': {
        if (!ui.modal?.draft) break;
        syncProductDraftFromDom();
        const d = ui.modal.draft;
        const idx = Number(el.getAttribute('data-idx'));
        const comps = productComponents(d);
        const c = comps[idx];
        if (!c) break;
        c.pool = uniqueSizes(c.pool || c.sizes || []);
        c.sizes = isAllSelected(c.pool, c.sizes || []) ? [] : [...c.pool];
        d.components = comps;
        pruneStdCombos(d);
        render(); break;
      }
      case 'product-add-comp': {
        syncProductDraftFromDom();
        const d = ui.modal.draft;
        const comps = productComponents(d);
        const n = comps.length + 1;
        comps.push({ id: `c${Date.now().toString(36)}`, name: `组件${n}`, pool: ['S', 'M', 'L'], sizes: ['S', 'M', 'L'] });
        d.components = comps;
        pruneStdCombos(d);
        render(); toast('已添加组件'); break;
      }
      case 'product-del-comp': {
        syncProductDraftFromDom();
        const d = ui.modal.draft;
        const comps = productComponents(d);
        if (comps.length <= 2) return toast('套件至少保留 2 个组件', 'warn');
        const idx = Number(el.getAttribute('data-idx'));
        comps.splice(idx, 1);
        d.components = comps;
        pruneStdCombos(d);
        render(); toast('已删除组件'); break;
      }
      case 'product-add-comp-size': {
        syncProductDraftFromDom();
        const d = ui.modal.draft;
        const idx = Number(el.getAttribute('data-idx'));
        const comps = productComponents(d);
        const c = comps[idx];
        if (!c) break;
        const inp = document.querySelector(`[data-add-comp-size="${idx}"]`);
        const v = (inp?.value || '').trim();
        if (!v) return toast('请输入尺码', 'err');
        c.pool = uniqueSizes(c.pool || []);
        if (c.pool.includes(v)) return toast('该尺码已存在', 'warn');
        c.pool.push(v);
        c.sizes = uniqueSizes([...(c.sizes || []), v]);
        d.components = comps;
        if (inp) inp.value = '';
        pruneStdCombos(d);
        render(); break;
      }
      case 'product-add-bsize': {
        // 单品新增尺码：写入尺码池并默认勾选
        syncProductDraftFromDom();
        const d = ui.modal.draft;
        const v = ($('#f-add-bsize')?.value || '').trim();
        if (!v) return toast('请输入尺码', 'err');
        const pool = uniqueSizes(d.sizePool || d.sizes || []);
        if (pool.includes(v)) return toast('该尺码已存在', 'warn');
        pool.push(v);
        d.sizePool = pool;
        d.sizes = uniqueSizes([...(d.sizes || []), v]);
        if ($('#f-add-bsize')) $('#f-add-bsize').value = '';
        render(); break;
      }
      case 'product-gen-std': {
        syncProductDraftFromDom();
        const d = ui.modal.draft;
        if (!d || d.type !== 'kit') break;
        d.stdCombos = defaultStdCombosFromSizes(d);
        if (!d.stdCombos.length) toast('当前尺码与默认标品规则无交集，请手动添加标品', 'warn');
        else toast(`已按当前尺码生成 ${d.stdCombos.length} 档标品`);
        render(); break;
      }
      case 'product-add-std': {
        syncProductDraftFromDom();
        const d = ui.modal.draft;
        const comps = productComponents(d);
        const grade = ($('#f-std-grade')?.value || '').trim();
        const picks = {};
        let miss = false;
        comps.forEach((c) => {
          const v = $(`#f-std-pick-${c.id}`)?.value;
          if (!v) miss = true;
          picks[c.id] = v || '';
        });
        if (miss || comps.some((c) => !(c.sizes || []).includes(picks[c.id]))) {
          return toast('请为每个组件选择已勾选的尺码', 'err');
        }
        const row = normalizeStdCombo(d, { grade, picks });
        d.stdCombos = d.stdCombos || [];
        if (d.stdCombos.some((k) => normalizeStdCombo(d, k).key === row.key)) {
          return toast('该标品组合已存在', 'warn');
        }
        d.stdCombos.push(row);
        render(); toast('已添加标品'); break;
      }
      case 'product-del-std': {
        syncProductDraftFromDom();
        const idx = Number(el.getAttribute('data-idx'));
        (ui.modal.draft.stdCombos || []).splice(idx, 1);
        render(); break;
      }
      case 'open-create-product': {
        const ptype = el.getAttribute('data-ptype') || 'kit';
        let draftSeed;
        if (ptype === 'part') {
          draftSeed = { type: 'part', sizes: ['S', 'M', 'L'], status: '上架', code: '', name: '', note: '' };
        } else if (ptype === 'single') {
          draftSeed = { type: 'single', sizePool: ['S', 'M', 'L'], sizes: ['S', 'M', 'L'], status: '上架', code: '', name: '', note: '' };
        } else {
          const seed = {
            type: 'kit',
            components: [
              { id: 'c0', name: '腰带', pool: [...BELTS], sizes: [...BELTS] },
              { id: 'c1', name: '弹力带', pool: [...BAND_SIZES], sizes: [...BAND_SIZES] },
            ],
            status: '上架',
            code: '',
            name: '',
            note: '',
          };
          syncLegacyFromComponents(seed);
          seed.stdCombos = defaultStdCombosFromSizes(seed);
          seed.defaultBelt = { ...DEFAULT_BELT };
          draftSeed = seed;
        }
        openModal('create-product', { ptype, draftSeed });
        break;
      }
      case 'open-edit-product': {
        const p = db.products.find((x) => x.id === id);
        if (!p) return toast('商品不存在', 'err');
        const draft = migrateProductShape(JSON.parse(JSON.stringify(p)));
        openModal('edit-product', { id, draft }); break;
      }
      case 'delete-product': {
        const p = db.products.find((x) => x.id === id);
        if (!p) return toast('商品不存在', 'err');
        const usedSn = (db.sns || []).some((s) => s.productId === id);
        const usedPo = (db.purchases || []).some((po) =>
          (po.lines || []).some((l) => l.productId === id)
          || (po.customLines || []).some((l) => l.productId === id)
          || (po.parts || []).some((l) => l.partId === id));
        const usedSo = (db.sales || []).some((s) => s.productId === id);
        const hint = (usedSn || usedPo || usedSo)
          ? `商品「${p.name}」已被单据/SN 引用，确认仍要删除？`
          : `确认删除商品「${p.name}」？不可恢复。`;
        confirmDialog(hint, 'delete-product-ok', { id }, { title: '删除商品', danger: true, okText: '确认删除' });
        break;
      }
      case 'save-product': {
        syncProductDraftFromDom();
        const d = ui.modal.draft || {};
        d.code = ($('#f-pcode')?.value || '').trim() || d.code;
        d.name = ($('#f-pname')?.value || '').trim() || d.name;
        d.status = $('#f-pstatus')?.value || d.status || '上架';
        d.note = $('#f-pnote')?.value || '';
        d.type = d.type || 'kit';
        if (d.type === 'kit') {
          const comps = productComponents(d);
          if (comps.length < 2) return toast('套件至少需要 2 个组件', 'err');
          for (let i = 0; i < comps.length; i++) {
            const c = comps[i];
            c.name = (c.name || '').trim() || `组件${i + 1}`;
            c.pool = uniqueSizes(c.pool || []);
            c.sizes = uniqueSizes(c.sizes || []).filter((s) => c.pool.includes(s));
            if (!c.pool.length) return toast(`请为「${c.name}」添加尺码`, 'err');
            if (!c.sizes.length) return toast(`请至少勾选一个「${c.name}」尺码`, 'err');
          }
          d.components = comps;
          pruneStdCombos(d);
          syncLegacyFromComponents(d);
          d.defaultBelt = {};
          (d.stdCombos || []).forEach((k) => { if (k.size) d.defaultBelt[k.size] = k.belt; });
        } else if (d.type === 'single') {
          const pool = uniqueSizes(d.sizePool || d.sizes || []);
          d.sizePool = pool;
          d.sizes = uniqueSizes(d.sizes || []).filter((s) => pool.includes(s));
          if (!d.sizes.length) return toast('请至少勾选一个尺码', 'err');
          d.belts = [];
          d.stdCombos = [];
          delete d.components;
          delete d.compAName;
          delete d.compBName;
          delete d.defaultBelt;
        } else {
          d.sizes = ($('#f-psizes')?.value || '').split(/[,，]/).map((x) => x.trim()).filter(Boolean);
          if (!d.sizes.length) return toast('请填写配件规格尺码', 'err');
        }
        if (!d.code || !d.name) return toast('请填写编码与名称', 'err');
        migrateProductShape(d);
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
        if (cartProd?.type === 'single') return toast('单品无非标组合，请直接填尺码数量', 'warn');
        const grade = ui.modal.draft.nonstdGrade || '小';
        const gradeOpt = nonstdGradesForProduct(cartProd).find((g) => g.id === grade);
        if (!gradeOpt) return toast(`当前商品无此非标${productCompAName(cartProd)}档`, 'err');
        const belt = gradeOpt.belt;
        const size = $('#f-cart-c-size')?.value;
        const qty = Number($('#f-cart-c-qty')?.value) || 0;
        if (!size) return toast(`请选择${productCompBName(cartProd)}`, 'err');
        if (!qty) return toast('请填写非标数量', 'err');
        if (!gradeOpt.bands.includes(size)) return toast(`该${productCompAName(cartProd)}档位不可选此${productCompBName(cartProd)}（或不在商品维护尺码内）`, 'err');
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
        if (!lines.length && !customLines.length && !parts.length) return toast('请至少填写标准数量、非标或配件', 'err');
        const payload = { channel, cartPid, lines, customLines, parts, l2Id: $('#f-cart-l2')?.value || '' };
        if (channel === 'sales') {
          if (!payload.l2Id) return toast('请选择二级代理', 'err');
          let planTotal = 0;
          lines.forEach((l) => { planTotal += l.qty; });
          customLines.forEach((r) => { planTotal += r.qty; });
          if (!planTotal) return toast('销售单需至少一件商品（含非标）', 'err');
          confirmDialog(`确认提交销售单（商品 ${planTotal} 件）？`, 'cart-submit-ok', payload, { title: '提交销售单', okText: '确认提交' });
        } else {
          confirmDialog('确认提交采购申请？提交后进入平台审核。', 'cart-submit-ok', payload, { title: '提交采购申请', okText: '确认提交' });
        }
        break;
      }
      case 'view-dup-customer':
        openModal('view-exception', { id }); break;
      case 'open-view-purchase': openModal('view-purchase', { id }); break;
      case 'open-view-sale': openModal('view-sale', { id }); break;
      case 'open-view-cend': openModal('view-cend', { id }); break;
      case 'open-view-stock': openModal('view-stock', { id }); break;
      case 'open-create-customer':
        openModal('create-customer', { draftSeed: { name: '', phone: '', phoneLoc: '', addr: '', note: '', sns: [] } });
        break;
      case 'open-edit-customer': {
        const c = (db.customers || []).find((x) => x.id === id);
        if (!c) return toast('客户不存在', 'err');
        openModal('edit-customer', { id, draft: JSON.parse(JSON.stringify(c)) });
        break;
      }
      case 'create-customer-ok': {
        const form = readCustomerForm();
        if (!form.phone && !form.addr && !form.sns.length) return toast('请至少填写手机、地址或关联 SN', 'err');
        confirmDialog(`确认创建客户「${form.phone || form.name || '未命名'}」？`, 'create-customer-confirm-ok', { form }, {
          title: '创建客户', okText: '确认创建',
        });
        break;
      }
      case 'save-customer': {
        const c = (db.customers || []).find((x) => x.id === id);
        if (!c) return toast('客户不存在', 'err');
        const form = readCustomerForm();
        if (!form.phone && !form.addr && !form.sns.length) return toast('请至少填写手机、地址或关联 SN', 'err');
        confirmDialog(`确认保存客户「${form.phone || form.name || c.id}」的修改？`, 'save-customer-confirm-ok', { id, form }, {
          title: '保存客户', okText: '确认保存',
        });
        break;
      }
      case 'delete-customer': {
        const c = (db.customers || []).find((x) => x.id === id);
        if (!c) return toast('客户不存在', 'err');
        confirmDialog(`确认删除客户「${c.phone || c.name || c.id}」？关联 SN 绑定信息不会自动清除。`, 'delete-customer-ok', { id }, {
          title: '删除客户', danger: true, okText: '确认删除',
        });
        break;
      }
      case 'goto-mini-stock-sn': {
        ui.tabs.miniStock = 'sn';
        ui.filters.miniStock = {
          ...(ui.filters.miniStock || {}),
          sn: '',
          size: el.getAttribute('data-size') || '',
          belt: el.getAttribute('data-belt') || '',
        };
        ui.modal = null;
        navigate('mini-stock');
        break;
      }
      case 'goto-sn-one': {
        const sn = el.getAttribute('data-sn') || id;
        ui.filters.sn = {
          sn: sn || '',
          productId: '',
          productName: '',
          l1: '',
          l2: '',
          size: '',
          belt: '',
          status: '',
          channel: '',
          factoryFrom: '',
          factoryTo: '',
          soldFrom: '',
          soldTo: '',
          returnFrom: '',
          returnTo: '',
          from: '',
          to: '',
        };
        ui.modal = null;
        navigate('sn');
        break;
      }
      case 'goto-sn-filtered': {
        const pid = el.getAttribute('data-product') || '';
        ui.filters.sn = {
          sn: '',
          productId: pid,
          productName: pid ? productName(pid) : '',
          l1: el.getAttribute('data-l1') || '',
          l2: el.getAttribute('data-l2') || '',
          size: el.getAttribute('data-size') || '',
          belt: el.getAttribute('data-belt') || '',
          status: el.getAttribute('data-status') || '',
          channel: '',
          factoryFrom: '',
          factoryTo: '',
          soldFrom: '',
          soldTo: '',
          returnFrom: '',
          returnTo: '',
          from: '',
          to: '',
        };
        ui.modal = null;
        navigate('sn');
        break;
      }
      case 'open-view-return': openModal('view-return', { id }); break;
      case 'open-view-exception': openModal('view-exception', { id }); break;
      case 'po-draft-add-custom': {
        if (!ui.modal.draft) ui.modal.draft = { customLines: [] };
        ui.modal.draft.customLines = ui.modal.draft.customLines || [];
        const poProd = kitProducts().find((p) => p.id === (ui.modal.draft.productId || $('#f-pid')?.value)) || kitProducts()[0];
        if (poProd?.type === 'single') return toast('单品无非标行', 'warn');
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
        const poProd = kitProducts().find((p) => p.id === productId) || kitProducts()[0];
        const isSingle = poProd?.type === 'single';
        const lines = [];
        document.querySelectorAll('[data-size-qty]').forEach((inp) => {
          const q = Number(inp.value)||0;
          if (q>0) lines.push({
            productId,
            size: inp.getAttribute('data-size-qty'),
            belt: inp.getAttribute('data-std-belt') || (isSingle ? '' : (DEFAULT_BELT[inp.getAttribute('data-size-qty')] || '')),
            qty: q,
          });
        });
        const customLines = [];
        if (!isSingle) {
          document.querySelectorAll('[data-po-custom-qty]').forEach((inp) => {
            const i = inp.getAttribute('data-po-custom-qty');
            const q = Number(inp.value) || 0;
            if (q <= 0) return;
            const size = document.querySelector(`[data-po-custom-size="${i}"]`)?.value || 'M';
            const belt = normalizeBelt(document.querySelector(`[data-po-custom-belt="${i}"]`)?.value);
            customLines.push({ productId, size, belt, qty: q });
          });
        }
        const parts = [];
        const pb = Number($('#f-part-belt')?.value) || 0;
        const pq = Number($('#f-part-qty')?.value)||0;
        if (pb > 0) parts.push({ partId: 'PART-BELT', spec: '配件', qty: pb });
        if (pq>0) parts.push({ partId: 'PART-SIL', spec: 'M', qty: pq });
        if (!lines.length && !customLines.length) return toast(isSingle ? '请填写尺码数量' : '请填写标准数量或新增非标行', 'err');
        confirmDialog('确认提交采购申请？提交后进入平台审核。', 'create-po-confirm-ok', {
          productId, lines, customLines, parts, l1Id: currentL1Id() || 'L1A',
        }, { title: '提交采购申请', okText: '确认提交' });
        break;
      }
      case 'mini-create-return': openModal('create-return', {}); break;
      case 'mini-create-cend-return':
        openModal('create-return', { mode: 'cend', draftSeed: { snsText: '', reasonType: '投诉', reason: '' } });
        break;
      case 'create-return-ok': {
        const sns = parseReturnSns($('#f-sns')?.value || '');
        const type = ui.modal?.payload?.mode === 'cend' ? 'user' : ($('#f-ttype')?.value || '');
        if (!sns.length) return toast('请填写 SN', 'err');
        const labels = { l2_to_l1: '二级退一级', l1_to_factory: '一级退原厂', user: '用户退货再入库' };
        confirmDialog(`确认提交退货申请（${sns.length} 个 SN）？`, 'create-return-confirm-ok', {
          sns, type, typeLabel: labels[type] || type,
          fromId: ui.role==='l2'?currentL2Id():currentL1Id(),
          fromName: ROLES[ui.role].name, approverId: ui.role==='l2'?currentL1Id():null,
          reason: $('#f-reason')?.value||'', reasonType: $('#f-rtype')?.value,
        }, { title: ui.modal?.payload?.mode === 'cend' ? '提交C端用户退货单' : '提交退货申请', okText: '确认提交' });
        break;
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
      row.channel = s.channel || 'distribute';
      pushSnEvent(row, '销售转入二级', s.no, 'sales');
    });
    s.status = 'done';
    db.stockLogs.unshift({ id: uid('H'), agentType: 'l2', agentId: s.l2Id, productId: s.productId, size: Object.keys(s.planBySize)[0], delta: s.scanned.length, reason: '销售转入', time: nowStr(), ref: s.no });
    // 一级分销给二级：仅调库，不做销售库存异常（库存异常只针对二级经营侧）
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

  function syncMiniL2DraftFromDom() {
    if (!ui.modal || !['create-l2-mini', 'edit-l2-mini'].includes(ui.modal.type)) return;
    const d = ui.modal.draft || (ui.modal.draft = {});
    d.name = $('#f-l2-name')?.value?.trim() ?? d.name;
    d.type = $('#f-l2-type')?.value || d.type || '个人';
    d.username = $('#f-l2-user')?.value?.trim() ?? d.username;
    d.password = $('#f-l2-pass')?.value ?? d.password;
    if ($('#f-l2-status')) d.status = $('#f-l2-status').value;
    if (d.type === '法人') d.ent = readEntFields();
  }

  function finishL2ExNoAlarm(ids) {
    const list = (ids || []).filter(Boolean);
    if (!list.length) { render(); return; }
    let n = 0;
    let closed = 0;
    list.forEach((lid) => {
      const a = db.agentsL2.find((x) => x.id === lid);
      if (!a) return;
      a.exNoAlarm = true;
      n += 1;
      db.exceptions.forEach((e) => {
        const hit = e.l2Id === lid
          || e.target === a.name
          || String(e.target || '').includes(a.name)
          || (!!db.sns.find((s) => s.sn === e.target && s.l2Id === lid));
        if (hit && e.status === '未处理') {
          e.status = '已处理';
          e.warnMode = 'off';
          e.notify = '仅记录';
          closed += 1;
        }
      });
    });
    ui.selected['agent-l2'] = {};
    addLog(`设置异常不报警 ${n} 个二级${closed ? `，关闭未处理 ${closed} 条` : ''}`);
    saveStore();
    toast(`已设置 ${n} 个二级异常不报警${closed ? `，并处理 ${closed} 条未处理异常` : ''}`);
    ui.modal = null;
    render();
  }

  function finishDeleteL2Mini(id) {
    const a = db.agentsL2.find((x) => x.id === id);
    if (!a) { render(); return; }
    const snN = db.sns.filter((s) => s.l2Id === id).length;
    if (snN) {
      toast(`该二级仍有 ${snN} 条 SN 关联，请先调库或停用，不能直接删除`, 'err');
      render();
      return;
    }
    db.agentsL2 = db.agentsL2.filter((x) => x.id !== id);
    db.accounts = db.accounts.filter((x) => !(x.roleId === 'R4' && x.agentId === id));
    addLog(`删除二级 ${a.name}`);
    saveStore();
    toast('已删除');
    render();
  }

  function finishReassignFrozen(sn, l1Id) {
    const row = db.sns.find((s) => s.sn === sn);
    if (!row || !l1Id) { render(); return; }
    row.l1Id = l1Id; row.status = 'l1'; row.frozen = false;
    row.tags = (row.tags || []).filter((t) => t !== '冷冻');
    pushSnEvent(row, '冷冻库重分配', l1Name(l1Id), 'reassign');
    addLog(`冷冻SN重分配 ${sn} → ${l1Name(l1Id)}`);
    saveStore(); ui.modal = null; toast('已解冻并分配'); render();
  }

  function finishSaveSn(payload) {
    const row = db.sns.find((s) => s.sn === payload.id);
    if (!row) { toast('找不到该 SN', 'err'); render(); return; }
    const { newSn, size, belt, l1Id, l2Id, changes } = payload;
    if (newSn && newSn !== row.sn) row.sn = newSn;
    if (size && size !== row.size) row.size = size;
    if (belt && belt !== row.belt) row.belt = belt;
    if (l1Id !== undefined && l1Id !== (row.l1Id || null)) row.l1Id = l1Id;
    if (l2Id !== undefined && l2Id !== (row.l2Id || null)) {
      row.l2Id = l2Id || null;
      if (l2Id && ['l1', 'warehouse'].includes(row.status)) row.status = 'l2';
      if (!l2Id && row.status === 'l2') row.status = 'l1';
    }
    const who = (ROLES[ui.role]?.account || ui.account || 'admin');
    const when = nowStr();
    row.tags = [...new Set([...(row.tags || []), '修改过'])];
    pushSnEvent(row, '管理员修改', `${who} 于 ${when}：${(changes || []).join('；')}`, 'edit');
    addLog(`修改SN ${row.sn}：${(changes || []).join('；')}`, 'edit');
    saveStore(); ui.modal = null; toast('已保存修改记录'); render();
  }

  function finishGenSn(payload) {
    const qty = Number(payload.qty) || 0;
    const meta = payload.meta || {};
    if (!qty) { render(); return; }
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
    saveStore(); ui.modal = null; toast(`已生成 ${list.length} 条 SN`); render();
  }

  function finishImportSn(payload) {
    const meta = payload.meta || {};
    const text = payload.text || '';
    const result = importSnSegmentsFromText(text, meta);
    if (result.err) { toast(result.err, 'err'); render(); return; }
    ui.form.segPaste = '';
    addLog(`批量导入SN段号 +${result.added}`);
    saveStore(); ui.modal = null;
    toast(`导入 ${result.added} 条${result.skipped ? `，跳过 ${result.skipped}` : ''}`);
    render();
  }

  function finishSaveRolePerms(id, payload) {
    const role = db.roles.find((r) => r.id === id);
    if (!role) { toast('角色不存在', 'err'); render(); return; }
    role.perms = payload.perms || role.perms;
    role.desc = payload.desc || role.desc;
    addLog(`编辑角色权限 ${role.name}`);
    saveStore(); ui.modal = null; toast('角色权限已更新'); render();
  }

  function finishCartSubmit(payload) {
    const channel = payload.channel || 'purchase';
    const cartPid = payload.cartPid;
    const lines = payload.lines || [];
    const customLines = payload.customLines || [];
    const parts = payload.parts || [];
    if (channel === 'sales') {
      const l2Id = payload.l2Id;
      const planBySize = {};
      let planTotal = 0;
      lines.forEach((l) => { planBySize[l.size] = (planBySize[l.size] || 0) + l.qty; planTotal += l.qty; });
      customLines.forEach((r) => { planBySize[r.size] = (planBySize[r.size] || 0) + r.qty; planTotal += r.qty; });
      const so = {
        id: uid('SO'), no: `SO${todayCompact()}${String(++db.seq.so).padStart(3, '0')}`,
        channel: 'distribute', l1Id: currentL1Id(), l2Id, productId: cartPid,
        planTotal, planBySize, parts, scanned: [], status: 'scanning', createdAt: nowStr(),
      };
      db.sales.unshift(so);
      addLog('购物车提交销售单');
      saveStore();
      toast('已创建销售单，请扫码出货');
      // 创建后直接进入扫码入口
      if (ui.mode === 'mini') {
        ui.page = 'mini-scan';
        ui.scanMode = 'ship';
      }
      openModal('scan-so', { id: so.id });
      render();
      return;
    }
    db.purchases.unshift({
      id: uid('PO'), no: `PO${todayCompact()}${String(++db.seq.po).padStart(3, '0')}`, l1Id: currentL1Id() || 'L1A',
      lines, customLines, parts, status: 'pending', createdAt: nowStr(), segments: {}, cosign: { admin1: false, admin2: false },
    });
    addLog('购物车提交采购申请');
    ui.modal = null; toast('已提交采购申请');
    saveStore(); render();
  }

  function finishCreatePo(payload) {
    db.purchases.unshift({
      id: uid('PO'), no: `PO${todayCompact()}${String(++db.seq.po).padStart(3, '0')}`, l1Id: payload.l1Id || currentL1Id() || 'L1A',
      lines: payload.lines || [], customLines: payload.customLines || [], parts: payload.parts || [],
      status: 'pending', createdAt: nowStr(), segments: {}, cosign: { admin1: false, admin2: false },
    });
    addLog('提交采购申请'); saveStore(); ui.modal = null; toast('已提交，等待平台审核'); render();
  }

  function finishCreateReturn(payload) {
    db.returns.unshift({
      id: uid('RT'), no: `RT${todayCompact()}${String(++db.seq.rt).padStart(2, '0')}`,
      type: payload.type, typeLabel: payload.typeLabel,
      fromId: payload.fromId, fromName: payload.fromName, approverId: payload.approverId,
      sns: payload.sns || [], status: 'pending', createdAt: nowStr(),
      reason: payload.reason || '', reasonType: payload.reasonType,
    });
    saveStore(); ui.modal = null; toast('退货已提交'); render();
  }

  function finishCreateSo(payload) {
    const { l1Id, l2Id, productId, planTotal, planBySize, parts } = payload;
    const so = {
      id: uid('SO'), no: `SO${todayCompact()}${String(++db.seq.so).padStart(3, '0')}`, channel: 'distribute',
      l1Id, l2Id, productId, planTotal, planBySize, parts: parts || [], scanned: [], status: 'scanning', createdAt: nowStr(),
    };
    const cfg = resolveWarnConfig(so.l1Id, l2Id);
    const overRatio = Number(cfg.rules.overOrderRatio || 1);
    const l2Stock = db.sns.filter((x) => x.l2Id === l2Id && x.status === 'l2' && !x.frozen && x.productId === productId).length;
    if (l2Stock > 0 && planTotal >= Math.max(1, Math.ceil(l2Stock * overRatio))) {
      pushException('超量下单预警', l2Name(l2Id), `二级在库 ${l2Stock} 仍出货 ${planTotal}（超量比 ${overRatio}，代理倍数 ${cfg.mult}）`, 'stock', { mode: cfg.mode, l2Id });
    }
    db.sales.unshift(so); saveStore();
    toast('已创建销售单，请扫码出货');
    if (ui.mode === 'mini') {
      ui.page = 'mini-scan';
      ui.scanMode = 'ship';
    }
    openModal('scan-so', { id: so.id });
    render();
  }

  function bindEvents() {
    $('#btn-login')?.addEventListener('click', doLogin);
    $('#login-pass')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

    document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      const set = el.getAttribute('data-set-filter');
      if (set) {
        if (set.startsWith('tab:')) {
          const [, key, id] = set.split(':');
          if (key && id) ui.tabs[key] = id;
        } else {
          const [scopeField, val] = set.split('=');
          const [scope, field] = scopeField.split(':');
          ui.filters[scope] = ui.filters[scope] || {};
          ui.filters[scope][field] = val;
        }
      }
      const setTab = el.getAttribute('data-set-tab');
      if (setTab) {
        const [key, id] = setTab.split(':');
        if (key && id) ui.tabs[key] = id;
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
      // open-/delete-/toggle- 是动作名，不是 modal type
      if (/^(open-|delete-|toggle-)/.test(act)) {
        handleAction(act, el);
        return;
      }
      openModal(act, { id: el.getAttribute('data-id') });
    }));

    // 仅顶栏「管理后台」切换；勿绑定扫码卡片的 data-mode=ship|direct|query
    document.querySelectorAll('.mode-switch [data-mode]').forEach((el) => el.addEventListener('click', () => {
      ui.mode = 'admin';
      persistSession();
      navigate('home');
    }));

    // 退货单：输入 SN 后实时展示商品名称 / 规格
    if (ui.modal?.type === 'create-return') {
      const snInp = $('#f-sns');
      snInp?.addEventListener('input', () => {
        if (!ui.modal.draft) ui.modal.draft = {};
        ui.modal.draft.snsText = snInp.value;
        ui.modal.draft.reason = $('#f-reason')?.value || '';
        ui.modal.draft.reasonType = $('#f-rtype')?.value || '';
        const box = $('#return-sn-detail');
        if (!box) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = returnSnDetailHtml(snInp.value);
        const next = wrap.firstElementChild;
        if (next) box.replaceWith(next);
      });
      $('#f-reason')?.addEventListener('input', () => {
        if (!ui.modal.draft) ui.modal.draft = {};
        ui.modal.draft.reason = $('#f-reason')?.value || '';
      });
      $('#f-rtype')?.addEventListener('change', () => {
        if (!ui.modal.draft) ui.modal.draft = {};
        ui.modal.draft.reasonType = $('#f-rtype')?.value || '';
      });
    }

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
      if (ui.modal.type === 'create-product' || ui.modal.type === 'edit-product') syncProductDraftFromDom();
      const r = el.getAttribute('data-toggle-psize');
      const d = ui.modal.draft;
      const pool = uniqueSizes(d.sizePool || d.sizes || []);
      d.sizePool = pool.includes(r) ? pool : uniqueSizes([...pool, r]);
      const set = new Set(d.sizes || []);
      if (set.has(r)) set.delete(r); else set.add(r);
      d.sizes = [...set].filter((s) => d.sizePool.includes(s));
      render();
    }));
    document.querySelectorAll('[data-toggle-comp-size]').forEach((el) => el.addEventListener('click', () => {
      if (!ui.modal?.draft) return;
      if (ui.modal.type === 'create-product' || ui.modal.type === 'edit-product') syncProductDraftFromDom();
      const raw = el.getAttribute('data-toggle-comp-size') || '';
      const pipe = raw.indexOf('|');
      if (pipe < 0) return;
      const idx = Number(raw.slice(0, pipe));
      const size = raw.slice(pipe + 1);
      const d = ui.modal.draft;
      const comps = productComponents(d);
      const c = comps[idx];
      if (!c || !size) return;
      c.pool = uniqueSizes(c.pool || []);
      if (!c.pool.includes(size)) c.pool.push(size);
      const set = new Set(c.sizes || []);
      if (set.has(size)) set.delete(size); else set.add(size);
      c.sizes = [...set].filter((s) => c.pool.includes(s));
      d.components = comps;
      pruneStdCombos(d);
      render();
    }));
    if (ui.modal?.type === 'create-product' || ui.modal?.type === 'edit-product') {
      document.querySelectorAll('[data-comp-name]').forEach((inp) => {
        inp.addEventListener('change', () => { syncProductDraftFromDom(); render(); });
      });
      document.querySelectorAll('[data-std-grade], [data-std-pick]').forEach((inp) => {
        inp.addEventListener('change', () => { syncProductDraftFromDom(); render(); });
      });
      document.querySelectorAll('[data-add-comp-size]').forEach((inp) => {
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const btn = document.querySelector(`[data-action="product-add-comp-size"][data-idx="${inp.getAttribute('data-add-comp-size')}"]`);
            if (btn) handleAction('product-add-comp-size', btn);
          }
        });
      });
      $('#f-add-bsize')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAction('product-add-bsize', e.currentTarget); }
      });
    }

    $('#modal-mask')?.addEventListener('click', (e) => { if (e.target.id === 'modal-mask' && !ui.confirm) closeModal(); });
    $('#confirm-mask')?.addEventListener('click', (e) => { if (e.target.id === 'confirm-mask') closeConfirm(); });
    if (ui.modal?.type === 'create-l2-mini' || ui.modal?.type === 'edit-l2-mini') {
      $('#f-l2-type')?.addEventListener('change', () => {
        syncMiniL2DraftFromDom();
        ui.modal.draft.type = $('#f-l2-type').value;
        render();
      });
    }
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
