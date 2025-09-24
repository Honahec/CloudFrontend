import { computed, inject, onMounted, provide, ref, watch } from 'vue'
import type { Ref } from 'vue'

export type ColorMode = 'light' | 'dark'

interface ThemeContext {
  colorMode: Ref<ColorMode>
  isDark: Ref<boolean>
  setColorMode: (mode: ColorMode) => void
  toggleTheme: () => void
}

const ThemeSymbol = Symbol('ThemeContext')

function applyToDocument(mode: ColorMode) {
  const target = document.documentElement
  target.setAttribute('data-theme', mode)
}

export function provideTheme(initial: ColorMode = 'light') {
  const stored = window?.localStorage?.getItem('app-color-mode') as ColorMode | null
  const colorMode = ref<ColorMode>(stored === 'dark' || stored === 'light' ? stored : initial)
  const isDark = computed(() => colorMode.value === 'dark')

  const setColorMode = (mode: ColorMode) => {
    colorMode.value = mode
  }

  onMounted(() => {
    applyToDocument(colorMode.value)
  })

  watch(colorMode, (mode) => {
    applyToDocument(mode)
    window?.localStorage?.setItem('app-color-mode', mode)
  }, { immediate: true })

  const context: ThemeContext = {
    colorMode,
    isDark,
    setColorMode,
    toggleTheme: () => {
      setColorMode(isDark.value ? 'light' : 'dark')
    },
  }

  provide(ThemeSymbol, context)
  return context
}

export function useTheme() {
  const context = inject<ThemeContext>(ThemeSymbol)
  if (!context) {
    throw new Error('Theme context is not provided')
  }
  return context
}
