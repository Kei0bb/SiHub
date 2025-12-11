# Semiconductor Analytics Platform

A modern, full-stack web application for visualizing semiconductor manufacturing data (Yield, SPC, Wafer Maps).

![Dashboard Screenshot](https://via.placeholder.com/800x450?text=Dashboard+Preview)

## Features
- **Yield Trend Analysis**: Interactive SPC charts with Target lines.
- **Wafer Map Viewer**: Visual inspection of chip-level pass/fail distribution.
- **Analytics**: Automatic calculation of Mean, Std Dev, and Histograms.
- **Premium UI**: Dark mode, Glassmorphism, and responsive design.
- **Dual Mode**: Supports both Mock Data (for dev) and Real Oracle DB (for prod).

## Tech Stack
- **Frontend**: React, Vite, Plotly.js, Lucide React
- **Backend**: Python, FastAPI, Pandas, NumPy, OracleDB
- **Database**: Oracle Database (Production) / Mock Service (Dev)
- **Deployment**: Docker, Nginx

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- uv (Python package manager)
- Docker & Docker Compose (for containerized deployment)

### Deployment (Recommended)
This project is containerized using Docker and Nginx.

```bash
# Build and run with Docker Compose
docker compose up --build -d
```
- **Frontend**: [http://localhost](http://localhost)
- **API Docs**: [http://localhost/docs](http://localhost/docs)

### Production Domain Setup
To use a custom domain in production:
1. **DNS**: Point your domain's A record to the server's IP address.
2. **Nginx Config**: Update `frontend/nginx.conf`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com; # Change from localhost
       # ...
   }
   ```
3. **SSL (HTTPS)**: It is recommended to use Certbot to enable HTTPS.

### Local Development Setup

#### Backend
1. Navigate to backend:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   uv sync
   ```
3. Run the server:
   ```bash
   uv run uvicorn app.main:app --reload
   ```
   API will be available at `http://localhost:8000`.

#### Frontend
1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
   App will be available at `http://localhost:5173`.

## Configuration
The application supports a `.env` file in the `backend` directory.

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_MOCK_DB` | Set to `True` for mock data, `False` for Oracle DB | `True` |
| `ORACLE_USER` | Oracle DB Username | `user` |
| `ORACLE_PASSWORD` | Oracle DB Password | `password` |
| `ORACLE_DSN` | Oracle Connection String | `localhost:1521/xe` |

## Project Structure
```
.
├── backend/            # FastAPI Application
│   ├── app/
│   │   ├── api/        # API Endpoints
│   │   ├── core/       # Config & Settings
│   │   ├── models/     # Pydantic Models
│   │   └── services/   # Business Logic (Mock & Oracle)
├── frontend/           # React Application
│   ├── src/
│   │   ├── pages/      # Page Components
│   │   └── index.css   # Global Styles
├── docker-compose.yml  # Docker Orchestration
```

---

# Semiconductor Analytics Platform (SONAR) - 日本語ドキュメント

半導体製造データ（歩留まり、SPC、ウェーハマップ）を可視化するためのモダンなフルスタックWebアプリケーションです。

## 特徴
- **歩留まりトレンド分析**: ターゲットライン付きのインタラクティブなSPCチャート。
- **ウェーハマップビューア**: チップレベルのPass/Fail分布を視覚的に検査。
- **分析機能**: 平均値、標準偏差、ヒストグラムの自動計算。
- **プレミアムUI**: ダークモード、グラスモーフィズム、レスポンシブデザイン。
- **デュアルモード**: モックデータ（開発用）と実際のOracle DB（本番用）の両方をサポート。

## 技術スタック
- **フロントエンド**: React, Vite, Plotly.js, Lucide React
- **バックエンド**: Python, FastAPI, Pandas, NumPy, OracleDB
- **データベース**: Oracle Database (本番) / Mock Service (開発)
- **デプロイ**: Docker, Nginx

## 始め方

### 前提条件
- Node.js 18以上
- Python 3.12以上
- uv (Pythonパッケージマネージャー)
- Docker & Docker Compose (コンテナデプロイ用)

### デプロイ（推奨）
本プロジェクトはDockerとNginxを使用してコンテナ化されています。

```bash
# Docker Composeでビルドして起動
docker compose up --build -d
```
- **フロントエンド**: [http://localhost](http://localhost)
- **APIドキュメント**: [http://localhost/docs](http://localhost/docs)

### 本番ドメイン設定
本番環境で独自ドメインを使用する場合：
1. **DNS設定**: ご利用のドメインのAレコードをサーバーのIPアドレスに向けます。
2. **Nginx設定**: `frontend/nginx.conf` を編集します。
   ```nginx
   server {
       listen 80;
       server_name your-domain.com; # localhostから実際のドメインに変更
       # ...
   }
   ```
3. **SSL (HTTPS)**: Certbot等を使用してHTTPS化することを推奨します。

### ローカル開発セットアップ

#### バックエンド
1. 保存先ディレクトリに移動:
   ```bash
   cd backend
   ```
2. 依存関係をインストール:
   ```bash
   uv sync
   ```
3. サーバーを起動:
   ```bash
   uv run uvicorn app.main:app --reload
   ```
   APIは `http://localhost:8000` で利用可能になります。

#### フロントエンド
1. 保存先ディレクトリに移動:
   ```bash
   cd frontend
   ```
2. 依存関係をインストール:
   ```bash
   npm install
   ```
3. 開発サーバーを起動:
   ```bash
   npm run dev
   ```
   アプリは `http://localhost:5173` で利用可能になります。

## 設定
`backend` ディレクトリ内の `.env` ファイルで設定を変更できます。

| 変数名 | 説明 | デフォルト値 |
|----------|-------------|---------|
| `USE_MOCK_DB` | `True` でモックデータ、`False` でOracle DBを使用 | `True` |
| `ORACLE_USER` | Oracle DB ユーザー名 | `user` |
| `ORACLE_PASSWORD` | Oracle DB パスワード | `password` |
| `ORACLE_DSN` | Oracle 接続文字列 | `localhost:1521/xe` |
