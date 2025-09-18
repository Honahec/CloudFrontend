import type { userLoginQuery } from '@/api/users/type'

function parseJwtPayload(token: string): any {
  const payloadPart = token.split('.')[1]
  if (!payloadPart) throw new Error('Invalid JWT')
  const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(json)
}

export function setTokenCookies(accessToken: string, refreshToken: string) {
  // Set access_token cookie
  try {
    const accessPayload = parseJwtPayload(accessToken)
    const nowSec = Math.floor(Date.now() / 1000)
    const accessExpSec = Number(accessPayload?.exp)
    if (!Number.isFinite(accessExpSec)) throw new Error('Illegal Access Token')
    const accessDelta = Math.max(0, accessExpSec - nowSec)
    if (accessDelta === 0) {
      removeTokenCookies()
      return
    }
    document.cookie = `access_token=${encodeURIComponent(
      accessToken
    )}; Max-Age=${accessDelta}; Path=/`
  } catch {
    removeTokenCookies()
    return
  }

  // Set refresh_token cookie
  try {
    const refreshPayload = parseJwtPayload(refreshToken)
    const nowSec = Math.floor(Date.now() / 1000)
    const refreshExpSec = Number(refreshPayload?.exp)
    if (!Number.isFinite(refreshExpSec))
      throw new Error('Illegal Refresh Token')
    const refreshDelta = Math.max(0, refreshExpSec - nowSec)
    if (refreshDelta === 0) {
      removeTokenCookies()
      return
    }
    document.cookie = `refresh_token=${encodeURIComponent(
      refreshToken
    )}; Max-Age=${refreshDelta}; Path=/`
  } catch {
    removeTokenCookies()
    return
  }
}

export function getTokenCookies(): {
  access: string | null
  refresh: string | null
} {
  // Helper to get a cookie value by name
  function getCookieValue(name: string): string | null {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'))
    return m ? decodeURIComponent(m[1]) : null
  }

  let access = getCookieValue('access_token')
  let refresh = getCookieValue('refresh_token')

  // Validate access token
  if (access) {
    try {
      const payload = parseJwtPayload(access)
      const expSec = Number(payload?.exp)
      if (!Number.isFinite(expSec)) throw new Error()
      const nowSec = Math.floor(Date.now() / 1000)
      if (expSec <= nowSec) {
        document.cookie = 'access_token=; Max-Age=0; Path=/'
        access = null
      }
    } catch {
      document.cookie = 'access_token=; Max-Age=0; Path=/'
      access = null
    }
  }

  // Validate refresh token
  if (refresh) {
    try {
      const payload = parseJwtPayload(refresh)
      const expSec = Number(payload?.exp)
      if (!Number.isFinite(expSec)) throw new Error()
      const nowSec = Math.floor(Date.now() / 1000)
      if (expSec <= nowSec) {
        document.cookie = 'refresh_token=; Max-Age=0; Path=/'
        refresh = null
      }
    } catch {
      document.cookie = 'refresh_token=; Max-Age=0; Path=/'
      refresh = null
    }
  }

  return { access, refresh }
}

export function removeTokenCookies() {
  document.cookie = 'access_token=; Max-Age=0; Path=/'
  document.cookie = 'refresh_token=; Max-Age=0; Path=/'
}
