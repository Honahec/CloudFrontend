import type { FileRecord } from '@/api/files/type'

export interface DropRecord {
  id: number
  code: string
  expire_days: number
  expire_time: string | null
  is_expired: boolean
  require_login: boolean
  download_count: number
  max_download_count: number
  password: string | null
  is_deleted: boolean
  created_at: string
}

export interface DropCreatePayload {
  files: number[]
  expire_days?: 1 | 3 | 7 | 15
  code: string
  require_login?: boolean
  max_download_count?: number
  password?: string
}

export interface DropCreateResponse {
  drop: DropRecord
  files: FileRecord[]
  message: string
  share_url?: string
}

export interface DropDetailPayload {
  code: string
  password?: string
}

export interface DropDetailResponse {
  drop: DropRecord
  files: FileRecord[]
  message: string
}

export type DropListResponse = DropRecord[] | { drops: DropRecord[]; message?: string }

export interface DropDeleteResponse {
  message: string
}
