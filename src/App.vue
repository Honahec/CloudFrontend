<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme, type GlobalThemeOverrides, zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
import { provideLocale } from '@/composables/locale'
import { provideTheme } from '@/composables/theme'

const localeContext = provideLocale('zh')
const themeContext = provideTheme('light')

const naiveTheme = computed(() => (themeContext.isDark.value ? darkTheme : undefined))

const baseFontFamily = "'Inter', 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif"

const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    fontFamily: baseFontFamily,
    primaryColor: '#111111',
    primaryColorHover: '#1f1f1f',
    primaryColorPressed: '#0b0b0b',
    textColorBase: '#111111',
    borderRadius: '12px',
  },
  Button: {
    borderRadiusTiny: '999px',
    borderRadiusSmall: '999px',
    borderRadiusMedium: '999px',
    borderRadiusLarge: '999px',
    borderRadiusHuge: '999px',
    textColorGhostPrimary: '#111111',
  },
}

const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    fontFamily: baseFontFamily,
    primaryColor: '#f5f5f5',
    primaryColorHover: '#ffffff',
    primaryColorPressed: '#e4e4e7',
    textColorBase: '#f4f4f5',
    borderRadius: '12px',
  },
  Button: {
    borderRadiusTiny: '999px',
    borderRadiusSmall: '999px',
    borderRadiusMedium: '999px',
    borderRadiusLarge: '999px',
    borderRadiusHuge: '999px',
    textColorGhostPrimary: '#f5f5f5',
  },
}

const themeOverrides = computed<GlobalThemeOverrides>(() =>
  themeContext.isDark.value ? darkThemeOverrides : lightThemeOverrides
)

const naiveLocale = computed(() => (localeContext.locale.value === 'zh' ? zhCN : enUS))
const naiveDateLocale = computed(() =>
  localeContext.locale.value === 'zh' ? dateZhCN : dateEnUS
)
</script>

<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
  >
    <n-dialog-provider>
      <n-message-provider>
        <router-view />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style scoped></style>
