# 整體架構 — Auth Service

> 本文件依據 `README.md` 所述的技術選型（TypeScript + Express 後端、React 前端、JWT Token 驗證、Docker Compose 部署）推導出專案的整體架構設計，作為後續實作的藍圖。

## 1. 系統概觀

一個以 JWT 為核心的使用者驗證服務，分為三個部署單元，全部透過 Docker Compose 編排：

```
┌──────────────┐        ┌──────────────────────────────┐        ┌──────────────┐
│   Frontend   │        │           Backend            │        │   Database   │
│   React SPA  │──HTTP──▶│   Express + TypeScript API   │──TCP──▶│    MySQL     │
│  (Nginx)     │◀──JSON──│   (REST + JWT)               │◀───────│              │
└──────────────┘        └──────────────────────────────┘        └──────────────┘
        │                             │
        └─────── Authorization: Bearer <JWT> ───────┘
```

## 2. 技術棧

| 層          | 技術                                                    |
| ----------- | ------------------------------------------------------- |
| 前端        | React.js、TypeScript、React Router、Axios/Fetch         |
| 後端        | Node.js、Express、TypeScript                            |
| 驗證        | JWT（jsonwebtoken）、bcrypt 密碼雜湊                    |
| 資料庫      | MySQL 8 + Prisma ORM（型別安全、schema/migration 管理） |
| 驗證/schema | Zod（輸入驗證）                                         |
| 部署        | Docker、Docker Compose、Nginx（前端靜態服務）           |

## 3. 認證流程（依 README「Flow」）

```
註冊      Client ──POST /api/auth/register {email, password}──▶ Server
          Server: 驗證輸入 → bcrypt 雜湊密碼 → 寫入 DB → 201 Created

登入      Client ──POST /api/auth/login {email, password}─────▶ Server
          Server: 查 user → bcrypt.compare → 簽發 JWT → 回傳 { token }

存取受保護資源
          Client ──GET /api/... Header: Authorization: Bearer <JWT>──▶ Server
          Server: authMiddleware 驗證 JWT 簽章與過期 → 放行 / 401
```

- **Access Token**：短效期（如 15 分鐘），放在 `Authorization` header。
- **Refresh Token（建議擴充）**：長效期，透過 HttpOnly Cookie 儲存，用於換發新的 access token。

## 4. 後端目錄結構（建議）

依全域規範「多個小檔案、依功能分層」組織：

```
backend/
├── src/
│   ├── config/            # 環境變數、DB 連線、常數設定
│   │   └── env.ts
│   ├── routes/            # 路由定義
│   │   └── auth.routes.ts
│   ├── controllers/       # 處理 req/res，呼叫 service
│   │   └── auth.controller.ts
│   ├── services/          # 商業邏輯（註冊、登入、簽發 token）
│   │   └── auth.service.ts
│   ├── repositories/      # 資料存取層（Repository Pattern）
│   │   └── user.repository.ts
│   ├── middlewares/       # authMiddleware、errorHandler、rateLimiter
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/            # 資料模型 / ORM entity
│   │   └── user.model.ts
│   ├── schemas/           # Zod 驗證 schema（系統邊界輸入驗證）
│   │   └── auth.schema.ts
│   ├── utils/             # jwt、hash 等工具
│   │   ├── jwt.ts
│   │   └── password.ts
│   ├── app.ts             # Express app 組裝
│   └── server.ts          # 進入點
├── tests/                 # 單元 + 整合測試
├── Dockerfile
├── package.json
└── tsconfig.json
```

**分層職責**：`routes → controllers → services → repositories → DB`，
商業邏輯只依賴 repository 介面，方便替換資料來源與測試 mock。

## 5. 前端目錄結構（建議）

```
frontend/
├── src/
│   ├── api/               # API client（Axios 實例、攔截器加 token）
│   ├── pages/             # Login、Register、Dashboard（受保護）
│   ├── components/        # 表單、按鈕等 UI 元件
│   ├── context/           # AuthContext（登入狀態、token）
│   ├── hooks/             # useAuth 等
│   ├── routes/            # ProtectedRoute 包裝
│   └── App.tsx
├── Dockerfile
└── package.json
```

- Axios 攔截器統一注入 `Authorization` header，並攔截 401 導回登入頁。
- `ProtectedRoute` 檢查登入狀態，未登入導向 `/login`。

## 6. API 端點設計（補齊 README 空白處）

| Method | 路徑                 | 說明                     | 保護   |
| ------ | -------------------- | ------------------------ | ------ |
| POST   | `/api/auth/register` | 註冊（email + password） | 否     |
| POST   | `/api/auth/login`    | 登入，回傳 JWT           | 否     |
| POST   | `/api/auth/logout`   | 登出（清除 refresh）     | 是     |
| GET    | `/api/auth/me`       | 取得目前使用者資料       | 是     |
| POST   | `/api/auth/refresh`  | 用 refresh token 換發    | Cookie |

**統一回應格式**（依全域 Patterns 規範的 envelope）：

```json
{ "success": true, "data": { ... }, "error": null }
{ "success": false, "data": null, "error": "Invalid credentials" }
```

## 7. 資料模型

Schema 由 **Prisma**（`backend/prisma/schema.prisma`）定義，透過 `prisma migrate` 管理版本：

```prisma
model User {
  id        Int      @id @default(autoincrement())   // INT AUTO_INCREMENT
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(255)                 // bcrypt hash，永不回傳
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  @@map("users")
}
```

- 表引擎/字元集沿用 MySQL 8 預設 InnoDB / utf8mb4。
- 若日後預期使用者量超過 INT 上限（約 21 億），可改為 `BigInt`（需處理 JSON 序列化）。

## 8. Docker Compose 部署

```
services:
  frontend   → build ./frontend，Nginx 服務靜態檔，對外 8080
  backend    → build ./backend，Express depends_on: db
  db         → mysql:8，volume 持久化資料，healthcheck 用 mysqladmin ping
```

環境變數（`.env`，切勿寫死於程式碼）：
`JWT_SECRET`、`JWT_EXPIRES_IN`、`PORT`、`NODE_ENV`，以及 MySQL 連線設定
`DATABASE_URL`（如 `mysql://user:pass@db:3306/auth`）、`MYSQL_ROOT_PASSWORD`、
`MYSQL_DATABASE`、`MYSQL_USER`、`MYSQL_PASSWORD`。

## 9. 安全性重點（依全域 Security 規範）

- 密碼一律以 **bcrypt** 雜湊儲存，永不明文、永不回傳。
- `JWT_SECRET` 等機密只從環境變數讀取，啟動時驗證是否存在。
- 所有輸入在系統邊界以 **Zod** 驗證，失敗即快速回傳明確錯誤。
- 認證端點加上 **rate limiting**，防止暴力破解。
- 使用參數化查詢 / ORM，避免 SQL Injection。
- 錯誤訊息不洩漏敏感資訊（如「帳號或密碼錯誤」而非指出哪個錯）。
- 前端 token 建議存於記憶體或 HttpOnly Cookie，降低 XSS 風險。
