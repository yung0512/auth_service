# Auth Service

メール／パスワードによる認証機能（新規登録・ログイン・ログアウト・トークン更新）を、**フロントエンド・バックエンド・データ保存**まで含めて実装した課題です。

- **認証方式**: JWT（アクセストークン + リフレッシュトークン）
- **フロント**: React (TypeScript) + Vite + MUI、多言語対応（日本語 / 英語）
- **バックエンド**: Node.js + Express (TypeScript)
- **データ保存**: MySQL 8 + Prisma ORM
- **実行**: Docker Compose（1 コマンドで全構成が起動）

---

## 1. 環境要件

### 方法 A: Docker（推奨・試験官の動作確認向け）

| ツール         | バージョン                  |
| -------------- | --------------------------- |
| Docker         | 24 以上                     |
| Docker Compose | v2 以上（`docker compose`） |

Docker さえあれば、Node.js や MySQL をローカルに用意する必要はありません。

### 方法 B: ローカルで個別に起動（開発向け）

| ツール  | バージョン |
| ------- | ---------- |
| Node.js | 26 以上    |
| MySQL   | 8 以上     |

---

## 2. 起動手順

### 方法 A: Docker Compose（推奨）

```bash
# 1. 環境変数ファイルを作成し、値を設定
cp .env.example .env
#   → JWT_SECRET / JWT_REFRESH_SECRET / MYSQL_* を任意の値に変更してください

# 2. 起動（初回はビルドが走ります）
docker compose up --build
```

起動後のアクセス先:

| サービス         | URL                       |
| ---------------- | ------------------------- |
| フロントエンド   | http://localhost          |
| バックエンド API | http://localhost:3000/api |
| MySQL            | localhost:3306            |

- DB マイグレーション（テーブル作成）はバックエンドコンテナ起動時に
  `prisma migrate deploy` が自動実行されるため、手動作業は不要です。
- 停止は `Ctrl+C`、データを含めて破棄する場合は `docker compose down -v`。

### 方法 B: ローカルで個別に起動

MySQL を起動し、接続情報を控えておきます。

**バックエンド**

```bash
cd backend
npm install

# backend/.env を用意（例）
#   DATABASE_URL="mysql://<user>:<pass>@localhost:3306/auth_service"
#   JWT_SECRET="..."
#   JWT_REFRESH_SECRET="..."

npm run db:deploy   # マイグレーション適用
npm run dev         # http://localhost:3000
```

**フロントエンド**

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173 （/api を :3000 にプロキシ）
```

### テスト

```bash
cd backend  && npm test   # JWT / Cookie / AuthService の単体テスト
cd frontend && npm test   # API クライアント（401→リフレッシュ再試行）のテスト
```

---

## 3. 生成 AI 使用箇所

本リポジトリは **Claude Code（Claude Opus）** を AI アシスタントとして使用しました。
基本方針は「**最初に設計文書（`ARCHITECTURE.md`）を AI に作らせて自分でレビューし、
その設計文書を土台に各コードを生成させる**」というものです。設計を人間が管理することで、
セッションをまたいでも一貫した実装を高速に生成できます。

### 使用したワークフローと箇所

| #   | 使用箇所           | 内容                                                                                                      |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| 1   | 設計文書の生成     | 技術選定（Express / React / JWT / Docker）を指定し、`ARCHITECTURE.md` を生成。内容を人間がレビュー。      |
| 2   | バックエンド雛形   | `ARCHITECTURE.md` に沿って、routes / controllers / services / repositories / middlewares / utils を生成。 |
| 3   | フロントエンド雛形 | 認証コンテキスト、ログイン／登録画面、Axios クライアント（トークン更新インターセプター）を生成。          |
| 4   | テストコード       | ファイル階層に対応させたテスト（backend: JWT・Cookie・AuthService、frontend: API クライアント）を生成。   |
| 5   | モデル拡張         | User モデルへ `firstName` / `lastName` を追加し、スキーマ・マイグレーション・API・画面まで横断的に反映。  |

### 代表的なプロンプト（実際に使用したもの）

```text
# 設計文書の生成
I want to use Node.js and Express as backend service and React.js as
frontend service to generate a simple auth service with JWT authentication,
according to the above requirements. Please generate the project
architecture into an ARCHITECTURE.md file.

# バックエンド／フロントエンド生成
根據 ARCHITECTURE.md 生成後端（前端）的專案結構與程式碼。

# テスト生成
backend 裡面的 test 資料夾根據原本的檔案階層來做 /
現在根據 JWT 的架構對前端實作測試檔案

# モデル拡張
User model 想要新增 first name / last name 欄位，
並讓後端 schema・migration・API 與前端註冊・ログイン画面も追従して修正。
```

> AI が生成したコードは、設計文書との整合性・型安全性（`tsc`）・テスト通過を
> 人間が確認したうえで採用しています。

---

## 4. 簡単な設計説明

### 全体構成（3 層）

```
┌────────────┐   HTTP/JSON   ┌──────────────────────┐   TCP   ┌─────────┐
│  Frontend  │ ────────────▶ │       Backend        │ ──────▶ │  MySQL  │
│ React SPA  │ ◀──────────── │  Express + TS (REST) │ ◀────── │ (Prisma)│
│  (Nginx)   │               │        + JWT         │         │         │
└────────────┘               └──────────────────────┘         └─────────┘
        └──── Authorization: Bearer <access token> ────┘
```

詳細な設計は [`ARCHITECTURE.md`](./ARCHITECTURE.md) を参照してください。

### 認証設計（JWT 2 トークン方式）

- **アクセストークン**: 短命（既定 15 分）。レスポンス body で返却し、フロントは
  メモリ上に保持して `Authorization: Bearer` ヘッダーで送信。
- **リフレッシュトークン**: 長命（既定 7 日）。**httpOnly Cookie** で保存し、
  JavaScript から読めないため XSS に強い。`/api/auth/refresh` でアクセストークンを再発行。
- **自動更新**: フロントの Axios レスポンスインターセプターが `401` を検知すると、
  リフレッシュ→元リクエスト再試行を自動で行う（同時多発時も **1 回のみ**更新する single-flight）。
- **パスワード**: bcrypt でハッシュ化して保存（平文は保持しない）。

### バックエンドのレイヤー構成

```
routes → controllers → services → repositories → Prisma → MySQL
                         │
        middlewares（認証・エラー処理） / utils（jwt・password・cookies） / schemas（Zod 入力検証）
```

- **責務分離**: HTTP 層（controller）・業務ロジック（service）・データアクセス（repository）を分離。
- **入力検証**: 全ての受信データを **Zod** スキーマで検証。
- **レスポンス形式**: `{ success, data, error }` の統一エンベロープ。

### API エンドポイント

| メソッド | パス                 | 認証   | 説明                                                        |
| -------- | -------------------- | ------ | ----------------------------------------------------------- |
| POST     | `/api/auth/register` | 不要   | 新規登録（email, password, 任意で firstName/lastName）      |
| POST     | `/api/auth/login`    | 不要   | ログイン（アクセストークン発行 + リフレッシュ Cookie 設定） |
| POST     | `/api/auth/refresh`  | Cookie | アクセストークン再発行                                      |
| POST     | `/api/auth/logout`   | 要     | リフレッシュ Cookie の破棄                                  |
| GET      | `/api/auth/me`       | 要     | ログイン中ユーザー情報の取得                                |

### データモデル（User）

| フィールド            | 型       | 説明               |
| --------------------- | -------- | ------------------ |
| id                    | Int      | 主キー（自動採番） |
| email                 | String   | 一意・ログイン ID  |
| password              | String   | bcrypt ハッシュ    |
| firstName             | String?  | 名（任意）         |
| lastName              | String?  | 姓（任意）         |
| createdAt / updatedAt | DateTime | 作成・更新日時     |

### ディレクトリ構成

```
.
├── docker-compose.yml     # frontend / backend / db(MySQL) を編成
├── .env.example           # 環境変数サンプル
├── ARCHITECTURE.md        # 設計文書
├── backend/               # Express + TypeScript + Prisma
│   ├── src/               # routes / controllers / services / repositories / ...
│   ├── prisma/            # schema.prisma・migrations
│   └── test/              # 単体テスト（src の階層に対応）
└── frontend/              # React + TypeScript + Vite + MUI
    ├── src/               # pages / context / api / routes / i18n
    └── test/              # API クライアントのテスト
```
