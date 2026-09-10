function asText(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return undefined
}

/** WeChat `<input>` / `<textarea>` 事件值。自定义组件里经常拿不到 `$event.detail.value`，受控 `:value` 就会把刚输入的字清掉。 */
export function inputEventValue(event: unknown, fallback = '') {
  const direct = asText(event)
  if (direct != null) return direct
  const row = event as {
    detail?: { value?: unknown; detail?: { value?: unknown } }
    mp?: { detail?: { value?: unknown } }
    target?: { value?: unknown }
  } | null
  const candidates = [
    asText(row?.detail?.value),
    asText(row?.detail?.detail?.value),
    asText(row?.mp?.detail?.value),
    asText(row?.target?.value),
  ]
  for (const value of candidates) {
    if (value != null) return value
  }
  return fallback
}
