import { Alova } from '@/utils/alova/index'
import type { FileResponse, ReachToken } from '@/api/files/type'
import { getTokenCookies } from '@/utils/userUtils'

export type OSSPolicyToken = ReachToken['token']

export interface UploadedResult {
  name: string
  content_type: string
  size: number
  oss_url: string
  key: string
}

export type NotifyItem = Omit<UploadedResult, 'key'> & { path: string }

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

function ensureWithinSize(file: File, token: OSSPolicyToken) {
  if (
    typeof token.max_file_size === 'number' &&
    file.size > token.max_file_size
  ) {
    throw new Error(
      `${file.name} is too large: ${(file.size / (1024 * 1024)).toFixed(
        2
      )}MB > ${(token.max_file_size / (1024 * 1024)).toFixed(2)}MB`
    )
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
  form.append('OSSAccessKeyId', token.access_key_id)
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

/** Upload multiple files to OSS concurrently. */
export async function uploadFilesToOSS(
  files: File[],
  token: OSSPolicyToken,
  opts?: {
    signal?: AbortSignal
    keyResolver?: (file: File, index: number) => string | undefined
    onProgress?: (file: File, index: number, percent: number, e: ProgressEvent) => void
  }
): Promise<UploadedResult[]> {
  const tasks = files.map((f, i) =>
    uploadFileToOSS(f, token, {
      key: opts?.keyResolver?.(f, i),
      signal: opts?.signal,
      onProgress: opts?.onProgress
        ? (p, e) => opts.onProgress?.(f, i, p, e)
        : undefined,
    })
  )
  return Promise.all(tasks)
}

/** Build the backend notify payload from uploaded results. */
export function buildNotifyBody(
  uploaded: UploadedResult[],
  path: string
): NotifyItem[] {
  // ensure path starts with '/' and ends with '/' (except root '/')
  let p = path || '/'
  if (!p.startsWith('/')) p = '/' + p
  if (p !== '/' && !p.endsWith('/')) p = p + '/'
  return uploaded.map((u) => ({
    name: u.name,
    content_type: u.content_type,
    size: u.size,
    oss_url: u.oss_url,
    path: p,
  }))
}

/** Notify backend that files have been uploaded successfully. */
export function notifyBackendUploaded(items: NotifyItem[]) {
  const access = getTokenCookies().access
  return Alova.Post<FileResponse>('/file/uploaded/', items, {
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  })
}

/** High-level: upload to OSS first, then notify backend. */
export async function uploadAndNotify(
  files: File[],
  token: OSSPolicyToken,
  opts?: {
    signal?: AbortSignal
    keyResolver?: (file: File, index: number) => string | undefined
    notifyPath?: string
  }
): Promise<FileResponse> {
  const uploaded = await uploadFilesToOSS(files, token, {
    signal: opts?.signal,
    keyResolver: opts?.keyResolver,
  })
  const body = buildNotifyBody(uploaded, opts?.notifyPath || '/')
  // Use Alova instance to send notify request
  const request = notifyBackendUploaded(body)
  return request
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
