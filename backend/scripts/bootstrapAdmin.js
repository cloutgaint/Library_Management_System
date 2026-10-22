// One-time creation of the installation's primary Admin account.
//
//   npm run admin:bootstrap -- --email admin@example.org --name "Library Admin"
//
// The password is read from a hidden prompt, or from ADMIN_BOOTSTRAP_PASSWORD
// for non-interactive setups. It is never accepted as a command-line argument
// (shell history and process listings would expose it).
//
// Refuses to run when an admin already exists, and never promotes an existing
// account: the email must not belong to any user. The database's
// users_single_admin_uq index rejects a second admin even under concurrent runs.
require("dotenv").config({ quiet: true });

const bcrypt = require("bcrypt");
const readline = require("node:readline");
const { Pool } = require("pg");
const {
  normalizeEmail,
  validateEmail,
  validateFullName,
  validatePassword,
} = require("../services/accountPolicy");

const parseArgs = (argv) => {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--email") args.email = argv[++i];
    else if (argv[i] === "--name") args.name = argv[++i];
    else if (argv[i] === "--password") args.passwordFlag = true;
  }

  return args;
};

const promptHidden = (question) =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("No terminal available. Set ADMIN_BOOTSTRAP_PASSWORD for non-interactive setup."));
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Suppress echo of typed characters.
    rl._writeToOutput = () => {};
    process.stdout.write(question);

    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });

const readPassword = async () => {
  if (process.env.ADMIN_BOOTSTRAP_PASSWORD) {
    return process.env.ADMIN_BOOTSTRAP_PASSWORD;
  }

  const password = await promptHidden("Admin password: ");
  const confirmation = await promptHidden("Confirm password: ");

  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  return password;
};

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exitCode = 1;
};

const bootstrapAdmin = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.passwordFlag) {
    return fail("Passwords are not accepted on the command line. Use the prompt or ADMIN_BOOTSTRAP_PASSWORD.");
  }

  const email = normalizeEmail(args.email);
  const fullName = (args.name || "Library Administrator").trim();
  const inputError = validateEmail(email) || validateFullName(fullName);

  if (!args.email || inputError) {
    return fail(
      `${inputError || "Email is required"}.\n  Usage: npm run admin:bootstrap -- --email <email> [--name "Full Name"]`
    );
  }

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    const guard = await pool.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'users_single_admin_uq'"
    );

    if (!guard.rowCount) {
      return fail("The single-admin constraint is missing. Apply the Phase 10 migration first.");
    }

    const existingAdmin = await pool.query("SELECT 1 FROM users WHERE role = 'admin'");

    if (existingAdmin.rowCount) {
      return fail("A primary admin already exists. Bootstrap can only run once per installation.");
    }

    const existingEmail = await pool.query("SELECT 1 FROM users WHERE LOWER(email) = $1", [email]);

    if (existingEmail.rowCount) {
      return fail("That email already belongs to an account. Existing accounts are never promoted; use a new email.");
    }

    const password = await readPassword();
    const passwordError = validatePassword(password);

    if (passwordError) {
      return fail(passwordError);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const client = await pool.connect();
    let admin;

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO users (full_name, email, password, role, password_changed_at)
         VALUES ($1, $2, $3, 'admin', NOW())
         RETURNING id, email`,
        [fullName, email, passwordHash]
      );

      admin = result.rows[0];

      await client.query(
        "INSERT INTO user_account_audit (target_user_id, actor_user_id, action) VALUES ($1, NULL, 'admin_bootstrapped')",
        [admin.id]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    console.log(`✔ Primary admin created: ${admin.email} (id ${admin.id})`);
  } catch (error) {
    if (error.code === "23505") {
      return fail("Another admin was created concurrently, or the email is taken. No changes were made.");
    }

    fail(`Bootstrap failed: ${error.message}`);
  } finally {
    await pool.end();
  }
};

bootstrapAdmin();
