<template>
  <el-button v-if="visible" @click="go">返回</el-button>
</template>
<script setup lang="ts">
import { useBackToDetail } from '@/composables/useBackToDetail'

const { visible, go } = useBackToDetail()
</script>
