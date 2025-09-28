<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="auth-header">
        <div class="auth-switch">
          <n-button text size="small" type="primary" disabled>
            {{ t('auth.common.toLogin') }}
          </n-button>
          <n-button text size="small" type="primary" :disabled="loading" @click="goRegister">
            {{ t('auth.common.toRegister') }}
          </n-button>
        </div>
        <h2 class="auth-title">{{ t('auth.common.title') }}</h2>
      </div>

      <!-- Step 1: 用户名 + 继续按钮（水平排列） -->
      <div class="row" v-if="!showPassword">
        <n-input
          v-model:value="username"
          round
          size="large"
          :status="usernameStatus"
          :disabled="loading"
          :placeholder="t('auth.login.usernamePlaceholder')"
          :input-props="{ autocomplete: 'username' }"
          class="username-input"
          @keyup.enter="onContinue"
        />
        <n-button
          round
          size="large"
          type="primary"
          :disabled="!canContinue || loading"
          @click="onContinue"
          class="continue-btn"
        >
          {{ t('auth.login.continue') }}
        </n-button>
      </div>

      <!-- Step 2: 锁定的用户名，仅显示输入框（无继续按钮） -->
      <div class="row" v-else>
        <n-input
          v-model:value="username"
          round
          size="large"
          :status="serverAuthFailed ? 'error' : usernameStatus"
          disabled
          :placeholder="t('auth.login.usernamePlaceholder')"
          :input-props="{ autocomplete: 'username' }"
          class="username-input only"
        />
      </div>

      <!-- Step 2: 密码输入框（圆角） -->
      <transition name="fade-slide">
        <div v-if="showPassword" class="col">
          <n-input
            v-model:value="password"
            type="password"
            round
            size="large"
          show-password-on="mousedown"
          :status="serverAuthFailed ? 'error' : undefined"
          :placeholder="t('auth.login.passwordPlaceholder')"
          :input-props="{ autocomplete: 'current-password' }"
          @keyup.enter="onLogin"
        />
        </div>
      </transition>

      <!-- 登录按钮（与上方区域等宽） -->
      <div class="actions">
        <n-button
          v-if="showPassword"
          type="primary"
          size="large"
          round
          block
          :loading="loading"
          :disabled="!canSubmit"
          @click="onLogin"
        >
          {{ t('auth.login.submit') }}
        </n-button>
      </div>

      <!-- 返回按钮（左下角，quaternary 小按钮） -->
      <div class="sub-actions" v-if="showPassword">
        <n-button quaternary size="small" :disabled="loading" @click="onBack">
          {{ t('auth.login.back') }}
        </n-button>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { userLogin } from '@/api/users/api'
import type { userLoginQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/locale'

const router = useRouter()
const { t } = useI18n()

// state
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const serverAuthFailed = ref(false)

// username 校验：3-20位，字母数字._-
const usernamePattern = /^[A-Za-z0-9._-]{3,20}$/
const usernameValid = computed(() => usernamePattern.test(username.value))
const usernameStatus = computed(() => {
  if (!username.value) return undefined
  return usernameValid.value ? 'success' : 'error'
})

const canContinue = computed(() => usernameValid.value)
const canSubmit = computed(() => showPassword.value && password.value.length > 0 && !loading.value)

watch([username, password], () => {
  if (serverAuthFailed.value) serverAuthFailed.value = false
})

const onContinue = () => {
  if (!canContinue.value) return
  showPassword.value = true
}

const onLogin = async () => {
  if (!canSubmit.value) return
  loading.value = true
  serverAuthFailed.value = false
  const payload: userLoginQuery = {
    username: username.value,
    password: password.value,
  }
  try {
    const res = await userLogin(payload)
    setTokenCookies(res.access, res.refresh)
    router.replace('/drive')
  } catch (e) {
    // 认证失败：将两个输入框置为 error
    serverAuthFailed.value = true
  } finally {
    loading.value = false
  }
}

const onBack = () => {
  if (loading.value) return
  showPassword.value = false
  password.value = ''
  serverAuthFailed.value = false
}

const goRegister = () => {
  if (loading.value) return
  router.push('/register')
}
</script>

<style scoped>
.login-wrap {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.login-card {
  width: 420px;
  max-width: 92vw;
  background: rgb(var(--color-surface-muted));
  border: 1px solid var(--border-color-subtle);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 28px 80px rgba(17, 17, 17, 0.08);
}
.auth-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.auth-switch {
  display: flex;
  gap: 8px;
}
.auth-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgb(var(--color-text-primary));
}
.row {
  display: flex;
  gap: 12px;
}
.col {
  margin-top: 12px;
}
.username-input {
  flex: 1 1 auto;
}
.username-input.only {
  width: 100%;
}
.continue-btn {
  flex: 0 0 auto;
}
.actions {
  margin-top: 16px;
}
.sub-actions {
  margin-top: 8px;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.18s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
