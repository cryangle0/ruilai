/** ISO `2026-08-31T16:54:48` → `2026-08-31 16:54:48` */
export function formatDateTime(value?: string | number | null) {
  if (value == null || value === '') return '—'
  const s = String(value)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/)
  if (m) return `${m[1]} ${m[2]}`
  return s.replace('T', ' ').slice(0, 19) || '—'
}

export function datePart(value?: string | number | null) {
  return formatDateTime(value).slice(0, 10)
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function todayDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function monthStart(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

export function weekStart(d = new Date()) {
  const day = d.getDay() || 7
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day - 1))
  return todayDate(x)
}

export function lastMonthStart(d = new Date()) {
  return todayDate(new Date(d.getFullYear(), d.getMonth() - 1, 1))
}

export function lastMonthEnd(d = new Date()) {
  return todayDate(new Date(d.getFullYear(), d.getMonth(), 0))
}

export const DATE_PRESETS = [
  { id: 'today', title: '今日' },
  { id: 'week', title: '本周' },
  { id: 'month', title: '本月' },
  { id: 'last', title: '上月' },
  { id: 'all', title: '全部' },
] as const

export function datePresetRange(preset: string) {
  const to = todayDate()
  if (preset === 'today') return { from: to, to }
  if (preset === 'week') return { from: weekStart(), to }
  if (preset === 'last') return { from: lastMonthStart(), to: lastMonthEnd() }
  if (preset === 'all') return { from: '', to: '' }
  return { from: monthStart(), to }
}

export function inDateRange(value: string | number | null | undefined, from?: string, to?: string) {
  if (!from && !to) return true
  const d = datePart(value)
  if (d === '—') return true
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

export function matchesQuery(parts: unknown[], q?: string) {
  const k = (q || '').trim().toLowerCase()
  if (!k) return true
  const hay = (parts as unknown[])
    .flatMap((x) => Array.isArray(x) ? x : [x])
    .filter((x) => x != null && x !== '')
    .map((x) => String(x).toLowerCase())
    .join(' ')
  return hay.includes(k)
}
