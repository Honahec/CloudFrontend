<template>
  <form class="auth-form" @submit.prevent="onSubmit" aria-describedby="login-errors" novalidate>
    <AuthBrand class="mb-4" :appName="brandName" />
    <h2 class="headline">{{ t('auth.login.headline') }}</h2>
    <p class="subtext">{{ t('auth.login.subtext', 'Welcome back! Please enter your details.') }}</p>

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
        @keyup.enter="focusPassword"
      />
      <FormError :id="ids.usernameError" :message="usernameInvalid ? t('auth.login.usernameError', 'Please enter a valid username or email') : ''" />
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
        :aria-invalid="passwordInvalid ? 'true' : 'false'"
        :aria-describedby="passwordInvalid ? ids.passwordError : undefined"
        ref="passwordRef"
        @keyup.enter="onSubmit"
      />
      <FormError :id="ids.passwordError" :message="passwordInvalid ? t('auth.login.passwordError', 'Password is required') : ''" />
    </div>

    <div class="row small">
      <label class="remember">
        <input type="checkbox" v-model="remember" />
        <span>{{ t('auth.login.remember', 'Remember me') }}</span>
      </label>
      <a href="#" class="link" @click.prevent="onForgot">{{ t('auth.login.forgot', 'Forgot password?') }}</a>
    </div>

    <div class="actions">
      <SubmitButton :loading="loading" :disabled="!canSubmit">{{ t('auth.login.submit') }}</SubmitButton>
    </div>

    <p v-if="error" id="login-errors" class="top-error" role="alert" aria-live="assertive">{{ error }}</p>

    <div class="sso" v-if="showSSO">
      <div class="divider"><span>{{ t('auth.misc.or', 'or') }}</span></div>
      <div class="sso-row">
        <n-button secondary size="small">Google</n-button>
        <n-button secondary size="small">GitHub</n-button>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from '@/composables/locale'
import { userLogin } from '@/api/users/api'
import type { userLoginQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import AuthBrand from './AuthBrand.vue'
import FormError from './FormError.vue'
import SubmitButton from './SubmitButton.vue'

interface Props {
  defaultUsername?: string
  brandName?: string
  showSSO?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  defaultUsername: '',
  brandName: 'Cloud',
  showSSO: false,
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
const remember = ref(false)
const attemptedSubmit = ref(false)

const ids = {
  username: 'login-username',
  password: 'login-password',
  usernameError: 'login-username-error',
  passwordError: 'login-password-error',
}

const usernameInvalid = computed(() => attemptedSubmit.value && !username.value)
const passwordInvalid = computed(() => attemptedSubmit.value && !password.value)
const usernameStatus = computed(() => {
  if (!username.value) return usernameInvalid.value ? 'error' : undefined
  return 'success'
})
const passwordStatus = computed(() => {
  if (!password.value) return passwordInvalid.value ? 'error' : undefined
  return 'success'
})
const canSubmit = computed(() => !!username.value && !!password.value && !loading.value)

const passwordRef = ref()
const focusPassword = () => passwordRef.value?.focus?.()

const onForgot = () => {
  // Placeholder for forgot password flow
}

const onSubmit = async () => {
  attemptedSubmit.value = true
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  const payload: userLoginQuery = { username: username.value, password: password.value }
  try {
    const res = await userLogin(payload)
    setTokenCookies(res.access, res.refresh)
    emit('loginSuccess')
  } catch (e: any) {
    const msg = e?.message || t('auth.errors.invalidCredentials', 'Incorrect username or password')
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
.link { color: rgb(var(--auth-accent, var(--color-brand-600))); text-decoration: none; }
.link:hover { text-decoration: underline; }
.actions { margin-top: 6px; }
.top-error { margin: 8px 0 0; color: rgb(var(--color-error)); }
.divider { display: flex; align-items: center; gap: 8px; color: rgb(var(--color-text-secondary)); font-size: 12px; margin-top: 6px; }
.divider::before, .divider::after { content: ''; flex: 1; border-top: 1px dashed var(--border-color-subtle); }
.sso-row { display: flex; gap: 8px; }
</style>
