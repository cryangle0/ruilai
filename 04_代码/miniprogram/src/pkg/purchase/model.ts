export type PurchaseProduct = {
  id: string
  name?: string
  type?: 'kit' | 'single' | 'part' | string
  sizes?: string[]
  extra?: Record<string, any>
  [key: string]: any
}

export type PurchaseOption = {
  key: string
  grade?: string
  belt: string
  size: string
  label: string
}

export type CustomLine = {
  belt: string
  size: string
  qty: number
}

type BuildPayloadInput = {
  product: PurchaseProduct
  products: PurchaseProduct[]
  standardQty: Record<string, number>
  customLines: CustomLine[]
  bundleQty: Record<string, Record<string, number>>
}

const CLASSIC_STANDARDS: PurchaseOption[] = [
  { key: 'S-SS', grade: '小', belt: '腰带S', size: 'SS', label: '小（腰带S+弹力带SS）' },
  { key: 'S-S', grade: '小', belt: '腰带S', size: 'S', label: '小（腰带S+弹力带S）' },
  { key: 'M-M', grade: '中', belt: '腰带M', size: 'M', label: '中（腰带M+弹力带M）' },
  { key: 'L-L', grade: '大', belt: '腰带L', size: 'L', label: '大（腰带L+弹力带L）' },
  { key: 'L-LL', grade: '大', belt: '腰带L', size: 'LL', label: '大（腰带L+弹力带LL）' },
]

export function productMeta(product?: PurchaseProduct | null) {
  if (!product) return {} as Record<string, any>
  return product.extra && typeof product.extra === 'object' ? product.extra : product
}

function cleanStrings(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return [...new Set(input.map((item) => String(item || '').trim()).filter(Boolean))]
}

function componentsOf(product: PurchaseProduct) {
  const meta = productMeta(product)
  return Array.isArray(meta.components) ? meta.components : []
}

export function productSizes(product: PurchaseProduct): string[] {
  const meta = productMeta(product)
  if (product.type === 'kit') {
    const component = componentsOf(product)[1]
    return cleanStrings(component?.sizes || component?.pool || meta.sizes)
  }
  return cleanStrings(meta.sizes || product.sizes)
}

export function productBelts(product: PurchaseProduct): string[] {
  const meta = productMeta(product)
  const component = componentsOf(product)[0]
  return cleanStrings(component?.sizes || component?.pool || meta.belts)
}

export function componentNames(product: PurchaseProduct) {
  const meta = productMeta(product)
  const components = componentsOf(product)
  return {
    belt: String(components[0]?.name || meta.compAName || '腰带'),
    band: String(components[1]?.name || meta.compBName || '弹力带'),
  }
}

export function standardOptions(product: PurchaseProduct): PurchaseOption[] {
  if (product.type !== 'kit') {
    return productSizes(product).map((size) => ({
      key: size,
      belt: '',
      size,
      label: size,
    }))
  }

  const meta = productMeta(product)
  if (Array.isArray(meta.stdCombos) && meta.stdCombos.length) {
    return meta.stdCombos.map((row: any) => {
      const belt = String(row.belt || '')
      const size = String(row.size || '')
      const grade = String(row.grade || '')
      return {
        key: String(row.key || `${belt}|${size}`),
        grade,
        belt,
        size,
        label: String(row.label || `${grade ? `${grade}（` : ''}${belt}+${componentNames(product).band}${size}${grade ? '）' : ''}`),
      }
    })
  }

  const belts = productBelts(product)
  const sizes = productSizes(product)
  const classicReady = ['腰带S', '腰带M', '腰带L'].every((item) => belts.includes(item))
    && ['SS', 'S', 'M', 'L', 'LL'].every((item) => sizes.includes(item))
  return classicReady ? CLASSIC_STANDARDS.map((row) => ({ ...row })) : []
}

export function nonstandardOptions(product: PurchaseProduct): PurchaseOption[] {
  if (product.type !== 'kit') return []
  const names = componentNames(product)
  const standardKeys = new Set(standardOptions(product).map((row) => `${row.belt}|${row.size}`))
  const rows: PurchaseOption[] = []
  for (const belt of productBelts(product)) {
    for (const size of productSizes(product)) {
      if (standardKeys.has(`${belt}|${size}`)) continue
      rows.push({
        key: `${belt}|${size}`,
        belt,
        size,
        label: `${belt}+${names.band}${size}`,
      })
    }
  }
  return rows
}

export function bundleProducts(product: PurchaseProduct, products: PurchaseProduct[]) {
  const ids = cleanStrings(productMeta(product).bundleSingles)
  return ids
    .map((id) => products.find((item) => item.id === id && item.type === 'single'))
    .filter((item): item is PurchaseProduct => Boolean(item))
}

function positiveQty(value: unknown) {
  const number = Number(value) || 0
  return number > 0 ? Math.floor(number) : 0
}

export function buildPurchasePayload(input: BuildPayloadInput) {
  const lines: Array<{ productId: string; belt: string; size: string; qty: number }> = []
  const customLines: Array<{ productId: string; belt: string; size: string; qty: number }> = []
  const parts: Array<{ partId: string; spec: string; qty: number }> = []
  const { product, products, standardQty, bundleQty } = input

  for (const option of standardOptions(product)) {
    const qty = positiveQty(standardQty[option.key])
    if (!qty) continue
    if (product.type === 'part') parts.push({ partId: product.id, spec: option.size, qty })
    else lines.push({ productId: product.id, belt: option.belt, size: option.size, qty })
  }

  if (product.type === 'kit') {
    for (const row of input.customLines) {
      const qty = positiveQty(row.qty)
      if (qty) customLines.push({ productId: product.id, belt: row.belt, size: row.size, qty })
    }
    for (const bundled of bundleProducts(product, products)) {
      for (const size of productSizes(bundled)) {
        const qty = positiveQty(bundleQty[bundled.id]?.[size])
        if (qty) lines.push({ productId: bundled.id, belt: '', size, qty })
      }
    }
  }

  return { lines, customLines, parts }
}

export function payloadTotal(payload: ReturnType<typeof buildPurchasePayload>) {
  return [...payload.lines, ...payload.customLines, ...payload.parts]
    .reduce((total, row) => total + positiveQty(row.qty), 0)
}
