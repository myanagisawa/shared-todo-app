# データベース設計

## 概要

PostgreSQLを使用したリレーショナルデータベース設計。
Prisma ORMを使用してスキーマを管理。

## ER図

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │     Notes       │    │     Tasks       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (UUID)       │◄───┤ authorId (UUID) │◄───┤ noteId (UUID)   │
│ email (Text)    │    │ id (UUID)       │    │ id (UUID)       │
│ password (Text) │    │ title (Text)    │    │ title (Text)    │
│ name (Text)     │    │ content (Text)  │    │ description     │
│ createdAt       │    │ createdAt       │    │ status (Enum)   │
│ updatedAt       │    │ updatedAt       │    │ priority (Enum) │
└─────────────────┘    └─────────────────┘    │ dueDate         │
                                              │ assigneeId      │──┐
┌─────────────────┐    ┌─────────────────┐    │ authorId        │  │
│   NoteUsers     │    │     Files       │    │ createdAt       │  │
├─────────────────┤    ├─────────────────┤    │ updatedAt       │  │
│ id (UUID)       │    │ id (UUID)       │    └─────────────────┘  │
│ noteId (UUID)   │──┐ │ filename (Text) │                         │
│ userId (UUID)   │  │ │ originalName    │                         │
│ role (Enum)     │  │ │ mimeType (Text) │                         │
│ createdAt       │  │ │ size (Int)      │                         │
└─────────────────┘  │ │ url (Text)      │                         │
                     │ │ noteId (UUID)   │──┘                      │
                     │ │ uploadedBy      │─────────────────────────┘
                     │ │ createdAt       │
                     │ └─────────────────┘
                     │
                     └─────────────────────────────────────────────┐
                                                                   │
┌─────────────────┐    ┌─────────────────┐                       │
│ ActivityLogs    │    │   Invitations   │                       │
├─────────────────┤    ├─────────────────┤                       │
│ id (UUID)       │    │ id (UUID)       │                       │
│ userId (UUID)   │──┐ │ email (Text)    │                       │
│ action (Text)   │  │ │ noteId (UUID)   │──┐                    │
│ resourceType    │  │ │ invitedBy       │──┘                    │
│ resourceId      │  │ │ role (Enum)     │                       │
│ details (JSON)  │  │ │ token (Text)    │                       │
│ createdAt       │  │ │ expiresAt       │                       │
└─────────────────┘  │ │ createdAt       │                       │
                     │ └─────────────────┘                       │
                     └───────────────────────────────────────────┘
```

## テーブル定義

### Users テーブル
ユーザー情報を管理

```sql
CREATE TABLE Users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    avatar      TEXT,
    isActive    BOOLEAN DEFAULT true,
    createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_active ON Users(isActive);
```

### Notes テーブル
ノート（プロジェクト）情報を管理

```sql
CREATE TABLE Notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    content     TEXT,
    authorId    UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    isArchived  BOOLEAN DEFAULT false,
    createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_author ON Notes(authorId);
CREATE INDEX idx_notes_created ON Notes(createdAt DESC);
CREATE INDEX idx_notes_archived ON Notes(isArchived);
```

### Tasks テーブル
タスク情報を管理

```sql
CREATE TYPE TaskStatus AS ENUM ('pending', 'in_progress', 'completed', 'on_hold');
CREATE TYPE TaskPriority AS ENUM ('low', 'medium', 'high');

CREATE TABLE Tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      TaskStatus DEFAULT 'pending',
    priority    TaskPriority DEFAULT 'medium',
    dueDate     TIMESTAMP,
    noteId      UUID NOT NULL REFERENCES Notes(id) ON DELETE CASCADE,
    assigneeId  UUID REFERENCES Users(id) ON DELETE SET NULL,
    authorId    UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_note ON Tasks(noteId);
CREATE INDEX idx_tasks_assignee ON Tasks(assigneeId);
CREATE INDEX idx_tasks_status ON Tasks(status);
CREATE INDEX idx_tasks_priority ON Tasks(priority);
CREATE INDEX idx_tasks_due ON Tasks(dueDate);
```

### NoteUsers テーブル
ノートとユーザーの関連及び権限管理

```sql
CREATE TYPE NoteRole AS ENUM ('viewer', 'editor', 'admin');

CREATE TABLE NoteUsers (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    noteId    UUID NOT NULL REFERENCES Notes(id) ON DELETE CASCADE,
    userId    UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    role      NoteRole DEFAULT 'viewer',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(noteId, userId)
);

CREATE INDEX idx_note_users_note ON NoteUsers(noteId);
CREATE INDEX idx_note_users_user ON NoteUsers(userId);
```

### Files テーブル
ファイル添付情報を管理

```sql
CREATE TABLE Files (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename     VARCHAR(255) NOT NULL,
    originalName VARCHAR(255) NOT NULL,
    mimeType     VARCHAR(100) NOT NULL,
    size         INTEGER NOT NULL,
    url          TEXT NOT NULL,
    noteId       UUID REFERENCES Notes(id) ON DELETE CASCADE,
    uploadedBy   UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_note ON Files(noteId);
CREATE INDEX idx_files_uploaded_by ON Files(uploadedBy);
```

### Invitations テーブル
ユーザー招待を管理

```sql
CREATE TABLE Invitations (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email     VARCHAR(255) NOT NULL,
    noteId    UUID NOT NULL REFERENCES Notes(id) ON DELETE CASCADE,
    invitedBy UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    role      NoteRole DEFAULT 'viewer',
    token     VARCHAR(255) UNIQUE NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invitations_token ON Invitations(token);
CREATE INDEX idx_invitations_email ON Invitations(email);
CREATE INDEX idx_invitations_expires ON Invitations(expiresAt);
```

### ActivityLogs テーブル
アクティビティログを管理

```sql
CREATE TABLE ActivityLogs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId       UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    action       VARCHAR(50) NOT NULL,
    resourceType VARCHAR(50) NOT NULL,
    resourceId   UUID NOT NULL,
    details      JSONB,
    createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user ON ActivityLogs(userId);
CREATE INDEX idx_activity_logs_resource ON ActivityLogs(resourceType, resourceId);
CREATE INDEX idx_activity_logs_created ON ActivityLogs(createdAt DESC);
```

## Prismaスキーマ

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  avatar    String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  authoredNotes  Note[]        @relation("NoteAuthor")
  noteUsers      NoteUser[]
  assignedTasks  Task[]        @relation("TaskAssignee")
  authoredTasks  Task[]        @relation("TaskAuthor")
  uploadedFiles  File[]
  invitations    Invitation[]  @relation("InvitedBy")
  activityLogs   ActivityLog[]

  @@map("users")
}

model Note {
  id         String   @id @default(uuid())
  title      String
  content    String?
  authorId   String
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  author      User          @relation("NoteAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  noteUsers   NoteUser[]
  tasks       Task[]
  files       File[]
  invitations Invitation[]

  @@map("notes")
}

enum TaskStatus {
  pending
  in_progress
  completed
  on_hold
}

enum TaskPriority {
  low
  medium
  high
}

model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  status      TaskStatus   @default(pending)
  priority    TaskPriority @default(medium)
  dueDate     DateTime?
  noteId      String
  assigneeId  String?
  authorId    String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  note     Note  @relation(fields: [noteId], references: [id], onDelete: Cascade)
  assignee User? @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  author   User  @relation("TaskAuthor", fields: [authorId], references: [id], onDelete: Cascade)

  @@map("tasks")
}

enum NoteRole {
  viewer
  editor
  admin
}

model NoteUser {
  id        String   @id @default(uuid())
  noteId    String
  userId    String
  role      NoteRole @default(viewer)
  createdAt DateTime @default(now())

  // Relations
  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([noteId, userId])
  @@map("note_users")
}

model File {
  id           String   @id @default(uuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String
  noteId       String?
  uploadedBy   String
  createdAt    DateTime @default(now())

  // Relations
  note       Note? @relation(fields: [noteId], references: [id], onDelete: Cascade)
  uploadedBy User  @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)

  @@map("files")
}

model Invitation {
  id        String   @id @default(uuid())
  email     String
  noteId    String
  invitedBy String
  role      NoteRole @default(viewer)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  note      Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  invitedBy User @relation("InvitedBy", fields: [invitedBy], references: [id], onDelete: Cascade)

  @@map("invitations")
}

model ActivityLog {
  id           String   @id @default(uuid())
  userId       String
  action       String
  resourceType String
  resourceId   String
  details      Json?
  createdAt    DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("activity_logs")
}
```

## インデックス戦略

### パフォーマンス重視のインデックス

1. **Users テーブル**
   - `email`: ログイン時の検索用
   - `isActive`: アクティブユーザーフィルタ用

2. **Notes テーブル**
   - `authorId`: 作成者によるフィルタ用
   - `createdAt DESC`: 新着順ソート用
   - `isArchived`: アーカイブ状態フィルタ用

3. **Tasks テーブル**
   - `noteId`: ノート別タスク取得用
   - `assigneeId`: 担当者別タスク取得用
   - `status`: ステータス別フィルタ用
   - `priority`: 優先度別フィルタ用
   - `dueDate`: 期限ソート用

4. **複合インデックス**
   - `(noteId, status)`: ノート内のステータス別タスク
   - `(assigneeId, status)`: 担当者のステータス別タスク
   - `(noteId, userId)`: ノートユーザー関連の一意制約

## データ整合性制約

### 外部キー制約
- CASCADE: 親レコード削除時に子レコードも削除
- SET NULL: 親レコード削除時に子レコードの外部キーをNULLに設定

### 一意制約
- `users.email`: メールアドレスの重複防止
- `note_users(noteId, userId)`: 同一ノートへの重複参加防止
- `invitations.token`: 招待トークンの重複防止

### チェック制約
```sql
-- メールアドレス形式チェック
ALTER TABLE Users ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');

-- ファイルサイズ制限（10MB）
ALTER TABLE Files ADD CONSTRAINT check_file_size 
CHECK (size <= 10485760);

-- 期限日チェック（過去日は不可）
ALTER TABLE Tasks ADD CONSTRAINT check_due_date 
CHECK (dueDate IS NULL OR dueDate >= CURRENT_DATE);
```

## パフォーマンス最適化

### パーティショニング
```sql
-- 大量のActivityLogsを月別にパーティション
CREATE TABLE activity_logs_y2024m01 PARTITION OF ActivityLogs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 定期メンテナンス
```sql
-- 期限切れ招待の削除
DELETE FROM Invitations WHERE expiresAt < CURRENT_TIMESTAMP;

-- 古いアクティビティログの削除（3ヶ月以上前）
DELETE FROM ActivityLogs WHERE createdAt < CURRENT_TIMESTAMP - INTERVAL '3 months';
```

## バックアップ戦略

### 自動バックアップ
- 毎日深夜にフルバックアップ
- 1時間ごとに差分バックアップ
- WALファイルの継続的アーカイブ

### リストア手順
```sql
-- ポイントインタイムリカバリ
pg_restore --clean --if-exists --dbname=shared_todo backup_file.dump
```