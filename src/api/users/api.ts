import { Alova } from '@/utils/alova/index'
import type { UserInfo, userLoginQuery, userRegisterQuery } from './type'
import { getTokenCookies } from '@/utils/userUtils'

export const getUserInfo = () => {
  const access = getTokenCookies().access
  return Alova.Get<UserInfo>('/user/profile/', {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  })
}

export const userLogin = (params: userLoginQuery = {} as userLoginQuery) => {
  return Alova.Post<UserInfo>('/user/login/', params)
}

export const refreshAccessToken = () => {
  const access = getTokenCookies().access
  const refresh = getTokenCookies().refresh
  return Alova.Post(
    '/user/refresh-token/',
    { refresh: refresh },
    {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    }
  )
}

export const userRegister = (
  params: userRegisterQuery = {} as userRegisterQuery
) => {
  return Alova.Post<UserInfo>('/user/register/', params)
}
export const userLogout = () => {
  const access = getTokenCookies().access
  const refresh = getTokenCookies().refresh
  return Alova.Post(
    '/user/logout/',
    { refresh: refresh },
    {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    }
  )
}
