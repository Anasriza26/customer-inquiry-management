# Design Decisions

## Product scope

The Customer Inquiry Management System supports a complete inquiry workflow for staff and administrators.

Customers do not sign in. Their contact details are recorded with each inquiry.

The first version focuses on inquiry creation, search, filtering, status updates, authentication, authorization, and staff account management. Real-time updates, Zustand, and rate limiting are outside the initial scope.

## Roles and access

The application has two roles: `staff` and `admin`.

- Staff can create inquiries and view or update only inquiries they created.
- Admins can view and update all inquiries.
- Admins can create, edit, deactivate, and reactivate staff accounts.
- The staff-management API manages staff accounts; Admin account deactivation is not supported by the current API.

The backend API is the source of truth for authorization. Frontend route guards improve navigation and prevent protected page content from being rendered to unauthorized visitors, but they do not replace backend authorization.

Unauthenticated API requests return `401 Unauthorized`. Authenticated users who attempt an Admin-only operation receive `403 Forbidden`.

When a staff member requests an inquiry they do not own, the API returns `404 Not Found` so it does not reveal that another staff member's inquiry exists.

## Authentication and sessions

The application uses one sign-in page for both Staff and Admin users. After successful sign-in, the user is sent to the home dashboard, which displays navigation according to the user's role.

Passwords are stored as bcrypt hashes, never as plain text. The API does not return password hashes in responses. The initial Admin account is created by the backend seed script.

Authentication uses server-side sessions stored in PostgreSQL. The session middleware uses the `user_sessions` table and creates it when missing. Session cookies are HTTP-only, use `SameSite=Lax`, and are marked secure in production.

Protected API requests verify that the user still exists and is active. Deactivated accounts cannot sign in, and existing sessions for deactivated accounts are rejected on their next protected request.

Signing out destroys the server-side session. The frontend returns to the home dashboard and reloads it so the signed-out state is displayed.

## Frontend route protection

The frontend uses a reusable authentication guard for protected pages.

- Signed-out visitors to protected pages are redirected to `/login`.
- Users without the required role are redirected to the home dashboard.
- Admin-only pages require the `admin` role.
- Staff and Admin navigation links are shown according to the authenticated user's role.

These frontend checks are for user experience only. Sensitive data and operations remain protected by backend authorization.

## Inquiry data and database constraints

The `users` table stores account information, including a unique email address, password hash, role, active state, and creation/update timestamps.

The `inquiries` table stores customer name, contact details, subject, description, status, creator, and creation/update timestamps.

Inquiry records reference their creator through a foreign key with `ON DELETE RESTRICT`. Staff accounts are deactivated rather than deleted so inquiry ownership is preserved.

Database constraints restrict roles to `staff` and `admin`, and inquiry statuses to `New`, `In Progress`, and `Resolved`. Indexes support filtering by inquiry creator and status.

The `updated_at` column defaults to the current time when a row is created. Update operations must explicitly set `updated_at` to the current time, unless a database trigger is added.

## Inquiry status workflow

The allowed statuses are `New`, `In Progress`, and `Resolved`.

Supported transitions are:

- `New` to `In Progress`
- `In Progress` to `Resolved`
- `Resolved` to `In Progress` to reopen an inquiry

The API rejects unsupported transitions with `409 Conflict`.

Status updates include the status the user last saw. The API updates the inquiry only if its current status still matches the expected status. If another update has made the submitted data stale, the API returns `409 Conflict` and provides the latest status information when available.

## Customer input and duplicate inquiries

Customer name, contact details, subject, and description are required. Input is validated by the frontend to help users correct mistakes and by the backend as the authoritative validation layer.

If the same inquiry is submitted more than once, each submission is stored as a separate inquiry. The first version does not attempt automatic duplicate detection.

## Errors and interface states

The API uses appropriate responses for unauthenticated requests, forbidden actions, invalid input, unsupported status transitions, stale updates, and records that are not available to the current user.

The interface provides loading, empty, validation, success, and error states. Toast notifications are used for relevant feedback and automatically disappear after 2.5 seconds.

The interface is designed mobile-first and adapts to mobile and desktop screen sizes.

## Technology

The frontend uses Next.js, React, TypeScript, Tailwind CSS, and DaisyUI.

The backend is a separate Node.js and Express API. PostgreSQL stores application data and server-side sessions. Zod validates API input, and bcrypt hashes passwords.

Backend automated tests use Node.js's built-in test runner. Frontend component tests use Vitest, React Testing Library, and jsdom.
