# Semiconductor Analytics Platform (SONAR)

半導体製造データ（歩留まり、SPC、ウェーハマップ）を可視化するためのモダンなWebアプリケーションです。

## Features / 特徴
- **Yield Trend Analysis**: Interactive SPC charts with Target lines
- **Wafer Map Viewer**: Visual inspection of chip-level pass/fail distribution
- **Analytics**: Automatic calculation of Mean, Std Dev, and Histograms
- **Premium UI**: Dark/Light mode, Glassmorphism, responsive design
- **Dual Mode**: Mock Data (dev) and Oracle DB (prod)

## Tech Stack / 技術スタック
- **Frontend**: HTMX, Jinja2 Templates, Plotly.js CDN, Lucide Icons
- **Backend**: Python, FastAPI, Plotly Python (SSR), Pandas, NumPy, OracleDB
- **Database**: Oracle Database (Production) / Mock Service (Dev)
- **Deployment**: Docker

## Getting Started / 始め方

### Prerequisites / 前提条件
- Python 3.13+
- uv (Python package manager)
- Docker & Docker Compose

### Deployment / デプロイ
```bash
docker compose up --build -d
```
- **App**: [http://localhost](http://localhost)
- **API Docs**: [http://localhost/docs](http://localhost/docs)

### Local Development / ローカル開発
```bash
uv sync
uv run uvicorn app.main:app --reload
```
App: `http://localhost:8000`

## Configuration / 設定

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_MOCK_DB` | `True` for mock, `False` for Oracle | `True` |
| `ORACLE_USER` | Oracle DB Username | `user` |
| `ORACLE_PASSWORD` | Oracle DB Password | `password` |
| `ORACLE_DSN` | Oracle Connection String | `localhost:1521/xe` |

## Project Structure / プロジェクト構造
```
.
├── app/                        # FastAPI Application
│   ├── api/                    # REST API Endpoints
│   ├── core/                   # Config & Settings
│   ├── models/                 # Pydantic Models
│   ├── services/               # Business Logic
│   └── views/                  # Page Routes (HTMX)
├── templates/                  # Jinja2 Templates
├── static/css/                 # Stylesheets
├── pyproject.toml
├── docker-compose.yml
└── Dockerfile
```
