import { defineComponent, h } from 'vue'

export const EMPTY_STATE_TEXT = '当前筛选暂无记录'

export default defineComponent({
  name: 'EmptyStateContent',
  setup() {
    return () => h('view', {
      class: 'empty-state__content',
      role: 'status',
      'aria-label': EMPTY_STATE_TEXT,
    }, [
      h('view', {
        class: 'empty-state__icon',
        'aria-hidden': 'true',
      }, [
        h('view', { class: 'empty-state__icon-lid' }),
        h('view', { class: 'empty-state__icon-bin' }),
      ]),
      h('text', { class: 'empty-state__text' }, EMPTY_STATE_TEXT),
    ])
  },
})
