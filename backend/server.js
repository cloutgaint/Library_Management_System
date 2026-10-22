require("dotenv").config({ quiet: true });

const app = require("./app");
const pool = require("./config/db");

// Objects the authentication system cannot work without (Phase 9 + Phase 10 migrations).
const REQUIRED_SCHEMA = [
  ["column", "users", "is_active"],
  ["column", "users", "password_changed_at"],
  ["column", "users", "session_version"],
  ["column", "password_reset_tokens", "purpose"],
  ["table", "librarian_branch_assignments"],
  ["table", "user_account_audit"],
  ["index", "users_single_admin_uq"],
];

const findMissingSchema = async () => {
  const missing = [];

  for (const [kind, name, column] of REQUIRED_SCHEMA) {
    const { rowCount } =
      kind === "column"
        ? await pool.query(
            "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2",
            [name, column]
          )
        : kind === "table"
          ? await pool.query("SELECT to_regclass($1) AS oid WHERE to_regclass($1) IS NOT NULL", [name])
          : await pool.query("SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = $1", [name]);

    if (!rowCount) missing.push(column ? `${name}.${column}` : name);
  }

  return missing;
};

const start = async () => {
  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is not set.");
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.warn("⚠️  JWT_SECRET is shorter than 32 characters; replace it with a long random value.");
  }

  const missing = await findMissingSchema();

  if (missing.length) {
    console.error(`❌ Database schema is out of date. Missing: ${missing.join(", ")}`);
    console.error("   Apply backend/database/migrations/20261022_phase10_auth_roles.sql (see backend/database/PHASE10_AUTH_ROLLOUT.md).");
    process.exit(1);
  }

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error("❌ Server failed to start:", error.message);
  process.exit(1);
});
