<template>
  <main
    class="auth-stack"
    :data-mode="mode"
  >
    <header class="masthead">
      <button class="back-btn" @click="onBack" :aria-label="t('auth.misc.back') || 'Back'">
        {{ t('auth.misc.back') || 'Back' }}
      </button>
      <AuthBrand :appName="brandName" class="brand" />
      <div
        class="mode-switch"
        role="tablist"
        aria-label="Authentication mode"
      >
        <button
          type="button"
          role="tab"
          class="mode-button"
          :data-active="mode === 'login'"
          :aria-selected="mode === 'login' ? 'true' : 'false'"
          :tabindex="mode === 'login' ? '0' : '-1'"
          @click="setMode('login')"
        >
          {{ loginTitle }}
        </button>
        <button
          type="button"
          role="tab"
          class="mode-button"
          :data-active="mode === 'register'"
          :aria-selected="mode === 'register' ? 'true' : 'false'"
          :tabindex="mode === 'register' ? '0' : '-1'"
          @click="setMode('register')"
        >
          {{ registerTitle }}
        </button>
        <span class="mode-indicator" aria-hidden="true"></span>
      </div>
    </header>

    <div class="stage" role="presentation">
      <section
        class="layer register"
        :aria-hidden="mode === 'login' ? 'true' : 'false'"
      >
        <div class="layer-card register-card">
          <h1 class="layer-title">{{ registerTitle }}</h1>
          <p v-if="registerSub" class="layer-sub">{{ registerSub }}</p>
          <RegisterForm
            @registerSuccess="() => emit('registerSuccess')"
            @authError="(m: string) => emit('authError', m)"
          />
        </div>
      </section>

      <section
        class="layer login"
        :aria-hidden="mode === 'register' ? 'true' : 'false'"
      >
        <div class="layer-card login-card">
          <h1 class="layer-title">{{ loginTitle }}</h1>
          <p v-if="loginSub" class="layer-sub">{{ loginSub }}</p>
          <LoginForm
            @loginSuccess="() => emit('loginSuccess')"
            @authError="(m: string) => emit('authError', m)"
          />
        </div>
      </section>

      <div class="divider" aria-hidden="true"></div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/composables/locale'
import AuthBrand from './AuthBrand.vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'

type Mode = 'login' | 'register'

interface Props {
  brandName?: string
  initialMode?: Mode
  persistKey?: string
  urlSync?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  brandName: 'Cloud',
  initialMode: 'login' as Mode,
  persistKey: 'auth_mode',
  urlSync: true,
})

const emit = defineEmits<{
  (e: 'loginSuccess'): void
  (e: 'registerSuccess'): void
  (e: 'authError', message: string): void
}>()

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const mode = ref<Mode>(props.initialMode)

onMounted(() => {
  const urlMode = route.query.mode as string
  const storeMode = localStorage.getItem(props.persistKey) as Mode | null
  if (urlMode === 'login' || urlMode === 'register') mode.value = urlMode
  else if (storeMode === 'login' || storeMode === 'register') mode.value = storeMode
  else mode.value = props.initialMode
})

watch(mode, (value) => {
  localStorage.setItem(props.persistKey, value)
  if (props.urlSync) {
    router.replace({ query: { ...route.query, mode: value } })
  }
})

const setMode = (value: Mode) => {
  mode.value = value
}

const loginTitle = computed(() => t('auth.login.headline') || 'Sign in')
const loginSub = computed(() => t('auth.login.subtext') || '')
const registerTitle = computed(() => t('auth.register.headline') || 'Create account')
const registerSub = computed(() => t('auth.register.subtext') || '')

const backTarget = computed(() => (route.query.back as string) || '/')
function onBack() {
  router.replace(backTarget.value)
}
</script>

<style scoped>
.auth-stack {
  --auth-accent: rgb(var(--color-brand-600));
  --auth-accent-glow: rgba(var(--color-brand-400), 0.32);
  --auth-surface: rgb(var(--color-surface-muted));
  --split-raw: -6%;
  --split-clamped: clamp(0%, var(--split-raw), 100%);
  --split-duration: 520ms;
  --split-ease: cubic-bezier(.2, .8, .2, 1);

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: rgb(var(--color-text-primary));
  background: linear-gradient(
    140deg,
    rgba(var(--color-brand-100), 0.85),
    rgba(var(--color-surface), 0.9)
  );
  position: relative;
  overflow: hidden;
}

.auth-stack::after {
  content: "";
  position: absolute;
  inset: -20% -10%;
  background: radial-gradient(circle at 15% 20%, rgba(var(--color-brand-400), 0.28), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.auth-stack[data-mode="register"] {
  --split-raw: 106%;
}

.masthead {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(12px, 3vw, 32px);
  padding: clamp(24px, 4vw, 48px) clamp(28px, 6vw, 72px);
  flex-wrap: wrap;
}

.brand {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
}

.back-btn {
  flex: 0 0 auto;
  border: 1px solid var(--border-color-subtle);
  background: rgb(var(--color-surface-overlay));
  color: rgb(var(--color-text-primary));
  border-radius: 9999px;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: 600;
}

.back-btn:hover {
  background: rgb(var(--color-surface));
}

.back-btn:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.mode-switch {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  background: rgba(var(--color-surface-overlay), 0.85);
  border-radius: 9999px;
  padding: 4px;
  border: 1px solid var(--border-color-subtle);
  box-shadow: inset 0 1px 4px rgba(17, 17, 17, 0.08);
}

.mode-button {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  color: rgb(var(--color-text-secondary));
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 9999px;
  cursor: pointer;
  transition: color 160ms ease;
}

.mode-button[data-active="true"] {
  color: rgb(var(--color-text-inverted));
}

.mode-button:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.mode-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px) / 2);
  border-radius: 9999px;
  background: var(--auth-accent);
  box-shadow: 0 12px 40px rgba(var(--color-brand-600), 0.35);
  transition: transform var(--split-duration) var(--split-ease);
}

.auth-stack[data-mode="register"] .mode-indicator {
  transform: translateX(100%);
}

.stage {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-height: 0;
  padding: clamp(24px, 6vw, 80px);
  z-index: 1;
}

.layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(28px, 6vw, 96px);
  transition: clip-path var(--split-duration) var(--split-ease), opacity 260ms ease;
  pointer-events: none;
}

.layer-card {
  width: min(520px, 80vw);
  padding: clamp(32px, 5vw, 48px);
  border-radius: 32px;
  background: var(--auth-surface);
  border: 1px solid var(--border-color-subtle);
  box-shadow: 0 32px 120px rgba(17, 17, 17, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transform-origin: center;
  transform: scale(0.975);
  opacity: 0.92;
  transition: transform 240ms ease, box-shadow 240ms ease, opacity 240ms ease;
}

.auth-stack[data-mode="login"] .layer.login .layer-card,
.auth-stack[data-mode="register"] .layer.register .layer-card {
  transform: scale(1);
  opacity: 1;
  box-shadow: 0 40px 160px rgba(17, 17, 17, 0.22);
}

.layer-title {
  margin: 0;
  font-size: clamp(26px, 3vw, 32px);
  font-weight: 800;
  color: rgb(var(--color-text-primary));
}

.layer-sub {
  margin: 0;
  font-size: 14px;
  color: rgb(var(--color-text-secondary));
}

.layer.login {
  clip-path: inset(0 0 0 var(--split-clamped));
}

.layer.register {
  clip-path: inset(0 calc(100% - var(--split-clamped)) 0 0);
}

.auth-stack[data-mode="login"] .layer.login,
.auth-stack[data-mode="register"] .layer.register {
  pointer-events: auto;
  opacity: 1;
}

.auth-stack[data-mode="login"] .layer.register {
  opacity: 0.65;
}

.auth-stack[data-mode="register"] .layer.login {
  opacity: 0.65;
}

.divider {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.divider::before {
  content: "";
  position: absolute;
  top: 8%;
  bottom: 8%;
  left: var(--split-raw);
  transform: translateX(-50%);
  width: 4px;
  border-radius: 999px;
  background: var(--auth-accent);
  box-shadow: 0 0 0 8px var(--auth-accent-glow), 0 12px 32px rgba(var(--color-brand-600), 0.45);
  transition:
    left var(--split-duration) var(--split-ease),
    transform var(--split-duration) var(--split-ease);
}

@media (max-width: 1024px) {
  .layer-card {
    width: min(480px, 86vw);
  }
}

@media (max-width: 768px) {
  .masthead {
    padding: 20px 18px 0;
    flex-direction: column;
    align-items: stretch;
  }
  .brand {
    justify-content: flex-start;
  }

  .stage {
    min-height: auto;
    padding: 24px 16px 32px;
  }

  .layer {
    position: relative;
    clip-path: none !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    padding: 0;
  }

  .layer-card {
    width: 100%;
    padding: 28px 20px;
    margin: 0;
    box-shadow: 0 18px 50px rgba(17, 17, 17, 0.14);
  }

  .auth-stack[data-mode="login"] .layer.register,
  .auth-stack[data-mode="register"] .layer.login {
    display: none;
  }

  .divider {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mode-button,
  .mode-indicator,
  .layer,
  .divider::before {
    transition: none !important;
  }
}
</style>
