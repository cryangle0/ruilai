export function comboPart(compName?: string, pick?: string) {
  const name = String(compName || '').trim()
  const p = String(pick || '').trim()
  if (!p) return name
  if (!name) return p
  if (p.includes(name) || name.includes(p)) return p.length >= name.length ? p : name
  return `${name}${p}`
}

export function comboLabelOf(comps: { id?: string; name?: string }[], row: { picks?: Record<string, string>; grade?: string }) {
  const parts = (comps || [])
    .map((c) => comboPart(c.name, row.picks?.[c.id || '']))
    .filter(Boolean)
    .join('+')
  return row.grade ? `${row.grade}（${parts}）` : parts
}

export function productCompsText(row: any) {
  if (row?.type === 'kit') {
    const cs = row.extra?.components
    if (cs?.length) return cs.map((c: any) => `${c.name}(${(c.sizes || []).join('/')})`).join(' + ')
    return [row.extra?.compAName, row.extra?.compBName].filter(Boolean).join(' + ') || '—'
  }
  const sizes = row?.extra?.sizes || row?.extra?.sizePool || []
  return sizes.length ? sizes.join('/') : '—'
}

export function stockSpecText(size?: string, belt?: string) {
  const b = belt ? String(belt).replace(/^腰带/, '') : ''
  return b ? `${size || ''}+腰带${b}` : String(size || '—')
}

export function snStatusLabel(s?: string) {
  return ({ warehouse: '原厂在库', l1: '一级在库', l2: '二级在库', bound: '已销售' } as Record<string, string>)[s || ''] || s || '—'
}

export function snStatusTone(s?: string) {
  return s === 'bound' ? 'tag-green' : s === 'l2' ? 'tag-blue' : s === 'l1' ? 'tag-orange' : 'tag-gray'
}

export function logTypeLabel(t?: string) {
  return ({ op: '操作', login: '登录', exception: '异常', warn: '预警', edit: '修改' } as Record<string, string>)[t || 'op'] || t || '操作'
}

export function snsProductDetail(sns: any[] | string[] | undefined, lookup?: (sn: string) => any) {
  const map: Record<string, number> = {}
  ;(sns || []).forEach((item: any) => {
    const row = typeof item === 'string' ? lookup?.(item) : item
    if (!row) return
    const size = row.size || row.sizeCode || ''
    const belt = row.belt || ''
    const name = row.productName || row.productId || ''
    const k = `${name}/${stockSpecText(size, belt)}`
    map[k] = (map[k] || 0) + 1
  })
  return Object.entries(map).map(([k, q]) => `${k}×${q}`).join('，') || '—'
}

export const RETURN_REASONS = [
  { type: '投诉', label: '客诉退货' },
  { type: '质量', label: '质量退货' },
  { type: '尺码', label: '尺码不合适' },
  { type: '批次', label: '批次瑕疵' },
  { type: '其他', label: '其他（手写）' },
]
