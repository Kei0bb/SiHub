# Semiconductor Analytics Platform (SONAR)

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

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- uv (Python package manager)

### Backend Setup
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

### Frontend Setup
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
```
