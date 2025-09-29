import type { FileCreateResponse, FileUploadedPayload, ReachToken } from '@/api/files/type'
import { notifyFileUploaded } from '@/api/files/api'

export type OSSPolicyToken = ReachToken['token']

export interface UploadedResult {
  name: string
  content_type: string
  size: number
  oss_url: string
  key: string
}

export type NotifyItem = FileUploadedPayload

function normalizePrefix(prefix: string | undefined): string {
  if (!prefix) return ''
  // ensure trailing slash if not empty
  return prefix.endsWith('/') ? prefix : `${prefix}/`
}

function objectKeyFor(file: File, token: OSSPolicyToken, customKey?: string) {
  if (customKey) return customKey
  const prefix = normalizePrefix(token.prefix)
  return `${prefix}${file.name}`
}

function buildOSSUrl(host: string, key: string) {
  // Avoid double slashes and encode path segments safely
  const encodedKey = key
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `${host.replace(/\/$/, '')}/${encodedKey}`
}

function resolveAccessKeyId(token: OSSPolicyToken): string {
  const accessKey = token.access_key_id || (token as unknown as { accessid?: string }).accessid
  if (!accessKey) {
    throw new Error('Missing access key id in upload policy')
  }
  return accessKey
}

function ensureWithinSize(file: File, token: OSSPolicyToken) {
  const raw = token.max_file_size
  const maxSize = typeof raw === 'string' ? Number(raw) : raw
  if (
    typeof maxSize === 'number' &&
    Number.isFinite(maxSize) &&
    maxSize > 0 &&
    file.size > maxSize
  ) {
    const actualMB = (file.size / (1024 * 1024)).toFixed(2)
    const limitMB = (maxSize / (1024 * 1024)).toFixed(2)
    const error = new Error(
      `${file.name} is too large: ${actualMB}MB > ${limitMB}MB`
    )
    error.name = 'FileSizeExceededError'
    throw error
  }
}

/**
 * Upload a single file to Aliyun OSS using a pre-signed PostObject policy.
 * Returns the uploaded file metadata including its final oss_url and key.
 */
export async function uploadFileToOSS(
  file: File,
  token: OSSPolicyToken,
  opts?: {
    key?: string
    signal?: AbortSignal
    onProgress?: (percent: number, e: ProgressEvent) => void
  }
): Promise<UploadedResult> {
  ensureWithinSize(file, token)

  const anyToken = token as any
  const resolvedKey = opts?.key || anyToken.key || objectKeyFor(file, token)
  const form = new FormData()

  // Build native Aliyun OSS form (per working reference)
  form.append('key', resolvedKey)
  form.append('OSSAccessKeyId', resolveAccessKeyId(token))
  form.append('policy', token.policy)
  form.append('signature', token.signature)
  const successAction = anyToken.success_action_status || '200'
  form.append('success_action_status', String(successAction))
  if (anyToken['x-oss-security-token']) {
    form.append('x-oss-security-token', anyToken['x-oss-security-token'])
  } else if (anyToken['security_token']) {
    form.append('x-oss-security-token', anyToken['security_token'])
  }
  form.append('file', file)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    if (opts?.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          opts.onProgress?.(percent, e)
        }
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`OSS upload failed: ${xhr.status}`))
    })
    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))

    let abortHandler: (() => void) | undefined
    if (opts?.signal) {
      if (opts.signal.aborted) {
        xhr.abort()
        return reject(new DOMException('Aborted', 'AbortError'))
      }
      abortHandler = () => xhr.abort()
      opts.signal.addEventListener('abort', abortHandler)
    }

    xhr.open('POST', token.host)
    xhr.send(form)

    const cleanup = () => {
      if (abortHandler && opts?.signal) opts.signal.removeEventListener('abort', abortHandler)
    }
    xhr.addEventListener('loadend', cleanup)
  })

  const oss_url = buildOSSUrl(token.host, resolvedKey)
  return {
    name: file.name,
    content_type: file.type || 'application/octet-stream',
    size: file.size,
    oss_url,
    key: resolvedKey,
  }
}

function normalizeNotifyPath(path?: string): string {
  if (!path || path === '/') return '/'
  let normalized = path.startsWith('/') ? path : `/${path}`
  if (!normalized.endsWith('/')) normalized += '/'
  return normalized
}

/** High-level: upload a single file to OSS, then notify backend. */
export async function uploadAndNotify(
  file: File,
  policy: ReachToken,
  opts?: {
    signal?: AbortSignal
    keyResolver?: (file: File, index: number) => string | undefined
    notifyPath?: string
    onProgress?: (
      file: File,
      index: number,
      percent: number,
      e: ProgressEvent
    ) => void
  }
): Promise<FileCreateResponse> {
  if (!policy?.token) {
    throw new Error('Missing upload credentials')
  }

  const uploaded = await uploadFileToOSS(file, policy.token, {
    key: opts?.keyResolver?.(file, 0),
    signal: opts?.signal,
    onProgress: opts?.onProgress
      ? (percent, event) => opts.onProgress?.(file, 0, percent, event)
      : undefined,
  })

  const payload: NotifyItem = {
    name: uploaded.name,
    content_type: uploaded.content_type,
    size: uploaded.size,
    oss_url: uploaded.oss_url,
    path: normalizeNotifyPath(opts?.notifyPath),
  }

  if (policy.upload_id) {
    payload.upload_id = policy.upload_id
  }

  return notifyFileUploaded(payload)
}

/** Convenience: compute OSS object key for a file using the token prefix. */
export function previewObjectKey(file: File, token: OSSPolicyToken) {
  return objectKeyFor(file, token)
}

/** Convenience: compute the final OSS URL for a file name using token + optional key. */
export function previewOssUrl(
  fileOrKey: File | string,
  token: OSSPolicyToken
): string {
  const key =
    typeof fileOrKey === 'string' ? fileOrKey : objectKeyFor(fileOrKey, token)
  return buildOSSUrl(token.host, key)
}
