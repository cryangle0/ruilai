import { defineComponent, h } from 'vue'

export const EMPTY_STATE_TEXT = '当前筛选暂无记录'

export default defineComponent({
  name: 'EmptyStateContent',
  setup() {
    return () => h('div', {
      class: 'empty-state__content',
      role: 'status',
      'aria-label': EMPTY_STATE_TEXT,
    }, [
      h('div', {
        class: 'empty-state__icon',
        'aria-hidden': 'true',
      }, [
        h('span', { class: 'empty-state__icon-lid' }),
        h('span', { class: 'empty-state__icon-bin' }),
      ]),
      h('p', { class: 'empty-state__text' }, EMPTY_STATE_TEXT),
    ])
  },
})
