const test = require("node:test");
const assert = require("node:assert/strict");
const { ADMIN, bootstrapAdmin, registerMember, startApp } = require("./helpers");

let ctx;
let adminToken;
let branchA;
let branchB;

const LIBRARIAN_PASSWORD = "Librarian123";

// Creates a librarian through the Admin API and completes the emailed invitation.
const createActiveLibrarian = async (email, branchIds) => {
  const created = await ctx.api("POST", "/api/users/librarians", {
    token: adminToken,
    body: { full_name: `Librarian ${email}`, email, branch_ids: branchIds },
  });

  assert.equal(created.status, 201, JSON.stringify(created.body));

  const accepted = await ctx.api("POST", "/api/auth/reset-password", {
    body: { token: ctx.latestTokenFor(email), newPassword: LIBRARIAN_PASSWORD },
  });

  assert.equal(accepted.status, 200, JSON.stringify(accepted.body));

  return { id: created.body.librarian.id, token: await ctx.login(email, LIBRARIAN_PASSWORD) };
};

test.before(async () => {
  ctx = await startApp();
  assert.equal((await bootstrapAdmin()).code, 0);
  adminToken = await ctx.login(ADMIN.email, ADMIN.password);

  branchA = (await ctx.api("POST", "/api/branches", { token: adminToken, body: { code: "main", name: "Main Branch" } })).body.branch;
  branchB = (await ctx.api("POST", "/api/branches", { token: adminToken, body: { code: "east", name: "East Branch" } })).body.branch;
});

test.after(() => ctx.stop());

test("admin creates a librarian, who receives an invitation instead of a password", async () => {
  const result = await ctx.api("POST", "/api/users/librarians", {
    token: adminToken,
    body: { full_name: "Lina Librarian", email: "Lina@Library.test", branch_ids: [branchA.id] },
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.librarian.role, "librarian");
  assert.equal(result.body.librarian.email, "lina@library.test");
  assert.equal(result.body.invitation_sent, true);
  assert.deepEqual(result.body.librarian.branches.map((b) => b.code), ["MAIN"]);
  assert.equal(result.body.librarian.password_set, false);

  const invitation = ctx.outbox.find((m) => m.to === "lina@library.test");
  assert.match(invitation.subject, /invited/);
  assert.match(invitation.text, /#token=[a-f0-9]{64}/, "invitation carries a setup link");
  assert.doesNotMatch(invitation.text, /password[ \t]*[:=][ \t]*\S/i, "no plaintext password in email");

  // Unusable until the invitation is accepted.
  const premature = await ctx.api("POST", "/api/auth/login", { body: { email: "lina@library.test", password: "" } });
  assert.notEqual(premature.status, 200);

  const accepted = await ctx.api("POST", "/api/auth/reset-password", {
    body: { token: ctx.latestTokenFor("lina@library.test"), newPassword: LIBRARIAN_PASSWORD },
  });
  assert.equal(accepted.status, 200);

  const login = await ctx.api("POST", "/api/auth/login", { body: { email: "lina@library.test", password: LIBRARIAN_PASSWORD } });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, "librarian");
});

test("admin cannot create an admin through librarian management", async () => {
  const result = await ctx.api("POST", "/api/users/librarians", {
    token: adminToken,
    body: { full_name: "Second Admin", email: "second.admin@library.test", role: "admin" },
  });

  assert.equal(result.status, 403);
});

test("librarians cannot create admins, librarians or manage staff", async () => {
  const librarian = await createActiveLibrarian("lib.escalate@library.test", [branchA.id]);

  const attempts = [
    ["POST", "/api/users/librarians", { full_name: "X", email: "x.admin@library.test", role: "admin" }],
    ["POST", "/api/users/librarians", { full_name: "X", email: "x.lib@library.test" }],
    ["POST", "/api/users/members", { full_name: "X", email: "x.member.admin@library.test", role: "admin" }],
    ["GET", "/api/users/librarians"],
    ["PATCH", `/api/users/librarians/${librarian.id}/status`, { is_active: true }],
    ["PUT", `/api/users/librarians/${librarian.id}/branches`, { branch_ids: [branchA.id, branchB.id] }],
    ["POST", "/api/branches", { code: "rogue", name: "Rogue" }],
  ];

  for (const [method, url, body] of attempts) {
    const result = await ctx.api(method, url, { token: librarian.token, body });
    assert.equal(result.status, 403, `${method} ${url}`);
  }

  const { rows } = await ctx.pool.query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'");
  assert.equal(rows[0].n, 1);
});

test("librarians can create member accounts only", async () => {
  const librarian = await createActiveLibrarian("lib.members@library.test", [branchA.id]);

  const result = await ctx.api("POST", "/api/users/members", {
    token: librarian.token,
    body: { full_name: "Walk-in Member", email: "walkin@library.test", phone: "555-0100" },
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.member.role, "member");
  assert.ok(result.body.member.member_id);
  assert.ok(ctx.latestTokenFor("walkin@library.test"), "member invitation sent");
});

test("admin can view, search and edit librarians", async () => {
  const librarian = await createActiveLibrarian("searchable@library.test", [branchB.id]);

  const search = await ctx.api("GET", "/api/users/librarians?search=searchable", { token: adminToken });
  assert.equal(search.status, 200);
  assert.deepEqual(search.body.librarians.map((l) => l.email), ["searchable@library.test"]);

  const edit = await ctx.api("PATCH", `/api/users/librarians/${librarian.id}`, {
    token: adminToken,
    body: { full_name: "Renamed Librarian", email: "renamed@library.test" },
  });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.librarian.full_name, "Renamed Librarian");

  const taken = await ctx.api("PATCH", `/api/users/librarians/${librarian.id}`, {
    token: adminToken,
    body: { full_name: "Renamed Librarian", email: ADMIN.email },
  });
  assert.equal(taken.status, 409);

  // The admin account and members are not reachable through librarian management.
  const adminId = (await ctx.pool.query("SELECT id FROM users WHERE role = 'admin'")).rows[0].id;
  const adminEdit = await ctx.api("PATCH", `/api/users/librarians/${adminId}`, {
    token: adminToken,
    body: { full_name: "Hijacked", email: "hijack@library.test" },
  });
  assert.equal(adminEdit.status, 404);
});

test("librarians are restricted to their assigned branches", async () => {
  const librarian = await createActiveLibrarian("branch.scoped@library.test", [branchA.id]);

  const own = await ctx.api("GET", `/api/branches/${branchA.id}`, { token: librarian.token });
  assert.equal(own.status, 200);

  const other = await ctx.api("GET", `/api/branches/${branchB.id}`, { token: librarian.token });
  assert.equal(other.status, 403);

  const list = await ctx.api("GET", "/api/branches", { token: librarian.token });
  assert.deepEqual(list.body.branches.map((b) => b.code), ["MAIN"]);

  const reassigned = await ctx.api("PUT", `/api/users/librarians/${librarian.id}/branches`, {
    token: adminToken,
    body: { branch_ids: [branchB.id] },
  });
  assert.equal(reassigned.status, 200);

  assert.equal((await ctx.api("GET", `/api/branches/${branchA.id}`, { token: librarian.token })).status, 403);
  assert.equal((await ctx.api("GET", `/api/branches/${branchB.id}`, { token: librarian.token })).status, 200);

  const me = await ctx.api("GET", "/api/auth/me", { token: librarian.token });
  assert.deepEqual(me.body.user.branches.map((b) => b.code), ["EAST"]);
});

test("branch assignment rejects unknown branches", async () => {
  const librarian = await createActiveLibrarian("bad.branch@library.test", []);
  const result = await ctx.api("PUT", `/api/users/librarians/${librarian.id}/branches`, {
    token: adminToken,
    body: { branch_ids: ["999999"] },
  });

  assert.equal(result.status, 400);
});

test("deactivated librarians cannot log in and their sessions end immediately", async () => {
  const librarian = await createActiveLibrarian("deactivate.me@library.test", [branchA.id]);

  const deactivated = await ctx.api("PATCH", `/api/users/librarians/${librarian.id}/status`, {
    token: adminToken,
    body: { is_active: false },
  });
  assert.equal(deactivated.status, 200);
  assert.equal(deactivated.body.librarian.is_active, false);

  const session = await ctx.api("GET", "/api/books", { token: librarian.token });
  assert.equal(session.status, 401);

  const login = await ctx.api("POST", "/api/auth/login", {
    body: { email: "deactivate.me@library.test", password: LIBRARIAN_PASSWORD },
  });
  assert.equal(login.status, 403);
  assert.match(login.body.message, /deactivated/);

  const wrongPassword = await ctx.api("POST", "/api/auth/login", {
    body: { email: "deactivate.me@library.test", password: "WrongPass999" },
  });
  assert.equal(wrongPassword.status, 401, "status is revealed only after a correct password");

  const reactivated = await ctx.api("PATCH", `/api/users/librarians/${librarian.id}/status`, {
    token: adminToken,
    body: { is_active: true },
  });
  assert.equal(reactivated.status, 200);

  const loginAgain = await ctx.api("POST", "/api/auth/login", {
    body: { email: "deactivate.me@library.test", password: LIBRARIAN_PASSWORD },
  });
  assert.equal(loginAgain.status, 200);
});

test("admin can send a librarian a password reset link", async () => {
  const librarian = await createActiveLibrarian("needs.reset@library.test", [branchA.id]);
  const before = ctx.outbox.length;

  const result = await ctx.api("POST", `/api/users/librarians/${librarian.id}/password-link`, { token: adminToken });
  assert.equal(result.status, 200);
  assert.match(result.body.message, /reset link/i);
  assert.equal(ctx.outbox.length, before + 1);

  const reset = await ctx.api("POST", "/api/auth/reset-password", {
    body: { token: ctx.latestTokenFor("needs.reset@library.test"), newPassword: "BrandNew12345" },
  });
  assert.equal(reset.status, 200);

  // The pre-reset session is revoked.
  assert.equal((await ctx.api("GET", "/api/auth/me", { token: librarian.token })).status, 401);
});

test("staff account changes are audited", async () => {
  const { rows } = await ctx.pool.query("SELECT DISTINCT action FROM user_account_audit ORDER BY action");
  const actions = rows.map((r) => r.action);

  for (const action of ["admin_bootstrapped", "librarian_created", "librarian_deactivated", "librarian_branches_changed"]) {
    assert.ok(actions.includes(action), action);
  }
});

test("members cannot reach user management", async () => {
  await registerMember(ctx.api, "curious.member@library.test");
  const token = await ctx.login("curious.member@library.test", "MemberPass123");

  assert.equal((await ctx.api("GET", "/api/users/librarians", { token })).status, 403);
  assert.equal((await ctx.api("POST", "/api/users/members", { token, body: { full_name: "X", email: "x@library.test" } })).status, 403);
  assert.equal((await ctx.api("GET", "/api/branches", { token })).status, 403);
});
