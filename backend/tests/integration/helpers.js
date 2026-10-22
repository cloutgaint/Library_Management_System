// Shared setup for database-backed integration tests.
// Runs against a dedicated throwaway database (TEST_DB_NAME, default "lms_test")
// that is dropped and recreated for every test file. Refuses any database name
// not ending in "_test" so development or production data can never be touched.
const path = require("node:path");
const fs = require("node:fs");
const { execFile } = require("node:child_process");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env"), quiet: true });

const TEST_DB_NAME = process.env.TEST_DB_NAME || "lms_test";

if (!TEST_DB_NAME.endsWith("_test")) {
  throw new Error(`Refusing to run integration tests against "${TEST_DB_NAME}": name must end with _test`);
}

// Must be set before the app (and config/db) is loaded; dotenv never overrides these.
Object.assign(process.env, {
  NODE_ENV: "test",
  DB_NAME: TEST_DB_NAME,
  EMAIL_TRANSPORT: "memory",
  RESET_URL_BASE: "http://localhost:5173/reset-password",
  JWT_SECRET: "integration-test-secret-0123456789abcdef",
  AUTH_RATE_LIMIT_MAX: "100000",
});

const { Client } = require("pg");
const jwt = require("jsonwebtoken");

const backendRoot = path.join(__dirname, "..", "..");
const read = (relative) => fs.readFileSync(path.join(backendRoot, relative), "utf8");

const connectionConfig = (database) => ({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database,
});

const recreateDatabase = async () => {
  const admin = new Client(connectionConfig("postgres"));
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  await admin.end();

  const db = new Client(connectionConfig(TEST_DB_NAME));
  await db.connect();
  await db.query(read("database/schema.sql"));
  // Applied on top of schema.sql to prove the migration is idempotent.
  await db.query(read("database/migrations/20261022_phase10_auth_roles.sql"));
  await db.end();
};

// Boots the real Express app on an ephemeral port.
const startApp = async () => {
  await recreateDatabase();

  const app = require("../../app");
  const pool = require("../../config/db");
  const { outbox } = require("../../services/emailService");

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const api = async (method, url, { token, body } = {}) => {
    const response = await fetch(baseUrl + url, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let json;

    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    return { status: response.status, body: json };
  };

  const login = async (email, password) => {
    const result = await api("POST", "/api/auth/login", { body: { email, password } });
    return result.body.token;
  };

  // Extracts the most recent account link token emailed to an address.
  const latestTokenFor = (email) => {
    const message = [...outbox].reverse().find((m) => m.to === email);
    return message?.text.match(/#token=([a-f0-9]{64})/)?.[1];
  };

  const stop = async () => {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  };

  return { api, baseUrl, login, latestTokenFor, outbox, pool, stop };
};

// Runs the real bootstrap CLI against the test database.
const runBootstrap = (args, password) =>
  new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join(backendRoot, "scripts", "bootstrapAdmin.js"), ...args],
      { env: { ...process.env, ADMIN_BOOTSTRAP_PASSWORD: password ?? "" } },
      (error, stdout, stderr) => resolve({ code: error ? error.code : 0, stdout, stderr })
    );
  });

const ADMIN = { email: "admin@library.test", password: "AdminPass123", name: "Primary Admin" };

const bootstrapAdmin = () => runBootstrap(["--email", ADMIN.email, "--name", ADMIN.name], ADMIN.password);

const signToken = (payload, options) =>
  jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", ...options });

const registerMember = (api, email, password = "MemberPass123", fullName = "Test Member") =>
  api("POST", "/api/auth/register", {
    body: { full_name: fullName, email, password, confirm_password: password },
  });

module.exports = {
  ADMIN,
  bootstrapAdmin,
  registerMember,
  runBootstrap,
  signToken,
  startApp,
};
