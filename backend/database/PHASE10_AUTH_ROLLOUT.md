# Phase 10: authentication and role management rollout

## What the migration changes

`migrations/20261022_phase10_auth_roles.sql` is additive. It does not drop, delete, demote or re-hash anything.

| Object | Purpose |
|---|---|
| `users.is_active` | Deactivated accounts cannot log in; their sessions end on the next request. |
| `users.session_version` | Embedded in each JWT. A password change or deactivation increments it, which revokes existing sessions. |
| `users.password_changed_at`, `created_by`, `updated_at` | Account history. |
| `users_single_admin_uq` | Partial unique index: at most one `admin` row. This covers concurrent inserts and role updates as well as direct SQL. |
| `users_email_lower_uq` | Emails are unique regardless of case. |
| `users_admin_always_active` | The primary admin cannot be deactivated, so the installation cannot be locked out. |
| `library_branches` | Created if missing; the definition is identical to Phase 7. |
| `librarian_branch_assignments` | Which branches each librarian may access. |
| `password_reset_tokens.purpose` | `reset` (30 minutes) or `invite` (72 hours). The table is created if Phase 9 has not run. |
| `user_account_audit` | Records admin actions on accounts. |

### Pre-flight safety check

The migration aborts the whole transaction, leaving the database untouched, if either of these exists:

- **More than one `admin` account.** The error lists their ids. Decide which one is the primary admin, then change the others yourself (for example to `librarian`) before re-running. The migration never chooses for you.
- **Emails that differ only by case.** Merge or rename those accounts first.

To check before applying:

```sql
SELECT id, email, created_at FROM users WHERE role = 'admin' ORDER BY id;
SELECT LOWER(email), COUNT(*) FROM users GROUP BY 1 HAVING COUNT(*) > 1;
```

## Steps

1. Back up the database.
2. Apply Phase 9 if it is not already applied. Phase 10 also creates its table, so this step is optional.
3. Apply Phase 10:
   ```
   npm run db:migrate -- database/migrations/20261022_phase10_auth_roles.sql
   ```
4. Create the primary admin. This works once per installation, and only with an email that no account uses yet:
   ```
   npm run admin:bootstrap -- --email admin@example.org --name "Library Admin"
   ```
   The password is requested at a hidden prompt. For automation, set `ADMIN_BOOTSTRAP_PASSWORD` instead. The script refuses `--password` on the command line.
5. Set `RESET_URL_BASE`, `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`. Password-reset and invitation links depend on them.
6. Start the server. `npm start` refuses to start if the Phase 10 schema is missing.

Existing users keep their passwords. Every user must log in again once, because tokens issued before this release carry no session version.

## Rollback

```
npm run db:migrate -- database/migrations/20261022_phase10_auth_roles.down.sql
```

Rollback removes only Phase 10 objects. It keeps `library_branches` and `password_reset_tokens`, which are shared with Phases 7 and 9. Activation state, branch assignments and the audit trail are lost, and any deactivated accounts become active again. Deploy the previous application version first, because this code requires the Phase 10 columns.

## Known limits

- Circulation (issue, return, reservations) is not branch-aware in the live schema. Branch scoping applies to `/api/branches` and to the Phase 7 inventory and periodical routes, which are not mounted yet.
