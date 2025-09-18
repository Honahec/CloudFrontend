export interface UserInfo {
  user: {
    id: number
    username: string
    display_name: string
    email: string
    is_active: boolean
    permission: string
  }
  access: string
  refresh: string
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
export interface refreshTokenQuery {
  refresh: string
}
export interface refreshToken {
  access: string
  refresh: string
}
export interface changePasswordQuery {
  old_password: string
  new_password: string
}
export interface updateEmailQuery {
  email: string
}
export interface updateDisplayNameQuery {
  display_name: string
}
