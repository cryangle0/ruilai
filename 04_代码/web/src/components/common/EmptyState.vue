<template>
  <div class="empty-state">
    <EmptyStateContent />
    <slot />
  </div>
</template>

<script setup lang="ts">
import EmptyStateContent from './EmptyStateContent.js'
</script>

<style scoped>
.empty-state {
  display: grid;
  min-height: 176px;
  place-items: center;
  padding: 24px 0;
  color: #8a97ad;
  text-align: center;
}
:deep(.empty-state__content) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
:deep(.empty-state__icon) {
  position: relative;
  width: 30px;
  height: 32px;
}
:deep(.empty-state__icon-lid),
:deep(.empty-state__icon-bin) {
  position: absolute;
  display: block;
  background: #9aa6b6;
}
:deep(.empty-state__icon-lid) {
  top: 0;
  left: 4px;
  width: 22px;
  height: 4px;
  border-radius: 2px 2px 1px 1px;
}
:deep(.empty-state__icon-lid::before) {
  position: absolute;
  top: -3px;
  left: 6px;
  width: 10px;
  height: 3px;
  border-radius: 2px 2px 0 0;
  background: #9aa6b6;
  content: '';
}
:deep(.empty-state__icon-bin) {
  top: 6px;
  left: 5px;
  width: 20px;
  height: 23px;
  border-radius: 1px 1px 4px 4px;
}
:deep(.empty-state__text) {
  margin: 0;
  color: #8a97ad;
  font-size: 14px;
  line-height: 1.5;
}
</style>
