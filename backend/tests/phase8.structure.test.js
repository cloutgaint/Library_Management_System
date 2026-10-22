const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("member dashboard queries are scoped to user ID",()=>{
 const s=read("models/roleDashboardModel.js");
 assert.match(s,/m\.user_id=\$1/);assert.match(s,/notifications WHERE user_id=\$1/);
});
test("report route requires staff role",()=>{
 const s=read("routes/reportRoutes.js");assert.match(s,/roles\("admin","librarian"\)/);
});
test("settings mutations require admin",()=>{
 const s=read("routes/settingsRoutes.js");assert.match(s,/router\.patch\("\/",role\("admin"\)/);
});
test("settings migration includes audit history",()=>{
 const s=read("database/migrations/20261022_phase8_settings.sql");
 assert.match(s,/CREATE TABLE IF NOT EXISTS library_settings_audit/);
});
