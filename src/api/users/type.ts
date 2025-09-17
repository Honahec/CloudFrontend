export interface UserInfo {
  userID: number
  UserName: string
  DisplayName: string
  Email: string
  IsActive: boolean
  Permission: string
}
export interface userRegisterQuery {
  UserName: string
  Email: string
  Password: string
}
export interface userLoginQuery {
  UserName: string
  Password: string
}
