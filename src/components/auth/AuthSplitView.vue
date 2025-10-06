<template>
  <main
    class="auth-split"
    :data-auth-mode="mode"
    :style="rootStyle"
  >
    <section
      class="panel left"
      :data-panel="'login'"
      :class="{ dim: mode === 'register' }"
      aria-labelledby="login-heading"
      aria-describedby="login-subtext"
    >
      <header class="panel-header">
        <AuthBrand :appName="brandName" />
      </header>
      <div class="panel-body">
        <h1 id="login-heading" class="panel-title">{{ loginTitle }}</h1>
        <LoginForm
          @loginSuccess="() => emit('loginSuccess')"
          @authError="(m:string) => emit('authError', m)"
        />
      </div>
    </section>

    <!-- Back button top-left -->
    <button class="back-btn" @click="onBack" :aria-label="t('auth.misc.back') || 'Back'">
      {{ t('auth.misc.back') || 'Back' }}
    </button>

    <!-- Diagonal slash with centered toggle -->
    <div class="slash" :style="slashStyle">
      <button
        class="slash-toggle"
        role="button"
        :aria-pressed="mode === 'register' ? 'true' : 'false'"
        :aria-label="toggleLabel"
        :title="toggleLabel"
        @click="onToggle"
        @keydown.enter.prevent="onToggle"
        @keydown.space.prevent="onToggle"
      >
        <span class="toggle-text">{{ toggleLabel }}</span>
      </button>
    </div>

    <section
      class="panel right"
      :data-panel="'register'"
      :class="{ dim: mode === 'login' }"
      aria-labelledby="register-heading"
      aria-describedby="register-subtext"
    >
      <header class="panel-header">
        <AuthBrand :appName="brandName" />
      </header>
      <div class="panel-body">
        <h1 id="register-heading" class="panel-title">{{ registerTitle }}</h1>
        <RegisterForm
          @registerSuccess="() => emit('registerSuccess')"
          @authError="(m:string) => emit('authError', m)"
        />
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch, ref } from 'vue'
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
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const mode = ref<Mode>(props.initialMode)

onMounted(() => {
  // initial from URL or localStorage
  const urlMode = (route.query.mode as string) as Mode
  const storeMode = (localStorage.getItem(props.persistKey) as Mode | null)
  if (urlMode === 'login' || urlMode === 'register') mode.value = urlMode
  else if (storeMode === 'login' || storeMode === 'register') mode.value = storeMode
  else mode.value = props.initialMode
})

watch(mode, (m) => {
  localStorage.setItem(props.persistKey, m)
  if (props.urlSync) {
    router.replace({ query: { ...route.query, mode: m } })
  }
})

const onToggle = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
}

const loginTitle = computed(() => t('auth.login.headline') || 'Welcome back')
const loginSub = computed(() => t('auth.login.subtext') || 'Sign in to continue')
const registerTitle = computed(() => t('auth.register.headline') || 'Join us')
const registerSub = computed(() => t('auth.register.subtext') || 'Create your account')

const toggleLabel = computed(() =>
  mode.value === 'login'
    ? t('auth.toggle.toRegister') || 'Go to Register'
    : t('auth.toggle.toLogin') || 'Go to Login'
)

const rootStyle = computed(() => ({
  '--auth-accent': 'rgb(var(--color-brand-600))',
  '--auth-accent-weak': 'rgba(var(--color-brand-400), 0.25)',
  '--auth-surface': 'rgb(var(--color-surface-muted))',
  '--auth-muted': 'rgb(var(--color-text-secondary))',
} as Record<string, string>))

const slashStyle = computed(() => ({
  '--slash-shift': mode.value === 'login' ? '66%' : '34%',
  '--left-width': mode.value === 'login' ? '66%' : '34%',
}))
const backTarget = computed(() => (route.query.back as string) || '/')
function onBack() {
  router.replace(backTarget.value)
}
</script>

<style scoped>
.auth-split {
  min-height: 100vh;
  display: flex;
  position: relative;
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text-primary));
  --auth-accent: rgb(var(--color-brand-600));
  --auth-accent-weak: rgba(var(--color-brand-400), 0.25);
  --slash-shift: 66%;
  --left-width: 66%;
  overflow: hidden;
}

/* Panels */
.panel {
  position: relative;
  padding: clamp(20px, 5vw, 56px);
  display: flex;
  flex-direction: column;
}
.panel-header { display: flex; justify-content: flex-start; }
.panel-body { max-width: 520px; }
.panel-title { margin: 16px 0 6px; font-weight: 800; font-size: clamp(20px, 3vw, 28px); }
.panel-sub { margin: 0 0 12px 0; color: rgb(var(--color-text-secondary)); }

/* Dim effect for inactive side */
.panel.dim {
  filter: saturate(0.85) brightness(0.92) blur(2px);
  opacity: 0.82;
  pointer-events: none;
}

/* Slash divider */
.slash {
  position: absolute;
  inset: 0;
  pointer-events: none; /* let only button capture events */
}

.slash::before {
  content: '';
  position: absolute;
  top: -10%;
  bottom: -10%;
  left: var(--slash-shift);
  width: 6px;
  background: var(--auth-accent);
  transform: skewX(-25deg);
  box-shadow: 0 0 0 8px var(--auth-accent-weak);
  transition: left 320ms cubic-bezier(.2,.8,.2,1), transform 320ms cubic-bezier(.2,.8,.2,1);
}

/***************************
Toggle button on the slash
***************************/
.slash-toggle {
  position: absolute;
  left: calc(var(--slash-shift) - 24px);
  top: 50%;
  transform: translateY(-50%) rotate(-14deg);
  pointer-events: auto;
  border: none;
  background: var(--auth-accent);
  color: rgb(var(--color-text-inverted));
  border-radius: 9999px;
  padding: 10px 14px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  transition: left 320ms cubic-bezier(.2,.8,.2,1), background-color 160ms ease;
}
.slash-toggle:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}
.toggle-text { font-weight: 700; font-size: 13px; white-space: nowrap; }

/* Back button */
.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  background: var(--color-button-ghost-bg);
  color: rgb(var(--color-text-primary));
  border: 1px solid var(--border-color-subtle);
  border-radius: 9999px;
  padding: 6px 12px;
  cursor: pointer;
}
.back-btn:hover { background: rgb(var(--color-surface-overlay)); }
.back-btn:focus-visible { outline: 3px solid var(--color-focus-ring); outline-offset: 2px; }

/* Animate widths with flex-basis to avoid jarring reflow */
.left { flex: 0 0 var(--left-width); transition: flex-basis 320ms cubic-bezier(.2,.8,.2,1); }
.right { flex: 1 1 auto; transition: flex-basis 320ms cubic-bezier(.2,.8,.2,1); }

/* Responsive adjustments */
@media (max-width: 1023px) {
  .auth-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .slash::before { left: var(--slash-shift); transform: skewX(-18deg); }
  .slash-toggle { left: calc(var(--slash-shift) - 24px); }
}

@media (max-width: 767px) {
  .auth-split {
    display: flex;
    flex-direction: column;
  }
  .panel { padding: 20px; }
  .panel.dim { filter: none; opacity: 1; display: none; }
  .slash::before {
    top: auto; bottom: auto; left: 0; right: 0; height: 4px; width: auto; transform: none;
  }
  .slash-toggle {
    position: static; transform: none;
    align-self: center; margin: 10px auto; display: inline-flex;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .slash::before, .slash-toggle { transition: none !important; }
}
</style>
