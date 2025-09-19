<template>
  <div class="login-wrap">
    <div class="login-card">
      <!-- Step 1: 用户名 + 继续按钮（水平排列） -->
      <div class="row" v-if="!showPassword">
        <n-input
          v-model:value="username"
          round
          size="large"
          :status="usernameStatus"
          :disabled="loading"
          placeholder="请输入用户名"
          :input-props="{ autocomplete: 'username' }"
          class="username-input"
        />
        <n-button
          round
          size="large"
          type="primary"
          :disabled="!canContinue || loading"
          @click="onContinue"
          class="continue-btn"
        >
          继续
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
          placeholder="用户名"
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
            placeholder="请输入密码"
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
          登录
        </n-button>
      </div>

      <!-- 返回按钮（左下角，quaternary 小按钮） -->
      <div class="sub-actions" v-if="showPassword">
        <n-button quaternary size="small" :disabled="loading" @click="onBack">
          返回
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

const router = useRouter()

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
</script>

<style scoped>
.login-wrap {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.login-card {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
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
