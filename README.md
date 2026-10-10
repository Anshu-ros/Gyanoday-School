# Gyanoday School

A full-stack school website for grades 6 to 10, built with a FastAPI backend and a React + TypeScript frontend, backed by a relational SQLite database for local development.

## Project structure

- `backend/` – Python API, SQLAlchemy models, migrations, and admin logic
- `frontend/` – Node.js + TypeScript + React UI

## Features included

- Public home page with navigation to all school sections
- Courses page for classes 6 through 10
- Student inquiry form saved to the database
- Admission form saved to the database
- Teacher records stored in the database with editable data
- Admin login and protected dashboard for viewing and updating inquiry/admission status
- Server-side validation, rate limiting, and CSRF protection on public forms
- SQLite database support for local development with Alembic migration support

## Placeholder content

The project intentionally uses placeholder names, contact information, and teacher profiles so the school can replace them later without touching code logic.

## Run locally

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # or cp .env.example .env on Unix/macOS
python -m app.scripts.create_admin
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### 2) Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open the Vite URL shown in the terminal, usually http://127.0.0.1:5173.

## Admin account creation

The first admin account is created automatically when the backend starts if the admin user does not already exist. The default credentials are loaded from the backend `.env` file:

- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=change-me`

If you want to create or reset it manually, run:

```bash
cd backend
source .venv/bin/activate   # Windows: .venv\Scripts\activate
python -m app.scripts.create_admin
```

## Database and migration notes

This project uses SQLite for local development. The schema is defined in `backend/app/db/models.py` and migration scripts are in `backend/alembic/versions/`.

To run migrations manually:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

## API overview

- `GET /api/health` – health check
- `GET /api/teachers` – public list of teacher profiles
- `POST /api/inquiries` – student inquiry submission
- `POST /api/admissions` – admission application submission
- `POST /api/chat` – school-information chatbot grounded in `SCHOOL_INFORMATION.md`
- `POST /api/admin/login` – admin login
- `GET /api/admin/inquiries` – list all inquiries
- `GET /api/admin/admissions` – list all admissions
- `PATCH /api/admin/inquiries/{id}` – update inquiry status
- `PATCH /api/admin/admissions/{id}` – update admission status

## Notes

- The admin area is protected by JWT-based authentication.
- Public forms use basic rate limiting and CSRF headers to reduce abuse.
- The server validates all incoming form payloads to prevent malformed input.
