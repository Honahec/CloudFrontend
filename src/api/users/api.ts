import { Alova } from '@/utils/alova/index'
import type { UserInfo, userLoginQuery, userRegisterQuery } from './type'

export const getUserInfo = () => {
  return Alova.Post<UserInfo>('/user/profile', {})
}

export const userLogin = (params: userLoginQuery = {} as userLoginQuery) => {
  return Alova.Post<UserInfo>('/user/login', {
    params,
  })
}

export const userRegister = (
  params: userRegisterQuery = {} as userRegisterQuery
) => {
  return Alova.Post<UserInfo>('/user', {
    params,
  })
}
