export function adminDisableSlot(username?: string) {
  return username === 'admin' ? 'admin1' : 'admin2'
}

export function pendingDisableForAccount<T extends { disableCosign?: Record<string, unknown> }>(
  list: T[] | undefined,
  username?: string,
) {
  const slot = adminDisableSlot(username)
  return (list || []).filter((a) => !a.disableCosign?.[slot])
}

export function alreadySignedDisable<T extends { disableCosign?: Record<string, unknown> }>(
  a: T,
  username?: string,
) {
  const slot = adminDisableSlot(username)
  return Boolean(a.disableCosign?.[slot])
}

export function disableApplyLine(a: { disableCosign?: Record<string, unknown> }) {
  const c = a.disableCosign || {}
  const who = String(c.admin1 ? (c.admin1By || 'admin') : (c.admin2By || 'admin2'))
  const raw = String(c.admin1At || c.admin2At || '—')
  const at = raw.replace('T', ' ').slice(0, 19)
  return `${who} 已于 ${at} 申请停用`
}
