import { Alova } from '@/utils/alova/index'
import { getTokenCookies } from '@/utils/userUtils'
import type {
  DropCreatePayload,
  DropCreateResponse,
  DropDeleteResponse,
  DropDetailPayload,
  DropDetailResponse,
  DropListResponse,
} from './type'

function authHeaders() {
  const { access } = getTokenCookies()
  return access ? { Authorization: `Bearer ${access}` } : undefined
}

export const createDrop = (payload: DropCreatePayload) =>
  Alova.Post<DropCreateResponse>('/drop/create/', payload, {
    headers: authHeaders(),
  })

export const getDrop = (payload: DropDetailPayload) =>
  Alova.Post<DropDetailResponse>('/drop/get-drop/', payload, {
    headers: authHeaders(),
  })

export const deleteDrop = (dropId: number) =>
  Alova.Post<DropDeleteResponse>(`/drop/${dropId}/delete/`, {}, {
    headers: authHeaders(),
  })

export const listDrops = () =>
  Alova.Get<DropListResponse>('/drop/', {
    headers: authHeaders(),
  })
