# Shared Todo App - Architecture Documentation

## Overview
The Shared Todo App is a collaborative task management platform built with a modern web stack featuring a React frontend, Node.js backend with PostgreSQL database, and comprehensive sharing capabilities.

## Current Implementation Status

### ✅ Completed Features
- **Authentication System**: JWT-based auth with secure token handling
- **Note Management**: Full CRUD operations with rich text support
- **Note Sharing**: Role-based collaboration (viewer/editor/admin)
- **Invitation System**: Email-based invitations with token validation
- **Task Management**: Status tracking, priority levels, assignment
- **User Interface**: Responsive design with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and user feedback
- **API Documentation**: Complete REST API specification

### 🚧 In Progress
- Task creation and editing forms
- Task-Note integration
- Real-time updates via WebSocket

### 📋 Planned Features
- File attachments
- Advanced search and filtering
- Dark mode support
- Offline capabilities (PWA)
- Mobile app (React Native)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React PWA)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Browser   │ │   Mobile    │ │       Desktop PWA       ││
│  │   Chrome    │ │   Safari    │ │      (Installed)        ││
│  │   Firefox   │ │   Chrome    │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │Rate Limiting│ │    CORS     │ │     Authentication      ││
│  │   Security  │ │  Handling   │ │      JWT Verify         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Services                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │    REST     │ │  WebSocket  │ │      File Upload        ││
│  │    API      │ │  Real-time  │ │       Service           ││
│  │ (Express)   │ │ (Socket.io) │ │     (Cloudinary)        ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ PostgreSQL  │ │    Redis    │ │       File Storage      ││
│  │ (Primary)   │ │ (Sessions)  │ │     (Cloudinary CDN)    ││
│  │  Database   │ │  (Cache)    │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## フロントエンド アーキテクチャ

### テクノロジースタック
- **React 18**: UIライブラリ（Concurrent Features対応）
- **TypeScript**: 静的型チェック
- **Vite**: 高速ビルドツール
- **React Query**: サーバー状態管理・キャッシュ
- **Zustand**: クライアント状態管理
- **React Router**: ルーティング
- **Tailwind CSS**: ユーティリティファーストCSS
- **React Hook Form**: フォーム管理
- **Socket.io Client**: リアルタイム通信

### ディレクトリ構成
```
client/
├── public/
│   ├── manifest.json          # PWA設定
│   ├── sw.js                  # Service Worker
│   └── icons/                 # アプリアイコン
├── src/
│   ├── components/            # 再利用可能コンポーネント
│   │   ├── ui/               # 基本UIコンポーネント
│   │   ├── forms/            # フォームコンポーネント
│   │   └── layout/           # レイアウトコンポーネント
│   ├── pages/                # ページコンポーネント
│   │   ├── auth/             # 認証関連ページ
│   │   ├── notes/            # ノート関連ページ
│   │   └── tasks/            # タスク関連ページ
│   ├── hooks/                # カスタムHooks
│   │   ├── api/              # API関連Hooks
│   │   ├── auth/             # 認証関連Hooks
│   │   └── realtime/         # リアルタイム関連Hooks
│   ├── services/             # API通信サービス
│   │   ├── api.ts            # Axios設定
│   │   ├── auth.ts           # 認証API
│   │   ├── notes.ts          # ノートAPI
│   │   └── tasks.ts          # タスクAPI
│   ├── stores/               # 状態管理
│   │   ├── auth.ts           # 認証状態
│   │   ├── ui.ts             # UI状態
│   │   └── realtime.ts       # リアルタイム状態
│   ├── types/                # TypeScript型定義
│   │   ├── api.ts            # API型定義
│   │   ├── auth.ts           # 認証型定義
│   │   └── entities.ts       # エンティティ型定義
│   ├── utils/                # ユーティリティ関数
│   │   ├── date.ts           # 日付処理
│   │   ├── validation.ts     # バリデーション
│   │   └── storage.ts        # ローカルストレージ
│   └── App.tsx               # メインアプリコンポーネント
└── package.json
```

### 状態管理戦略

#### サーバー状態（React Query）
```typescript
// ノート一覧取得
const useNotes = () => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: () => api.notes.getAll(),
    staleTime: 5 * 60 * 1000, // 5分
    cacheTime: 10 * 60 * 1000, // 10分
  });
};

// リアルタイム更新
const useRealtimeNotes = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    socket.on('note:updated', (note) => {
      queryClient.setQueryData(['notes', note.id], note);
      queryClient.invalidateQueries(['notes']);
    });
  }, [queryClient]);
};
```

#### クライアント状態（Zustand）
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: async (credentials) => {
    const { user, token } = await api.auth.login(credentials);
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
```

### PWA対応

#### Service Worker
```javascript
// public/sw.js
const CACHE_NAME = 'shared-todo-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

#### オフライン対応
```typescript
const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<Action[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // オンライン復帰時に未同期データを送信
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
};
```

## バックエンド アーキテクチャ

### テクノロジースタック
- **Node.js**: サーバーランタイム
- **Express**: WebフレームワーK
- **TypeScript**: 静的型チェック
- **Prisma**: ORM・データベースクライアント
- **Socket.io**: リアルタイム通信
- **JWT**: 認証トークン
- **bcrypt**: パスワードハッシュ化
- **Zod**: 入力値検証
- **Winston**: ログ管理

### ディレクトリ構成
```
server/
├── src/
│   ├── controllers/          # コントローラー層
│   │   ├── auth.ts          # 認証コントローラー
│   │   ├── notes.ts         # ノートコントローラー
│   │   ├── tasks.ts         # タスクコントローラー
│   │   └── files.ts         # ファイルコントローラー
│   ├── middleware/          # ミドルウェア
│   │   ├── auth.ts          # 認証ミドルウェア
│   │   ├── validation.ts    # バリデーションミドルウェア
│   │   ├── rateLimit.ts     # レート制限
│   │   └── errorHandler.ts  # エラーハンドリング
│   ├── routes/              # ルーティング
│   │   ├── auth.ts          # 認証ルート
│   │   ├── notes.ts         # ノートルート
│   │   ├── tasks.ts         # タスクルート
│   │   └── files.ts         # ファイルルート
│   ├── services/            # ビジネスロジック層
│   │   ├── auth.service.ts  # 認証サービス
│   │   ├── notes.service.ts # ノートサービス
│   │   ├── tasks.service.ts # タスクサービス
│   │   └── files.service.ts # ファイルサービス
│   ├── models/              # データモデル
│   │   └── index.ts         # Prismaクライアント
│   ├── utils/               # ユーティリティ
│   │   ├── logger.ts        # ログ設定
│   │   ├── crypto.ts        # 暗号化処理
│   │   └── validation.ts    # バリデーションスキーマ
│   ├── socket/              # WebSocket処理
│   │   ├── handlers/        # イベントハンドラー
│   │   └── middleware.ts    # Socket認証
│   └── app.ts               # アプリケーション設定
├── prisma/
│   ├── schema.prisma        # データベーススキーマ
│   ├── migrations/          # マイグレーションファイル
│   └── seed.ts              # シードデータ
└── package.json
```

### レイヤードアーキテクチャ

#### Controller層
```typescript
// src/controllers/notes.ts
export class NotesController {
  constructor(private notesService: NotesService) {}

  async createNote(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const noteData = validateNoteInput(req.body);
      
      const note = await this.notesService.createNote({
        ...noteData,
        authorId: userId,
      });

      // リアルタイム通知
      req.io.emit('note:created', { note });

      res.status(201).json({
        success: true,
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }
}
```

#### Service層
```typescript
// src/services/notes.service.ts
export class NotesService {
  constructor(private prisma: PrismaClient) {}

  async createNote(data: CreateNoteData): Promise<Note> {
    const note = await this.prisma.note.create({
      data,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        tasks: true,
      },
    });

    // アクティビティログ記録
    await this.logActivity({
      userId: data.authorId,
      action: 'CREATE',
      resourceType: 'NOTE',
      resourceId: note.id,
    });

    return note;
  }
}
```

### リアルタイム通信

#### Socket.io設定
```typescript
// src/socket/index.ts
export const setupSocket = (server: Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // 認証ミドルウェア
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifyJWT(token);
      socket.userId = user.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // イベントハンドラー登録
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    socket.on('join-note', (noteId) => {
      socket.join(`note:${noteId}`);
    });

    socket.on('leave-note', (noteId) => {
      socket.leave(`note:${noteId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};
```

## データベース アーキテクチャ

### 接続管理
```typescript
// src/models/index.ts
import { PrismaClient } from '@prisma/client';

class DatabaseManager {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });
    }
    return DatabaseManager.instance;
  }

  static async disconnect(): Promise<void> {
    if (DatabaseManager.instance) {
      await DatabaseManager.instance.$disconnect();
    }
  }
}

export const prisma = DatabaseManager.getInstance();
```

### トランザクション管理
```typescript
export class TasksService {
  async updateTaskWithNote(taskId: string, updates: TaskUpdate) {
    return await this.prisma.$transaction(async (tx) => {
      // タスク更新
      const task = await tx.task.update({
        where: { id: taskId },
        data: updates,
      });

      // ノートの更新日時も更新
      await tx.note.update({
        where: { id: task.noteId },
        data: { updatedAt: new Date() },
      });

      return task;
    });
  }
}
```

## セキュリティ アーキテクチャ

### 認証・認可
```typescript
// JWT認証ミドルウェア
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// 権限チェックミドルウェア
export const requireNoteAccess = (requiredRole: NoteRole) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const noteId = req.params.noteId;
    const userId = req.user.id;

    const noteUser = await prisma.noteUser.findFirst({
      where: { noteId, userId },
    });

    if (!noteUser || !hasPermission(noteUser.role, requiredRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
```

### データ暗号化
```typescript
// src/utils/crypto.ts
import crypto from 'crypto';

export class CryptoService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly key = process.env.ENCRYPTION_KEY!;

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('shared-todo', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('shared-todo', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## 監視・ログ アーキテクチャ

### ログ設定
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'shared-todo-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### パフォーマンス監視
```typescript
// src/middleware/performance.ts
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    // 遅いリクエストを警告
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
      });
    }
  });

  next();
};
```

## デプロイメント アーキテクチャ

### CI/CD パイプライン
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway deploy --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 環境分離
```
Production:
  Frontend: Vercel
  Backend: Railway
  Database: Supabase PostgreSQL
  File Storage: Cloudinary
  Monitoring: Railway Metrics

Staging:
  Frontend: Vercel Preview
  Backend: Railway Staging
  Database: Supabase Staging
  File Storage: Cloudinary Test

Development:
  Frontend: Vite Dev Server
  Backend: Local Express
  Database: Local PostgreSQL
  File Storage: Local Mock
```

この包括的なアーキテクチャにより、スケーラブルで保守性の高いシステムを構築できます。