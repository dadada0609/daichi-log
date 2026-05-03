# architecture.md

## 1. システムアーキテクチャ概要 (System Architecture Overview)
本システムは、高いスケーラビリティと堅牢性を確保するため、**Go (バックエンド)**、**React/Vite + TypeScript (フロントエンド)**、および **PostgreSQL (データベース)** を採用した3層クライアント・サーバーモデルで構築する。

## 2. ディレクトリ構造 (Directory Structure)

```text
daichi-log/
├── backend/                  # Go バックエンド
│   ├── cmd/
│   │   └── server/           # エントリーポイント (main.go)
│   ├── internal/
│   │   ├── handlers/         # HTTPハンドラ (REST APIエンドポイント)
│   │   ├── models/           # ドメインモデル (GORM/SQL構造体)
│   │   ├── repository/       # データベースアクセシビリティ
│   │   └── services/         # ビジネスロジック (Wikiパース、Gitフック処理等)
│   ├── pkg/                  # 汎用ライブラリ
│   ├── go.mod
│   └── go.sum
├── frontend/                 # React/Vite + TypeScript フロントエンド
│   ├── src/
│   │   ├── api/              # バックエンド通信用APIクライアント
│   │   ├── components/       # UIコンポーネント
│   │   │   ├── issues/       # 課題管理UI
│   │   │   ├── gantt/        # ガントチャート描画コンポーネント
│   │   │   ├── wiki/         # Wikiエディタ・ビューア (Markdown)
│   │   │   └── git/          # Git履歴表示
│   │   ├── types/            # TypeScript インターフェース定義
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── database/                 # DBマイグレーションスクリプト (SQL)
    └── migrations/
```

## 3. インターフェース・API仕様 (Interfaces & API Specs)

### 3.1 REST API エンドポイント
`requirements.md` で定義されたリソースを操作する標準的なRESTful APIを実装する。

* **課題 (Issues)**
  * `GET /api/v1/issues` : ガントチャート描画用を含む課題一覧の取得（クエリパラメータでフィルタ）
  * `POST /api/v1/issues` : 新規課題作成
  * `PUT /api/v1/issues/:issue_key` : 課題の更新（ステータス、実績時間など）
* **Wiki**
  * `GET /api/v1/wiki/:page_id` : Wikiページの取得（マークダウン）
  * `POST /api/v1/wiki` : Wikiページの作成・更新
* **Git**
  * `POST /api/v1/webhooks/git` : GitHub/GitLab等からのWebhook受信エンドポイント（コミットパース用）
  * `GET /api/v1/issues/:issue_key/commits` : 特定の課題に紐づくコミット履歴の取得

### 3.2 データモデル定義 (TypeScript Interfaces)
```typescript
// frontend/src/types/index.ts

export interface Issue {
  issueKey: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee: string | null;
  startDate: string | null; // ISO8601形式 YYYY-MM-DD
  dueDate: string | null;   // ISO8601形式 YYYY-MM-DD
  estimatedHours: number | null;
  actualHours: number | null;
}

export interface WikiPage {
  pageId: string;
  title: string;
  content: string; // Markdown
  version: number;
  createdBy: string;
  updatedAt: string; // ISO8601形式
}

export interface GitCommit {
  commitHash: string;
  author: string;
  message: string;
  timestamp: string; // ISO8601形式
}
```

## 4. 内部検証プロセス (CrossReference) 結果

### <VerificationQuestions>
1. **ディレクトリ構造の検証**: Goプロジェクトの構造はベストプラクティス（Standard Go Project Layout）に準拠しているか？ReactフロントエンドはViteの標準出力と合致しているか？
2. **API仕様の検証**: 定義したREST APIは、ガントチャートの描画（全データフェッチ）やGitWebhook受信の要件を満たすことができるか？
3. **データモデルの検証**: TypeScriptのインターフェースは `requirements.md` で定義されたフィールドを過不足なく網羅しており、標準的なJSONシリアライズ仕様（ISO8601日付など）に合致しているか？

### <Verify>
1. **ディレクトリ構造**: Goの `cmd/` と `internal/` の分離は `golang-standards/project-layout` に完全に準拠している。フロントエンドの `src/components`, `src/types` もTypeScript + Reactの業界標準の構成である。既存のプロジェクトファイルとの不整合はない。
2. **API仕様**: ガントチャートの要件（O(N)のフェッチ）を満たすため、`GET /api/v1/issues` を設計した。Git連携の要件（イベント駆動）を満たすため、`POST /api/v1/webhooks/git` を設計し、バックエンドの `services/` で非同期にメッセージパースを行うフローを確立した。
3. **データモデル**: `requirements.md` の第2章で定義された `IssueKey`, `Status` などの全フィールドをTypeScript型として定義した。日付はJSONで安全に扱えるISO8601文字列（`string`型）を採用しており、Go側の `time.Time` のデフォルトJSONシリアライズ仕様とも完全に一致する。

### <FinalOutput>
本アーキテクチャ設計は、ターゲット言語（Go / React TypeScript）のベストプラクティスを遵守し、`requirements.md` の全要件を論理的矛盾なく満たしている。標準仕様との完全な整合性が確認されたため、本設計を承認・確定する。
