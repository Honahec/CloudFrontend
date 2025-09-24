<template>
  <div class="home">
    <div class="hero">
      <h1>{{ t('home.title') }}</h1>
      <p>{{ t('home.description') }}</p>
      <div class="hero-actions">
        <template v-if="isLoggedIn">
          <n-button type="primary" size="large" round @click="goDrive">
            {{ t('home.primary') }}
          </n-button>
          <n-button tertiary size="large" round @click="goShare">
            {{ t('home.secondary') }}
          </n-button>
        </template>
        <template v-else>
          <n-button type="primary" size="large" round @click="goLogin">
            {{ t('common.actions.login') }}
          </n-button>
          <n-button tertiary size="large" round @click="goRegister">
            {{ t('common.actions.register') }}
          </n-button>
        </template>
      </div>
    </div>

    <div class="highlights">
      <div class="highlight" v-for="item in highlights" :key="item.key">
        <div class="highlight-dot" />
        <div class="highlight-text">{{ item.text }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/locale'
import { getTokenCookies } from '@/utils/userUtils'

const router = useRouter()
const { t } = useI18n()

const isLoggedIn = ref(false)

const highlights = computed(() => [
  { key: 'secure', text: t('home.highlights.secure') },
  { key: 'fast', text: t('home.highlights.fast') },
  { key: 'shareable', text: t('home.highlights.shareable') },
])

onMounted(() => {
  const { access, refresh } = getTokenCookies()
  isLoggedIn.value = Boolean(access && refresh)
})

const goDrive = () => {
  router.push('/drive')
}

const goShare = () => {
  router.push('/share')
}

const goLogin = () => {
  router.push('/login')
}

const goRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.home {
  display: grid;
  gap: 48px;
  padding: 32px;
  background: var(--color-card-bg);
  border-radius: 24px;
  border: 1px solid var(--color-border);
  box-shadow: 0 32px 120px rgba(17, 17, 17, 0.08);
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 48px);
  line-height: 1.2;
  color: var(--color-text);
}

.hero p {
  margin: 0;
  font-size: 16px;
  color: var(--color-subtle-text);
  max-width: 520px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.highlights {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.highlight {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(17, 17, 17, 0.04);
  border-radius: 16px;
  color: var(--color-text);
  transition: background 0.2s ease;
}

[data-theme='dark'] .highlight {
  background: rgba(244, 244, 245, 0.06);
}

.highlight-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.highlight-text {
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .home {
    padding: 24px;
  }
}
</style>
