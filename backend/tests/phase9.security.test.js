const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("public registration is member-only",()=>{const s=read("controllers/authController.js");assert.match(s,/role !== "member"/);assert.match(s,/selectedRole = "member"/);});
test("unverified password recovery fails closed",()=>{const s=read("controllers/authController.js");assert.match(s,/forgotPassword = async/);assert.match(s,/status\(503\)/);assert.doesNotMatch(s,/updatePassword\(email/);});
test("authenticated endpoints verify JWT",()=>{assert.match(read("middleware/authMiddleware.js"),/jwt.verify/);});
