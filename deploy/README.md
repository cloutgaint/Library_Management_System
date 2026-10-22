# LMS Phase 9 staging deployment checklist
Phase 9 is not approved for production. No deployment was performed.

1. Reconcile Phase 4, 5, 6, 7 and 8 feature branches; they are not merged into Phase 9.
2. Inspect live PostgreSQL schema and migration history, back up database, and verify restoration on staging.
3. Configure environment secrets using a protected secret manager; never commit them.
4. Build frontend and run backend and frontend tests; verify CORS, JWT, role isolation and password recovery.
5. Deploy staging with HTTPS, same-origin reverse proxy /api -> backend, SPA fallback to index.html and service-worker headers.
6. Test mobile, PWA install/offline behavior, login, issue/return, reservations, fines and reports.
7. Rehearse rollback. Do not deploy to production until verified reset-link recovery, upload hardening and rate limiting are complete.
