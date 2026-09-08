import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPurchasePayload,
  nonstandardOptions,
  standardOptions,
} from '../src/pkg/purchase/model.ts'

const kit = {
  id: 'P1',
  name: '锐涞经典款套件',
  type: 'kit',
  extra: {
    components: [
      { name: '腰带', sizes: ['腰带S', '腰带M', '腰带L'] },
      { name: '弹力带', sizes: ['SS', 'S', 'M', 'L', 'LL'] },
    ],
    stdCombos: [
      { key: 'S-SS', grade: '小', belt: '腰带S', size: 'SS', label: '小（腰带S+弹力带SS）' },
      { key: 'S-S', grade: '小', belt: '腰带S', size: 'S', label: '小（腰带S+弹力带S）' },
      { key: 'M-M', grade: '中', belt: '腰带M', size: 'M', label: '中（腰带M+弹力带M）' },
      { key: 'L-L', grade: '大', belt: '腰带L', size: 'L', label: '大（腰带L+弹力带L）' },
      { key: 'L-LL', grade: '大', belt: '腰带L', size: 'LL', label: '大（腰带L+弹力带LL）' },
    ],
    bundleSingles: ['P-SINGLE'],
  },
}

const single = {
  id: 'P-SINGLE',
  name: '锐涞护膝单品',
  type: 'single',
  extra: { sizes: ['S', 'M'] },
}

test('configured standard kit combinations remain complete and ordered', () => {
  const rows = standardOptions(kit)
  assert.equal(rows.length, 5)
  assert.deepEqual(rows.map((row) => row.key), ['S-SS', 'S-S', 'M-M', 'L-L', 'L-LL'])
})

test('nonstandard combinations use maintained sizes and exclude standard rows', () => {
  const rows = nonstandardOptions(kit)
  assert.equal(rows.length, 10)
  assert.equal(rows.some((row) => row.belt === '腰带S' && row.size === 'SS'), false)
  assert.equal(rows.some((row) => row.belt === '腰带S' && row.size === 'M'), true)
  assert.equal(rows.some((row) => row.belt === '腰带M' && row.size === 'M'), false)
})

test('kit payload preserves standard, nonstandard, and bundled single lines', () => {
  const payload = buildPurchasePayload({
    product: kit,
    products: [kit, single],
    standardQty: { 'S-SS': 2, 'M-M': 1 },
    customLines: [{ belt: '腰带S', size: 'M', qty: 3 }],
    bundleQty: { 'P-SINGLE': { S: 4, M: 0 } },
  })

  assert.deepEqual(payload.lines, [
    { productId: 'P1', belt: '腰带S', size: 'SS', qty: 2 },
    { productId: 'P1', belt: '腰带M', size: 'M', qty: 1 },
    { productId: 'P-SINGLE', belt: '', size: 'S', qty: 4 },
  ])
  assert.deepEqual(payload.customLines, [
    { productId: 'P1', belt: '腰带S', size: 'M', qty: 3 },
  ])
  assert.deepEqual(payload.parts, [])
})

test('part quantities are sent only as parts and zero quantities are omitted', () => {
  const payload = buildPurchasePayload({
    product: { id: 'PART1', name: '绑带配件', type: 'part', extra: { sizes: ['短', '长'] } },
    products: [],
    standardQty: { 短: 0, 长: 2 },
    customLines: [],
    bundleQty: {},
  })

  assert.deepEqual(payload.lines, [])
  assert.deepEqual(payload.customLines, [])
  assert.deepEqual(payload.parts, [{ partId: 'PART1', spec: '长', qty: 2 }])
})

test('single quantities are sent as SN-bearing standard lines', () => {
  const payload = buildPurchasePayload({
    product: single,
    products: [single],
    standardQty: { S: 1, M: 2 },
    customLines: [],
    bundleQty: {},
  })

  assert.deepEqual(payload.lines, [
    { productId: 'P-SINGLE', belt: '', size: 'S', qty: 1 },
    { productId: 'P-SINGLE', belt: '', size: 'M', qty: 2 },
  ])
  assert.deepEqual(payload.parts, [])
})
