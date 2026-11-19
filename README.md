# Customer Inquiry Management System

A full-stack application for staff to record and track customer inquiries.

## Project structure

- `frontend/` — Next.js application using Tailwind CSS and DaisyUI.
- `backend/` — Node.js and Express API.
- `backend/migrations/` — PostgreSQL schema migration files.
- `backend/seeds/` — Development seed data.
- `docs/DECISIONS.md` — Design decisions and assumptions.

## Roles

- **Staff:** Create inquiries and view or update only inquiries they created.
- **Admin:** View and update all inquiries and manage staff accounts.
- **Customer:** Does not sign in; customer details are recorded on an inquiry.

Access rules are enforced by the backend API.

## Technology

- Next.js
- Node.js and Express
- PostgreSQL
- Tailwind CSS and DaisyUI

## Database

Create a PostgreSQL database named `customer_inquiry_db`.

The initial schema is in:

`backend/migrations/001_create_users_and_inquiries.sql`

## Environment setup

Use the example files as templates:

- `backend/.env.example`
- `frontend/.env.example`

Create local `.env` files from these examples and enter your own local settings. Do not commit `.env` files or real credentials.

## Run locally

Setup and run commands will be documented here after the frontend and backend applications are initialized.

## Tests

Test commands will be documented here after the test setup is added.
