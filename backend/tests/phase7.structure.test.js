const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("migration creates copy identities and unique active transfer constraints",()=>{
 const s=read("database/migrations/20261022_phase7_multibranch_inventory.sql");
 for(const key of ["library_branches","book_copies","inventory_movements","branch_transfers","branch_transfer_events","periodical_subscriptions","periodical_issues","copy_condition_events","branch_transfers_active_copy_idx"])
 assert.ok(s.includes(key),key);
});
test("transfer transitions use transactions and row locks",()=>{
 const s=read("models/transferModel.js");
 for(const token of ["BEGIN","FOR UPDATE","ROLLBACK","branch_transfer_events","InTransit","Received"])assert.ok(s.includes(token),token);
});
test("condition changes are audited and transactional",()=>{
 const s=read("models/copyConditionModel.js");
 for(const token of ["BEGIN","FOR UPDATE","ROLLBACK","copy_condition_events","inventory_movements"])assert.ok(s.includes(token),token);
});
test("Phase 7 endpoints are authenticated and staff changes are restricted",()=>{
 const s=read("routes/inventoryRoutes.js");
 assert.match(s,/router\.use\(auth\)/);
 assert.match(s,/role\w*\("admin","librarian"\)/);
});
