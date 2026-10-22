const pool = require("../config/db");

const createUser = async (full_name, email, password, role) => {
  const query = `
    INSERT INTO users (full_name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [full_name, email, password, role];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const createUserWithMember = async (
  full_name,
  email,
  password,
  role
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userQuery = `
      INSERT INTO users (full_name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, role;
    `;

    const userResult = await client.query(userQuery, [
      full_name,
      email,
      password,
      role,
    ]);

    const user = userResult.rows[0];

    const memberQuery = `
      INSERT INTO members
      (
        user_id,
        membership_expiry
      )
      VALUES
      (
        $1,
        CURRENT_DATE + INTERVAL '1 year'
      )
      RETURNING *;
    `;

    await client.query(memberQuery, [user.id]);

    await client.query("COMMIT");

    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const findUserByEmail = async (email) => {
  const query = `
    SELECT * FROM users
    WHERE email = $1;
  `;

  const result = await pool.query(query, [email]);

  return result.rows[0];
};

const updatePassword = async (email, password) => {
  const query = `
    UPDATE users
    SET password = $1
    WHERE email = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [password, email]);

  return result.rows[0];
};

module.exports = {
  createUser,
  createUserWithMember,
  findUserByEmail,
  updatePassword,
};