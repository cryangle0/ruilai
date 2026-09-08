<template>
  <div class="policy-page">
    <header class="policy-bar">
      <button type="button" class="back" @click="goBack">返回</button>
      <strong>{{ doc.title }}</strong>
      <span class="ver">v{{ doc.version }}</span>
    </header>
    <article class="policy-body">
      <h1>{{ doc.title }}</h1>
      <p class="meta">生效日期 {{ doc.effectiveAt }} · 最近更新 {{ doc.updatedAt }}</p>
      <p class="intro">{{ doc.intro }}</p>
      <section v-for="sec in doc.sections" :key="sec.heading">
        <h2>{{ sec.heading }}</h2>
        <p v-for="(p, i) in sec.paragraphs" :key="i">{{ p }}</p>
        <ul v-if="sec.bullets?.length">
          <li v-for="(b, i) in sec.bullets" :key="i">{{ b }}</li>
        </ul>
      </section>
      <p class="foot">{{ doc.footer }}</p>
      <nav class="switch">
        <RouterLink v-if="doc.kind === 'agreement'" to="/legal/privacy">阅读《隐私政策》</RouterLink>
        <RouterLink v-else to="/legal/agreement">阅读《用户协议》</RouterLink>
      </nav>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPolicy } from '@/legal/policies'

const route = useRoute()
const router = useRouter()
const doc = computed(() => getPolicy(String(route.params.type || 'agreement')))

watchEffect(() => {
  document.title = `${doc.value.title} · 锐涞经销商`
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.replace('/login')
}
</script>

<style scoped>
.policy-page {
  min-height: 100vh;
  background: #f4f7fa;
}
.policy-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(16px);
}
.policy-bar strong { flex: 1; font-size: 15px; }
.back {
  border: 0;
  background: transparent;
  color: var(--primary-deep);
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
}
.ver { font-size: 12px; color: var(--text-3); }
.policy-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 22px 64px;
  color: var(--text);
  line-height: 1.75;
}
h1 { margin: 0 0 8px; font-size: 26px; font-weight: 800; }
.meta { margin: 0 0 20px; color: var(--text-3); font-size: 13px; }
.intro, p { margin: 0 0 12px; font-size: 14px; color: var(--text-2); }
h2 { margin: 28px 0 10px; font-size: 16px; font-weight: 700; color: var(--text); }
ul { margin: 0 0 12px; padding-left: 1.2em; color: var(--text-2); font-size: 14px; }
li { margin-bottom: 6px; }
.foot { margin-top: 28px; font-size: 13px; color: var(--text-3); }
.switch { margin-top: 16px; }
.switch a { color: var(--primary-deep); font-weight: 600; font-size: 14px; }
</style>
