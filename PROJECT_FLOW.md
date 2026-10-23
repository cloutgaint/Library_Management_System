# Library Management System — Complete Project Flow

## 1. Purpose of this document

This document explains how the Library Management System works from installation to daily use. It follows the actual source code and covers:

- application startup;
- frontend navigation;
- authentication and authorization;
- Admin, Librarian, and Member workflows;
- every major feature flow;
- API routes;
- PostgreSQL data changes;
- security controls;
- testing and deployment;
- modules that exist in the repository but are not currently connected to the running application.

The implementation is a React single-page application backed by an Express API and PostgreSQL.

---

## 2. System at a glance

```text
Browser
  |
  | React pages/components
  | Authorization: Bearer <JWT>
  v
Vite development proxy or production reverse proxy
  |
  | /api/* and /uploads/*
  v
Express application
  |
  | security headers -> JSON parser -> route -> authentication
  | -> role/branch checks -> controller -> model/service
  v
PostgreSQL
  |
  +-- users and memberships
  +-- catalogue and copies
  +-- borrowing, reservations, and fines
  +-- notifications, reviews, and requisitions
  +-- branches, transfers, settings, and audit history

External service used by the backend:
  - Google Books API for missing book-cover images
  - Gmail/Nodemailer for password, invitation, and reminder email
```

### Main technologies

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React 19, React Router, Vite, Tailwind, Recharts | Screens, navigation, forms, charts, and client session state |
| Backend | Node.js, Express 5 | REST API, validation, authorization, and business rules |
| Database | PostgreSQL through `pg` | Persistent records, transactions, constraints, and audit trails |
| Authentication | bcrypt and JWT | Password hashing and one-day bearer sessions |
| Email | Nodemailer | Reset links, staff invitations, and due-date email |
| Upload | Multer | Member profile images |
| PWA | Web manifest and service worker | Installable production frontend |

---

## 3. Repository structure and responsibility

```text
Library_Management_System/
├── backend/
│   ├── app.js                 Express middleware and mounted API routers
│   ├── server.js              Startup checks and HTTP listener
│   ├── config/db.js           PostgreSQL connection pool
│   ├── controllers/           Request validation and HTTP responses
│   ├── models/                SQL queries and transactional business logic
│   ├── routes/                Endpoint and role definitions
│   ├── middleware/            JWT, roles, branches, security, uploads
│   ├── services/              Email, account policy, reset/invite tokens
│   ├── database/              Base schema, migrations, and rollout notes
│   ├── scripts/               Database initialization, migration, admin bootstrap
│   └── tests/                 Structure, security, auth, and integration tests
├── frontend/
│   ├── src/main.jsx           React entry point and service-worker registration
│   ├── src/App.jsx            Active client-side routes
│   ├── src/auth/              Session provider, role paths, auth context
│   ├── src/lib/api.js         API URL, bearer header, JSON request helper
│   ├── src/pages/             Role and feature screens
│   ├── src/components/        Shared UI and feature components
│   └── public/                Manifest, service worker, icons
├── deploy/                    Nginx and systemd examples
└── PROJECT_FLOW.md            This document
```

### Backend call chain

For a normal request the code flows in this order:

1. `backend/server.js` starts the process.
2. `backend/app.js` receives the request.
3. Global CORS, security headers, and JSON parsing run.
4. Express selects a router in `backend/routes/`.
5. `authMiddleware` verifies the JWT and reloads the user from PostgreSQL.
6. `roleMiddleware` and, when applicable, `branchAccessMiddleware` authorize the operation.
7. A controller validates request data and chooses an HTTP response.
8. A model performs SQL reads or writes.
9. Multi-record operations use `BEGIN`, `COMMIT`, and `ROLLBACK`.
10. The controller sends JSON to the frontend.
11. React updates the relevant screen or displays the returned error.

---

## 4. Installation and first startup flow

### 4.1 Prerequisites

1. Install Node.js and npm.
2. Install PostgreSQL.
3. Create a PostgreSQL database and a database user with permission to use it.
4. Keep backend secrets outside version control.

### 4.2 Backend environment

Create `backend/.env` with values appropriate for the environment:

```dotenv
DB_USER=your_database_user
DB_HOST=localhost
DB_NAME=library_management
DB_PASSWORD=your_database_password
DB_PORT=5432

JWT_SECRET=use_a_long_random_value_of_at_least_32_characters
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

RESET_URL_BASE=http://localhost:5173/reset-password
EMAIL_USER=your_email_account
EMAIL_PASSWORD=your_email_app_password
AUTH_RATE_LIMIT_MAX=30

# Enable only after Phase 7 inventory reconciliation has been verified.
LMS_PHASE7_INVENTORY_ENABLED=false
```

For email integration tests, `EMAIL_TRANSPORT=memory` stores messages in the test outbox instead of sending them.

### 4.3 Install packages

1. Open a terminal in `backend/`.
2. Run `npm install`.
3. Open a second terminal in `frontend/`.
4. Run `npm install`.

### 4.4 Create the database schema

For a new database:

1. From `backend/`, run `npm run db:init`.
2. The script reads `backend/database/schema.sql`.
3. PostgreSQL creates the base users, books, members, loans, reservations, fines, notifications, e-books, reviews, reset tokens, branches, assignments, and audit tables.
4. Apply required additive migrations with the migration runner, after reviewing the matching rollout/preflight notes.
5. Apply migrations in feature order: Phase 2 catalogue, Phase 3 member foundation, Phase 4 circulation, Phase 5 reservations/notifications, Phase 6 reviews/requisitions, Phase 7 multi-branch inventory, Phase 8 settings, Phase 9 password reset, and Phase 10 auth/roles.
6. Run one migration with `npm run db:migrate -- database/migrations/<migration-file>.sql`.
7. For an existing/live database, take a backup and run the supplied preflight SQL before migrations. Do not assume its schema matches a new installation.

The migrations are additive and mostly idempotent, but the repository rollout notes explicitly require schema inspection, backup, and staging verification.

### 4.5 Create the primary Admin

1. Run `npm run admin:bootstrap -- --email admin@example.org --name "Library Admin"` from `backend/`.
2. Enter the password at the hidden prompt. For non-interactive provisioning, set `ADMIN_BOOTSTRAP_PASSWORD` temporarily in the process environment.
3. The script verifies that the single-admin database constraint exists.
4. It refuses to continue if an Admin already exists or the email belongs to another user.
5. It validates the password, hashes it with bcrypt, and starts a database transaction.
6. It inserts the Admin user.
7. It records `admin_bootstrapped` in `user_account_audit`.
8. It commits the transaction.

Only one primary Admin is permitted by the partial unique index `users_single_admin_uq`.

### 4.6 Start development services

1. From `backend/`, run `npm run dev`.
2. The backend checks `JWT_SECRET`.
3. It checks for the Phase 9/10 schema objects required by authentication.
4. It connects to PostgreSQL.
5. It listens on port `5000` unless `PORT` overrides it.
6. From `frontend/`, run `npm run dev`.
7. Vite starts on its development port, normally `5173`.
8. Vite proxies `/api` and `/uploads` to `VITE_DEV_BACKEND_URL`, defaulting to `http://localhost:5000`.
9. Open the frontend URL and use the login page.

---

## 5. Application startup and request lifecycle

### 5.1 Backend startup

1. `server.js` loads environment variables.
2. It imports the Express application and PostgreSQL pool.
3. It refuses startup if `JWT_SECRET` is absent.
4. It warns if `JWT_SECRET` is shorter than 32 characters.
5. It checks required auth tables, columns, and indexes.
6. If anything is missing, it prints the missing objects and exits.
7. Otherwise, it starts the Express listener.

### 5.2 Global Express processing

Every request passes through the following active middleware in `app.js`:

1. CORS accepts a request only if its origin is absent or listed in `CORS_ORIGINS`.
2. Security headers set `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`.
3. JSON request bodies are limited to 1 MB.
4. `/uploads` serves stored profile images.
5. The matching `/api/...` router processes the request.

### 5.3 Frontend startup

1. `main.jsx` mounts React into the `root` element.
2. `BrowserRouter` enables client-side navigation.
3. `AuthProvider` loads any token from `localStorage`.
4. If a token exists, the provider calls `GET /api/auth/me`.
5. The backend verifies that token and returns the current database user.
6. Until verification finishes, protected screens show “Checking your session…”.
7. If verification succeeds, the user and role become the trusted frontend session.
8. If verification returns `401`, the provider clears local storage and redirects to login.
9. In production, the browser registers `/sw.js` after the window loads.

### 5.4 Normal authenticated API request

1. A screen calls `apiRequest` or `fetch`.
2. The frontend reads `token` from `localStorage`.
3. It sends `Authorization: Bearer <token>`.
4. `authMiddleware` checks the header format.
5. It verifies the JWT signature with HS256 and `JWT_SECRET`.
6. It reloads the user from PostgreSQL instead of trusting role data stored in the browser.
7. It rejects missing, inactive, expired, deleted, or version-revoked sessions with `401`.
8. It places the current user on `req.user`.
9. Role and branch middleware apply endpoint-specific access rules.
10. The controller/model performs the operation.
11. Any authenticated frontend request that receives `401` automatically ends the session application-wide.
12. Removing the token in another browser tab also logs this tab out through the `storage` event.

---

## 6. Authentication and account flows

### 6.1 Member self-registration

1. The visitor opens `/register`.
2. The form validates name, email, password, confirmation, and acceptance of terms.
3. Passwords must be 10–128 characters and contain at least one letter and one number.
4. The frontend sends `POST /api/auth/register` without a role.
5. The auth rate limiter counts the request by IP in a 15-minute window.
6. The backend rejects any attempt to self-register as Admin or Librarian.
7. It normalizes the email to lowercase and validates all fields again.
8. It checks for an existing email.
9. It hashes the password with bcrypt using 12 rounds.
10. A transaction inserts a `users` row with role `member`.
11. The same transaction inserts a `members` row with one-year expiry.
12. The transaction commits and the user returns to login.

### 6.2 Login

1. The user opens `/` and enters email and password.
2. The frontend sends `POST /api/auth/login`.
3. The backend normalizes the email and finds the database user.
4. bcrypt compares the submitted password to the stored hash. Unknown email uses a dummy hash comparison to reduce account-enumeration timing leakage.
5. A bad credential pair returns the same generic error.
6. A correct password for an inactive account returns a deactivation message.
7. A valid active account receives a one-day HS256 JWT containing user ID, role, and session version.
8. The frontend stores the token and public user in `localStorage`.
9. The user is redirected by database role:
   - Admin → `/admin`
   - Librarian → `/librarian`
   - Member → `/student`

### 6.3 Session verification and role protection

1. Every page refresh calls `GET /api/auth/me` when a stored token exists.
2. The backend checks the current user, activation state, role, and `session_version`.
3. Librarian responses also include assigned branches.
4. `ProtectedRoute` blocks anonymous visitors.
5. It redirects a user away from a route not allowed for that role.
6. This frontend guard improves navigation only; backend middleware is the actual security boundary.

### 6.4 Forgot and reset password

1. The visitor opens `/forgot-password` and submits an email.
2. The frontend sends `POST /api/auth/forgot-password`.
3. The backend requires `RESET_URL_BASE` to be configured.
4. The response is deliberately the same whether or not an account exists.
5. For an active matching account, earlier outstanding links are revoked.
6. A random 32-byte token is generated.
7. Only its SHA-256 hash is stored in `password_reset_tokens`.
8. The reset token expires after 30 minutes.
9. The raw token is placed after `#token=` in the emailed URL so it is not sent in ordinary HTTP request paths or access logs.
10. The recipient opens `/reset-password#token=...`.
11. The frontend submits the token and new password to `POST /api/auth/reset-password`.
12. PostgreSQL locks the matching valid token row in a transaction.
13. The backend hashes and stores the new password.
14. It increments `session_version`, invalidating all older JWTs.
15. It marks every unused token for that user as used.
16. It commits, removes the token fragment from browser history, and sends the user to login.

### 6.5 Logout

1. The user selects logout.
2. The frontend deletes `token` and `user` from `localStorage`.
3. It resets the Auth context.
4. It redirects to `/`.
5. Other tabs detect the storage change and log out as well.

---

## 7. Role-based user journeys

### 7.1 Admin journey

1. Log in and land on `/admin`.
2. Dashboard requests books, all borrow transactions, and the Admin’s notifications.
3. Open the catalogue to add, edit, or delete books.
4. Open User Management to:
   - list and search Librarians;
   - create a branch;
   - create a Librarian account;
   - assign branches;
   - edit Librarian details;
   - activate or deactivate a Librarian;
   - resend a password/invitation link.
5. Use staff circulation pages to issue, return, or renew books.
6. Manage the reservation queue and mark the FIFO head ready.
7. Calculate, create, and mark fines paid.
8. Review requisitions and move them through allowed statuses.
9. View analytics, charts, reports, e-books, and notifications.
10. Use Admin-only API operations for member deletion, membership expiry processing, and branch management where the relevant UI is connected.

### 7.2 Librarian journey

1. Log in and land on `/librarian`.
2. The dashboard loads the role overview plus operational counts.
3. View and maintain the catalogue.
4. View members and their borrowing activity.
5. Issue, return, and renew books.
6. Manage reservations, fines, notifications, requisitions, reports, reviews, and e-books.
7. For branch-aware endpoints, operate only on assigned branches.
8. Librarians cannot create Admins, manage Librarian accounts, or perform Admin-only branch changes.

### 7.3 Member journey

1. Self-register or receive a staff-created member account.
2. Log in and land on `/student`.
3. Browse `/books` and inspect book details and approved reviews.
4. Reserve a book, cancel an owned active reservation, or inspect queue status.
5. Create one review per book; edit or delete only the Member’s own review.
6. View issued books and full reading history.
7. View and update profile details and upload a profile image.
8. View personalized recommendations.
9. Submit a book-purchase requisition and track its progress.
10. View fine status and notifications.
11. Browse e-books.

---

## 8. Feature flows in detail

### 8.1 Book catalogue

#### Read/search/filter

1. Any authenticated role opens `/books`.
2. The page calls `GET /api/books`.
3. The model selects books ordered by ID.
4. For a record with an ISBN but no image, the backend queries Google Books.
5. If a cover is found, the backend stores the HTTPS image URL in `books.image`.
6. Search uses `GET /api/books/search?query=...` across title, author, and ISBN.
7. Filter uses `GET /api/books/filter?category=...&status=...`.
8. Pagination uses `GET /api/books/pagination?page=...&limit=...`.

#### Add/edit/delete

1. Admin or Librarian opens the catalogue management controls.
2. Add sends `POST /api/books`; edit sends `PUT /api/books/:id`.
3. The controller validates required data and ensures copy counts are non-negative and available copies do not exceed total copies.
4. The model inserts or updates `books`.
5. Delete sends `DELETE /api/books/:id` and removes the row if foreign-key rules allow it.

### 8.2 Member profile and membership

1. `GET /api/members/profile` resolves the logged-in user to their member record.
2. `PUT /api/members/profile` updates `users.full_name` and member phone/address in one transaction.
3. Profile image upload sends multipart data to `PUT /api/members/profile/image`.
4. Multer accepts JPG, JPEG, PNG, or WEBP up to 5 MB and stores it in `backend/uploads/` using a generated filename.
5. The stored path is returned through the profile endpoint and served by `/uploads`.
6. Staff can list and update members.
7. Admin can create or delete member records and run the membership-expiry check.
8. Staff can suspend a membership only with a reason; every status change is added to `membership_status_history`.
9. An expired membership cannot be reactivated until the expiry is renewed.

### 8.3 Issue a book

1. Admin or Librarian opens `/issue-book`.
2. The page loads available books and members.
3. Staff selects a Member, a book, and a due date.
4. The frontend sends `POST /api/borrow-transactions/issue`.
5. The backend begins a transaction and locks the book row.
6. It verifies that the book exists and `available_copies > 0`.
7. It inserts an `Issued` row in `borrow_transactions`.
8. It decrements `books.available_copies`.
9. If no copies remain, it changes the aggregate book status to `Issued`; otherwise it remains `Available`.
10. It commits the database transaction.
11. The controller creates an in-app “Book Issued” notification for the Member.
12. The updated transaction appears in staff and Member history views.

### 8.4 Return a book

1. Staff opens `/return-book` and loads all circulation transactions.
2. Staff chooses an issued transaction.
3. The frontend sends `POST /api/borrow-transactions/return` with `transactionId`.
4. PostgreSQL locks the transaction row.
5. The backend rejects an unknown or already-returned transaction.
6. It writes today to `return_date` and changes status to `Returned`.
7. It increments the book’s available copy count and sets its status to `Available`.
8. It commits the transaction.
9. The controller creates an in-app “Book Returned” notification.
10. Fine creation is a separate staff action; return does not automatically insert a fine.

### 8.5 Renew a book

1. Staff opens `/renew-book` and selects an active transaction and later due date.
2. The frontend sends `PUT /api/borrow-transactions/renew`.
3. The database updates only if the loan is still issued.
4. The new date must be later than both the current date and existing due date.
5. `renewal_count` must be below `circulation_policy.max_renewals`.
6. No other Member may have a Waiting or Ready reservation for that book.
7. On success, `renewal_count` increments and the due date changes.
8. The Member receives an in-app “Book Renewed” notification.

### 8.6 Reservation queue

#### Create reservation

1. A Member selects Reserve from the catalogue or reservations page.
2. The frontend sends `POST /api/reservations` with a book ID.
3. The controller resolves the logged-in user to its `members.id`; clients cannot reserve for another Member.
4. A transaction verifies Member and book records.
5. It rejects a duplicate active reservation for the same Member/book.
6. It calculates `MAX(queue_position) + 1` for the book.
7. It inserts a Waiting reservation and commits.

#### Mark ready

1. Staff opens `/reservation-queue` and chooses the first Waiting reservation.
2. The frontend sends `PUT /api/reservations/:id/ready`.
3. PostgreSQL locks the related book.
4. At least one available copy must exist.
5. Existing Ready holds cannot already consume all available copies.
6. The selected reservation must be the FIFO head by reservation date and ID.
7. Status changes to `Ready`; `ready_at` is recorded and expiry is set to two days later.
8. Remaining Waiting queue positions move up.

#### Cancel/expire

1. A Member may cancel only their own reservation; staff may cancel any active one.
2. `DELETE /api/reservations/:id` sets status to `Cancelled` and closes gaps in a Waiting queue.
3. Staff may call `PUT /api/reservations/auto-cancel`.
4. Every Ready reservation past `expires_at` becomes Cancelled.
5. This cleanup is endpoint-triggered; the repository does not schedule it automatically.

### 8.7 Fines

1. Staff calls `GET /api/fines/calculate/:transactionId`.
2. The model calculates overdue days as the positive difference between due date and return date, or today for an active loan.
3. It reads `circulation_policy.fine_per_day`, defaulting to 5.00 if no policy row exists.
4. Staff calls `POST /api/fines/:transactionId` to insert or refresh the unpaid fine.
5. A paid fine is not recalculated.
6. Staff views all fines; a Member views only their fines through `GET /api/fines/my-fines`.
7. `PUT /api/fines/:id/pay` marks an unpaid fine Paid and records `payment_date`.
8. The model contains ownership checks for Member payments, although the current frontend route only labels the fine-status experience.

### 8.8 Notifications and reminders

1. A logged-in user calls `GET /api/notifications` and receives only their notifications.
2. Mark read sends `PUT /api/notifications/:id/read`; ownership is enforced in SQL.
3. Staff may create a direct notification with `POST /api/notifications`.
4. `POST /api/notifications/due-reminders` finds issued books due in exactly three days, creates in-app notifications, and sends reminder email where an address is present.
5. `POST /api/notifications/overdue` creates in-app notifications for all currently overdue issued books.
6. `POST /api/notifications/low-stock` notifies Admins and Librarians for books with exactly one available copy.
7. These three generator endpoints must be called manually or by an external scheduler; no cron process is included.
8. Repeated calls may create repeated messages because the current model does not apply `dedupe_key` when inserting these notifications.

### 8.9 Reviews and ratings

1. Any authenticated user may list approved reviews and rating summary for a book.
2. A Member sends a 1–5 rating and optional text to `POST /api/reviews`.
3. The database unique constraint permits one review per user per book.
4. The list marks whether the reviewer has a matching borrowing history.
5. A Member may update or delete only their own review.
6. Staff may set moderation status to Pending, Approved, or Rejected.
7. Only Approved reviews contribute to displayed review lists and rating summaries.

### 8.10 Recommendations

1. A logged-in user calls `GET /api/recommendations`.
2. The primary query finds categories the user previously borrowed.
3. It selects available books in those categories that the user has not borrowed.
4. Results are ordered by availability and recency, limited to 20.
5. If there is no personalized result, the fallback returns available books ranked by average stored rating, review count, and recency. The current fallback query does not filter ratings by moderation status.

### 8.11 Book requisitions

1. A Member opens `/my-requisitions` and submits title, author, optional ISBN, and reason.
2. `POST /api/requisitions` resolves the Member profile.
3. It rejects another active request with the same title or ISBN.
4. It inserts a Pending requisition and a `book_requisition_history` entry in one transaction.
5. The Member tracks their own list through `GET /api/requisitions/mine`.
6. Staff loads all requests through `GET /api/requisitions`.
7. Staff changes status using `PATCH /api/requisitions/:id/status`.
8. Allowed transitions are:
   - Pending → Approved or Rejected
   - Approved → Ordered or Rejected
   - Ordered → Acquired
   - Rejected and Acquired → terminal
9. Each transition records reviewer, note, timestamps, and immutable history.

### 8.12 Librarian and branch administration

1. Admin opens `/admin/users`.
2. The page loads active branches and Librarians.
3. Creating a Librarian inserts a fixed-role Librarian with an unusable random password.
4. Selected active branches are validated and written to `librarian_branch_assignments` in the same transaction.
5. The action is written to `user_account_audit`.
6. An invitation token valid for 72 hours is emailed so the Librarian can choose a password.
7. Admin may edit name/email, replace branch assignments, and activate/deactivate the account.
8. Deactivation increments `session_version`, immediately revoking existing sessions, and invalidates outstanding password/invitation tokens.
9. Admin may resend a password link only for an active Librarian.
10. `GET /api/branches` returns every branch to Admin but only assigned branches to a Librarian.

### 8.13 E-books

1. Any authenticated user opens `/ebooks` and calls `GET /api/ebooks`.
2. A selected item may be retrieved by ID.
3. Admin or Librarian adds an e-book linked to a catalogue book with title, author, and file URL.
4. Admin or Librarian may delete it.
5. Files themselves are referenced by URL; this module does not upload e-book files.

### 8.14 QR codes

1. An authenticated client sends data to `POST /api/qr/generate`.
2. The backend validates that data is present.
3. The `qrcode` package converts it into a QR data URL.
4. The frontend can display or scan that code as part of circulation support.

### 8.15 Analytics and reports

1. Staff analytics pages load books, members, transactions, and fines.
2. The frontend aggregates returned data for dashboard cards and Recharts visualizations.
3. `GET /api/dashboard/statistics` provides backend-calculated staff statistics.
4. `GET /api/dashboard-overview` provides role-specific overview data.
5. `GET /api/reports/borrowing` supports validated status, date range, and pagination filters.
6. `GET /api/reports/summary` provides report summary figures.
7. Report endpoints are restricted to Admin and Librarian.

### 8.16 Multi-branch inventory (implemented but not currently reachable)

The following logic exists in source files and Phase 7 migrations, but the current `backend/app.js` does not mount `inventoryRoutes`, `periodicalRoutes`, or `copyConditionRoutes`. The current `frontend/src/App.jsx` also does not route to the inventory pages. Requests will therefore return 404 until both entry points are wired.

Intended inventory flow:

1. List branches and physical copies.
2. Add a uniquely barcoded copy to a branch.
3. Verify Admin access or the Librarian’s assigned branch.
4. Require `LMS_PHASE7_INVENTORY_ENABLED=true` for copy/transfer/condition writes.
5. Increment aggregate book copy counts when a copy is added.
6. Request a transfer only for an Available copy in Good or Worn condition.
7. Follow transfer states: Requested → Approved → Dispatched → Received, with Rejected/Cancelled alternatives.
8. On dispatch, mark the copy InTransit and reduce aggregate availability.
9. On receipt, change branch, mark Available, restore aggregate availability, and write movement/event audit rows.
10. Track periodical subscriptions and expected/received/missing issues.
11. Record copy-condition history such as Good, Worn, Damaged, Lost, or Repair.

### 8.17 Library settings (implemented but not currently reachable in the frontend)

`settingsRoutes` is mounted at `/api/settings`, but `LibrarySettings.jsx` has no active route in `App.jsx`.

1. Admin or Librarian can read settings.
2. Only Admin can patch settings.
3. Values must be known integer settings between 0 and 3650.
4. Updates are written to `library_settings` and audited in `library_settings_audit`.

---

## 9. Active frontend route map

| Browser path | Screen | Allowed role |
|---|---|---|
| `/` | Login | Public |
| `/register` | Member registration | Public |
| `/forgot-password` | Password recovery request | Public |
| `/reset-password` | Reset/invitation password choice | Public with valid token |
| `/admin` | Admin dashboard | Admin |
| `/admin/users` | Librarian and branch management | Admin |
| `/librarian` | Librarian dashboard | Librarian |
| `/student` | Student/Member dashboard | Member |
| `/member-dashboard` | Alternate Member dashboard | Member |
| `/books` | Catalogue | Any authenticated role |
| `/ebooks` | E-books | Any authenticated role |
| `/notifications` | Notification center | Any authenticated role |
| `/profile` | Member profile | Member |
| `/reading-history` | Borrowing history | Member |
| `/my-issued-books` | Current loans | Member |
| `/reservations` | Member reservations | Member |
| `/my-requisitions` | Member requisitions | Member |
| `/recommendations` | Recommendations | Member |
| `/fine-payment-status` | Fine status | Any authenticated role in current guard |
| `/issue-book` | Issue workflow | Admin, Librarian |
| `/return-book` | Return workflow | Admin, Librarian |
| `/renew-book` | Renewal workflow | Admin, Librarian |
| `/qr-scanner` | QR scanning | Admin, Librarian |
| `/reservation-queue` | Reservation operations | Admin, Librarian |
| `/fines` | Fine management | Admin, Librarian |
| `/analytics` | Analytics dashboard | Admin, Librarian |
| `/reports` | Reports | Admin, Librarian |
| `/charts` | Charts | Admin, Librarian |
| `/requisition-management` | Requisition review | Admin, Librarian |
| any other path | Redirect to login | — |

Pages present but not routed: `LibrarySettings`, `BranchInventory`, `TransferManagement`, `Periodicals`, and `CopyConditions`.

---

## 10. Active backend API catalogue

All endpoints below are currently mounted by `backend/app.js`. “Authenticated” means any valid active account unless a narrower role is shown.

### Authentication — `/api/auth`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/register` | Public, rate limited | Create Member user and membership |
| POST | `/login` | Public, rate limited | Verify credentials and issue JWT |
| POST | `/forgot-password` | Public, rate limited | Email reset link without account disclosure |
| POST | `/reset-password` | Public, rate limited | Consume reset/invite token and set password |
| GET | `/me` | Authenticated | Return current server-verified user |
| GET | `/test` | Authenticated | Authentication diagnostic |
| GET | `/admin-test` | Admin | Admin authorization diagnostic |

### Books — `/api/books`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Authenticated | List books |
| GET | `/search` | Authenticated | Search by title, author, or ISBN |
| GET | `/filter` | Authenticated | Filter by category/status |
| GET | `/pagination` | Authenticated | Paginated book list |
| GET | `/:id` | Authenticated | Get one book |
| POST | `/` | Admin, Librarian | Add book |
| PUT | `/:id` | Admin, Librarian | Replace editable book data |
| DELETE | `/:id` | Admin, Librarian | Delete book |

### Members — `/api/members`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Admin, Librarian | List members |
| GET | `/profile` | Authenticated | Get own member profile |
| PUT | `/profile` | Authenticated | Update own profile |
| PUT | `/profile/image` | Authenticated | Upload own profile image |
| GET | `/check-expiry` | Admin | Mark expired memberships |
| GET | `/:id` | Admin, Librarian | Get member |
| POST | `/` | Admin | Add member record for an existing Member user |
| PUT | `/:id` | Admin, Librarian | Update membership details |
| PATCH | `/:id/status` | Admin, Librarian | Suspend/reactivate membership with audit |
| DELETE | `/:id` | Admin | Delete member record |

### Circulation — `/api/borrow-transactions`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/my-history` | Member | Own borrowing history |
| GET | `/member/:memberId` | Admin, Librarian | One Member’s history |
| GET | `/` | Admin, Librarian | All transactions |
| POST | `/issue` | Admin, Librarian | Issue book |
| POST | `/return` | Admin, Librarian | Return book |
| PUT | `/renew` | Admin, Librarian | Renew loan |

### Reservations — `/api/reservations`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Admin, Librarian | List reservation queue |
| GET | `/my-reservations` | Member | Own reservations |
| PUT | `/auto-cancel` | Admin, Librarian | Cancel expired Ready holds |
| GET | `/:id` | Admin, Librarian | Reservation details |
| POST | `/` | Member | Join queue |
| DELETE | `/:id` | Authenticated, ownership enforced for Member | Cancel reservation |
| PUT | `/:id/ready` | Admin, Librarian | Mark FIFO head ready |

### Fines — `/api/fines`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Admin, Librarian | List all fines |
| GET | `/my-fines` | Authenticated | List requesting user’s fines |
| GET | `/calculate/:transactionId` | Admin, Librarian | Calculate overdue amount |
| POST | `/:transactionId` | Admin, Librarian | Create/update fine |
| GET | `/:id` | Admin, Librarian | Fine details |
| PUT | `/:id/pay` | Authenticated | Mark paid; model enforces Member ownership |

### Notifications — `/api/notifications`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Authenticated | Own notifications |
| POST | `/` | Admin, Librarian | Create notification |
| PUT | `/:id/read` | Authenticated, owner only | Mark read |
| POST | `/due-reminders` | Admin, Librarian | Generate due reminders and email |
| POST | `/overdue` | Admin, Librarian | Generate overdue notifications |
| POST | `/low-stock` | Admin, Librarian | Generate staff low-stock notifications |

### QR — `/api/qr`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/generate` | Authenticated | Generate QR data URL |

### E-books — `/api/ebooks`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Authenticated | List e-books |
| GET | `/:id` | Authenticated | E-book details |
| POST | `/` | Admin, Librarian | Add e-book link |
| DELETE | `/:id` | Admin, Librarian | Delete e-book record |

### Reviews — `/api/reviews`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/book/:bookId` | Authenticated | Approved book reviews |
| GET | `/book/:bookId/rating` | Authenticated | Rating summary |
| POST | `/` | Member | Add review |
| PUT | `/:id` | Member, owner only | Edit review |
| DELETE | `/:id` | Member, owner only | Delete review |
| PATCH | `/:id/moderation` | Admin, Librarian | Moderate review |

### Recommendations — `/api/recommendations`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Authenticated | Personalized or popular recommendations |

### Requisitions — `/api/requisitions`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/` | Member | Submit requisition |
| GET | `/mine` | Member | Own requisitions |
| GET | `/` | Admin, Librarian | All requisitions |
| PATCH | `/:id/status` | Admin, Librarian | Validated status transition |

### Dashboards and reports

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/dashboard/statistics` | Admin, Librarian | Staff statistics |
| GET | `/api/dashboard-overview` | Admin, Librarian, Member | Role-specific overview |
| GET | `/api/reports/borrowing` | Admin, Librarian | Filtered/paginated circulation report |
| GET | `/api/reports/summary` | Admin, Librarian | Summary report |

### Settings — `/api/settings`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Admin, Librarian | Read effective settings |
| PATCH | `/` | Admin | Update and audit settings |

### Users and branches

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/users/librarians` | Admin | List/search Librarians |
| POST | `/api/users/librarians` | Admin | Create Librarian and invitation |
| GET | `/api/users/librarians/:id` | Admin | Librarian details |
| PATCH | `/api/users/librarians/:id` | Admin | Edit details |
| PATCH | `/api/users/librarians/:id/status` | Admin | Activate/deactivate |
| PUT | `/api/users/librarians/:id/branches` | Admin | Replace branch assignments |
| POST | `/api/users/librarians/:id/password-link` | Admin | Send new invite/reset link |
| POST | `/api/users/members` | Admin, Librarian | Create Member account on their behalf |
| GET | `/api/branches` | Admin, Librarian | List visible branches |
| GET | `/api/branches/:branchId` | Admin or assigned Librarian | Branch details |
| POST | `/api/branches` | Admin | Create branch |
| PATCH | `/api/branches/:branchId` | Admin | Update/deactivate branch |

### Router files that are not mounted

These paths describe the intended router prefixes but currently return 404 because `app.js` does not attach them:

| Intended prefix | Router | Features |
|---|---|---|
| `/api/inventory` | `inventoryRoutes.js` | Branch/copy listing, copy creation, transfers |
| `/api/periodicals` | `periodicalRoutes.js` | Subscriptions and issue receipt/status |
| `/api/copy-conditions` | `copyConditionRoutes.js` | Copy condition history and updates |

---

## 11. Database data flow

### 11.1 Core entity relationships

```text
users
  ├── 1:0..1 members
  │           ├── many borrow_transactions ── many-to-one books
  │           ├── many reservations ───────── many-to-one books
  │           ├── many fines ──────────────── one-to-one borrow_transaction
  │           └── many book_requisitions
  ├── many notifications
  ├── many reviews ────────────────────────── many-to-one books
  ├── many password_reset_tokens
  ├── many librarian_branch_assignments ───── many-to-one library_branches
  └── user_account_audit

books
  ├── many ebooks
  ├── many book_copies ────────────────────── many-to-one library_branches
  └── many reviews/reservations/loans

book_copies
  ├── many inventory_movements
  ├── many copy_condition_events
  └── many branch_transfers ───────────────── branch_transfer_events
```

### 11.2 Table groups

| Area | Tables | What they store |
|---|---|---|
| Identity | `users`, `members`, `password_reset_tokens` | Login accounts, Member profiles, reset/invite tokens |
| Authorization | `library_branches`, `librarian_branch_assignments` | Branches and Librarian scope |
| Audit | `user_account_audit`, `membership_status_history` | Account and membership actions |
| Catalogue | `books`, `book_categories`, `ebooks` | Physical titles, categories, digital links |
| Circulation | `borrow_transactions`, `circulation_policy` | Loans, dates, renewal limits, fine rate |
| Reservations | `reservations` | FIFO queue and pickup windows |
| Fines | `fines`, `fine_payment_audit` | Fine balance/status and payment evidence |
| Communication | `notifications`, `notification_deliveries`, `member_communication_preferences` | In-app messages and delivery preferences/history |
| Community | `reviews` | Ratings, review text, moderation |
| Acquisition | `book_requisitions`, `book_requisition_history` | Member requests and decisions |
| Inventory | `book_copies`, `inventory_movements`, `copy_condition_events` | Copy-level location, status, and condition |
| Transfers | `branch_transfers`, `branch_transfer_events` | Inter-branch movement workflow |
| Periodicals | `periodical_subscriptions`, `periodical_issues` | Serial subscriptions and received issues |
| Configuration | `library_settings`, `library_settings_audit` | Operational settings and changes |

### 11.3 Transaction boundaries

Atomic database transactions protect operations that must not be partially applied:

- creating a Member user plus member profile;
- creating a Librarian plus assignments and audit record;
- updating a Member profile across `users` and `members`;
- changing membership status and inserting history;
- issuing or returning a book plus aggregate copy counts;
- creating/cancelling/readying a reservation and queue positions;
- resetting a password and consuming tokens;
- creating/updating a requisition plus history;
- adding a physical copy plus aggregate counts;
- requesting and transitioning a branch transfer.

If any SQL step fails, the backend rolls back the complete operation.

---

## 12. Security flow

1. Public registration is fixed to Member; clients cannot choose privileged roles.
2. Only the one-time bootstrap creates the primary Admin.
3. Only Admin creates or manages Librarians.
4. Passwords are hashed with bcrypt; hashes are never returned by public user serializers.
5. JWTs use HS256, expire after one day, and include a session version.
6. Every authenticated request reloads account role and activation from the database.
7. Password reset or account deactivation invalidates existing sessions.
8. Authentication endpoints are IP rate limited in process memory.
9. Reset and invitation tokens are random, hashed at rest, expiring, revocable, and single use.
10. Generic forgot-password responses reduce account discovery.
11. Role middleware returns `403` for insufficient privileges.
12. Branch middleware restricts Librarians to assigned branches where it is applied.
13. SQL uses positional parameters rather than string interpolation for user values.
14. CORS uses an explicit origin allowlist.
15. Global security headers reduce MIME sniffing, framing, referrer leakage, and device permissions.
16. Uploads enforce extension, MIME type, and a 5 MB limit.
17. Database constraints enforce roles, statuses, unique emails, one Admin, valid counts, valid dates, and valid transitions at the data boundary where defined.

Operational limitations to account for:

- the auth rate limiter is memory-only, so counters are per process and reset on restart;
- uploaded profile filenames are timestamp-based and stored on local disk;
- notification generators require external scheduling;
- deployment notes state that production release is not yet approved without the listed staging, upload, recovery, and rate-limit verification;
- Phase 7 inventory write safety depends on reconciliation plus the feature flag.

---

## 13. Testing flow

### Backend structure/security tests

1. Open `backend/`.
2. Run `npm test`.
3. Node’s test runner executes `tests/*.test.js`.
4. These tests inspect phase structure, security, and auth expectations.

### Backend integration tests

1. Create a separate PostgreSQL test database.
2. Set `TEST_DB_NAME` and the normal database connection variables.
3. Never point integration tests at production data.
4. Run `npm run test:integration`.
5. Tests run serially and cover registration/login, password reset, access control, Admin bootstrap, and user management.

### Frontend tests

1. Open `frontend/`.
2. Run `npm test`.
3. Vitest runs in jsdom with Testing Library setup.
4. Navigation tests verify role redirects and authentication behavior.

### Build and lint

1. Run `npm run lint` in `frontend/`.
2. Run `npm run build` in `frontend/`.
3. Vite writes the production bundle to `frontend/dist/`.
4. Treat test, lint, and build failures as release blockers until investigated.

---

## 14. Production deployment flow

The repository marks the current release as staging-only; follow `deploy/README.md` before production approval.

1. Reconcile all feature phases and confirm which modules are intentionally enabled.
2. Inspect the live PostgreSQL schema.
3. Back up the database and verify restoration in staging.
4. Apply reviewed migrations in staging.
5. Store database, JWT, and email secrets in a protected secret manager.
6. Run backend tests, integration tests, frontend tests, lint, and production build.
7. Run the backend as a service using the supplied systemd example as a template.
8. Serve `frontend/dist/` over HTTPS with Nginx.
9. Proxy `/api` and `/uploads` to the backend.
10. Configure SPA fallback to `index.html` so browser refresh works on React routes.
11. Apply appropriate service-worker cache headers.
12. Set `CORS_ORIGINS` to the exact production frontend origin, or deploy same-origin.
13. Set `RESET_URL_BASE` to the public HTTPS reset page.
14. Test login, reset, invitations, role isolation, upload, issue/return/renew, reservations, fines, reports, mobile layout, PWA install, and offline behavior.
15. Rehearse database and application rollback.
16. Enable Phase 7 inventory writes only after copy-level and aggregate inventory reconciliation is verified.

---

## 15. Current implementation gaps and integration checklist

These are observable differences between repository modules and the currently running route graph:

1. `inventoryRoutes.js`, `periodicalRoutes.js`, and `copyConditionRoutes.js` exist but are not imported/mounted in `backend/app.js`.
2. `BranchInventory`, `TransferManagement`, `Periodicals`, `CopyConditions`, and `LibrarySettings` pages exist but are not added to `frontend/src/App.jsx`.
3. Inventory-related pages cannot work until both frontend paths and backend prefixes are connected.
4. Settings API is mounted, but its page has no browser route.
5. Ready-reservation expiry, overdue messages, due reminders, and low-stock messages have endpoints but no included scheduler.
6. Returning a book does not automatically calculate or create its fine; staff must use the fine endpoints.
7. Aggregate `books.total_copies/available_copies` and copy-level `book_copies` coexist. The Phase 7 flag and rollout notes must be respected to avoid divergence.
8. The current reservation flow marks a hold Ready but does not automatically convert it to Completed when a book is issued.
9. The base schema and additive migrations must be treated as one release set; a base-only database lacks later phase columns/tables used by current code.
10. Some frontend pages call `fetch` directly while others use `apiRequest`; `AuthProvider` wraps browser fetch globally to keep `401` logout behavior consistent.

Recommended integration order:

1. Confirm and migrate the complete database schema.
2. Reconcile aggregate and copy-level inventory.
3. Mount the three Phase 7 backend routers.
4. Add role-protected frontend routes for settings and inventory screens.
5. Add navigation entries by role and branch assignment.
6. Add a trusted scheduler for reminder and expiry endpoints, or move those jobs into a worker.
7. Add idempotency/deduplication to scheduled notification generation.
8. Decide whether return should automatically create a fine and whether issuing a Ready hold should mark its reservation Completed.
9. Re-run all tests and staging workflows before production approval.

---

## 16. End-to-end example

This example connects the major flows:

1. An operator initializes PostgreSQL, applies migrations, and bootstraps the Admin.
2. The Admin logs in and creates branches.
3. The Admin creates a Librarian, assigns branches, and sends an invitation link.
4. The Librarian opens the link, chooses a password, and logs in.
5. A visitor self-registers; the backend creates both user and member records.
6. The Member logs in and browses the catalogue.
7. Staff adds a book or updates its copy counts.
8. The Member reserves the book and enters its FIFO queue.
9. Staff marks the head reservation Ready when a copy is available.
10. Staff issues the book; inventory availability decreases and the Member receives a notification.
11. The Member sees the loan in issued books and history.
12. Before the due date, staff or a scheduler calls the reminder endpoint.
13. If allowed, staff renews the loan; otherwise a waiting reservation blocks renewal.
14. Staff returns the book; availability increases and the Member is notified.
15. If overdue, staff calculates and creates a fine.
16. The fine is marked Paid after payment.
17. The Member reviews the book; staff may moderate the review.
18. The recommendation engine uses borrowing categories to suggest unborrowed available books.
19. Reports and dashboards read the resulting catalogue, circulation, Member, fine, and notification records.
20. Audit/history tables retain sensitive account, membership, requisition, setting, and transfer changes.

This is the complete operational flow represented by the current repository, including both active functionality and disconnected phase modules.
