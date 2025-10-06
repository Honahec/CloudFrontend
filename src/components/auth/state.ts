export type AuthMode = 'login' | 'register'

export function toggleMode(mode: AuthMode): AuthMode {
  return mode === 'login' ? 'register' : 'login'
}

interface InitialModeOptions {
  urlMode?: string | null
  storedMode?: string | null
  initialMode?: AuthMode
}

export function getInitialMode(options: InitialModeOptions): AuthMode {
  const { urlMode, storedMode, initialMode = 'login' } = options
  if (urlMode === 'login' || urlMode === 'register') return urlMode
  if (storedMode === 'login' || storedMode === 'register') return storedMode
  return initialMode
}
