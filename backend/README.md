# Darukaa.Earth Backend

This is the authentication backend for Darukaa.Earth, built with FastAPI and PostgreSQL.

## Setup Instructions

1. **Prerequisites**: Python 3.9+ and PostgreSQL must be installed.
2. **Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables**:
   Copy `.env.example` to `.env` and configure your database URL and JWT secret.
   ```bash
   cp .env.example .env
   ```
5. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

The API docs will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
