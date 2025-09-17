export interface UserInfo {
  id: number
  username: string
  display_name: string
  email: string
  is_active: boolean
  permission: string
}
export interface userRegisterQuery {
  username: string
  email: string
  password: string
  display_name: string
}
export interface userLoginQuery {
  username: string
  password: string
}
