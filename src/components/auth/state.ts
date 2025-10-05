export type Mode = 'login' | 'register'

export function toggleMode(mode: Mode): Mode {
  return mode === 'login' ? 'register' : 'login'
}

export function getInitialMode(options: {
  urlMode?: string | null
  storedMode?: string | null
  initialMode?: Mode
}): Mode {
  const { urlMode, storedMode, initialMode = 'login' } = options
  if (urlMode === 'login' || urlMode === 'register') return urlMode
  if (storedMode === 'login' || storedMode === 'register') return storedMode
  return initialMode
}
