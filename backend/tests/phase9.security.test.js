const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("registration rejects privileged roles",()=>{const s=read("controllers/authController.js");assert.match(s,/role !== "member"/);assert.match(s,/selectedRole = "member"/);});
test("password reset requires a hashed single-use token",()=>{const s=read("controllers/authController.js");assert.match(s,/createHash\("sha256"\)/);assert.match(s,/used_at IS NULL AND expires_at>NOW\(\)/);assert.match(s,/FOR UPDATE/);assert.match(s,/UPDATE password_reset_tokens SET used_at=NOW\(\)/);});
test("reset schema enforces unique tokens",()=>assert.match(read("database/migrations/20261022_phase9_password_reset.sql"),/token_hash CHAR\(64\) NOT NULL UNIQUE/));
