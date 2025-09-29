import { Alova } from '@/utils/alova/index'
import type {
  FileCreatePayload,
  FileCreateResponse,
  FileDeleteResponse,
  FileResponse,
  FolderCreateResponse,
  ReachToken,
  FileUpdateResponse,
  FileDownloadResponse,
  FileDownloadPayload,
  UploadPolicyRequest,
  FileUploadedPayload,
} from './type'
import { getTokenCookies } from '@/utils/userUtils'

// Get a direct-upload policy/token for Aliyun OSS
export const getOSSPolicy = (payload: UploadPolicyRequest) => {
  const access = getTokenCookies().access
  return Alova.Post<ReachToken>('/file/get-token/', payload, {
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  })
}

// Notify backend that files were uploaded to OSS successfully
export const notifyFileUploaded = (payload: FileUploadedPayload) => {
  const access = getTokenCookies().access
  return Alova.Post<FileCreateResponse>('/file/uploaded/', payload, {
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  })
}

const normalizeDrivePath = (path?: string) => {
  if (!path || path === '/') return '/'
  let normalized = path.startsWith('/') ? path : '/' + path
  if (!normalized.endsWith('/')) normalized += '/'
  return normalized
}

export const createFile = (payload: FileCreatePayload) => {
  const access = getTokenCookies().access
  const body: FileCreatePayload = {
    ...payload,
    path: normalizeDrivePath(payload.path),
  }
  return Alova.Post<FileCreateResponse>('/file/create/', body, {
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  })
}

// List files by logical drive path, e.g. path = '' or 'path/to/folder'
export const listFilesByPath = (path: string) => {
  const access = getTokenCookies().access
  const normalized = path ? (path.startsWith('/') ? (path.endsWith('/') ? path : path + '/') : '/' + path + '/') : '/'
  return Alova.Post<FileResponse>(
    '/file/list/',
    { path: normalized },
    {
      headers: access ? { Authorization: `Bearer ${access}` } : undefined,
    }
  )
}

// Create a folder under a given path
export const createFolder = (path: string, name: string) => {
  const access = getTokenCookies().access
  const normalized = path ? (path.startsWith('/') ? (path.endsWith('/') ? path : path + '/') : '/' + path + '/') : '/'
  return Alova.Post<FolderCreateResponse>(
    '/file/new-folder/',
    { path: normalized, folder_name: name },
    {
      headers: access ? { Authorization: `Bearer ${access}` } : undefined,
    }
  )
}

// Batch move files or folders to their new parent paths
export interface MoveTarget {
  id: number
  path: string
}

export const moveFiles = (targets: MoveTarget[]) => {
  const access = getTokenCookies().access
  if (!Array.isArray(targets) || targets.length === 0) return Promise.resolve([])
  return Promise.all(
    targets.map(({ id, path }) => {
      const normalizedPath = normalizeDrivePath(path)
      return Alova.Post<FileUpdateResponse>(
        `/file/${id}/update/`,
        { path: normalizedPath },
        {
          headers: access ? { Authorization: `Bearer ${access}` } : undefined,
        }
      )
    })
  )
}


// Delete multiple entries (files or folders) by ids
export const deleteFiles = (ids: number[]) => {
  const access = getTokenCookies().access
  return Promise.all(
    ids.map((id) =>
      Alova.Post<FileDeleteResponse>(`/file/${id}/delete/`, {}, {
        headers: access ? { Authorization: `Bearer ${access}` } : undefined,
      })
    )
  )
}

// Delete a single file/folder by id in URL
export const deleteFile = (id: number) => {
  const access = getTokenCookies().access
  return Alova.Post<FileDeleteResponse>(
    `/file/${id}/delete/`,
    {},
    { headers: access ? { Authorization: `Bearer ${access}` } : undefined }
  )
}

// Update a single file/folder by id; partial fields supported
export const updateFile = (
  id: number,
  data: Partial<{
    name: string
    content_type: string
    size: number
    oss_url: string
    path: string
  }>
) => {
  const access = getTokenCookies().access
  // Normalize path to ensure it ends with '/'
  if (data.path && data.path !== '/') {
    const path = data.path.startsWith('/') ? data.path : '/' + data.path
    data.path = path.endsWith('/') ? path : path + '/'
  }
  return Alova.Post<FileUpdateResponse>(`/file/${id}/update/`, data, {
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  })
}

export const downloadFile = (id: number, payload?: FileDownloadPayload) => {
  const access = getTokenCookies().access
  const body: FileDownloadPayload = {}
  if (typeof payload?.code === 'string') {
    const trimmed = payload.code.trim()
    if (trimmed) body.code = trimmed
  }
  if (typeof payload?.password === 'string') {
    const trimmed = payload.password.trim()
    if (trimmed) body.password = trimmed
  }
  return Alova.Post<FileDownloadResponse>(
    `/file/${id}/download/`,
    body,
    { headers: access ? { Authorization: `Bearer ${access}` } : undefined }
  )
}
