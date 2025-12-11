# Backend API

This is the backend API for the Semiconductor Engineering Data Analysis Platform.

## Setup

1.  **Install dependencies**:
    This project uses `uv` for dependency management.
    ```bash
    uv sync
    ```

2.  **Run the application**:
    ```bash
    uv run uvicorn app.main:app --reload
    ```

## Oracle Database Connection Setup

The application supports connecting to an Oracle Database for retrieving yield and wafer map data.

### Environment Variables

To configure the connection, set the following environment variables in a `.env` file in the `backend` directory (or export them in your shell):

| Variable         | Description                                      | Default           |
| ---------------- | ------------------------------------------------ | ----------------- |
| `USE_MOCK_DB`    | Set to `False` to use the real Oracle DB.        | `True`            |
| `ORACLE_USER`    | Database username.                               | `user`            |
| `ORACLE_PASSWORD`| Database password.                               | `password`        |
| `ORACLE_DSN`     | Data Source Name (e.g., `localhost:1521/xe`).    | `localhost:1521/xe`|

### Example .env

Create a file named `.env` in the `backend/` directory:

```env
# Disable mock mode to connect to real DB
USE_MOCK_DB=False

# Oracle Connection Details
ORACLE_USER=my_db_user
ORACLE_PASSWORD=my_secure_password
ORACLE_DSN=db.example.com:1521/service_name
```

### Driver Information

The application uses `python-oracledb` in "Thin" mode by default. This means **Oracle Instant Client is NOT required** for standard connections, simplifying the setup.

If you encounter issues or need specific advanced features requiring "Thick" mode, please refer to the [python-oracledb documentation](https://python-oracledb.readthedocs.io/).
