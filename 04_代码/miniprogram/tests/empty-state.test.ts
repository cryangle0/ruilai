import assert from 'node:assert/strict'
import test from 'node:test'
import { createRenderer } from 'vue'

async function loadComponent() {
  return import('../src/components/EmptyStateContent.ts').catch(() => ({}))
}

function mount(component: object) {
  const renderer = createRenderer<Record<string, unknown>, Record<string, any>>({
    patchProp(node, key, _previous, value) {
      node.props[key] = value
    },
    insert(node, parent) {
      parent.children.push(node)
    },
    remove() {},
    createElement(type) {
      return { type, props: {}, children: [] }
    },
    createText(text) {
      return { type: '#text', text }
    },
    createComment(text) {
      return { type: '#comment', text }
    },
    setText(node, text) {
      node.text = text
    },
    setElementText(node, text) {
      node.children = [{ type: '#text', text }]
    },
    parentNode() {
      return null
    },
    nextSibling() {
      return null
    },
    querySelector() {
      return null
    },
    setScopeId() {},
    cloneNode(node) {
      return structuredClone(node)
    },
    insertStaticContent() {
      throw new Error('static content is not expected')
    },
  })
  const root = { type: 'root', props: {}, children: [] }
  renderer.createApp(component).mount(root)
  return root
}

function textContent(node: Record<string, any>): string {
  return node.text || (node.children || []).map(textContent).join('')
}

test('mini shared empty state renders the issue 34 text and icon contract', async () => {
  const { default: EmptyStateContent } = await loadComponent()
  assert.equal(typeof EmptyStateContent, 'object', 'shared runtime component must exist')

  const root = mount(EmptyStateContent)
  const content = root.children[0]

  assert.equal(content.type, 'view')
  assert.equal(content.props.role, 'status')
  assert.equal(content.props['aria-label'], '当前筛选暂无记录')
  assert.equal(content.children[0].props['aria-hidden'], 'true')
  assert.equal(textContent(content), '当前筛选暂无记录')
})
