# システム設計 (Architecture) - ハイブリッドDB接続の導入

## 1. 概要
本設計では、GORM を用いたデータベース接続管理モジュール (`backend/internal/repository/db.go`) の接続ロジックを改修し、指定された環境変数に基づいて SQLite と PostgreSQL を動的に切り替える仕組みを導入する。

## 2. 変更対象コンポーネント
- **ファイルパス**: `backend/internal/repository/db.go`
- **責務**: アプリケーション全体のデータベース接続プール（`*gorm.DB`）の初期化と保持。
- **依存ライブラリ**:
  - `gorm.io/gorm` (O/R マッパー本体)
  - `gorm.io/driver/sqlite` (SQLite ドライバ)
  - `gorm.io/driver/postgres` (PostgreSQL ドライバ)

## 3. データフローとロジック
1. **環境変数の読み込み**
   - `os.Getenv("DB_TYPE")` および `os.Getenv("DATABASE_URL")` を取得する。
   - `DATABASE_URL` は `strings.TrimSpace` で前後の不要な空白を除去する。
2. **分岐ロジック**
   - 条件: `DB_TYPE == "postgres" && DATABASE_URL != ""`
   - **True**: `postgres.New(postgres.Config{DSN: DATABASE_URL, PreferSimpleProtocol: true})` を用いて PostgreSQL 接続を初期化。Render の pgBouncer 環境での Prepared Statement 起因のエラー (`insufficient arguments`) を回避する。
   - **False**: `sqlite.Open("daichi_log.db" / SQLITE_PATH)` を用いて SQLite 接続を初期化。
3. **マイグレーション**
   - 接続成功後、`db.AutoMigrate()` に既存の3モデル (`Issue`, `WikiPage`, `GitCommit`) を渡し、スキーマの同期を行う。
4. **エラーハンドリング**
   - DB接続フェーズでのエラー発生時は `log.Fatalf()` でプロセスをシャットダウンする。
   - ただし `db.AutoMigrate()` のエラー発生時は `log.Printf()` でエラーを出力するのみに留め、Render のヘルスチェック等を通すためのサーバー起動フローを継続させる。

## 4. 循環参照の防止とインポート管理
- `db.go` は `repository` パッケージに属し、`models` パッケージをインポートする。
- 逆に `models` パッケージは `repository` パッケージに依存しない（GORM の構造体タグのみを定義する）ため、循環参照は発生しない。

---
### 設計検証 (CrossReference)
- 生成したコードのディレクトリ構造と構成は、Go の標準的な Clean Architecture やレイヤードアーキテクチャのベストプラクティスに従い、安全に分離されています。
- PostgreSQL を利用するための `gorm.io/driver/postgres` は、適切に `go get` で追加・管理されています。
