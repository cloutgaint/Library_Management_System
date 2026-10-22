const test = require("node:test");
const assert = require("node:assert/strict");
const { ADMIN, bootstrapAdmin, registerMember, runBootstrap, startApp } = require("./helpers");

let ctx;

test.before(async () => {
  ctx = await startApp();
});

test.after(() => ctx.stop());

const adminCount = async () =>
  Number((await ctx.pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'")).rows[0].count);

test("bootstrap rejects weak passwords and passwords on the command line", async () => {
  const weak = await runBootstrap(["--email", ADMIN.email], "short");
  assert.notEqual(weak.code, 0);
  assert.match(weak.stderr, /Password must/);

  const flag = await runBootstrap(["--email", ADMIN.email, "--password", "AdminPass123"], ADMIN.password);
  assert.notEqual(flag.code, 0);
  assert.match(flag.stderr, /not accepted on the command line/);

  assert.equal(await adminCount(), 0);
});

test("bootstrap never promotes an existing account", async () => {
  await registerMember(ctx.api, "existing@library.test");

  const result = await runBootstrap(["--email", "existing@library.test"], ADMIN.password);

  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /never promoted/);

  const { rows } = await ctx.pool.query("SELECT role FROM users WHERE email = 'existing@library.test'");
  assert.equal(rows[0].role, "member");
  assert.equal(await adminCount(), 0);
});

test("bootstrap creates exactly one primary admin and refuses to run again", async () => {
  const first = await bootstrapAdmin();
  assert.equal(first.code, 0, first.stderr);
  assert.match(first.stdout, /Primary admin created/);

  const second = await runBootstrap(["--email", "second.admin@library.test"], ADMIN.password);
  assert.notEqual(second.code, 0);
  assert.match(second.stderr, /already exists/);

  assert.equal(await adminCount(), 1);
});

test("concurrent bootstrap runs cannot create two admins", async () => {
  await ctx.pool.query("DELETE FROM user_account_audit");
  await ctx.pool.query("DELETE FROM users WHERE role = 'admin'");

  const results = await Promise.all(
    ["race.one@library.test", "race.two@library.test", "race.three@library.test"].map((email) =>
      runBootstrap(["--email", email], ADMIN.password)
    )
  );

  assert.equal(results.filter((r) => r.code === 0).length, 1, results.map((r) => r.stderr).join("\n"));
  assert.equal(await adminCount(), 1);
});

test("the database rejects a second admin even when the application is bypassed", async () => {
  await assert.rejects(
    ctx.pool.query(
      "INSERT INTO users (full_name, email, password, role) VALUES ('Rogue', 'rogue@library.test', 'x', 'admin')"
    ),
    (error) => error.code === "23505"
  );

  await assert.rejects(
    ctx.pool.query("UPDATE users SET role = 'admin' WHERE email = 'existing@library.test'"),
    (error) => error.code === "23505"
  );

  await assert.rejects(
    ctx.pool.query("UPDATE users SET is_active = FALSE WHERE role = 'admin'"),
    (error) => error.code === "23514"
  );

  assert.equal(await adminCount(), 1);
});
