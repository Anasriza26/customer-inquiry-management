# Design Decisions

## Roles and access

The application has two roles: `staff` and `admin`. Customers do not sign in; their contact details are stored on each inquiry.

A staff member can create inquiries and can view or update only inquiries they created. An admin can view and update all inquiries and can create, edit, deactivate, and reactivate staff accounts.

These access rules are enforced by the backend API, not only by the frontend. When a staff member requests an inquiry they do not own, the API returns `404 Not Found` so it does not reveal that another staff member's inquiry exists. Admin-only staff-management endpoints return `403 Forbidden` to authenticated non-admin users.

## Authentication and staff accounts

The application uses a seeded admin account. Passwords are stored as bcrypt hashes, never as plain text. Admins can create staff accounts. The API does not return password hashes in its responses.

Staff accounts are deactivated instead of permanently deleted. A deactivated staff member cannot sign in. Protected API requests also verify that the account still exists and is active, so an existing session for a deactivated staff member is rejected on its next protected request.

The staff-management API only manages accounts with the `staff` role. Admin account deactivation is not supported by the current API.

## Inquiry status

The allowed statuses are `New`, `In Progress`, and `Resolved`. Supported transitions are:

- `New` to `In Progress`
- `In Progress` to `Resolved`
- `Resolved` to `In Progress` to reopen an inquiry

The API rejects unsupported transitions with a conflict response.

## Customer input and duplicate inquiries

Customer name, contact details, subject, and description are required. The backend validates all submitted inquiry data. The frontend will also validate form input to help users correct mistakes before submitting; backend validation remains authoritative.

If the same inquiry is submitted more than once, each submission is stored as a separate inquiry. This avoids complex duplicate-detection rules.

## Stale data and errors

The application does not use real-time updates. A status update must include the status the user last saw. The API updates the inquiry only if its current status still matches that expected status.

If the status has changed since the user loaded the inquiry, the API returns `409 Conflict` and includes the current status. The frontend should explain that the inquiry changed and ask the user to refresh before trying again.

The API also returns appropriate responses for unauthenticated requests, forbidden actions, invalid input, unsupported status transitions, and records that are not available to the user. The frontend is expected to provide clear loading, empty, validation, success, and error states.

## Technology and scope

The frontend uses Next.js, Tailwind CSS, and DaisyUI. Toast messages will be used for relevant success and error feedback.

A separate Node.js and Express API handles authentication, authorization, validation, and inquiry operations. PostgreSQL stores application data and login sessions.

Zustand and rate limiting are not included in the initial scope. The first version focuses on the complete inquiry workflow and staff administration.