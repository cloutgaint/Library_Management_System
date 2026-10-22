// Fast, database-free checks for Phase 10. Behaviour is covered end to end by
// tests/integration (npm run test:integration).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const policy = require("../services/accountPolicy");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

test("password policy requires 10-128 characters with a letter and a digit", () => {
  assert.equal(policy.validatePassword("Abcdefgh12"), null);
  assert.match(policy.validatePassword("Abc12"), /between 10 and 128/);
  assert.match(policy.validatePassword("a".repeat(129) + "1"), /between 10 and 128/);
  assert.match(policy.validatePassword("abcdefghijk"), /letter and one number/);
  assert.match(policy.validatePassword("12345678901"), /letter and one number/);
  assert.match(policy.validatePassword(undefined), /required/);
});

test("emails are normalised and validated", () => {
  assert.equal(policy.normalizeEmail("  Mixed@Case.ORG "), "mixed@case.org");
  assert.equal(policy.normalizeEmail(42), "");
  assert.equal(policy.validateEmail("user@library.org"), null);
  assert.ok(policy.validateEmail("user@library"));
  assert.ok(policy.validateEmail(""));
});

test("each role maps to its dashboard", () => {
  assert.equal(policy.dashboardPathForRole("admin"), "/admin");
  assert.equal(policy.dashboardPathForRole("librarian"), "/librarian");
  assert.equal(policy.dashboardPathForRole("member"), "/student");
  assert.equal(policy.dashboardPathForRole("other"), "/");
});

test("public user objects never include the password hash", () => {
  const user = policy.toPublicUser({ id: 1, full_name: "A", email: "a@b.co", role: "member", password: "$2b$12$hash" });
  assert.equal(user.password, undefined);
});

test("migration enforces one admin at the database level", () => {
  const sql = read("database/migrations/20261022_phase10_auth_roles.sql");
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin_uq\s+ON users \(\(role\)\) WHERE role = 'admin'/);
  assert.match(sql, /RAISE EXCEPTION 'Phase 10 aborted: multiple admin accounts/);
  const statements = sql.replace(/--.*$/gm, "").replace(/ON DELETE (CASCADE|RESTRICT|SET NULL)/g, "");
  assert.doesNotMatch(statements, /\b(DROP|DELETE|TRUNCATE)\b/i, "migration is additive only");
});

test("auth middleware takes the role from the database, not the token", () => {
  const source = read("middleware/authMiddleware.js");
  assert.match(source, /findAuthUserById\(decoded\.id\)/);
  assert.match(source, /role: user\.role/);
  assert.match(source, /algorithms: \["HS256"\]/);
});

test("librarian management is admin-only and never creates admins", () => {
  const routes = read("routes/userManagementRoutes.js");
  assert.match(routes, /const adminOnly = roleMiddleware\("admin"\)/);
  for (const line of routes.split("\n").filter((l) => l.includes('"/librarians'))) {
    assert.match(line, /adminOnly/, line);
  }

  const model = read("models/userModel.js");
  assert.doesNotMatch(model, /'admin'/);
});
