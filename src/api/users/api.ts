import { Alova } from '@/utils/alova/index'
import type {
  GetUserInfo,
  logoutStatus,
  refreshToken,
  UserInfo,
  userLoginQuery,
  userRegisterQuery,
} from './type'
import { getTokenCookies } from '@/utils/userUtils'

export const getUserInfo = () => {
  const access = getTokenCookies().access
  return Alova.Get<GetUserInfo>('/user/profile/', {
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
  return Alova.Post<refreshToken>(
    '/user/refresh-token/',
    { refresh: refresh },
    {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    }
  )
}

export const changePassword = (params: {
  old_password: string
  new_password: string
}) => {
  const access = getTokenCookies().access
  return Alova.Post<logoutStatus>('/user/change-password/', params, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  })
}

export const updateEmail = (params: { email: string }) => {
  const access = getTokenCookies().access
  return Alova.Post<GetUserInfo>('/user/update-email/', params, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  })
}

export const updateDisplayName = (params: { display_name: string }) => {
  const access = getTokenCookies().access
  return Alova.Post<GetUserInfo>('/user/update-display-name/', params, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  })
}

export const userRegister = (
  params: userRegisterQuery = {} as userRegisterQuery
) => {
  return Alova.Post<UserInfo>('/user/register/', params)
}
export const userLogout = () => {
  const access = getTokenCookies().access
  const refresh = getTokenCookies().refresh
  return Alova.Post<logoutStatus>(
    '/user/logout/',
    { refresh: refresh },
    {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    }
  )
}
