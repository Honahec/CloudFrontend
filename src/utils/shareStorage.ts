export interface ShareInfoPayload {
  code: string
  link: string
  password?: string
  expireTime?: string | null
}

const STORAGE_KEY = 'drive-share-info'

export function storeShareInfo(info: ShareInfoPayload) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info))
  } catch (error) {
    console.warn('Failed to persist share info', error)
  }
}

export function takeShareInfo(): ShareInfoPayload | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  window.sessionStorage.removeItem(STORAGE_KEY)
  try {
    return JSON.parse(raw) as ShareInfoPayload
  } catch (error) {
    console.warn('Failed to parse share info', error)
    return null
  }
}
