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

## API 文档

### 1. 用户注册

**接口:** `POST /user/register/`

**请求体:**

```json
{
  "username": "用户名",
  "email": "邮箱地址",
  "password": "密码",
  "display_name": "显示名称"
}
```

**注意:** `display_name` 字段是可选的，如果不提供则默认使用用户名。

**响应示例:**

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "display_name": "testuser",
  "is_active": true,
  "permission": "user"
}
```

**错误响应:**

用户名已存在:

```json
{
  "error": "用户名已存在"
}
```

邮箱已存在:

```json
{
  "error": "邮箱已存在"
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
    "display_name": "testuser",
    "is_active": true,
    "permission": "user"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**错误响应:**

```json
{
  "detail": "用户名或密码错误"
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

**请求头:**

```
Authorization: Bearer <access_token>
```

**请求体:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**响应示例:**

```json
{
  "status": "登出成功"
}
```

### 5. 获取用户个人资料

**接口:** `GET /user/profile/`

**请求头:**

```
Authorization: Bearer <access_token>
```

**响应示例:**

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "display_name": "testuser",
  "is_active": true,
  "permission": "user"
}
```

## 用户设置接口

### 6. 修改密码

**接口:** `POST /user/change-password/`

**请求头:**

```
Authorization: Bearer <access_token>
```

**请求体:**

```json
{
  "old_password": "旧密码",
  "new_password": "新密码"
}
```

**响应示例:**

```json
{
  "status": "密码更新成功"
}
```

**错误响应:**

```json
{
  "error": "旧密码错误"
}
```

### 7. 更新昵称

**接口:** `POST /user/update-display-name/`

**请求头:**

```
Authorization: Bearer <access_token>
```

**请求体:**

```json
{
  "display_name": "新的昵称"
}
```

**响应示例:**

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "display_name": "新的昵称",
  "is_active": true,
  "permission": "user"
}
```

### 8. 更新邮箱

**接口:** `POST /user/update-email/`

**请求头:**

```
Authorization: Bearer <access_token>
```

**请求体:**

```json
{
  "email": "newemail@example.com"
}
```

**响应示例:**

```json
{
  "id": 1,
  "username": "testuser",
  "email": "newemail@example.com",
  "display_name": "testuser",
  "is_active": true,
  "permission": "user"
}
```

**错误响应:**

```json
{
  "error": "邮箱已存在"
}
```

## 安全建议

1. **Token 存储**: 在生产环境中，建议将 token 存储在 HttpOnly Cookie 中而不是 localStorage
2. **HTTPS**: 生产环境必须使用 HTTPS 来保护 token 传输
3. **Token 轮换**: 系统已启用 token 轮换，每次刷新都会生成新的 refresh token
4. **短期有效**: Access token 有效期较短（60 分钟），降低安全风险
5. **黑名单**: 注销时 token 会被加入黑名单，防止重复使用

## 数据库模型

### 用户模型 (User)

- `id`: 主键
- `username`: 用户名（唯一）
- `email`: 邮箱地址（唯一）
- `password`: 密码（加密存储）
- `display_name`: 显示名称
- `is_active`: 是否激活
- `permission`: 用户权限

### 文件模型 (File)

- `id`: 主键
- `user`: 关联用户（外键）
- `name`: 文件名
- `content_type`: 文件类型（folder 表示文件夹）
- `size`: 文件大小（字节）
- `oss_url`: OSS 存储地址
- `created_at`: 创建时间
- `path`: 文件路径
- `is_deleted`: 是否已删除（逻辑删除）

## 项目结构

```
CloudBackend/
├── manage.py                 # Django管理脚本
├── requirements.txt          # 项目依赖
├── db.sqlite3               # SQLite数据库文件
├── CloudBackend/            # 主项目配置
│   ├── settings.py          # Django设置(包含JWT配置)
│   ├── urls.py              # URL路由配置
│   └── ...
├── cloud_auth/              # 认证应用
│   ├── models.py            # 用户数据模型
│   ├── views.py             # JWT认证视图
│   ├── serializers.py       # 序列化器
│   └── migrations/          # 数据库迁移文件
└── cloud_file/              # 文件管理应用
    ├── models.py            # 文件数据模型
    ├── views.py             # 文件管理视图
    ├── serializers.py       # 文件序列化器
    ├── oss_utils.py         # 阿里云OSS工具类
    └── migrations/          # 数据库迁移文件
```

## 文件管理 API 文档

### 文件上传工作流程

本系统采用直接上传到阿里云 OSS 的方式，避免文件经过后端服务器，提高上传效率：

1. **获取上传凭证** → 2. **直接上传到 OSS** → 3. **通知后端创建记录**

### 1. 获取上传凭证

**接口:** `GET /file/get-token/`

**请求头:**

```
Authorization: Bearer <access_token>
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
    "max_file_size": 104857600
  },
  "message": "已生成token"
}
```

### 2. 直接上传到阿里云 OSS

使用获取的凭证直接上传文件到 OSS（前端实现）

### 3. 通知后端上传成功

**接口:** `POST /file/uploaded/`

**请求头:**

```
Authorization: Bearer <access_token>
```

**请求体示例（单个文件）:**

```json
{
  "name": "example.jpg",
  "content_type": "image/jpeg",
  "size": 1024000,
  "oss_url": "https://bucket.oss-region.aliyuncs.com/username/example.jpg",
  "path": "/"
}
```

**请求体示例（批量文件）:**

```json
[
  {
    "name": "file1.jpg",
    "content_type": "image/jpeg",
    "size": 1024000,
    "oss_url": "https://bucket.oss-region.aliyuncs.com/username/file1.jpg",
    "path": "/documents/"
  },
  {
    "name": "file2.pdf",
    "content_type": "application/pdf",
    "size": 2048000,
    "oss_url": "https://bucket.oss-region.aliyuncs.com/username/file2.pdf",
    "path": "/documents/"
  }
]
```

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
    }
  ],
  "message": "Successfully created 1 file record(s)"
}
```

### 4. 获取文件列表

**接口:** `POST /file/list/`

**请求头:**

```
Authorization: Bearer <access_token>
```

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
  "message": "文件列表获取成功"
}
```

### 5. 创建文件夹

**接口:** `POST /file/new-folder/`

**请求头:**

```
Authorization: Bearer <access_token>
```

**请求体:**

```json
{
  "folder_name": "新文件夹",
  "path": "/"
}
```

**响应示例:**

```json
{
  "folder": {
    "id": 3,
    "name": "新文件夹",
    "content_type": "folder",
    "size": 0,
    "oss_url": "",
    "created_at": "2024-01-01T13:00:00Z",
    "path": "/"
  },
  "message": "文件夹创建成功"
}
```

### 6. 删除文件

**接口:** `POST /file/{file_id}/delete/`

**请求头:**

```
Authorization: Bearer <access_token>
```

**响应示例:**

```json
{
  "message": "文件已删除"
}
```

**错误响应:**

```json
{
  "error": "没有权限删除此文件"
}
```

### 7. 更新文件信息

**接口:** `POST /file/{file_id}/update/`

**请求头:**

```
Authorization: Bearer <access_token>
```

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

**响应示例:**

```json
{
  "file": {
    "id": 1,
    "name": "新文件名.jpg",
    "content_type": "image/jpeg",
    "size": 2048000,
    "oss_url": "https://bucket.oss-region.aliyuncs.com/username/newfile.jpg",
    "created_at": "2024-01-01T12:00:00Z",
    "path": "/documents/"
  },
  "message": "文件信息更新成功"
}
```

**错误响应:**

权限不足:

```json
{
  "error": "没有权限更新此文件"
}
```

数据验证失败:

```json
{
  "errors": {
    "name": ["此字段不能为空。"]
  },
  "message": "Invalid data provided"
}
```

服务器错误:

```json
{
  "error": "具体错误信息",
  "message": "更新文件信息失败"
}
```

### 文件管理说明

- **路径系统**: 支持虚拟文件夹结构，使用 `path` 字段管理文件层级
- **文件夹**: 逻辑文件夹，不占用 OSS 存储空间，`content_type` 为 `"folder"`
- **删除机制**: 采用逻辑删除，文件不会立即从 OSS 删除
- **更新机制**: 支持部分更新文件信息，包括文件名、路径、大小等元数据
- **权限控制**: 用户只能管理（查看、更新、删除）自己的文件
- **批量上传**: 支持一次性上传多个文件
- **文件列表**: 按路径层级获取文件列表，返回指定目录下的直接子项

### 常见错误处理

**Token 生成失败:**

```json
{
  "error": "具体错误信息",
  "message": "生成token失败"
}
```

**文件上传记录创建失败:**

```json
{
  "errors": "验证错误详情",
  "message": "Invalid file data provided"
}
```

**权限不足:**

删除文件:

```json
{
  "error": "没有权限删除此文件"
}
```

更新文件:

```json
{
  "error": "没有权限更新此文件"
}
```

**文件更新失败:**

数据验证错误:

```json
{
  "errors": {
    "name": ["此字段不能为空。"],
    "size": ["请输入一个有效数字。"]
  },
  "message": "Invalid data provided"
}
```

服务器内部错误:

```json
{
  "error": "具体错误信息",
  "message": "更新文件信息失败"
}
```
