export interface ReachToken {
  token: {
    access_key_id: string
    policy: string
    signature: string
    expiration: string
    bucket: string
    endpoint: string
    prefix: string
    host: string
    max_file_size: number
  }
  message: string
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
  message: string
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
