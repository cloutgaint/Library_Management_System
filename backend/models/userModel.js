const pool = require("../config/db");

// Columns safe to return to callers; the password hash is deliberately excluded.
const PUBLIC_COLUMNS = "u.id, u.full_name, u.email, u.role, u.is_active, u.created_at";

const BRANCHES_SUBQUERY = `
  COALESCE((
    SELECT json_agg(json_build_object('id', b.id, 'code', b.code, 'name', b.name) ORDER BY b.name)
    FROM librarian_branch_assignments a
    JOIN library_branches b ON b.id = a.branch_id
    WHERE a.user_id = u.id
  ), '[]'::json) AS branches`;

const withTransaction = async (work) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const recordAudit = (db, targetUserId, actorUserId, action, details = {}) =>
  db.query(
    `INSERT INTO user_account_audit (target_user_id, actor_user_id, action, details)
     VALUES ($1, $2, $3, $4)`,
    [targetUserId, actorUserId, action, JSON.stringify(details)]
  );

// Includes the password hash: for credential checks only, never for responses.
const findUserForLogin = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );

  return result.rows[0];
};

const findAuthUserById = async (id) => {
  const result = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, u.session_version FROM users u WHERE u.id = $1`,
    [id]
  );

  return result.rows[0];
};

const emailExists = async (email, exceptUserId = null) => {
  const result = await pool.query(
    "SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND ($2::bigint IS NULL OR id <> $2)",
    [email, exceptUserId]
  );

  return result.rowCount > 0;
};

// Creates a member login plus its membership record. Role is fixed to 'member'.
const createMemberAccount = ({ fullName, email, passwordHash, createdBy = null, phone = "", address = "" }) =>
  withTransaction(async (client) => {
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password, role, created_by)
       VALUES ($1, $2, $3, 'member', $4)
       RETURNING id, full_name, email, role, is_active, created_at`,
      [fullName, email, passwordHash, createdBy]
    );

    const user = userResult.rows[0];

    const memberResult = await client.query(
      `INSERT INTO members (user_id, phone, address, membership_expiry)
       VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '1 year')
       RETURNING id`,
      [user.id, phone, address]
    );

    if (createdBy) {
      await recordAudit(client, user.id, createdBy, "member_created");
    }

    return { ...user, member_id: memberResult.rows[0].id };
  });

const assertBranchesExist = async (db, branchIds) => {
  if (!branchIds.length) return;

  const result = await db.query(
    "SELECT COUNT(*)::int AS count FROM library_branches WHERE id = ANY($1::bigint[]) AND is_active",
    [branchIds]
  );

  if (result.rows[0].count !== branchIds.length) {
    const error = new Error("One or more branches do not exist or are inactive");
    error.status = 400;
    throw error;
  }
};

const writeBranchAssignments = async (db, userId, branchIds, actorUserId) => {
  await db.query("DELETE FROM librarian_branch_assignments WHERE user_id = $1", [userId]);

  if (branchIds.length) {
    await db.query(
      `INSERT INTO librarian_branch_assignments (user_id, branch_id, assigned_by)
       SELECT $1, UNNEST($2::bigint[]), $3`,
      [userId, branchIds, actorUserId]
    );
  }
};

// Role is fixed to 'librarian'; there is no code path that creates an admin here.
const createLibrarian = ({ fullName, email, passwordHash, branchIds, createdBy }) =>
  withTransaction(async (client) => {
    await assertBranchesExist(client, branchIds);

    const result = await client.query(
      `INSERT INTO users (full_name, email, password, role, created_by)
       VALUES ($1, $2, $3, 'librarian', $4)
       RETURNING id`,
      [fullName, email, passwordHash, createdBy]
    );

    const userId = result.rows[0].id;

    await writeBranchAssignments(client, userId, branchIds, createdBy);
    await recordAudit(client, userId, createdBy, "librarian_created", { branchIds });

    return userId;
  });

const listLibrarians = async ({ search = "", status = "all" } = {}) => {
  const result = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, ${BRANCHES_SUBQUERY}
     FROM users u
     WHERE u.role = 'librarian'
       AND ($1 = '' OR u.full_name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
       AND ($2 = 'all' OR ($2 = 'active' AND u.is_active) OR ($2 = 'inactive' AND NOT u.is_active))
     ORDER BY u.full_name, u.id`,
    [search, status]
  );

  return result.rows;
};

const getLibrarianById = async (id) => {
  const result = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, u.password_changed_at, ${BRANCHES_SUBQUERY}
     FROM users u
     WHERE u.id = $1 AND u.role = 'librarian'`,
    [id]
  );

  return result.rows[0];
};

const updateLibrarianDetails = (id, { fullName, email }, actorUserId) =>
  withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE users SET full_name = $1, email = $2, updated_at = NOW()
       WHERE id = $3 AND role = 'librarian'
       RETURNING id`,
      [fullName, email, id]
    );

    if (result.rowCount) {
      await recordAudit(client, id, actorUserId, "librarian_updated", { fullName, email });
    }

    return result.rowCount > 0;
  });

const setLibrarianActive = (id, isActive, actorUserId) =>
  withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE users SET is_active = $1, session_version = session_version + 1, updated_at = NOW()
       WHERE id = $2 AND role = 'librarian'
       RETURNING id`,
      [isActive, id]
    );

    if (result.rowCount) {
      await recordAudit(client, id, actorUserId, isActive ? "librarian_activated" : "librarian_deactivated");

      if (!isActive) {
        // A deactivated account must not be able to finish an outstanding reset or invitation.
        await client.query(
          "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
          [id]
        );
      }
    }

    return result.rowCount > 0;
  });

const replaceLibrarianBranches = (id, branchIds, actorUserId) =>
  withTransaction(async (client) => {
    const target = await client.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'librarian' FOR UPDATE",
      [id]
    );

    if (!target.rowCount) return false;

    await assertBranchesExist(client, branchIds);
    await writeBranchAssignments(client, id, branchIds, actorUserId);
    await recordAudit(client, id, actorUserId, "librarian_branches_changed", { branchIds });

    return true;
  });

const getAssignedBranchIds = async (userId) => {
  const result = await pool.query(
    "SELECT branch_id FROM librarian_branch_assignments WHERE user_id = $1",
    [userId]
  );

  return result.rows.map((row) => String(row.branch_id));
};

const getAssignedBranches = async (userId) => {
  const result = await pool.query(
    `SELECT b.id, b.code, b.name
     FROM librarian_branch_assignments a
     JOIN library_branches b ON b.id = a.branch_id
     WHERE a.user_id = $1
     ORDER BY b.name`,
    [userId]
  );

  return result.rows;
};

module.exports = {
  withTransaction,
  recordAudit,
  findUserForLogin,
  findAuthUserById,
  emailExists,
  createMemberAccount,
  createLibrarian,
  listLibrarians,
  getLibrarianById,
  updateLibrarianDetails,
  setLibrarianActive,
  replaceLibrarianBranches,
  getAssignedBranchIds,
  getAssignedBranches,
};
