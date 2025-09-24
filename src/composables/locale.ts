import { inject, provide, ref } from 'vue'
import type { Ref } from 'vue'
import { messages } from '@/locales'

export type LocaleKey = keyof typeof messages

interface LocaleContext {
  locale: Ref<LocaleKey>
  setLocale: (value: LocaleKey) => void
  t: (key: string, params?: Record<string, unknown>) => string
  availableLocales: LocaleKey[]
}

const LocaleSymbol = Symbol('LocaleContext')

function resolveMessage(locale: LocaleKey, key: string): string | undefined {
  const segments = key.split('.')
  let current: any = messages[locale]
  for (const segment of segments) {
    if (current == null) return undefined
    current = current[segment]
  }
  return typeof current === 'string' ? current : undefined
}

function formatMessage(template: string, params?: Record<string, unknown>) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    return value == null ? '' : String(value)
  })
}

export function provideLocale(initial: LocaleKey = 'zh') {
  const stored = window?.localStorage?.getItem('app-locale') as LocaleKey | null
  const locale = ref<LocaleKey>(stored && stored in messages ? stored : initial)

  const context: LocaleContext = {
    locale,
    setLocale: (value) => {
      locale.value = value
      window?.localStorage?.setItem('app-locale', value)
    },
    t: (key, params) => {
      const text = resolveMessage(locale.value, key) ?? key
      return formatMessage(text, params)
    },
    availableLocales: Object.keys(messages) as LocaleKey[],
  }

  provide(LocaleSymbol, context)
  return context
}

export function useLocale() {
  const context = inject<LocaleContext>(LocaleSymbol)
  if (!context) {
    throw new Error('Locale context is not provided')
  }
  return context
}

export function useI18n() {
  const { t } = useLocale()
  return { t }
}
