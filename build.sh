#!/usr/bin/env bash
# build.sh — フロントエンド + バックエンドを一括ビルドし、
#             dist/ を backend/ へコピーしてモノリス用バイナリを生成する。
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

echo "=== [1/3] Frontend: npm install & build ==="
cd "$FRONTEND_DIR"
npm ci
npm run build
echo "Frontend build complete → $FRONTEND_DIR/dist"

echo "=== [2/3] Copy dist → backend/dist ==="
rm -rf "$BACKEND_DIR/dist"
cp -r "$FRONTEND_DIR/dist" "$BACKEND_DIR/dist"
echo "Copied to $BACKEND_DIR/dist"

echo "=== [3/3] Backend: go build ==="
cd "$BACKEND_DIR"
go build -o server ./cmd/server/main.go
echo "Backend binary → $BACKEND_DIR/server"

echo ""
echo "✅ Build complete! Run with:"
echo "   cd backend && ./server"
