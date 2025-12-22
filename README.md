# Semiconductor Analytics Platform (SONAR)

半導体製造データ（歩留まり、SPC、ウェーハマップ）を可視化するためのモダンなWebアプリケーションです。

---

## ✨ Features / 特徴

### 📈 Yield Trend Analysis
- 日次/週次/月次/四半期/ロット単位でのデータ集計表示
- Targetライン付きのインタラクティブなSPCチャート
- Mean（平均）、Std Dev（標準偏差）の自動計算
- ヒストグラム表示による歩留まり分布の可視化

### 🔵 Wafer Map Viewer
- ロット/ウェーハ単位でのチップレベル合否分布表示
- SVGによる軽量なウェーハマップサムネイル生成
- 詳細モーダルでの拡大表示（Plotly使用）
- Binコード別のカラー表示（Pass, Open, Short, Other）

### ⚙️ Settings / 管理機能
- **Product Management**: 製品のアクティブ/非アクティブ切り替え
- **Yield Target管理**: 年/月単位での歩留まり目標値設定
- HTMXによるリアルタイムUI更新

### 🎨 Premium UI/UX
- ダークモード対応
- Glassmorphismデザイン
- レスポンシブデザイン（モバイル対応）
- Lucide Iconsによるモダンなアイコン

### 🔄 Dual Mode Architecture
- **Development**: モックデータによる即座のテスト
- **Production**: Oracle Database接続

---

## 🛠 Tech Stack / 技術スタック

| Category | Technology |
|----------|------------|
| **Frontend** | HTMX, Jinja2 Templates, Plotly.js (CDN), Lucide Icons |
| **Backend** | Python 3.13+, FastAPI, Plotly Python (SSR), Pandas, NumPy |
| **Database** | Oracle Database (Prod) / Mock Service (Dev) |
| **Deployment** | Docker, Docker Compose, Nginx |

### Dependencies
```
fastapi>=0.123.5
jinja2>=3.1.0
numpy>=2.3.5
oracledb>=3.4.1
pandas>=2.3.3
plotly>=5.24.0
pydantic>=2.12.5
pydantic-settings>=2.12.0
python-multipart>=0.0.21
sqlalchemy>=2.0.44
uvicorn>=0.38.0
```

---

## 🚀 Getting Started / 始め方

### Prerequisites / 前提条件
- Python 3.13+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
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
App: [http://localhost:8000](http://localhost:8000)

---

## ⚙️ Configuration / 設定

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_MOCK_DB` | `True` for mock, `False` for Oracle | `True` |
| `ORACLE_USER` | Oracle DB Username | `user` |
| `ORACLE_PASSWORD` | Oracle DB Password | `password` |
| `ORACLE_DSN` | Oracle Connection String | `localhost:1521/xe` |

---

## 📁 Project Structure / プロジェクト構造
```
.
├── app/                        # FastAPI Application
│   ├── api/                    # REST API Endpoints
│   │   ├── yield_trend.py     #   Yield Trend API
│   │   ├── wafer_map.py       #   Wafer Map API
│   │   └── deps.py            #   Dependency Injection
│   ├── core/                   # Config & Settings
│   ├── models/                 # Pydantic Models
│   ├── services/               # Business Logic
│   │   ├── chart_generator.py #   Plotly Chart Generation (SSR)
│   │   ├── analytics.py       #   Statistics & Analytics
│   │   ├── mock_db.py         #   Mock Data Service
│   │   └── oracle_db.py       #   Oracle DB Service
│   └── views/                  # Page Routes (HTMX)
├── templates/                  # Jinja2 Templates
│   ├── base.html              #   Base Layout
│   ├── pages/                 #   Full Page Templates
│   │   ├── dashboard.html     #     Yield Dashboard
│   │   ├── wafermap.html      #     Wafer Map Viewer
│   │   └── settings.html      #     Settings Page
│   ├── partials/              #   HTMX Partial Templates
│   └── components/            #   Reusable Components
├── static/css/                 # Stylesheets
├── pyproject.toml
├── docker-compose.yml
└── Dockerfile
```

---

## 📡 API Endpoints

### Yield Trend API (`/api/v1/yield`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/trend/{product_id}` | GET | 歩留まりトレンドデータ取得 |

### Wafer Map API (`/api/v1/wafer`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/lots/{product_id}` | GET | ロット一覧取得 |
| `/map/{lot_id}/{wafer_id}` | GET | ウェーハマップ取得 |

### Settings API (`/api/v1/settings`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | GET | 製品一覧取得 |
| `/products/{product_id}` | POST | 製品アクティブ状態切り替え |
| `/targets` | GET | 歩留まり目標取得 |
| `/targets` | POST | 歩留まり目標設定 |
| `/targets/bulk` | POST | 一括目標設定 |

---

## 🔮 Future Enhancements / 将来の拡張可能性

### 📊 Analytics & Reporting
- [ ] **Advanced SPC**: Cp/Cpk計算、管理図（X-bar R, X-bar S）
- [ ] **Trend Analysis**: 歩留まり予測（機械学習モデル統合）
- [ ] **PDF/Excel Export**: レポート自動生成機能
- [ ] **Scheduled Reports**: 定時レポートメール配信

### 🗺️ Wafer Map Enhancement
- [ ] **Defect Pattern Recognition**: AIによる欠陥パターン分類
- [ ] **Stacked Wafer Map**: 複数ウェーハの重ね合わせ表示
- [ ] **Failure Mode Analysis**: Bin別の詳細分析画面
- [ ] **Compare Mode**: 複数ロット/ウェーハの比較機能

### 📱 Integration & Connectivity
- [ ] **Multi-DB Support**: MySQL, PostgreSQL, SAP対応
- [ ] **REST API認証**: JWT / OAuth2.0実装
- [ ] **Webhook**: 異常検知時の外部通知
- [ ] **Mobile App**: React Native / Flutterネイティブアプリ

### 🔧 System Improvements
- [ ] **User Authentication**: ログイン/ロール管理機能
- [ ] **Audit Log**: 操作履歴記録
- [ ] **Multi-tenant**: 複数工場/ファブ対応
- [ ] **Real-time Dashboard**: WebSocket接続によるライブ更新
- [ ] **Kubernetes Deployment**: スケーラブルなクラウドデプロイ

### 🧪 Testing & Quality
- [ ] **Unit Tests**: pytest実装
- [ ] **E2E Tests**: Playwright / Cypress
- [ ] **Performance Testing**: Locust負荷テスト
- [ ] **CI/CD**: GitHub Actions自動テスト/デプロイ

---

## 📝 License

This project is proprietary software.

---

## 👥 Contributors

- Development Team
