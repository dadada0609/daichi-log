# 要件定義 (Requirements) - ハイブリッドDB接続の導入

## 1. 概要
daichi-log のデータ永続化において、環境に応じた柔軟な運用を可能にするため、既存の SQLite と Neon (PostgreSQL) のハイブリッド接続環境を構築する。

## 2. 機能要件
- **DB接続切り替え**:
  - `DB_TYPE` が `postgres` であり、かつ `DATABASE_URL` が設定されている場合、PostgreSQL (gorm.io/driver/postgres) を使用する。接続文字列の前後にある不要な空白文字は Trim する。
  - Render の pgBouncer 等のコネクションプーラー環境で発生する `insufficient arguments` 対策として、Prepared Statement を無効化 (`PreferSimpleProtocol: true`) して接続する。
  - 上記の条件を満たさない場合は、デフォルトとして既存の SQLite (gorm.io/driver/sqlite) を使用する。
- **自動マイグレーション**:
  - GORMの `db.AutoMigrate` を用い、起動時に自動的にテーブル構造を生成・同期する。
  - 対象モデル: `Issue`, `WikiPage`, `GitCommit` （既存の定義を維持する）
- **エラーハンドリング**:
  - データベース接続に失敗した場合は `log.Fatalf` でプロセスを終了する。
  - **【重要】** `AutoMigrate` に失敗した場合は、Render の無限再起動ループ（ヘルスチェック失敗）を防ぐため、`log.Printf` でエラーを記録するに留め、サーバーの起動処理を継続する（デバッグ用途）。

## 3. 非機能要件
- 既存のモデル定義およびDB利用箇所には影響を与えないこと。
- パッケージの循環参照が発生しない構造を維持すること。

---
### CoVe (Chain-of-Thought Verification) 評価
1. **[Q] PostgreSQL を条件付きで使うための変数は仕様と合致しているか？**
   - [A] はい。`DB_TYPE` が `postgres` かつ `DATABASE_URL` が存在することが指定条件であり、ロジックはそれに準拠しています。
2. **[Q] gorm.io/driver/postgres のメソッド名や引数は最新仕様と合致するか？**
   - [A] はい。`postgres.Open(dsn)` は GORM の標準仕様と合致しています。
3. **[Q] マイグレーションのモデルに変更が加わっていないか？**
   - [A] はい。`db.AutoMigrate(&models.Issue{}, &models.WikiPage{}, &models.GitCommit{})` となっており、既存のモデルをそのまま渡しているためハルシネーションはありません。
