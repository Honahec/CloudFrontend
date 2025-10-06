export const usernamePattern = /^[A-Za-z0-9._-]{3,20}$/
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isUsernameValid(v: string): boolean {
  return usernamePattern.test(v)
}

export function isEmailValid(v: string): boolean {
  return emailPattern.test(v)
}

export function isPasswordValid(v: string): boolean {
  return v.length >= 6
}

export function isConfirmValid(pwd: string, confirm: string): boolean {
  return confirm.length > 0 && confirm === pwd
}
