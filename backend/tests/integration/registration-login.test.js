const test = require("node:test");
const assert = require("node:assert/strict");
const { ADMIN, bootstrapAdmin, registerMember, startApp } = require("./helpers");

let ctx;

test.before(async () => {
  ctx = await startApp();
  const result = await bootstrapAdmin();
  assert.equal(result.code, 0, result.stderr);
});

test.after(() => ctx.stop());

test("public member registration succeeds and never returns the password hash", async () => {
  const result = await registerMember(ctx.api, "new.member@library.test");

  assert.equal(result.status, 201);
  assert.equal(result.body.user.role, "member");
  assert.equal(result.body.user.password, undefined);
  assert.doesNotMatch(JSON.stringify(result.body), /\$2[aby]\$/);

  const { rows } = await ctx.pool.query(
    "SELECT u.role, u.password, m.id AS member_id FROM users u JOIN members m ON m.user_id = u.id WHERE u.email = $1",
    ["new.member@library.test"]
  );

  assert.equal(rows[0].role, "member");
  assert.ok(rows[0].member_id, "membership record created");
  assert.match(rows[0].password, /^\$2[aby]\$12\$/, "password stored as bcrypt hash");
});

for (const role of ["admin", "librarian"]) {
  test(`public registration with role "${role}" is rejected`, async () => {
    const email = `wannabe.${role}@library.test`;
    const result = await ctx.api("POST", "/api/auth/register", {
      body: { full_name: "Escalation", email, password: "Sneaky12345", confirm_password: "Sneaky12345", role },
    });

    assert.equal(result.status, 403);

    const { rowCount } = await ctx.pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
    assert.equal(rowCount, 0, "no account created");
  });
}

test("registration validates email, password strength and confirmation", async () => {
  const cases = [
    [{ full_name: "A", email: "not-an-email", password: "Valid12345", confirm_password: "Valid12345" }, "email"],
    [{ full_name: "A", email: "weak@library.test", password: "short1", confirm_password: "short1" }, "password"],
    [{ full_name: "A", email: "weak@library.test", password: "lettersonly", confirm_password: "lettersonly" }, "password"],
    [{ full_name: "A", email: "weak@library.test", password: "Valid12345", confirm_password: "Different123" }, "confirm_password"],
    [{ full_name: "A", email: "weak@library.test", password: "Valid12345" }, "confirm_password"],
    [{ full_name: " ", email: "weak@library.test", password: "Valid12345", confirm_password: "Valid12345" }, "full_name"],
  ];

  for (const [body, field] of cases) {
    const result = await ctx.api("POST", "/api/auth/register", { body });
    assert.equal(result.status, 400, JSON.stringify(body));
    assert.ok(result.body.errors[field], `expected ${field} error for ${JSON.stringify(body)}`);
  }
});

test("registration rejects duplicate emails regardless of case", async () => {
  await registerMember(ctx.api, "dupe@library.test");
  const result = await registerMember(ctx.api, "DUPE@Library.test");

  assert.equal(result.status, 409);
  assert.match(result.body.message, /already exists/);
});

test("all roles log in through the same endpoint and the role comes from the database", async () => {
  await registerMember(ctx.api, "login.member@library.test");

  const admin = await ctx.api("POST", "/api/auth/login", { body: { email: ADMIN.email, password: ADMIN.password } });
  assert.equal(admin.status, 200);
  assert.equal(admin.body.user.role, "admin");

  const member = await ctx.api("POST", "/api/auth/login", {
    body: { email: "LOGIN.member@library.test", password: "MemberPass123", role: "admin" },
  });
  assert.equal(member.status, 200);
  assert.equal(member.body.user.role, "member", "client-supplied role is ignored");
  assert.equal(member.body.user.password, undefined);
});

test("wrong password and unknown email produce the same generic error", async () => {
  const wrongPassword = await ctx.api("POST", "/api/auth/login", {
    body: { email: ADMIN.email, password: "WrongPass999" },
  });
  const unknownEmail = await ctx.api("POST", "/api/auth/login", {
    body: { email: "nobody@library.test", password: "WrongPass999" },
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
});

test("login requires both fields", async () => {
  const result = await ctx.api("POST", "/api/auth/login", { body: { email: ADMIN.email } });
  assert.equal(result.status, 400);
});

test("/api/auth/me returns the verified account", async () => {
  const token = await ctx.login(ADMIN.email, ADMIN.password);
  const result = await ctx.api("GET", "/api/auth/me", { token });

  assert.equal(result.status, 200);
  assert.equal(result.body.user.email, ADMIN.email);
  assert.equal(result.body.user.role, "admin");
  assert.equal(result.body.user.password, undefined);
});
