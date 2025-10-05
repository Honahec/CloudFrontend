import { describe, it, expect } from 'vitest'
import { isUsernameValid, isEmailValid, isPasswordValid, isConfirmValid } from '@/components/auth/validation'

describe('auth validation', () => {
  it('validates username', () => {
    expect(isUsernameValid('ab')).toBe(false)
    expect(isUsernameValid('abc')).toBe(true)
    expect(isUsernameValid('user.name')).toBe(true)
    expect(isUsernameValid('toolongtoolongtoolong')).toBe(false)
  })

  it('validates email', () => {
    expect(isEmailValid('not-an-email')).toBe(false)
    expect(isEmailValid('user@example.com')).toBe(true)
  })

  it('validates password', () => {
    expect(isPasswordValid('12345')).toBe(false)
    expect(isPasswordValid('123456')).toBe(true)
  })

  it('validates confirm password', () => {
    expect(isConfirmValid('secret', 'secret')).toBe(true)
    expect(isConfirmValid('secret', 'nope')).toBe(false)
  })
})
