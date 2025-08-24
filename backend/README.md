# SIS Backend (Phase 0 + Phase A Chunks 1 & 2)

## What to run
```bash
python -m venv .venv && .\.venv\Scripts\activate
pip install -r requirements.txt

# start Postgres
docker compose up -d

# run migrations
python -m alembic upgrade head

# start API
python -m uvicorn app.main:app --reload
```

Health: http://localhost:8000/health
Docs:   http://localhost:8000/docs
