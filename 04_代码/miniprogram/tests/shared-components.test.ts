import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', 'src')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

test('mini-program theme exposes the full design palette without dropping legacy aliases', () => {
  const theme = read('styles/theme.scss')
  for (const token of [
    '$rl-navy: #1A2B4A',
    '$rl-text-secondary: #7A879C',
    '$rl-text-tertiary: #8A97AD',
    '$rl-text-placeholder: #9AA6BA',
    '$rl-border-design: #E3E9F2',
    '$rl-border-soft: #EDF1F7',
    '$rl-fill-primary: #F5F9FF',
    '$rl-fill-soft: #FBFCFE',
    '$rl-primary-deep:',
    '$rl-glass:',
  ]) {
    assert.match(theme, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('detail building blocks expose section, key-value, and table primitives', () => {
  const section = read('components/DetailSection.vue')
  const kv = read('components/DetailKv.vue')
  const table = read('components/DetailTable.vue')

  assert.match(section, /slot name="action"/)
  assert.match(kv, /items:/)
  assert.match(kv, /columns\?:/)
  assert.match(kv, /<slot\s+:name="`value-\$\{item\.key\}`"/)
  assert.match(kv, /:item="item"/)
  assert.match(table, /columns:/)
  assert.match(table, /rows:/)
  assert.match(table, /emptyText/)
  assert.match(table, /<slot\s+:name="`cell-\$\{column\.key\}`"/)
  assert.match(table, /:row="row"/)
  assert.match(table, /:row-index="rowIndex"/)
})

test('form and paging primitives expose disabled, error, busy, and retry states', () => {
  const picker = read('components/FormPicker.vue')
  const scan = read('components/ScanField.vue')
  const uploader = read('components/FileUploader.vue')
  const paged = read('components/PagedState.vue')

  assert.match(picker, /disabled\?: boolean/)
  assert.match(picker, /error\?: string/)
  assert.match(scan, /scanning/)
  assert.match(uploader, /uploading/)
  assert.match(paged, /submitting/)
  assert.match(paged, /'load-more'/)
  assert.match(paged, /retry/)
})

test('file uploader has a four-image API and reports non-cancel selection errors', () => {
  const uploader = read('components/FileUploader.vue')

  assert.match(uploader, /maxCount\?: 1 \| 2 \| 3 \| 4/)
  assert.match(uploader, /const MAX_IMAGE_COUNT = 4/)
  assert.match(uploader, /isChooseImageCancelled/)
  assert.match(uploader, /emit\('upload-error', chooseError\)/)
  assert.match(uploader, /uploadFile\(path\)/)
})

test('privacy popup requires an explicit privacy authorization action', () => {
  const popup = read('components/PrivacyPopup.vue')

  assert.doesNotMatch(popup, /class="mask"\s+@click/)
  assert.match(popup, /open-type="agreePrivacyAuthorization"/)
  assert.match(popup, /@agreeprivacyauthorization="onAgreePrivacyAuthorization"/)
  assert.match(popup, /agreePrivacyAuthorization:ok/)
  assert.match(popup, /supportsPrivacyAuthorization/)
  assert.match(popup, /uni\.setStorageSync\('rl_privacy_ok', 1\)/)
})

test('status tag infers tones through exact status lookup', () => {
  const tag = read('components/StatusTag.vue')

  assert.match(tag, /STATUS_TONES/)
  assert.match(tag, /STATUS_TONES\[raw\]/)
  assert.doesNotMatch(tag, /\.test\(states\)/)
})
