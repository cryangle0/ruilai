<template>
  <div class="login-page">
    <section class="login-art">
      <div class="art-brand">
        <div class="brand-logo" aria-hidden="true">锐</div>
        <div>
          <div class="brand-name">锐涞经销商管理系统</div>
          <div class="brand-sub">RUI LAI DEALER SYSTEM</div>
        </div>
      </div>
      <div class="art-stage">
        <LoginCharacters :typing="typing" :password-len="password.length" :show-password="showPassword" />
      </div>
      <p class="art-foot">渠道授权 · SN 进销存 · 异常风控</p>
      <div class="art-grid" />
      <div class="art-blob art-blob-a" />
      <div class="art-blob art-blob-b" />
    </section>
    <section class="login-form-wrap">
      <div class="mobile-brand">
        <div class="brand-logo" aria-hidden="true">锐</div>
        <div>
          <div class="brand-name">锐涞经销商管理系统</div>
          <div class="brand-sub">RUI LAI DEALER SYSTEM</div>
        </div>
      </div>
      <div class="login-card">
        <h1>欢迎回来</h1>
        <p class="sub">请输入管理员账号与密码</p>
        <el-form @submit.prevent="submit">
          <div class="form-field">
            <label>管理员账号</label>
            <el-input
              v-model="username"
              placeholder="账号"
              size="large"
              autocomplete="username"
              @focus="typing = true"
              @blur="typing = false"
            />
          </div>
          <div class="form-field">
            <label>密码</label>
            <el-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="密码"
              size="large"
              autocomplete="current-password"
              @keyup.enter="submit"
            >
              <template #suffix>
                <el-icon class="eye" @click="showPassword = !showPassword">
                  <View v-if="!showPassword" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </div>
          <p class="hint">演示：admin / demo（或 admin2）· 运营专员 ops / demo</p>
          <div class="agree">
            <button type="button" class="cbx" :class="{ on: agreed }" aria-label="同意协议" @click="agreed = !agreed" />
            <span @click="agreed = !agreed">我已阅读并同意</span>
            <RouterLink to="/legal/agreement" @click.stop>《用户协议》</RouterLink>
            <span>和</span>
            <RouterLink to="/legal/privacy" @click.stop>《隐私政策》</RouterLink>
          </div>
          <el-button type="primary" class="submit" size="large" :loading="loading" @click="submit">
            进入管理后台
          </el-button>
        </el-form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import LoginCharacters from './LoginCharacters.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const username = ref('admin')
const password = ref('demo')
const loading = ref(false)
const typing = ref(false)
const showPassword = ref(false)
const agreed = ref(sessionStorage.getItem('ruilai_login_agreed') === '1')

watch(agreed, (v) => {
  sessionStorage.setItem('ruilai_login_agreed', v ? '1' : '0')
})

async function submit() {
  if (!agreed.value) {
    ElMessage.warning('请先阅读并勾选用户协议和隐私政策')
    return
  }
  loading.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    sessionStorage.removeItem('ruilai_disable_prompted')
    const raw = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    const path = raw.split('?')[0]
    await router.replace(auth.canAccess(path) ? raw : '/home')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.login-art {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 48px 32px;
  color: #fff;
  overflow: hidden;
  background: linear-gradient(150deg, #2B7BF0 0%, #1A68D7 48%, #124E9E 100%);
}
.art-brand {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
}
.art-brand .brand-logo,
.mobile-brand .brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--grad-primary);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 14px rgba(26, 104, 215, 0.35);
}
.art-brand .brand-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.2px;
  line-height: 1.25;
}
.art-brand .brand-sub {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 1px;
}
.art-stage {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 420px;
}
.art-foot {
  position: relative;
  z-index: 2;
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}
.art-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
  background-size: 22px 22px;
}
.art-blob {
  position: absolute; border-radius: 999px; filter: blur(60px); pointer-events: none;
}
.art-blob-a { width: 260px; height: 260px; right: 12%; top: 18%; background: rgba(255,255,255,.14); }
.art-blob-b { width: 360px; height: 360px; left: 8%; bottom: 8%; background: rgba(43, 123, 240, .28); }
.login-form-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: #F3F5F9;
}
.mobile-brand {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 28px;
}
.mobile-brand .brand-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.2px;
  line-height: 1.25;
}
.mobile-brand .brand-sub {
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: 1px;
}
.login-card {
  width: min(420px, 100%);
  padding: 36px 32px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
}
.login-card h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -.02em; }
.sub { margin: 8px 0 28px; color: var(--text-2); font-size: 14px; }
.form-field { margin-bottom: 16px; }
.form-field label {
  display: block; font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 8px;
}
.eye { cursor: pointer; color: var(--text-3); }
.login-card :deep(.el-input__wrapper) {
  min-height: 40px;
  height: 40px;
}
.agree {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 16px;
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.5;
  cursor: default;
}
.agree a { color: var(--primary-deep); font-weight: 600; }
.cbx {
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1.5px solid #C7DCF8;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
}
.cbx.on {
  border-color: var(--primary-deep);
  background: var(--primary) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M5 12.5 10 17.5 19 7'/%3E%3C/svg%3E") center / 12px no-repeat;
}
.submit {
  width: 100%;
  height: 40px !important;
  font-weight: 700;
  border-radius: 8px !important;
}
.hint { margin: 0 0 14px; color: var(--text-3); font-size: 12px; }
@media (max-width: 960px) {
  .login-page { grid-template-columns: 1fr; }
  .login-art { display: none; }
  .mobile-brand { display: flex; }
}
</style>
