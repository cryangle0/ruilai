export type ExceptionRequestScope = {
  dim?: string
  status?: string
  type?: string
  l1Id?: string
  l2Id?: string
  from?: string
  to?: string
  sn?: string
}

export function exceptionRequestScope(scope: Record<string, unknown>): ExceptionRequestScope {
  const text = (value: unknown) => typeof value === 'string' && value ? value : undefined
  const sn = text(scope.sn)?.trim() || undefined
  return {
    dim: text(scope.dim),
    status: text(scope.status),
    type: text(scope.type),
    l1Id: text(scope.l1Id),
    l2Id: text(scope.l2Id),
    from: sn ? undefined : text(scope.from),
    to: sn ? undefined : text(scope.to),
    sn,
  }
}
