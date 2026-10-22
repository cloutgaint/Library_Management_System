const test = require("node:test");
const assert = require("node:assert/strict");
const { ADMIN, bootstrapAdmin, registerMember, signToken, startApp } = require("./helpers");

let ctx;
let adminToken;
let alice;
let bob;

const memberSession = async (email) => {
  await registerMember(ctx.api, email);
  const token = await ctx.login(email, "MemberPass123");
  const { rows } = await ctx.pool.query(
    "SELECT u.id AS user_id, m.id AS member_id FROM users u JOIN members m ON m.user_id = u.id WHERE u.email = $1",
    [email]
  );
  return { token, ...rows[0] };
};

test.before(async () => {
  ctx = await startApp();
  assert.equal((await bootstrapAdmin()).code, 0);
  adminToken = await ctx.login(ADMIN.email, ADMIN.password);
  alice = await memberSession("alice@library.test");
  bob = await memberSession("bob@library.test");
});

test.after(() => ctx.stop());

test("requests without a token get 401", async () => {
  for (const url of ["/api/books", "/api/members", "/api/users/librarians", "/api/auth/me"]) {
    assert.equal((await ctx.api("GET", url)).status, 401, url);
  }
});

test("expired, tampered and malformed tokens get 401", async () => {
  const adminId = (await ctx.pool.query("SELECT id FROM users WHERE role = 'admin'")).rows[0].id;

  const expired = signToken({ id: adminId, role: "admin" }, { expiresIn: -10 });
  const forged = require("jsonwebtoken").sign({ id: adminId, role: "admin" }, "attacker-secret");
  const unsigned = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify({ id: adminId, role: "admin" })).toString("base64url")}.`;

  for (const token of [expired, forged, unsigned, "garbage"]) {
    assert.equal((await ctx.api("GET", "/api/auth/me", { token })).status, 401);
  }

  const basic = await fetch(`${ctx.baseUrl}/api/auth/me`, { headers: { Authorization: `Basic ${adminToken}` } });
  assert.equal(basic.status, 401, "non-Bearer schemes are rejected");
});

test("a role claim inside the token is not trusted", async () => {
  // Validly signed, but the database says this user is a member.
  const escalated = signToken({ id: alice.user_id, role: "admin", sv: 0 }, { expiresIn: "1h" });

  assert.equal((await ctx.api("GET", "/api/members", { token: escalated })).status, 403);
  assert.equal((await ctx.api("GET", "/api/auth/admin-test", { token: escalated })).status, 403);

  const me = await ctx.api("GET", "/api/auth/me", { token: escalated });
  assert.equal(me.body.user.role, "member");
});

test("tokens for deleted accounts are rejected", async () => {
  const ghost = signToken({ id: "987654321", role: "member" }, { expiresIn: "1h" });
  assert.equal((await ctx.api("GET", "/api/auth/me", { token: ghost })).status, 401);
});

test("members cannot use admin or staff APIs", async () => {
  const forbidden = [
    ["GET", "/api/members"],
    ["GET", `/api/members/${bob.member_id}`],
    ["POST", "/api/members", { user_id: bob.user_id, membership_expiry: "2030-01-01" }],
    ["DELETE", `/api/members/${bob.member_id}`],
    ["GET", "/api/borrow-transactions"],
    ["GET", `/api/borrow-transactions/member/${bob.member_id}`],
    ["POST", "/api/borrow-transactions/issue", {}],
    ["GET", "/api/fines"],
    ["GET", "/api/reports/summary"],
    ["PATCH", "/api/settings", { max_loans: 3 }],
    ["POST", "/api/books", { title: "x" }],
    ["GET", "/api/auth/admin-test"],
    ["GET", "/api/users/librarians"],
  ];

  for (const [method, url, body] of forbidden) {
    assert.equal((await ctx.api(method, url, { token: alice.token, body })).status, 403, `${method} ${url}`);
  }
});

test("members see only their own data", async () => {
  const profile = await ctx.api("GET", "/api/members/profile", { token: alice.token });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.member.email, "alice@library.test");

  const history = await ctx.api("GET", "/api/borrow-transactions/my-history", { token: alice.token });
  assert.equal(history.status, 200);
});

test("members cannot cancel another member's reservation but can cancel their own", async () => {
  const book = await ctx.api("POST", "/api/books", {
    token: adminToken,
    body: { title: "Shared Book", author: "Author", isbn: "9780000000001", category: "Fiction", total_copies: 1, available_copies: 1 },
  });
  assert.equal(book.status, 201, JSON.stringify(book.body));

  const reservation = await ctx.api("POST", "/api/reservations", { token: bob.token, body: { bookId: book.body.book.id } });
  assert.equal(reservation.status, 201, JSON.stringify(reservation.body));

  const stolen = await ctx.api("DELETE", `/api/reservations/${reservation.body.reservation.id}`, { token: alice.token });
  assert.equal(stolen.status, 403);

  const own = await ctx.api("DELETE", `/api/reservations/${reservation.body.reservation.id}`, { token: bob.token });
  assert.equal(own.status, 200);
});

test("memberships cannot be attached to staff accounts", async () => {
  const adminId = (await ctx.pool.query("SELECT id FROM users WHERE role = 'admin'")).rows[0].id;
  const result = await ctx.api("POST", "/api/members", {
    token: adminToken,
    body: { user_id: adminId, membership_expiry: "2030-01-01" },
  });

  assert.equal(result.status, 400);
});

test("admin can reach admin-only endpoints", async () => {
  assert.equal((await ctx.api("GET", "/api/auth/admin-test", { token: adminToken })).status, 200);
  assert.equal((await ctx.api("GET", "/api/members", { token: adminToken })).status, 200);
  assert.equal((await ctx.api("GET", "/api/users/librarians", { token: adminToken })).status, 200);
});
