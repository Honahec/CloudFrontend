<template>
  <n-layout has-sider class="layout">
    <n-layout-sider class="sidebar" width="`${12}%`" bordered>
      <div class="sidebar-inner">
        <div class="sidebar-top">
          <div class="brand">
            <div class="brand-mark" />
            <div class="brand-text">
              <div class="brand-name">{{ t('common.appName') }}</div>
              <div class="brand-desc">
                {{ t('layout.getStarted.description') }}
              </div>
            </div>
          </div>
          <n-menu
            :value="activeMenu"
            :options="menuOptions"
            :collapsed-width="48"
            class="menu"
            @update:value="onMenuSelect"
          />
        </div>

        <div class="sidebar-bottom">
          <div class="control-block">
            <span class="control-label">{{ t('layout.toggles.theme') }}</span>
            <n-button-group size="small" class="control-actions sidebar-field">
              <n-button
                ghost
                round
                :type="!isDark ? 'primary' : 'default'"
                @click="setColorMode('light')"
              >
                {{ t('common.theme.light') }}
              </n-button>
              <n-button
                ghost
                round
                :type="isDark ? 'primary' : 'default'"
                @click="setColorMode('dark')"
              >
                {{ t('common.theme.dark') }}
              </n-button>
            </n-button-group>
          </div>

          <div class="control-block">
            <span class="control-label">{{
              t('layout.toggles.language')
            }}</span>
            <n-select
              size="small"
              class="language-select sidebar-field"
              :options="languageOptions"
              :value="locale"
              @update:value="onLanguageSelect"
            />
          </div>

          <div class="auth-block">
            <template v-if="isLoggedIn">
              <n-dropdown
                trigger="click"
                placement="top-start"
                :options="userMenuOptions"
                :min-width="dropdownWidth"
                :max-width="dropdownWidth"
                :content-style="dropdownStyle"
                @update:show="handleDropdownShow"
                @select="onUserMenuSelect"
              >
                <div class="auth-trigger sidebar-field" ref="triggerRef">
                  <n-button type="primary" block>
                    {{ displayName || userName || t('common.actions.account') }}
                  </n-button>
                </div>
              </n-dropdown>
            </template>
            <template v-else>
              <n-dropdown
                trigger="click"
                placement="top-start"
                :options="authMenuOptions"
                :min-width="dropdownWidth"
                :max-width="dropdownWidth"
                :content-style="dropdownStyle"
                @update:show="handleDropdownShow"
                @select="onAuthMenuSelect"
              >
                <div class="auth-trigger sidebar-field" ref="triggerRef">
                  <n-button type="primary" block>
                    {{ t('common.actions.getStarted') }}
                  </n-button>
                </div>
              </n-dropdown>
            </template>
          </div>
        </div>
      </div>
    </n-layout-sider>

    <n-layout-content class="content">
      <div class="page-shell">
        <router-view />
      </div>
    </n-layout-content>
  </n-layout>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { MenuOption, SelectOption } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/theme'
import { useLocale, useI18n } from '@/composables/locale'
import { getUserInfo, refreshAccessToken } from '@/api/users/api'
import { getTokenCookies, setTokenCookies } from '@/utils/userUtils'

const router = useRouter()
const { t } = useI18n()
const { locale, setLocale } = useLocale()
const { isDark, setColorMode } = useTheme()

const menuOptions = computed<MenuOption[]>(() => [
  { label: t('layout.menu.home'), key: '/' },
  { label: t('layout.menu.drive'), key: '/drive' },
  { label: t('layout.menu.share'), key: '/share' },
  { label: t('layout.menu.settings'), key: '/settings' },
])

const onMenuSelect = (key: string) => {
  if (!key) return
  if (key !== router.currentRoute.value.path) router.push(key)
}

const activeMenu = computed(() => {
  const path = router.currentRoute.value.path
  if (path === '/') return '/'
  if (path.startsWith('/drive')) return '/drive'
  if (path.startsWith('/settings')) return '/settings'
  if (path.startsWith('/share')) return '/share'
  return path
})

const dropdownStyle = {
  paddingLeft: '0px',
  paddingRight: '0px',
}

const triggerRef = ref<HTMLElement | null>(null)
const dropdownWidth = ref<number>(0)

type SupportedLocale = 'zh' | 'en'

const languageOptions = computed<SelectOption[]>(() => [
  { label: t('common.language.zh'), value: 'zh' },
  { label: t('common.language.en'), value: 'en' },
])

const onLanguageSelect = (value: string | null) => {
  if (!value) return
  if (value !== locale.value) setLocale(value as SupportedLocale)
}

const measureDropdownWidth = () => {
  // Calculate 85% of sidebar width (250px)
  dropdownWidth.value = 250 * 0.85
}

const handleDropdownShow = async (visible: boolean) => {
  if (visible) {
    await nextTick()
    measureDropdownWidth()
  }
}

onMounted(async () => {
  await nextTick()
  measureDropdownWidth()
  window.addEventListener('resize', measureDropdownWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureDropdownWidth)
})

watch(locale, async () => {
  await nextTick()
  measureDropdownWidth()
})

const isLoggedIn = ref(false)
const userName = ref('')
const displayName = ref('')

onMounted(async () => {
  try {
    const { access, refresh } = getTokenCookies()
    if (access && refresh) {
      try {
        const refreshTokens = await refreshAccessToken()
        setTokenCookies(refreshTokens.access, refreshTokens.refresh)
      } catch (error) {
        console.warn('Token refresh failed, using existing token')
      }
      const res = await getUserInfo()
      userName.value =
        (res as any).user?.username ?? (res as any).username ?? ''
      displayName.value =
        (res as any).user?.display_name ?? (res as any).display_name ?? ''
      isLoggedIn.value = true
    } else {
      isLoggedIn.value = false
    }
  } catch (error) {
    isLoggedIn.value = false
  }
})

watch(isLoggedIn, async () => {
  await nextTick()
  measureDropdownWidth()
})

const userMenuOptions = computed<MenuOption[]>(() => [
  { label: t('common.actions.settings'), key: 'settings' },
  { label: t('common.actions.logout'), key: 'logout' },
])

const authMenuOptions = computed<MenuOption[]>(() => [
  { label: t('common.actions.register'), key: 'register' },
  { label: t('common.actions.login'), key: 'login' },
])

const onUserMenuSelect = (key: string) => {
  if (key === 'settings') router.push('/settings')
  else if (key === 'logout') router.push('/logout')
}

const onAuthMenuSelect = (key: string) => {
  if (key === 'register') router.push('/register')
  else if (key === 'login') router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: rgb(var(--color-surface));
}

.sidebar {
  display: flex;
  flex-direction: column;
  padding: 24px 18px;
  box-sizing: border-box;
  border-right: 1px solid var(--border-color-subtle);
  background: rgb(var(--color-surface-muted));
  min-height: 100vh;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  gap: 24px;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #d7c8ee, #9a72d3);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--color-brand-000));
}

.brand-desc {
  font-size: 12px;
  color: rgb(var(--color-brand-000));
}

.menu {
  width: 85%;
}

.menu :deep(.n-menu-item) {
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: auto;
}

.control-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 12px;
  color: rgb(var(--color-brand-500));
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sidebar-field {
  width: 85%;
  margin: 0;
}

.control-actions {
  display: flex;
  gap: 8px;
  width: 85%;
  justify-content: space-between;
}

.control-actions :deep(.n-button) {
  flex: 1;
  min-width: 0;
}

.language-select {
  width: 85%;
}

.auth-block {
  margin-top: auto;
}

.content {
  background: rgb(var(--color-surface));
  padding: 32px 40px;
  box-sizing: border-box;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
  width: 85%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 960px) {
  .sidebar {
    width: 220px !important;
  }

  .content {
    padding: 24px;
  }
}
</style>
