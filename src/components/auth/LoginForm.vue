<template>
  <form class="auth-form" @submit.prevent="onSubmit" aria-describedby="login-errors" novalidate>
    <div v-if="!showPassword" class="step step-one">
      <div class="field">
        <label :for="ids.username" class="label">{{ t('auth.login.username') }}</label>
        <n-input
          :id="ids.username"
          v-model:value="username"
          :input-props="{ autocomplete: 'username' }"
          :status="usernameStatus"
          :disabled="loading"
          :placeholder="t('auth.login.usernamePlaceholder')"
          :aria-invalid="usernameInvalid ? 'true' : 'false'"
          :aria-describedby="usernameInvalid ? ids.usernameError : undefined"
          @keyup.enter="onContinue"
        />
        <FormError :id="ids.usernameError" :message="usernameErrorMessage" />
      </div>
      <div class="actions">
        <n-button
          type="primary"
          size="large"
          round
          block
          :loading="loading"
          :disabled="!canContinue || loading"
          @click="onContinue"
        >
          {{ t('auth.login.continue') || 'Continue' }}
        </n-button>
      </div>
    </div>

    <div v-else class="step step-two">
      <div class="field">
        <label :for="ids.username" class="label">{{ t('auth.login.username') }}</label>
        <n-input
          :id="ids.username"
          v-model:value="username"
          :input-props="{ autocomplete: 'username' }"
          :status="serverAuthFailed ? 'error' : usernameStatus"
          disabled
          :placeholder="t('auth.login.usernamePlaceholder')"
          :aria-invalid="serverAuthFailed ? 'true' : 'false'"
          :aria-describedby="serverAuthFailed ? ids.usernameError : undefined"
        />
        <FormError :id="ids.usernameError" :message="serverAuthFailed ? (error || t('auth.errors.invalidCredentials') || 'Incorrect username or password') : ''" />
      </div>

      <div class="field">
        <label :for="ids.password" class="label">{{ t('auth.login.password') }}</label>
        <n-input
          :id="ids.password"
          v-model:value="password"
          type="password"
          show-password-on="mousedown"
          :input-props="{ autocomplete: 'current-password' }"
          :status="passwordStatus"
          :disabled="loading"
          :placeholder="t('auth.login.passwordPlaceholder')"
          :aria-invalid="passwordErrorMessage ? 'true' : 'false'"
          :aria-describedby="passwordErrorMessage ? ids.passwordError : undefined"
          ref="passwordRef"
          @keyup.enter="onSubmit"
        />
        <FormError :id="ids.passwordError" :message="passwordErrorMessage" />
      </div>

      <div class="actions">
        <SubmitButton @click="onSubmit">{{ t('auth.login.submit') }}</SubmitButton>
      </div>
      <div class="sub-actions">
        <n-button quaternary size="small" :disabled="loading" @click="onBack">
          {{ t('auth.login.back') || 'Back' }}
        </n-button>
      </div>
    </div>

    <p v-if="error && !serverAuthFailed" id="login-errors" class="top-error" role="alert" aria-live="assertive">{{ error }}</p>
  </form>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from '@/composables/locale'
import { userLogin } from '@/api/users/api'
import type { userLoginQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import FormError from './FormError.vue'
import SubmitButton from './SubmitButton.vue'

interface Props {
  defaultUsername?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultUsername: '',
})

const emit = defineEmits<{
  (e: 'loginSuccess'): void
  (e: 'authError', message: string): void
}>()

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const username = ref(props.defaultUsername)
const password = ref('')
const showPassword = ref(false)
const serverAuthFailed = ref(false)
const attemptedContinue = ref(false)
const attemptedSubmit = ref(false)

const ids = {
  username: 'login-username',
  password: 'login-password',
  usernameError: 'login-username-error',
  passwordError: 'login-password-error',
}

const usernamePattern = /^[A-Za-z0-9._-]{3,20}$/
const usernameValid = computed(() => usernamePattern.test(username.value))
const usernameInvalid = computed(() => !showPassword.value && attemptedContinue.value && !usernameValid.value)
const usernameStatus = computed(() => {
  if (!username.value) return usernameInvalid.value ? 'error' : undefined
  if (serverAuthFailed.value) return 'error'
  if (!usernameValid.value) return attemptedContinue.value ? 'error' : undefined
  return 'success'
})
const canContinue = computed(() => usernameValid.value && !loading.value)
const canSubmit = computed(() => showPassword.value && password.value.length > 0 && !loading.value)
const passwordStatus = computed(() => {
  if (!showPassword.value) return undefined
  if (serverAuthFailed.value) return 'error'
  if (!password.value) return attemptedSubmit.value ? 'error' : undefined
  return 'success'
})
const passwordErrorMessage = computed(() => {
  if (serverAuthFailed.value) return error.value || t('auth.errors.invalidCredentials') || 'Incorrect username or password'
  if (attemptedSubmit.value && !password.value) return t('auth.login.passwordError') || 'Password is required'
  return ''
})
const usernameErrorMessage = computed(() => {
  if (!usernameInvalid.value) return ''
  return t('auth.login.usernameError') || 'Use 3-20 letters, numbers, . _ -'
})

const passwordRef = ref()

watch([username, password], () => {
  if (serverAuthFailed.value) serverAuthFailed.value = false
  if (error.value) error.value = ''
})

watch(showPassword, async (value) => {
  if (value) {
    await nextTick()
    passwordRef.value?.focus?.()
  } else {
    attemptedSubmit.value = false
  }
})

const onContinue = () => {
  attemptedContinue.value = true
  if (!canContinue.value) return
  showPassword.value = true
}

const onBack = () => {
  if (loading.value) return
  showPassword.value = false
  password.value = ''
  serverAuthFailed.value = false
  attemptedSubmit.value = false
  error.value = ''
}

const onSubmit = async () => {
  attemptedSubmit.value = true
  if (!canSubmit.value) return
  loading.value = true
  const payload: userLoginQuery = {
    username: username.value,
    password: password.value,
  }
  try {
    const res = await userLogin(payload)
    setTokenCookies(res.access, res.refresh)
    emit('loginSuccess')
  } catch (e: any) {
    serverAuthFailed.value = true
    const msg = e?.message || t('auth.errors.invalidCredentials') || 'Incorrect username or password'
    error.value = msg
    emit('authError', msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.step { display: flex; flex-direction: column; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 600; }
.actions { margin-top: 4px; }
.sub-actions { margin-top: 8px; display: flex; }
.top-error { margin: 8px 0 0; color: rgb(var(--color-error)); }
</style>
