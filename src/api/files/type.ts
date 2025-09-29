export interface ReachToken {
  token: {
    access_key_id?: string
    accessid?: string
    policy: string
    signature: string
    expiration: string
    bucket: string
    endpoint: string
    prefix: string
    host: string
    max_file_size: number | string
    declared_file_size?: number | string
    success_action_status?: string | number
    security_token?: string
    'x-oss-security-token'?: string
  }
  upload_id?: string
  message: string
}

export interface UploadPolicyRequest {
  file_name: string
  file_size: number
  content_type: string
}

export interface FileUploadedPayload {
  name: string
  content_type: string
  size: number
  oss_url: string
  path: string
  upload_id?: string
}

export interface FileRecord {
  id: number
  name: string
  content_type: string
  size: number
  oss_url: string
  created_at: string
  path: string
}

export interface FileResponse {
  files: FileRecord[]
  quota?: number | string
  // backend may return one of these for used bytes
  used_space?: number | string
  message: string
}

export interface FileCreatePayload {
  name: string
  content_type: string
  size: number
  oss_url: string
  path: string
}

export interface FileUploadStatus {
  message: string
}

export interface FileDeleteResponse {
  message: string
}

export interface FolderCreateResponse {
  folder: FileRecord
  message: string
}

export interface ShareLinkResponse {
  url: string
  message: string
  expired_at?: string
}

export interface FileUpdateResponse {
  file: FileRecord
  message: string
}

export interface FileCreateResponse {
  file: FileRecord
  message: string
}

export interface FileDownloadLink {
  download_url: string
  message?: string
}

export type FileDownloadResponse = FileDownloadLink

export interface FileDownloadPayload {
  code?: string
  password?: string
}
