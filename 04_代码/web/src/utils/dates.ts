const CN_TZ = 'Asia/Shanghai'

/** Calendar date in China, independent of the browser's local timezone. */
export function todayDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function monthStart() {
  return `${todayDate().slice(0, 8)}01`
}

/** ISO `2026-08-31T16:54:48` → `2026-08-31 16:54:48`（不改时区） */
export function formatDateTime(value?: string | number | Date | null) {
  if (value == null || value === '') return '—'
  const s = String(value)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/)
  if (m) return `${m[1]} ${m[2]}`
  const trimmed = s.replace('T', ' ').slice(0, 19)
  return trimmed || '—'
}

export function dateTimeFormatter(_row: unknown, _column: unknown, cellValue: unknown) {
  return formatDateTime(cellValue as string | number | Date | null)
}
