# Customer Inquiry Management System

A full-stack web application for recording, tracking, and managing customer inquiries.

## Features

- Staff and Admin sign-in using session-based authentication.
- Staff can create inquiries and access only inquiries they created.
- Admins can view and update all inquiries.
- Admins can create, update, deactivate, and reactivate staff accounts.
- Search inquiries by customer name, contact details, or subject.
- Filter inquiries by status.
- Update inquiry status using the supported workflow.
- Responsive interface built for mobile and desktop screens.
- Protected pages and backend API authorization.
- Automated backend and frontend tests.

## Roles and access

- **Staff:** Create inquiries and view or update only their own inquiries.
- **Admin:** View and update all inquiries and manage staff accounts.
- **Customer:** Does not sign in. Customer details are recorded on an inquiry.

The frontend hides or redirects users from pages they are not allowed to open. The backend API enforces the actual authentication, role, and inquiry-ownership rules.

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
- `backend/seeds/` - Development seed data, if used.
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
2. Open that database in pgAdmin.
3. Open its Query Tool.
4. Run the migration SQL file:

   `backend/migrations/001_create_users_and_inquiries.sql`

The database user in the backend environment configuration must have permission to connect to the database and use the tables.

## Environment setup

Create local environment files from the example files:

- Copy `backend/.env.example` to `backend/.env`.
- Copy `frontend/.env.example` to `frontend/.env.local`.

Set the values in `backend/.env` for your local PostgreSQL connection, session secret, and initial Admin account. The frontend environment file should point to the backend API.

Example frontend value:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api