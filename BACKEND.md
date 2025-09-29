# CloudBackend

## JWT 认证说明

本系统使用 JWT (JSON Web Token) 进行身份认证，提供安全且无状态的 API 访问方式。

### Token 配置

- **Access Token 有效期**: 60 分钟
- **Refresh Token 有效期**: 7 天
- **Token 轮换**: 启用（刷新时生成新的 refresh token）
- **黑名单支持**: 启用（注销时将 token 加入黑名单）

### 认证流程

1. 用户登录获取 access_token 和 refresh_token
2. 使用 access_token 访问受保护的 API
3. 当 access_token 过期时，使用 refresh_token 获取新的 token
4. 注销时将 refresh_token 加入黑名单

### Token 使用方式

在需要认证的 API 请求中，在请求头中包含：

```
Authorization: Bearer <access_token>
```

**重要提示:**

- 用户注册接口 (`POST /user/register/`) 不需要认证
- 用户登录接口 (`POST /user/login/`) 不需要认证
- Token 刷新接口 (`POST /user/refresh-token/`) 不需要认证，但需要有效的 refresh token
- 其他所有接口都需要有效的 JWT 认证

## Auth API

### 1. 用户注册

**接口:** `POST /user/register/`

**请求体:**

```json
{
  "username": "用户名",
  "password": "密码",
  "email": "邮箱",
  "display_name": "..."
}
```

**注意:** `display_name` 字段是可选的，如果不提供则默认使用用户名。

**响应示例:**

```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "display_name": "testuser"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. 用户登录 (JWT)

**接口:** `POST /user/login/`

**请求体:**

```json
{
  "username": "用户名",
  "password": "密码"
}
```

**响应示例:**

```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "display_name": "testuser"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 3. Token 刷新

**接口:** `POST /user/refresh-token/`

**请求体:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**响应示例:**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 4. 用户注销

**接口:** `POST /user/logout/`

**请求体:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 5. 获取用户个人资料

**接口:** `GET /user/profile/`

**响应示例:**

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "display_name": "testuser"
}
```

## UserSettings API

### 6. 修改密码

**接口:** `POST /user/change-password/`

**请求体:**

```json
{
  "old_password": "旧密码",
  "new_password": "新密码"
}
```

### 7. 更新昵称

**接口:** `POST /user/update-display-name/`

**请求体:**

```json
{
  "display_name": "新的昵称"
}
```

### 8. 更新邮箱

**接口:** `POST /user/update-email/`

**请求体:**

```json
{
  "email": "newemail@example.com"
}
```

## File API

### 文件上传工作流程

本系统采用直接上传到阿里云 OSS 的方式，避免文件经过后端服务器，提高上传效率：

1. **获取上传凭证** → 2. **直接上传到 OSS** → 3. **通知后端创建记录**

### 1. 获取上传凭证

**接口:** `POST /file/get-token/`

**请求体**

```json
{
  "file_name": "...",
  "file_size": "...",
  "content_type": "...",
}
```

**响应示例:**

```json
{
  "token": {
    "accessid": "LTAI4G...",
    "policy": "eyJleHBpcmF0aW9uIjoi...",
    "signature": "signature_string",
    "expiration": "2025-09-18T20:24:39.111339",
    "bucket": "bucket_name",
    "endpoint": "endpoint",
    "prefix": "username/",
    "host": "https://bucket.oss-region.aliyuncs.com",
    "declared_file_size": "file_size",
    "max_file_size": "max_allowed_size"
  },
  "upload_id": "...",
  "message": "Success"
}
```

> 20250929变动：删除批量获取功能，请多次获取单个文件凭证

### 2. 直接上传到阿里云 OSS

使用获取的凭证直接上传文件到 OSS（前端实现）

### 3. 通知后端上传成功

**接口:** `POST /file/uploaded/`

**请求体示例：**

```json
{
  "name": "example.jpg",
  "oss_url": "https://bucket.oss-region.aliyuncs.com/username/example.jpg",
  "path": "/",
  "upload_id": "..."
}
```

> 20250929变动：删除批量申报功能，请多次申报单个文件

### 4. 获取文件列表

**接口:** `POST /file/list/`

**请求体:**

```json
{
  "path": "/"
}
```

**说明:**

- `path`: 要获取文件列表的路径，默认为根目录 "/"
- 只返回指定路径下的文件和文件夹，不包含子目录内容
- 只返回未删除的文件 (`is_deleted=False`)

**响应示例:**

```json
{
  "files": [
    {
      "id": 1,
      "name": "example.jpg",
      "content_type": "image/jpeg",
      "size": 1024000,
      "oss_url": "https://bucket.oss-region.aliyuncs.com/username/example.jpg",
      "created_at": "2024-01-01T12:00:00Z",
      "path": "/"
    },
    {
      "id": 2,
      "name": "documents",
      "content_type": "folder",
      "size": 0,
      "oss_url": "",
      "created_at": "2024-01-01T11:00:00Z",
      "path": "/"
    }
  ],
  "message": "Success"
}
```

### 5. 创建文件夹

**接口:** `POST /file/new-folder/`

**请求体:**

```json
{
  "folder_name": "新文件夹",
  "path": "/"
}
```

### 6. 删除文件

**接口:** `POST /file/{file_id}/delete/`

### 7. 更新文件信息

**接口:** `POST /file/{file_id}/update/`

**请求体:**

```json
{
  "name": "新文件名.jpg",
  "content_type": "image/jpeg",
  "size": 2048000,
  "oss_url": "https://bucket.oss-region.aliyuncs.com/username/newfile.jpg",
  "path": "/documents/"
}
```

**说明:**

- 支持部分更新，只需要提供需要修改的字段
- 可更新字段：`name`, `content_type`, `size`, `oss_url`, `path`
- 只能更新自己的文件
- `id` 字段为只读，无法修改

### 8. 文件下载

**接口:** `POST /file/{file_id}/download/`

**说明:**

- 生成指定文件的临时下载链接
- 只能下载自己的文件
- 文件夹无法下载
- 下载链接具有时效性（根据 OSS 配置）
- 特殊判断下载 drop 文件

**请求体:**

```json
{
  "code": "...",
  "password": "..."
}
```

**响应示例:**

```json
{
  "download_url": "https://bucket.oss-region.aliyuncs.com/username/example.jpg?Expires=1695123456&OSSAccessKeyId=LTAI4G...&Signature=abc123...",
  "message": "Success"
}
```

## DROP API

文件分享功能允许用户创建文件分享链接，其他用户可以通过分享码访问和下载文件。

### 1. 创建文件分享

**接口:** `POST /drop/create/`

**请求体:**

```json
{
  "files": [1, 2, 3],
  "expire_days": 7,
  "code": "abc123",
  "require_login": false,
  "max_download_count": 10,
  "password": "可选密码"
}
```

**参数说明:**

- `files`: 要分享的文件 ID 列表（必需）
- `expire_days`: 过期天数，可选值: 1, 3, 7, 15（默认为 1）
- `code`: 分享码，最多 10 个字符（必需）
- `require_login`: 是否需要登录才能访问（默认 false）
- `max_download_count`: 最大下载次数（默认为 1）
- `password`: 访问密码，可选

### 2. 获取分享详情

**接口:** `POST /drop/get-drop/`

**请求体:**

```json
{
  "code": "abc123",
  "password": "密码（如果设置了密码）"
}
```

**参数说明:**

- `code`: 分享码（必需）
- `password`: 访问密码（如果分享设置了密码则必需）

**响应示例:**

```json
{
  "drop": {
    "id": 1,
    "code": "abc123",
    "expire_days": 7,
    "expire_time": "2024-01-08T12:00:00Z",
    "is_expired": false,
    "require_login": false,
    "download_count": 1,
    "max_download_count": 10,
    "password": "",
    "is_deleted": false,
    "created_at": "2024-01-01T12:00:00Z"
  },
  "files": [
    {
      "id": 1,
      "name": "example.jpg",
      "content_type": "image/jpeg",
      "size": 1024000,
      "oss_url": "https://bucket.oss-region.aliyuncs.com/username/example.jpg",
      "created_at": "2024-01-01T12:00:00Z",
      "path": "/"
    }
  ],
  "message": "Success"
}
```

### 3. 删除分享

**接口:** `POST /drop/{drop_id}/delete/`

### 4. 获取我的分享列表

**接口:** `GET /drop/`

**响应示例:**

```json
[
  {
    "id": 1,
    "code": "abc123",
    "expire_days": 7,
    "expire_time": "2024-01-08T12:00:00Z",
    "is_expired": false,
    "require_login": false,
    "download_count": 5,
    "max_download_count": 10,
    "password": "",
    "is_deleted": false,
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```
