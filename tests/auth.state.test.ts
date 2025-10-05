import { describe, it, expect } from 'vitest'
import { getInitialMode, toggleMode } from '@/components/auth/state'

describe('auth state', () => {
  it('toggleMode switches between login and register', () => {
    expect(toggleMode('login')).toBe('register')
    expect(toggleMode('register')).toBe('login')
  })

  it('getInitialMode prefers urlMode', () => {
    expect(getInitialMode({ urlMode: 'register', storedMode: 'login', initialMode: 'login' })).toBe('register')
  })

  it('getInitialMode falls back to storedMode', () => {
    expect(getInitialMode({ urlMode: undefined, storedMode: 'register', initialMode: 'login' })).toBe('register')
  })

  it('getInitialMode uses initial when others invalid', () => {
    expect(getInitialMode({ urlMode: 'x', storedMode: 'y', initialMode: 'login' })).toBe('login')
  })
})
