const pool = require("../config/db");

const getAllMembers = async () => {
  const query = `
    SELECT
      m.id,
      m.user_id,
      u.full_name,
      u.email,
      u.role,
      m.phone,
      m.address,
      m.membership_start,
      m.membership_expiry,
      m.membership_status,
      m.created_at
    FROM members m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.id ASC;
  `;

  const result = await pool.query(query);
  return result.rows;
};

const getMemberById = async (id) => {
  const query = `
    SELECT
      m.id,
      m.user_id,
      u.full_name,
      u.email,
      u.role,
      m.phone,
      m.address,
      m.membership_start,
      m.membership_expiry,
      m.membership_status,
      m.created_at
    FROM members m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = $1;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const createMember = async (
  user_id,
  phone,
  address,
  membership_start,
  membership_expiry
) => {
  const query = `
    INSERT INTO members
    (
      user_id,
      phone,
      address,
      membership_start,
      membership_expiry
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    user_id,
    phone,
    address,
    membership_start,
    membership_expiry,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateMember = async (
  id,
  phone,
  address,
  membership_start,
  membership_expiry,
  membership_status
) => {
  const query = `
    UPDATE members
    SET
      phone = $1,
      address = $2,
      membership_start = $3,
      membership_expiry = $4,
      membership_status = $5
    WHERE id = $6
    RETURNING *;
  `;

  const values = [
    phone,
    address,
    membership_start,
    membership_expiry,
    membership_status,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateMyProfile = async (
  user_id,
  full_name,
  phone,
  address
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userQuery = `
      UPDATE users
      SET full_name = $1
      WHERE id = $2
      RETURNING id, full_name, email, role;
    `;

    const userResult = await client.query(userQuery, [
      full_name,
      user_id,
    ]);

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const memberQuery = `
      UPDATE members
      SET
        phone = $1,
        address = $2
      WHERE user_id = $3
      RETURNING
        id,
        user_id,
        phone,
        address,
        membership_start,
        membership_expiry,
        membership_status,
        created_at;
    `;

    const memberResult = await client.query(memberQuery, [
      phone,
      address,
      user_id,
    ]);

    if (memberResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query("COMMIT");

    return {
      ...memberResult.rows[0],
      full_name: userResult.rows[0].full_name,
      email: userResult.rows[0].email,
      role: userResult.rows[0].role,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteMember = async (id) => {
  const query = `
    DELETE FROM members
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const getMemberByUserId = async (user_id) => {
  const query = `
    SELECT
      m.id,
      m.user_id,
      u.full_name,
      u.email,
      u.role,
      m.phone,
      m.address,
      m.membership_start,
      m.membership_expiry,
      m.membership_status,
      m.profile_image,
      m.created_at
    FROM members m
    JOIN users u ON m.user_id = u.id
    WHERE m.user_id = $1;
  `;

  const result = await pool.query(query, [user_id]);
  return result.rows[0];
};
const updateProfileImage = async (user_id, profile_image) => {
  const query = `
    UPDATE members
    SET profile_image = $1
    WHERE user_id = $2
    RETURNING
      id,
      user_id,
      phone,
      address,
      membership_start,
      membership_expiry,
      membership_status,
      profile_image,
      created_at;
  `;

  const result = await pool.query(query, [
    profile_image,
    user_id,
  ]);

  return result.rows[0];
};

const updateExpiredMemberships = async () => {
  const query = `
    UPDATE members
    SET membership_status = 'Expired'
    WHERE membership_expiry < CURRENT_DATE
      AND membership_status = 'Active'
    RETURNING *;
  `;

  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMyProfile,
  updateProfileImage,
  deleteMember,
  getMemberByUserId,
  updateExpiredMemberships,
};