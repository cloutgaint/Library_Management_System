const test = require("node:test");
const assert = require("node:assert/strict");
const { registerMember, startApp } = require("./helpers");

let ctx;
const EMAIL = "forgetful@library.test";
const ORIGINAL_PASSWORD = "MemberPass123";

test.before(async () => {
  ctx = await startApp();
  await registerMember(ctx.api, EMAIL, ORIGINAL_PASSWORD);
});

test.after(() => ctx.stop());

const requestReset = (email) => ctx.api("POST", "/api/auth/forgot-password", { body: { email } });

test("forgot-password responds identically for known and unknown emails", async () => {
  const known = await requestReset(EMAIL);
  const unknown = await requestReset("nobody@library.test");

  assert.equal(known.status, 200);
  assert.deepEqual(known.body, unknown.body);
  assert.ok(ctx.latestTokenFor(EMAIL), "reset link emailed to the account owner");
  assert.equal(ctx.outbox.filter((m) => m.to === "nobody@library.test").length, 0);
});

test("only a hash of the reset token is stored", async () => {
  await requestReset(EMAIL);
  const token = ctx.latestTokenFor(EMAIL);

  const { rows } = await ctx.pool.query("SELECT token_hash FROM password_reset_tokens");
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.token_hash !== token));
});

test("a reset token changes the password once and revokes old sessions", async () => {
  const oldSession = await ctx.login(EMAIL, ORIGINAL_PASSWORD);
  assert.ok(oldSession);

  await requestReset(EMAIL);
  const token = ctx.latestTokenFor(EMAIL);

  const reset = await ctx.api("POST", "/api/auth/reset-password", { body: { token, newPassword: "ChangedPass456" } });
  assert.equal(reset.status, 200);

  assert.equal((await ctx.api("POST", "/api/auth/login", { body: { email: EMAIL, password: ORIGINAL_PASSWORD } })).status, 401);
  assert.equal((await ctx.api("POST", "/api/auth/login", { body: { email: EMAIL, password: "ChangedPass456" } })).status, 200);
  assert.equal((await ctx.api("GET", "/api/auth/me", { token: oldSession })).status, 401, "old session revoked");

  const reused = await ctx.api("POST", "/api/auth/reset-password", { body: { token, newPassword: "AnotherPass789" } });
  assert.equal(reused.status, 400, "token is single-use");
});

test("requesting a new link invalidates earlier links", async () => {
  await requestReset(EMAIL);
  const first = ctx.latestTokenFor(EMAIL);
  await requestReset(EMAIL);
  const second = ctx.latestTokenFor(EMAIL);

  assert.notEqual(first, second);
  assert.equal((await ctx.api("POST", "/api/auth/reset-password", { body: { token: first, newPassword: "Whatever1234" } })).status, 400);
  assert.equal((await ctx.api("POST", "/api/auth/reset-password", { body: { token: second, newPassword: "Whatever1234" } })).status, 200);
});

test("expired tokens are rejected", async () => {
  await requestReset(EMAIL);
  const token = ctx.latestTokenFor(EMAIL);

  await ctx.pool.query("UPDATE password_reset_tokens SET expires_at = NOW() - INTERVAL '1 minute' WHERE used_at IS NULL");

  const result = await ctx.api("POST", "/api/auth/reset-password", { body: { token, newPassword: "TooLate12345" } });
  assert.equal(result.status, 400);
  assert.match(result.body.message, /Invalid or expired/);
});

test("malformed tokens and weak passwords are rejected", async () => {
  assert.equal((await ctx.api("POST", "/api/auth/reset-password", { body: { token: "abc", newPassword: "Valid12345" } })).status, 400);
  assert.equal((await ctx.api("POST", "/api/auth/reset-password", { body: { token: "f".repeat(64), newPassword: "Valid12345" } })).status, 400);

  await requestReset(EMAIL);
  const weak = await ctx.api("POST", "/api/auth/reset-password", {
    body: { token: ctx.latestTokenFor(EMAIL), newPassword: "weak" },
  });
  assert.equal(weak.status, 400);
});

test("forgot-password validates the email format", async () => {
  assert.equal((await requestReset("not-an-email")).status, 400);
});
