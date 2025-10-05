<template>
  <form class="auth-form" @submit.prevent="onSubmit" aria-describedby="register-errors" novalidate>
    <AuthBrand class="mb-4" :appName="brandName" />
    <h2 class="headline">{{ t('auth.common.title') }}</h2>
    <p class="subtext">{{ t('auth.register.subtitle', 'Create your account') }}</p>

    <div class="field">
      <label :for="ids.username" class="label">{{ t('auth.register.username', 'Username') }}</label>
      <n-input
        :id="ids.username"
        v-model:value="username"
        :input-props="{ autocomplete: 'username' }"
        :status="usernameStatus"
        :disabled="loading"
        :placeholder="t('auth.register.usernamePlaceholder')"
        :aria-invalid="usernameInvalid ? 'true' : 'false'"
        :aria-describedby="usernameInvalid ? ids.usernameError : undefined"
      />
      <FormError :id="ids.usernameError" :message="usernameInvalid ? t('auth.register.usernameError', 'Use 3-20 letters, numbers, . _ -') : ''" />
    </div>

    <div class="field">
      <label :for="ids.email" class="label">{{ t('auth.register.email', 'Email') }}</label>
      <n-input
        :id="ids.email"
        v-model:value="email"
        :input-props="{ autocomplete: 'email' }"
        :status="emailStatus"
        :disabled="loading"
        :placeholder="t('auth.register.emailPlaceholder')"
        :aria-invalid="emailInvalid ? 'true' : 'false'"
        :aria-describedby="emailInvalid ? ids.emailError : undefined"
      />
      <FormError :id="ids.emailError" :message="emailInvalid ? t('auth.register.emailError', 'Enter a valid email') : ''" />
    </div>

    <div class="field">
      <label :for="ids.password" class="label">{{ t('auth.register.password', 'Password') }}</label>
      <n-input
        :id="ids.password"
        v-model:value="password"
        type="password"
        show-password-on="mousedown"
        :input-props="{ autocomplete: 'new-password' }"
        :status="pwdStatus"
        :disabled="loading"
        :placeholder="t('auth.register.passwordPlaceholder')"
        :aria-invalid="pwdInvalid ? 'true' : 'false'"
        :aria-describedby="pwdInvalid ? ids.pwdError : ids.pwdHint"
      />
      <small :id="ids.pwdHint" class="hint">{{ t('auth.register.passwordHint', 'At least 6 characters') }}</small>
      <FormError :id="ids.pwdError" :message="pwdInvalid ? t('auth.register.passwordError', 'Password too weak') : ''" />
    </div>

    <div class="field">
      <label :for="ids.confirm" class="label">{{ t('auth.register.confirm', 'Confirm password') }}</label>
      <n-input
        :id="ids.confirm"
        v-model:value="confirm"
        type="password"
        show-password-on="mousedown"
        :input-props="{ autocomplete: 'new-password' }"
        :status="confirmStatus"
        :disabled="loading"
        :placeholder="t('auth.register.confirmPlaceholder')"
        :aria-invalid="confirmInvalid ? 'true' : 'false'"
        :aria-describedby="confirmInvalid ? ids.confirmError : undefined"
        @keyup.enter="onSubmit"
      />
      <FormError :id="ids.confirmError" :message="confirmInvalid ? t('auth.register.confirmError', 'Passwords do not match') : ''" />
    </div>

    <div class="row small">
      <label class="remember">
        <input type="checkbox" v-model="agree" />
        <span>{{ t('auth.register.terms', 'I agree to the terms') }}</span>
      </label>
    </div>

    <div class="actions">
      <SubmitButton :loading="loading" :disabled="!canSubmit">{{ t('auth.register.submit') }}</SubmitButton>
    </div>

    <p v-if="error" id="register-errors" class="top-error" role="alert" aria-live="assertive">{{ error }}</p>
  </form>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/locale'
import { userRegister } from '@/api/users/api'
import type { userRegisterQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import AuthBrand from './AuthBrand.vue'
import FormError from './FormError.vue'
import SubmitButton from './SubmitButton.vue'

interface Props {
  brandName?: string
}
const props = withDefaults(defineProps<Props>(), { brandName: 'Cloud' })

const emit = defineEmits<{
  (e: 'registerSuccess'): void
  (e: 'authError', message: string): void
}>()

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const agree = ref(false)
const attemptedSubmit = ref(false)

const ids = {
  username: 'reg-username',
  email: 'reg-email',
  password: 'reg-password',
  confirm: 'reg-confirm',
  usernameError: 'reg-username-error',
  emailError: 'reg-email-error',
  pwdError: 'reg-password-error',
  confirmError: 'reg-confirm-error',
  pwdHint: 'reg-pwd-hint',
}

const usernamePattern = /^[A-Za-z0-9._-]{3,20}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const usernameValid = computed(() => usernamePattern.test(username.value))
const emailValid = computed(() => emailPattern.test(email.value))
const pwdValid = computed(() => password.value.length >= 6)
const confirmValid = computed(() => confirm.value.length > 0 && confirm.value === password.value)

const usernameInvalid = computed(() => attemptedSubmit.value && !usernameValid.value)
const emailInvalid = computed(() => attemptedSubmit.value && !emailValid.value)
const pwdInvalid = computed(() => attemptedSubmit.value && !pwdValid.value)
const confirmInvalid = computed(() => attemptedSubmit.value && !confirmValid.value)

const usernameStatus = computed(() => {
  if (!username.value) return usernameInvalid.value ? 'error' : undefined
  return usernameValid.value ? 'success' : attemptedSubmit.value ? 'error' : undefined
})
const emailStatus = computed(() => {
  if (!email.value) return emailInvalid.value ? 'error' : undefined
  return emailValid.value ? 'success' : attemptedSubmit.value ? 'error' : undefined
})
const pwdStatus = computed(() => {
  if (!password.value) return pwdInvalid.value ? 'error' : undefined
  return pwdValid.value ? 'success' : attemptedSubmit.value ? 'error' : undefined
})
const confirmStatus = computed(() => {
  if (!confirm.value) return confirmInvalid.value ? 'error' : undefined
  return confirmValid.value ? 'success' : attemptedSubmit.value ? 'error' : undefined
})

const canSubmit = computed(() => usernameValid.value && emailValid.value && pwdValid.value && confirmValid.value && agree.value && !loading.value)

const onSubmit = async () => {
  attemptedSubmit.value = true
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  const payload: userRegisterQuery = {
    username: username.value,
    password: password.value,
    email: email.value,
    display_name: username.value,
  }
  try {
    const res = await userRegister(payload)
    setTokenCookies(res.access, res.refresh)
    emit('registerSuccess')
  } catch (e: any) {
    const msg = e?.message || t('auth.misc.error', 'Something went wrong')
    error.value = msg
    emit('authError', msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 12px; }
.headline { margin: 0; font-weight: 700; font-size: 20px; }
.subtext { margin: 0 0 8px 0; color: rgb(var(--color-text-secondary)); font-size: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 600; }
.row.small { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
.remember { display: inline-flex; gap: 6px; align-items: center; }
.hint { color: rgb(var(--color-text-secondary)); font-size: 12px; }
.actions { margin-top: 6px; }
.top-error { margin: 8px 0 0; color: rgb(var(--color-error)); }
</style>
