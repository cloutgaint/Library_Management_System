const pool = require("../config/db");

const listBranches = async ({ branchIds = null } = {}) => {
  const result = await pool.query(
    `SELECT id, code, name, address, is_active, created_at
     FROM library_branches
     WHERE $1::bigint[] IS NULL OR id = ANY($1::bigint[])
     ORDER BY name`,
    [branchIds]
  );

  return result.rows;
};

const getBranchById = async (id) => {
  const result = await pool.query(
    `SELECT b.id, b.code, b.name, b.address, b.is_active, b.created_at,
       COALESCE((
         SELECT json_agg(json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email) ORDER BY u.full_name)
         FROM librarian_branch_assignments a
         JOIN users u ON u.id = a.user_id
         WHERE a.branch_id = b.id
       ), '[]'::json) AS librarians
     FROM library_branches b
     WHERE b.id = $1`,
    [id]
  );

  return result.rows[0];
};

const createBranch = async ({ code, name, address }) => {
  const result = await pool.query(
    `INSERT INTO library_branches (code, name, address)
     VALUES ($1, $2, $3)
     RETURNING id, code, name, address, is_active, created_at`,
    [code, name, address]
  );

  return result.rows[0];
};

const updateBranch = async (id, { name, address, isActive }) => {
  const result = await pool.query(
    `UPDATE library_branches
     SET name = COALESCE($1, name),
         address = COALESCE($2, address),
         is_active = COALESCE($3, is_active)
     WHERE id = $4
     RETURNING id, code, name, address, is_active, created_at`,
    [name ?? null, address ?? null, isActive ?? null, id]
  );

  return result.rows[0];
};

module.exports = {
  listBranches,
  getBranchById,
  createBranch,
  updateBranch,
};
