<template>
  <form class="auth-form" @submit.prevent="onSubmit" aria-describedby="register-errors" novalidate>
    <div v-if="!showPwd" class="step step-one">
      <div class="field">
        <label :for="ids.username" class="label">{{ t('auth.register.username') || 'Username' }}</label>
        <n-input
          :id="ids.username"
          v-model:value="username"
          :input-props="{ autocomplete: 'username' }"
          :status="usernameStatus"
          :disabled="loading"
          :placeholder="t('auth.register.usernamePlaceholder')"
          :aria-invalid="usernameErrorMessage ? 'true' : 'false'"
          :aria-describedby="usernameErrorMessage ? ids.usernameError : undefined"
          @keyup.enter="onContinue"
        />
        <FormError :id="ids.usernameError" :message="usernameErrorMessage" />
      </div>

      <div class="field">
        <label :for="ids.display" class="label">{{ t('auth.register.display') || 'Display name' }}</label>
        <n-input
          :id="ids.display"
          v-model:value="displayName"
          :status="displayStatus"
          :disabled="loading"
          :placeholder="t('auth.register.displayPlaceholder')"
          :aria-invalid="displayErrorMessage ? 'true' : 'false'"
          :aria-describedby="displayErrorMessage ? ids.displayError : undefined"
          @keyup.enter="onContinue"
        />
        <FormError :id="ids.displayError" :message="displayErrorMessage" />
      </div>

      <div class="field">
        <label :for="ids.email" class="label">{{ t('auth.register.email') || 'Email' }}</label>
        <n-input
          :id="ids.email"
          v-model:value="email"
          :input-props="{ autocomplete: 'email' }"
          :status="emailStatus"
          :disabled="loading"
          :placeholder="t('auth.register.emailPlaceholder')"
          :aria-invalid="emailErrorMessage ? 'true' : 'false'"
          :aria-describedby="emailErrorMessage ? ids.emailError : undefined"
          @keyup.enter="onContinue"
        />
        <FormError :id="ids.emailError" :message="emailErrorMessage" />
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
          {{ t('auth.register.continue') || 'Continue' }}
        </n-button>
      </div>
    </div>

    <div v-else class="step step-two">
      <div class="field">
        <label :for="ids.username" class="label">{{ t('auth.register.username') || 'Username' }}</label>
        <n-input
          :id="ids.username"
          v-model:value="username"
          disabled
          :status="usernameStatus"
          :placeholder="t('auth.register.usernamePlaceholder')"
        />
      </div>

      <div class="field">
        <label :for="ids.display" class="label">{{ t('auth.register.display') || 'Display name' }}</label>
        <n-input
          :id="ids.display"
          v-model:value="displayName"
          disabled
          :status="displayStatus"
          :placeholder="t('auth.register.displayPlaceholder')"
        />
      </div>

      <div class="field">
        <label :for="ids.email" class="label">{{ t('auth.register.email') || 'Email' }}</label>
        <n-input
          :id="ids.email"
          v-model:value="email"
          disabled
          :status="emailStatus"
          :placeholder="t('auth.register.emailPlaceholder')"
        />
      </div>

      <div class="field">
        <label :for="ids.password" class="label">{{ t('auth.register.password') || 'Password' }}</label>
        <n-input
          :id="ids.password"
          v-model:value="password"
          type="password"
          show-password-on="mousedown"
          :input-props="{ autocomplete: 'new-password' }"
          :status="pwdStatus"
          :disabled="loading"
          :placeholder="t('auth.register.passwordPlaceholder')"
          :aria-invalid="passwordErrorMessage ? 'true' : 'false'"
          :aria-describedby="passwordErrorMessage ? ids.pwdError : ids.pwdHint"
          ref="passwordRef"
        />
        <small :id="ids.pwdHint" class="hint">{{ t('auth.register.passwordHint') || 'At least 6 characters' }}</small>
        <FormError :id="ids.pwdError" :message="passwordErrorMessage" />
      </div>

      <div class="field">
        <label :for="ids.confirm" class="label">{{ t('auth.register.confirm') || 'Confirm password' }}</label>
        <n-input
          :id="ids.confirm"
          v-model:value="confirm"
          type="password"
          show-password-on="mousedown"
          :input-props="{ autocomplete: 'new-password' }"
          :status="confirmStatus"
          :disabled="loading"
          :placeholder="t('auth.register.confirmPlaceholder')"
          :aria-invalid="confirmErrorMessage ? 'true' : 'false'"
          :aria-describedby="confirmErrorMessage ? ids.confirmError : undefined"
          @keyup.enter="onSubmit"
        />
        <FormError :id="ids.confirmError" :message="confirmErrorMessage" />
      </div>

      <div class="actions">
        <SubmitButton @click="onSubmit">{{ t('auth.register.submit') }}</SubmitButton>
      </div>
      <div class="sub-actions">
        <n-button quaternary size="small" :disabled="loading" @click="onBack">
          {{ t('auth.register.back') || 'Back' }}
        </n-button>
      </div>
    </div>

    <p v-if="error" id="register-errors" class="top-error" role="alert" aria-live="assertive">{{ error }}</p>
  </form>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from '@/composables/locale'
import { userRegister } from '@/api/users/api'
import type { userRegisterQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import FormError from './FormError.vue'
import SubmitButton from './SubmitButton.vue'

const emit = defineEmits<{
  (e: 'registerSuccess'): void
  (e: 'authError', message: string): void
}>()

const { t } = useI18n()
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')
const username = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const attemptedContinue = ref(false)
const attemptedSubmit = ref(false)

const ids = {
  username: 'reg-username',
  display: 'reg-display',
  email: 'reg-email',
  password: 'reg-password',
  confirm: 'reg-confirm',
  usernameError: 'reg-username-error',
  displayError: 'reg-display-error',
  emailError: 'reg-email-error',
  pwdError: 'reg-password-error',
  confirmError: 'reg-confirm-error',
  pwdHint: 'reg-pwd-hint',
}

const usernamePattern = /^[A-Za-z0-9._-]{3,20}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const usernameValid = computed(() => usernamePattern.test(username.value))
const displayValid = computed(() => !!displayName.value.trim())
const emailValid = computed(() => emailPattern.test(email.value))
const pwdValid = computed(() => password.value.length >= 6)
const confirmValid = computed(() => confirm.value.length > 0 && confirm.value === password.value)

const usernameErrorMessage = computed(() => {
  if (!attemptedContinue.value || usernameValid.value) return ''
  return t('auth.register.usernameError') || 'Use 3-20 letters, numbers, . _ -'
})
const displayErrorMessage = computed(() => {
  if (!attemptedContinue.value || displayValid.value) return ''
  return t('auth.register.displayError') || 'Display name is required'
})
const emailErrorMessage = computed(() => {
  if (!attemptedContinue.value || emailValid.value) return ''
  return t('auth.register.emailError') || 'Enter a valid email'
})
const passwordErrorMessage = computed(() => {
  if (!attemptedSubmit.value) return ''
  if (!pwdValid.value) return t('auth.register.passwordError') || 'Password too weak'
  return ''
})
const confirmErrorMessage = computed(() => {
  if (!attemptedSubmit.value) return ''
  if (!confirmValid.value) return t('auth.register.confirmError') || 'Passwords do not match'
  return ''
})

const usernameStatus = computed(() => {
  if (!username.value) return usernameErrorMessage.value ? 'error' : undefined
  return usernameValid.value ? 'success' : (attemptedContinue.value ? 'error' : undefined)
})
const displayStatus = computed(() => {
  if (!displayName.value) return displayErrorMessage.value ? 'error' : undefined
  return displayValid.value ? 'success' : (attemptedContinue.value ? 'error' : undefined)
})
const emailStatus = computed(() => {
  if (!email.value) return emailErrorMessage.value ? 'error' : undefined
  return emailValid.value ? 'success' : (attemptedContinue.value ? 'error' : undefined)
})
const pwdStatus = computed(() => {
  if (!showPwd.value) return undefined
  if (!password.value) return attemptedSubmit.value ? 'error' : undefined
  return pwdValid.value ? 'success' : 'error'
})
const confirmStatus = computed(() => {
  if (!showPwd.value) return undefined
  if (!confirm.value) return attemptedSubmit.value ? 'error' : undefined
  return confirmValid.value ? 'success' : 'error'
})

const canContinue = computed(() => usernameValid.value && displayValid.value && emailValid.value && !loading.value)
const canSubmit = computed(() => showPwd.value && pwdValid.value && confirmValid.value && !loading.value)

const passwordRef = ref()

watch([username, displayName, email, password, confirm], () => {
  if (error.value) error.value = ''
})

watch(showPwd, async (value) => {
  if (value) {
    await nextTick()
    passwordRef.value?.focus?.()
  } else {
    attemptedSubmit.value = false
    password.value = ''
    confirm.value = ''
  }
})

const onContinue = () => {
  attemptedContinue.value = true
  if (!canContinue.value) return
  showPwd.value = true
}

const onBack = () => {
  if (loading.value) return
  showPwd.value = false
  attemptedSubmit.value = false
  password.value = ''
  confirm.value = ''
  error.value = ''
}

const onSubmit = async () => {
  attemptedSubmit.value = true
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
    emit('registerSuccess')
  } catch (e: any) {
    const msg = e?.message || t('auth.misc.error') || 'Something went wrong'
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
.hint { color: rgb(var(--color-text-secondary)); font-size: 12px; margin-top: 4px; }
.top-error { margin: 8px 0 0; color: rgb(var(--color-error)); }
</style>
