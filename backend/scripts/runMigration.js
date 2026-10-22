// Applies one explicitly named migration file inside its own transaction.
//   npm run db:migrate -- database/migrations/20261022_phase10_auth_roles.sql
require("dotenv").config({ quiet: true });

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const runMigration = async () => {
  const file = process.argv[2];

  if (!file || !file.endsWith(".sql") || !fs.existsSync(file)) {
    console.error("Usage: npm run db:migrate -- <path/to/migration.sql>");
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log(`Applying ${path.basename(file)} to database "${process.env.DB_NAME}"...`);
    await pool.query(fs.readFileSync(file, "utf8"));
    console.log("Migration applied.");
  } catch (error) {
    console.error(`Migration failed (no changes committed): ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

runMigration();
