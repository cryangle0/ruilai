import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStockDetail,
  removePhotoAt,
  returnDetailItems,
} from '../src/utils/miniPages.ts'

test('stock detail maps populated backend rows and encoded specifications', () => {
  const detail = buildStockDetail({
    productId: 'P1',
    size: 'M',
    belt: '%E8%85%B0%E5%B8%A6M',
  }, [
    { productId: 'P1', productName: '锐涞经典款套件', size: 'M', belt: '腰带M', qty: 2, sns: ['S1', 'S2'], l1Name: '华东总代', status: 'l1' },
    { productId: 'P1', productName: '锐涞经典款套件', size: 'M', belt: '腰带M', qty: 1, sns: ['S3'], l1Name: '华东总代', status: 'l1' },
  ], [
    { sn: 'S1', productId: 'P1', sizeCode: 'M', belt: '腰带M', status: 'l1' },
    { sn: 'OTHER', productId: 'P2', sizeCode: 'M', belt: '腰带M', status: 'l1' },
  ], [
    { id: 'H1', productId: 'P1', sizeCode: 'M', occurredAt: '2026-09-10 10:00:00' },
    { id: 'H2', productId: 'P2', sizeCode: 'M', occurredAt: '2026-09-10 09:00:00' },
  ])

  assert.equal(detail.productName, '锐涞经典款套件')
  assert.equal(detail.size, 'M')
  assert.equal(detail.belt, '腰带M')
  assert.equal(detail.qty, 3)
  assert.deepEqual(detail.snRows.map((row: any) => row.sn), ['S1', 'S2', 'S3'])
  assert.deepEqual(detail.logs.map((row: any) => row.id), ['H1'])
})

test('stock detail does not display stale draft data when backend is empty', () => {
  const detail = buildStockDetail(
    { productId: 'P1', size: 'M', belt: '腰带M' },
    [],
    [],
    [],
    { productName: '过期缓存', qty: 99, sns: ['STALE'] },
  )

  assert.deepEqual(detail, {})
})

test('return detail labels after-sales note immediately after reason for every return type', () => {
  const expectedTypes: Record<string, string> = {
    l2_to_l1: '二级退一级',
    user: '终端退货',
    l1_to_factory: '一级退原厂',
  }

  for (const [type, label] of Object.entries(expectedTypes)) {
    const items = returnDetailItems({
      type,
      reasonType: '外观损坏',
      reason: '拉链断了',
      fromName: '杭州城西专营',
      status: 'done',
      createdAt: '2026-09-10 10:00:00',
    }, (value: string) => value)

    assert.deepEqual(items.slice(0, 3).map((item: any) => item.key), ['type', 'reason', 'afterSaleNote'])
    assert.equal(items[0].value, label)
    assert.equal(items[1].value, '外观损坏')
    assert.equal(items[2].label, '售后说明')
    assert.equal(items[2].value, '拉链断了')
    assert.equal(items.find((item: any) => item.key === 'status')?.value, '已通过')
  }
})

test('deleting one uploaded proof preserves the other images and payload order', () => {
  const photos = ['proof-a.jpg', 'proof-b.jpg', 'proof-c.jpg']
  const next = removePhotoAt(photos, 1)

  assert.deepEqual(next, ['proof-a.jpg', 'proof-c.jpg'])
  assert.deepEqual(photos, ['proof-a.jpg', 'proof-b.jpg', 'proof-c.jpg'])
})
