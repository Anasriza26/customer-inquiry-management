# Design Decisions

## Roles and access

The application has two roles: `staff` and `admin`. Customers do not sign in; their contact details are stored on an inquiry.

A staff member can create inquiries and can view or update only inquiries they created. An admin can view and update all inquiries and can create, edit, and deactivate staff accounts. These rules are enforced by the backend API, not only by the frontend.

## Authentication and staff accounts

Passwords are stored as hashes, never as plain text. The application starts with a seeded admin account. Admins can create staff accounts. Deactivated staff cannot sign in.

Staff accounts are deactivated instead of permanently deleted. This preserves the relationship between a staff member and inquiries they created. The application prevents deactivating the last active admin account.

## Inquiry status

The allowed statuses are `New`, `In Progress`, and `Resolved`. Supported transitions are:

- `New` to `In Progress`
- `In Progress` to `Resolved`
- `Resolved` to `In Progress` to reopen an inquiry

The API rejects unsupported transitions.

## Customer input and duplicate inquiries

Customer name, contact details, subject, and description are required. Input is validated by both the frontend and backend. If the same inquiry is submitted more than once, each submission is stored as a separate inquiry. This avoids complex duplicate-detection rules.

## Stale data and errors

The application does not use real-time updates. If a user attempts to update an inquiry using stale data, the API returns a conflict response and the interface asks the user to refresh and try again.

The interface provides loading, empty, validation, success, and error states. The API returns appropriate errors for unauthenticated requests, forbidden access, invalid input, and records that do not exist.

## Technology and scope

The frontend uses Next.js, Tailwind CSS, and DaisyUI. A separate Node.js and Express API handles authentication, authorization, validation, and inquiry operations. PostgreSQL stores application data.

The first version focuses on the complete inquiry workflow and staff administration. Zustand and rate limiting are not included in the initial scope.
