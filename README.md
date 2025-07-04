# Multiple Todo Share

複数端末で同期する超シンプルなタスク管理アプリ

## 🎯 プロジェクト概要

Stockアプリの設計思想を参考に、「極限までシンプル」「高速レスポンス」「情報の一元管理」を重視した複数端末対応ToDoアプリです。

### コンセプト
- **シンプル**: ITに詳しくない方でも直感的に使える
- **高速**: 待つことのないレスポンス
- **同期**: 全端末でリアルタイム同期
- **一元管理**: ノートとタスクの統合管理

## 🚀 主要機能

### 1. ノート機能
- プロジェクト単位での情報整理
- Markdown対応のリッチテキスト編集
- ファイル添付機能
- 検索機能

### 2. タスク管理
- ノートに紐付いたタスク作成
- 担当者・期限・優先度設定
- 進捗状況管理（未着手/進行中/完了/保留）
- タスク一覧表示・フィルタリング

### 3. リアルタイム同期
- 全端末での即座な同期
- オフライン対応＋自動復旧
- 競合解決機能

### 4. ユーザー管理
- 個人・チーム利用対応
- 権限管理（読み取り専用/編集/管理者）
- 招待機能

## 🛠️ 技術構成

### フロントエンド
- **React 18** + **TypeScript**
- **Vite** (開発環境)
- **Tailwind CSS** (スタイリング)
- **React Query** (データフェッチ・キャッシュ)
- **React Hook Form** (フォーム管理)
- **PWA** (オフライン対応)

### バックエンド
- **Node.js** + **Express**
- **Socket.io** (リアルタイム通信)
- **PostgreSQL** (データベース)
- **Prisma** (ORM)
- **JWT** (認証)

### インフラ・デプロイ
- **Vercel** (フロントエンド)
- **Railway** または **Supabase** (バックエンド)
- **Cloudinary** (ファイルストレージ)

### 開発・運用
- **ESLint** + **Prettier** (コード品質)
- **Jest** + **React Testing Library** (テスト)
- **GitHub Actions** (CI/CD)

## 🎯 機能実装状況

### ✅ 実装完了機能

#### 🔐 認証・ユーザー管理
- ✅ ユーザー登録・ログイン・ログアウト
- ✅ JWT トークンベース認証
- ✅ ユーザープロフィール管理
- ✅ セキュアなパスワードハッシュ化

#### 📝 ノート管理
- ✅ ノート作成・編集・削除
- ✅ リッチテキスト編集（プレーンテキスト）
- ✅ ノート一覧・詳細表示
- ✅ ページネーション対応

#### 👥 ノート共有・コラボレーション
- ✅ ユーザー招待機能（メール招待）
- ✅ 権限管理（viewer/editor/admin）
- ✅ 招待受諾・辞退システム
- ✅ コラボレーター管理UI
- ✅ 役割ベースアクセス制御

#### ✔️ タスク管理（基盤）
- ✅ タスクAPIサービス完全実装
- ✅ タスク一覧・フィルタリング
- ✅ タスク状態管理（pending/in_progress/completed/on_hold）
- ✅ 優先度設定（low/medium/high/critical）
- ✅ タスク割り当て機能
- ✅ 期限管理

#### 🎨 UI/UX・品質
- ✅ レスポンシブデザイン（Tailwind CSS）
- ✅ エラーハンドリング（ErrorBoundary）
- ✅ ローディング状態管理
- ✅ フォームバリデーション
- ✅ TypeScript完全対応

#### 📚 開発・保守
- ✅ Docker開発環境
- ✅ 包括的API仕様書
- ✅ アーキテクチャドキュメント
- ✅ Git版本管理

### 🚧 実装中・近日公開

#### ✔️ タスク管理（完成）
- 🔄 タスク作成・編集フォーム
- 🔄 タスクとノートの統合UI
- 🔄 タスク詳細ページ

#### 🔄 リアルタイム機能
- 🔄 WebSocket実装
- 🔄 リアルタイム同期
- 🔄 オンライン状態表示

### 📋 今後の開発予定

#### Phase 2: 拡張機能
- [ ] ファイル添付機能
- [ ] Markdown対応
- [ ] 高度な検索機能
- [ ] 詳細フィルタリング・ソート
- [ ] ダークモード
- [ ] 通知システム

#### Phase 3: エンタープライズ機能
- [ ] アクティビティログ
- [ ] データエクスポート
- [ ] バックアップ・復元
- [ ] 管理者ダッシュボード
- [ ] 使用統計・分析

#### Phase 4: モバイル・PWA
- [ ] PWA完全対応
- [ ] オフライン機能
- [ ] プッシュ通知
- [ ] モバイルアプリ（React Native）

#### Phase 5: インテグレーション
- [ ] 外部API連携
- [ ] Slack/Teams統合
- [ ] カレンダー連携
- [ ] メール通知システム

### 🎯 実装進捗率

| カテゴリ | 進捗 | 説明 |
|---------|------|------|
| **認証・ユーザー管理** | 100% | 完全実装済み |
| **ノート管理** | 100% | 基本機能完成 |
| **ノート共有** | 100% | コラボレーション完成 |
| **タスク管理** | 80% | API完成、UI部分実装中 |
| **リアルタイム同期** | 20% | 基盤準備済み |
| **UI/UX品質** | 90% | 高品質な実装 |

**総合進捗: 約 75% 完成**

## 🎨 UI/UX設計

### デザイン原則
1. **ミニマル**: 必要最小限の要素のみ表示
2. **直感的**: 説明不要で操作可能
3. **レスポンシブ**: モバイル・デスクトップ両対応
4. **アクセシブル**: WAI-ARIA準拠

### カラーパレット
- プライマリ: #3B82F6 (Blue-500)
- セカンダリ: #64748B (Slate-500)
- 成功: #10B981 (Emerald-500)
- 警告: #F59E0B (Amber-500)
- エラー: #EF4444 (Red-500)

## 📁 プロジェクト構成

```
shared-todo-app/
├── client/                 # フロントエンド
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── pages/          # ページコンポーネント
│   │   ├── services/       # API通信
│   │   ├── types/          # TypeScript型定義
│   │   └── utils/          # ユーティリティ関数
│   ├── public/             # 静的ファイル
│   └── package.json
├── server/                 # バックエンド
│   ├── src/
│   │   ├── controllers/    # コントローラー
│   │   ├── middleware/     # ミドルウェア
│   │   ├── models/         # データモデル
│   │   ├── routes/         # ルーティング
│   │   ├── services/       # ビジネスロジック
│   │   └── utils/          # ユーティリティ
│   ├── prisma/             # データベーススキーマ
│   └── package.json
├── docs/                   # ドキュメント
├── .github/                # GitHub Actions
└── README.md
```

## 🔒 セキュリティ

- HTTPS通信の強制
- JWT トークンによる認証
- データベース暗号化
- XSS・CSRF対策
- レート制限
- 入力値検証・サニタイゼー

## 📈 パフォーマンス目標

- 初回読み込み: 3秒以内
- ページ遷移: 1秒以内
- リアルタイム同期: 100ms以内
- オフライン復旧: 5秒以内

## 🚧 開発ロードマップ

### ✅ 完了したスプリント

#### Sprint 1-2 (Week 1-4) - 完了
- ✅ プロジェクト環境構築（Docker開発環境）
- ✅ 認証システム構築（JWT認証）
- ✅ 基本UI実装（React + Tailwind CSS）
- ✅ ノート機能実装（CRUD操作）
- ✅ ローカル状態管理（Zustand）

#### Sprint 3 (Week 5-6) - 完了  
- ✅ ノート共有機能実装
- ✅ 招待・権限管理システム
- ✅ タスク管理API基盤構築
- ✅ エラーハンドリング・品質向上

### 🚧 進行中・今後のスプリント

#### Sprint 4 (進行中)
- 🔄 タスク管理UI完成
- 🔄 タスク・ノート統合機能
- [ ] ユニットテスト実装
- [ ] パフォーマンス最適化

#### Sprint 5 (Next)
- [ ] リアルタイム同期実装（WebSocket）
- [ ] オフライン対応・PWA機能
- [ ] 通知システム基盤
- [ ] デプロイ・リリース準備

#### Sprint 6 (Future)
- [ ] ファイル添付機能
- [ ] 高度な検索・フィルタリング
- [ ] モバイル最適化
- [ ] パフォーマンス監視

## 🤝 コントリビューション

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 ライセンス

MIT License

## 🐳 Docker環境での開発

### 事前準備
1. Docker Desktop をインストールしてください
2. 環境変数を設定してください
   ```bash
   cp .env.example .env
   # .env ファイルを編集して適切な値を設定
   ```

### 開発環境の起動
```bash
# 全サービスを起動
docker-compose up -d

# ログを確認
docker-compose logs -f

# 特定のサービスのログを確認
docker-compose logs -f backend
docker-compose logs -f frontend
```

### サービスアクセス
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **データベース**: localhost:5432
- **Redis**: localhost:6379
- **PgAdmin** (オプション): http://localhost:8080

### 開発用コマンド
```bash
# サービス停止
docker-compose down

# データベースを含む完全なクリーンアップ
docker-compose down -v

# PgAdminも含めて起動
docker-compose --profile tools up -d

# データベースのリセット
docker-compose down -v database
docker-compose up -d database

# 特定のサービスのみ再起動
docker-compose restart backend
```

### トラブルシューティング
- **ポート競合**: 他のサービスが同じポートを使用していないか確認
- **データベース接続エラー**: データベースの起動を待ってから他のサービスを起動
- **ファイル変更が反映されない**: `docker-compose down && docker-compose up -d`

## 📞 サポート

問題や質問がありましたら、GitHub Issuesをご利用ください。