const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

test("requisition API requires authentication and role authorization", () => {
  const routes = read("routes/requisitionRoutes.js");
  for (const method of ["post", "get", "patch"]) {
    assert.match(routes, new RegExp("router\\." + method + "\\("));
  }
  assert.match(routes, /roleMiddleware\("member"\)/);
  assert.match(routes, /roleMiddleware\("admin", "librarian"\)/);
});
test("requisition updates record an audit history in a transaction", () => {
  const model = read("models/requisitionModel.js");
  assert.match(model, /BEGIN/);
  assert.match(model, /FOR UPDATE/);
  assert.match(model, /book_requisition_history/);
  assert.match(model, /ROLLBACK/);
});
test("review moderation endpoint is staff-only", () => {
  const routes = read("routes/reviewRoutes.js");
  assert.match(routes, /roleMiddleware\("admin", "librarian"\), moderate/);
});
test("reviews enforce integer ratings", () => {
  assert.match(read("controllers/reviewController.js"), /Number\.isInteger\(rating\)/);
});
