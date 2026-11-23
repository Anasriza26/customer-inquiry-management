# Customer Inquiry Management System

A full-stack web application for recording, tracking, and managing customer inquiries.

## Features

- Staff and Admin sign-in using server-side sessions.
- Role-aware home dashboard and navigation.
- Staff can create inquiries and access only inquiries they created.
- Staff can edit or delete only their own inquiries.
- Admins can view, edit, and delete all inquiries.
- Admins can create, edit, deactivate, and reactivate staff accounts.
- Search inquiries by customer name, contact details, or subject.
- Filter inquiries by status.
- Update inquiry status through the supported workflow.
- Confirm before permanently deleting an inquiry.
- Responsive, mobile-first interface.
- Protected frontend routes and backend API authorization.
- Backend and frontend automated tests.

## Roles and access

- **Staff:** Create inquiries and view, update, or delete only their own inquiries.
- **Admin:** View, update, or delete all inquiries and manage staff accounts.
- **Customer:** Does not sign in. Customer details are recorded on an inquiry.

Frontend route guards control navigation and prevent protected page content from being displayed to unauthorized visitors. The backend API enforces the actual authentication, role, and inquiry-ownership rules.

## Technology

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- DaisyUI
- Vitest
- React Testing Library
- jsdom

### Backend

- Node.js
- Express
- PostgreSQL
- `pg`
- `express-session`
- `connect-pg-simple`
- `bcrypt`
- Zod
- Node.js built-in test runner

## Project structure

- `frontend/` - Next.js application.
- `backend/` - Express API.
- `backend/migrations/` - PostgreSQL schema migration files.
- `backend/src/` - API, authentication, database, and application code.
- `backend/test/` - Backend automated tests.
- `frontend/test/` - Frontend automated tests.
- `docs/DECISIONS.md` - Design decisions and project assumptions.

## Prerequisites

Install the following before setting up the project:

- Node.js and npm.
- PostgreSQL.
- Git.

## Database setup

1. Create a PostgreSQL database named `customer_inquiry_db`.
2. Open the database in pgAdmin.
3. Open its Query Tool.
4. Run the migration file:

   `backend/migrations/001_create_users_and_inquiries.sql`

The PostgreSQL user configured for the backend must be able to connect to this database and use its tables.

The session store creates the `user_sessions` table when it is missing.

## Environment setup

Create local environment files from the example files:

- Copy `backend/.env.example` to `backend/.env`.
- Copy `frontend/.env.example` to `frontend/.env.local`.

Set your local database connection values, session secret, and initial Admin account values in `backend/.env`. Set the backend API URL in `frontend/.env.local`.

Example frontend configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

The backend environment file requires the following values:

- `NODE_ENV`
- `PORT`
- `FRONTEND_ORIGIN`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `SESSION_SECRET`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Use a strong, private session secret and Admin password. Do not commit `.env` or `.env.local` files, or share real credentials, session secrets, or cookies.

## Install dependencies

Install backend dependencies:

```cmd
cd backend
npm install
```

In a separate terminal, install frontend dependencies:

```cmd
cd frontend
npm install
```

## Create the initial Admin account

After configuring `backend/.env` and setting up the database, run:

```cmd
cd backend
npm run seed:admin
```

The seed script reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `backend/.env`.

Do not publish real Admin credentials in this repository. If an assessment reviewer needs a demo account, provide disposable test credentials through the assessment's private submission channel.

## Run locally

Start the backend API in one terminal:

```cmd
cd backend
npm run dev
```

Start the frontend in a second terminal:

```cmd
cd frontend
npm run dev
```

Open the application at:

`http://localhost:3000`

The backend API runs at:

`http://localhost:4000/api`

The API health endpoint is:

`http://localhost:4000/api/health`

## Inquiry status workflow

Supported statuses:

- `New`
- `In Progress`
- `Resolved`

Supported transitions:

- `New` to `In Progress`
- `In Progress` to `Resolved`
- `Resolved` to `In Progress` to reopen an inquiry

The API rejects unsupported transitions. It also detects stale status updates and returns `409 Conflict` when the inquiry's current status no longer matches the status supplied by the user.

## Inquiry editing and deletion

Staff can edit or delete only inquiries they created. Admins can edit or delete any inquiry.

Editing sends the full inquiry form to the backend. The backend validates all required fields and verifies the user's access to that inquiry.

Deleting an inquiry is permanent. The interface asks for confirmation before sending the delete request. The backend checks access before deleting the record.

## Tests and checks

Run backend automated tests:

```cmd
cd backend
npm test
```

Run frontend automated tests:

```cmd
cd frontend
npm test
```

Run the frontend lint check:

```cmd
cd frontend
npm run lint
```

Create a production build of the frontend:

```cmd
cd frontend
npm run build
```

Run each command from its indicated `backend` or `frontend` directory.

## Security notes

- Passwords are stored as bcrypt hashes, not plain text.
- Session cookies are HTTP-only.
- The backend enforces authentication, role authorization, and inquiry ownership.
- Staff accounts are deactivated instead of permanently deleted.
- Inquiry deletion is permanent.
- Keep `.env` and `.env.local` files out of version control.
- Never commit real passwords, session secrets, or session cookies.