<template>
  <div class="register-wrap">
    <div class="register-card">
      <!-- Step 1: 基本信息（用户名、昵称、邮箱） + 继续 -->
      <div v-if="!showPwd" class="col">
        <n-input
          v-model:value="username"
          round
          size="large"
          :status="usernameStatus"
          :disabled="loading"
          placeholder="用户名"
          :input-props="{ autocomplete: 'username' }"
        />
        <n-input
          v-model:value="displayName"
          round
          size="large"
          :status="displayStatus"
          :disabled="loading"
          placeholder="昵称"
        />
        <n-input
          v-model:value="email"
          round
          size="large"
          :status="emailStatus"
          :disabled="loading"
          placeholder="邮箱"
          :input-props="{ autocomplete: 'email' }"
        />
        <div class="actions">
          <n-button
            type="primary"
            size="large"
            round
            block
            :disabled="!canContinue || loading"
            @click="onContinue"
          >
            继续
          </n-button>
        </div>
      </div>

      <!-- Step 2: 锁定基本信息 + 设置密码 -->
      <div v-else class="col">
        <n-input
          v-model:value="username"
          round
          size="large"
          :status="usernameStatus"
          disabled
          placeholder="用户名"
        />
        <n-input
          v-model:value="displayName"
          round
          size="large"
          :status="displayStatus"
          disabled
          placeholder="昵称"
        />
        <n-input
          v-model:value="email"
          round
          size="large"
          :status="emailStatus"
          disabled
          placeholder="邮箱"
        />

        <n-input
          v-model:value="password"
          type="password"
          round
          size="large"
          show-password-on="mousedown"
          :status="pwdStatus"
          placeholder="密码（至少 6 位）"
          :input-props="{ autocomplete: 'new-password' }"
          class="mt"
        />
        <n-input
          v-model:value="confirm"
          type="password"
          round
          size="large"
          show-password-on="mousedown"
          :status="confirmStatus"
          placeholder="确认密码"
          :input-props="{ autocomplete: 'new-password' }"
          @keyup.enter="onRegister"
        />

        <div class="actions">
          <n-button
            type="primary"
            size="large"
            round
            block
            :loading="loading"
            :disabled="!canSubmit"
            @click="onRegister"
          >
            注册
          </n-button>
        </div>
        <div class="sub-actions">
          <n-button quaternary size="small" :disabled="loading" @click="onBack">
            返回
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { userRegister } from '@/api/users/api'
import type { userRegisterQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import { useRouter } from 'vue-router'

const router = useRouter()

// Step state
const showPwd = ref(false)
const loading = ref(false)

// Fields
const username = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')

// Validation
const usernamePattern = /^[A-Za-z0-9._-]{3,20}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernameValid = computed(() => usernamePattern.test(username.value))
const displayValid = computed(() => !!displayName.value.trim())
const emailValid = computed(() => emailPattern.test(email.value))
const pwdValid = computed(() => password.value.length >= 6)
const confirmValid = computed(() => confirm.value.length > 0 && confirm.value === password.value)

const usernameStatus = computed(() => (username.value ? (usernameValid.value ? 'success' : 'error') : undefined))
const displayStatus = computed(() => (displayName.value ? (displayValid.value ? 'success' : 'error') : undefined))
const emailStatus = computed(() => (email.value ? (emailValid.value ? 'success' : 'error') : undefined))
const pwdStatus = computed(() => (password.value ? (pwdValid.value ? 'success' : 'error') : undefined))
const confirmStatus = computed(() => (confirm.value ? (confirmValid.value ? 'success' : 'error') : undefined))

const canContinue = computed(() => usernameValid.value && displayValid.value && emailValid.value)
const canSubmit = computed(() => showPwd.value && pwdValid.value && confirmValid.value && !loading.value)

watch([username, displayName, email, password, confirm], () => {
  // 变更任意输入时，未来可重置服务端错误状态
})

const onContinue = () => {
  if (!canContinue.value) return
  showPwd.value = true
}

const onBack = () => {
  if (loading.value) return
  showPwd.value = false
  password.value = ''
  confirm.value = ''
}

const onRegister = async () => {
  if (!canSubmit.value) return
  loading.value = true
  const payload: userRegisterQuery = {
    username: username.value,
    password: password.value,
    email: email.value,
    display_name: displayName.value,
  }
  try {
    const res = await userRegister(payload)
    setTokenCookies(res.access, res.refresh)
    router.replace('/drive')
  } catch (e) {
    // 简单处理：保持在当前步骤，用户自行调整输入
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-wrap {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.register-card {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}
.col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.actions {
  margin-top: 8px;
}
.sub-actions {
  margin-top: 8px;
}
.mt { margin-top: 4px; }
</style>
