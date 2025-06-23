# API仕様書

## 基本情報

- Base URL: `https://api.shared-todo.app`
- API Version: `v1`
- Authentication: JWT Bearer Token
- Content-Type: `application/json`

## 認証エンドポイント

### POST /api/v1/auth/register
ユーザー登録

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "田中太郎"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "田中太郎",
      "createdAt": "2024-01-01T10:00:00Z"
    },
    "token": "jwt-token"
  }
}
```

### POST /api/v1/auth/login
ログイン

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "田中太郎"
    },
    "token": "jwt-token"
  }
}
```

### POST /api/v1/auth/refresh
トークンリフレッシュ

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token"
  }
}
```

## ノートエンドポイント

### GET /api/v1/notes
ノート一覧取得

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`: ページ番号 (default: 1)
- `limit`: 取得件数 (default: 20)
- `search`: 検索キーワード

**Response:**
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "uuid",
        "title": "プロジェクト企画書",
        "content": "# プロジェクト概要...",
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-01T10:00:00Z",
        "author": {
          "id": "uuid",
          "name": "田中太郎"
        },
        "taskCount": 5,
        "completedTaskCount": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### POST /api/v1/notes
ノート作成

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "title": "新しいプロジェクト",
  "content": "# プロジェクト概要\n..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "note": {
      "id": "uuid",
      "title": "新しいプロジェクト",
      "content": "# プロジェクト概要\n...",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "author": {
        "id": "uuid",
        "name": "田中太郎"
      }
    }
  }
}
```

### GET /api/v1/notes/:id
ノート詳細取得

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "note": {
      "id": "uuid",
      "title": "プロジェクト企画書",
      "content": "# プロジェクト概要...",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "author": {
        "id": "uuid",
        "name": "田中太郎"
      },
      "tasks": [
        {
          "id": "uuid",
          "title": "要件定義書作成",
          "status": "pending",
          "priority": "high",
          "dueDate": "2024-01-15T00:00:00Z",
          "assignee": {
            "id": "uuid",
            "name": "山田花子"
          }
        }
      ]
    }
  }
}
```

### PUT /api/v1/notes/:id
ノート更新

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "title": "更新されたタイトル",
  "content": "# 更新された内容..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "note": {
      "id": "uuid",
      "title": "更新されたタイトル",
      "content": "# 更新された内容...",
      "updatedAt": "2024-01-01T11:00:00Z"
    }
  }
}
```

### DELETE /api/v1/notes/:id
ノート削除

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "ノートが削除されました"
}
```

## タスクエンドポイント

### GET /api/v1/tasks
タスク一覧取得

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `noteId`: ノートID（指定した場合、そのノートのタスクのみ）
- `status`: タスクステータス（pending, in_progress, completed, on_hold）
- `priority`: 優先度（low, medium, high）
- `assigneeId`: 担当者ID
- `page`: ページ番号
- `limit`: 取得件数

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "要件定義書作成",
        "description": "詳細な要件定義書を作成する",
        "status": "pending",
        "priority": "high",
        "dueDate": "2024-01-15T00:00:00Z",
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-01T10:00:00Z",
        "note": {
          "id": "uuid",
          "title": "プロジェクト企画書"
        },
        "assignee": {
          "id": "uuid",
          "name": "山田花子"
        },
        "author": {
          "id": "uuid",
          "name": "田中太郎"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### POST /api/v1/tasks
タスク作成

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "noteId": "uuid",
  "title": "新しいタスク",
  "description": "タスクの詳細説明",
  "priority": "medium",
  "dueDate": "2024-01-20T00:00:00Z",
  "assigneeId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid",
      "title": "新しいタスク",
      "description": "タスクの詳細説明",
      "status": "pending",
      "priority": "medium",
      "dueDate": "2024-01-20T00:00:00Z",
      "createdAt": "2024-01-01T10:00:00Z",
      "note": {
        "id": "uuid",
        "title": "プロジェクト企画書"
      },
      "assignee": {
        "id": "uuid",
        "name": "山田花子"
      }
    }
  }
}
```

### PUT /api/v1/tasks/:id
タスク更新

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "title": "更新されたタスク",
  "status": "in_progress",
  "priority": "high"
}
```

### PUT /api/v1/tasks/:id/status
タスクステータス更新

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "status": "completed"
}
```

### DELETE /api/v1/tasks/:id
タスク削除

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "タスクが削除されました"
}
```

## ファイルアップロードエンドポイント

### POST /api/v1/upload
ファイルアップロード

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request:**
```
file: [ファイルデータ]
noteId: uuid (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "uuid",
      "filename": "document.pdf",
      "originalName": "要件定義書.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "url": "https://storage.example.com/files/uuid",
      "uploadedAt": "2024-01-01T10:00:00Z"
    }
  }
}
```

## WebSocketイベント

### 接続
```javascript
const socket = io('wss://api.shared-todo.app', {
  auth: {
    token: 'jwt-token'
  }
});
```

### イベント一覧

#### note:created
新しいノートが作成された時

```json
{
  "type": "note:created",
  "data": {
    "note": { /* ノートオブジェクト */ }
  }
}
```

#### note:updated
ノートが更新された時

```json
{
  "type": "note:updated",
  "data": {
    "note": { /* 更新されたノートオブジェクト */ }
  }
}
```

#### note:deleted
ノートが削除された時

```json
{
  "type": "note:deleted",
  "data": {
    "noteId": "uuid"
  }
}
```

#### task:created
新しいタスクが作成された時

```json
{
  "type": "task:created",
  "data": {
    "task": { /* タスクオブジェクト */ }
  }
}
```

#### task:updated
タスクが更新された時

```json
{
  "type": "task:updated",
  "data": {
    "task": { /* 更新されたタスクオブジェクト */ }
  }
}
```

#### task:deleted
タスクが削除された時

```json
{
  "type": "task:deleted",
  "data": {
    "taskId": "uuid"
  }
}
```

## エラーレスポンス

### 共通エラー形式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  }
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|----------------|------|
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | アクセス権限なし |
| NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 400 | 入力値検証エラー |
| DUPLICATE_EMAIL | 400 | メールアドレスが既に登録済み |
| INVALID_CREDENTIALS | 401 | ログイン情報が無効 |
| TOKEN_EXPIRED | 401 | トークンの有効期限切れ |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

## レート制限

- 認証エンドポイント: 5回/分
- 一般エンドポイント: 100回/分
- ファイルアップロード: 10回/分

制限に達した場合、以下のヘッダーが返されます：

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1609459200
Retry-After: 60
```