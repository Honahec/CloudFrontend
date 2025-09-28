<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme, type GlobalThemeOverrides, zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
import { provideLocale } from '@/composables/locale'
import { provideTheme } from '@/composables/theme'

type ThemePalette = {
  primary: string
  primaryHover: string
  primaryPressed: string
  primarySuppl: string
  primaryText: string
  text: string
  textSecondary: string
  surface: string
  card: string
  borderSubtle: string
  borderStrong: string
  success: string
  successHover: string
  successPressed: string
  warning: string
  warningHover: string
  warningPressed: string
  error: string
  errorHover: string
  errorPressed: string
  info: string
  infoHover: string
  infoPressed: string
}

const baseFontFamily = "'Inter', 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif"

const lightPalette: ThemePalette = {
  primary: '#e8dff5',
  primaryHover: '#d7c8ee',
  primaryPressed: '#c6b0e6',
  primarySuppl: '#b699df',
  primaryText: '#111111',
  text: '#111111',
  textSecondary: '#4b5563',
  surface: '#f7f7f8',
  card: '#ffffff',
  borderSubtle: 'rgba(17, 17, 17, 0.08)',
  borderStrong: 'rgba(17, 17, 17, 0.16)',
  success: '#2f8f60',
  successHover: '#3da673',
  successPressed: '#276f50',
  warning: '#d97706',
  warningHover: '#f59e0b',
  warningPressed: '#b65c02',
  error: '#dc2626',
  errorHover: '#ef4444',
  errorPressed: '#b91c1c',
  info: '#2563eb',
  infoHover: '#3b82f6',
  infoPressed: '#1d4ed8',
}

const darkPalette: ThemePalette = {
  primary: '#d7c8ee',
  primaryHover: '#e8dff5',
  primaryPressed: '#c6b0e6',
  primarySuppl: '#b699df',
  primaryText: '#111111',
  text: '#f4f4f5',
  textSecondary: '#a1a1aa',
  surface: '#0b0b0d',
  card: '#141417',
  borderSubtle: 'rgba(244, 244, 245, 0.10)',
  borderStrong: 'rgba(244, 244, 245, 0.24)',
  success: '#76d6a5',
  successHover: '#88e2b3',
  successPressed: '#5abc8b',
  warning: '#f5c478',
  warningHover: '#f8d499',
  warningPressed: '#d6a35a',
  error: '#f87c7c',
  errorHover: '#f89b9b',
  errorPressed: '#e05656',
  info: '#7dadff',
  infoHover: '#9bc0ff',
  infoPressed: '#5d8fe3',
}

const createThemeOverrides = (palette: ThemePalette): GlobalThemeOverrides => ({
  common: {
    fontFamily: baseFontFamily,
    primaryColor: palette.primary,
    primaryColorHover: palette.primaryHover,
    primaryColorPressed: palette.primaryPressed,
    primaryColorSuppl: palette.primarySuppl,
    successColor: palette.success,
    successColorHover: palette.successHover,
    successColorPressed: palette.successPressed,
    warningColor: palette.warning,
    warningColorHover: palette.warningHover,
    warningColorPressed: palette.warningPressed,
    errorColor: palette.error,
    errorColorHover: palette.errorHover,
    errorColorPressed: palette.errorPressed,
    infoColor: palette.info,
    infoColorHover: palette.infoHover,
    infoColorPressed: palette.infoPressed,
    textColorBase: palette.text,
    textColor1: palette.text,
    textColor2: palette.textSecondary,
    textColor3: palette.textSecondary,
    borderColor: palette.borderSubtle,
    dividerColor: palette.borderSubtle,
    hoverColor: palette.borderStrong,
    pressedColor: palette.borderStrong,
    baseColor: palette.surface,
    bodyColor: palette.surface,
    cardColor: palette.card,
    modalColor: palette.card,
    popoverColor: palette.card,
    tableColor: palette.card,
    borderRadius: '12px',
  },
  Button: {
    borderRadiusTiny: '999px',
    borderRadiusSmall: '999px',
    borderRadiusMedium: '999px',
    borderRadiusLarge: '999px',
    borderRadiusHuge: '999px',
    colorPrimary: palette.primary,
    colorHoverPrimary: palette.primaryHover,
    colorPressedPrimary: palette.primaryPressed,
    colorFocusPrimary: palette.primaryHover,
    borderPrimary: palette.primary,
    borderHoverPrimary: palette.primaryHover,
    borderPressedPrimary: palette.primaryPressed,
    borderFocusPrimary: palette.primaryHover,
    textColorPrimary: palette.primaryText,
    textColorHoverPrimary: palette.primaryText,
    textColorPressedPrimary: palette.primaryText,
    textColorFocusPrimary: palette.primaryText,
    textColorGhostPrimary: palette.text,
  },
})

const localeContext = provideLocale('zh')
const themeContext = provideTheme('light')

const naiveTheme = computed(() => (themeContext.isDark.value ? darkTheme : undefined))

const lightThemeOverrides = createThemeOverrides(lightPalette)
const darkThemeOverrides = createThemeOverrides(darkPalette)

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
