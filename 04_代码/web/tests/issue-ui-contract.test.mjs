import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('issue 1 removes the redundant todo action and fills the row', () => {
  const view = source('src/views/home/HomeView.vue')
  assert.doesNotMatch(view, /查看全部待办/)
  assert.match(view, /grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/)
})

test('issues 6, 9, 10, 20, 30, 39 and 44 allow short dialogs to fit content', () => {
  const styles = source('src/styles/index.css')
  assert.doesNotMatch(styles, /height:\s*min\(80vh,\s*calc\(100vh - 48px\)\)/)
  assert.match(styles, /\.el-dialog\s*\{[\s\S]*?height:\s*auto/)
})

test('issues 11 through 15 simplify and rebalance the SN list controls', () => {
  const view = source('src/views/goods/SnView.vue')
  assert.doesNotMatch(view, /系统生成SN/)
  assert.match(view, /class="date-range-filter"/)
  assert.doesNotMatch(view, /<el-option label="个性化"/)
  assert.match(view, /<el-option label="再入库" value="再入库"/)
  assert.match(view, /visibleTags\(row\.tags\)/)
})

test('issue 19 keeps size controls in one aligned editor row', () => {
  const view = source('src/views/goods/ProductView.vue')
  assert.match(view, /class="size-config-row"/)
})
