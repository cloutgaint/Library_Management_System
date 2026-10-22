const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMyProfile,
  updateProfileImage,
  deleteMember,
  getMemberByUserId,
  updateExpiredMemberships,
} = require("../models/memberModel");

const { createNotification } = require("../models/notificationModel");
const pool = require("../config/db");

const getMembers = async (req, res) => {
  try {
    const members = await getAllMembers();

    res.status(200).json({
      message: "Members fetched successfully",
      members,
    });
  } catch (error) {
    console.error("Get Members Error:", error);

    res.status(500).json({
      message: "Failed to fetch members",
    });
  }
};

const getMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await getMemberById(id);

    if (!member) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    res.status(200).json({
      message: "Member fetched successfully",
      member,
    });
  } catch (error) {
    console.error("Get Member Error:", error);

    res.status(500).json({
      message: "Failed to fetch member",
    });
  }
};

const addMember = async (req, res) => {
  try {
    const {
      user_id,
      phone,
      address,
      membership_start,
      membership_expiry,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id is required",
      });
    }

    if (!membership_expiry) {
      return res.status(400).json({
        message: "membership_expiry is required",
      });
    }

    // Membership records belong to member accounts only, never to staff.
    const owner = await pool.query("SELECT role FROM users WHERE id = $1", [user_id]);

    if (owner.rows[0]?.role !== "member") {
      return res.status(400).json({
        message: "Memberships can only be created for member accounts",
      });
    }

    const member = await createMember(
      user_id,
      phone || "",
      address || "",
      membership_start || null,
      membership_expiry
    );

    await createNotification(
      user_id,
      "Membership",
      "Welcome to the Library",
      "Your library membership has been created successfully."
    );

    res.status(201).json({
      message: "Member created successfully",
      member,
    });
  } catch (error) {
    console.error("Create Member Error:", error);

    res.status(500).json({
      message: "Failed to create member",
    });
  }
};

const editMember = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      phone,
      address,
      membership_start,
      membership_expiry,
      membership_status,
    } = req.body;

    const member = await updateMember(
      id,
      phone || "",
      address || "",
      membership_start || null,
      membership_expiry,
      membership_status
    );

    if (!member) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    res.status(200).json({
      message: "Member updated successfully",
      member,
    });
  } catch (error) {
    console.error("Update Member Error:", error);

    res.status(500).json({
      message: "Failed to update member",
    });
  }
};

const updateMyMemberProfile = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      full_name,
      phone,
      address,
    } = req.body;

    if (!full_name) {
      return res.status(400).json({
        message: "Full name is required",
      });
    }

    const member = await updateMyProfile(
      user_id,
      full_name,
      phone || "",
      address || ""
    );

    if (!member) {
      return res.status(404).json({
        message: "Member profile not found",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      member,
    });
  } catch (error) {
    console.error("Update My Profile Error:", error);

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await deleteMember(id);

    if (!member) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    res.status(200).json({
      message: "Member deleted successfully",
      member,
    });
  } catch (error) {
    console.error("Delete Member Error:", error);

    res.status(500).json({
      message: "Failed to delete member",
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user_id = req.user.id;

    const member = await getMemberByUserId(user_id);

    if (!member) {
      return res.status(404).json({
        message: "Member profile not found",
      });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      member,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    const user_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        message: "Profile image is required",
      });
    }

    const profile_image = `/uploads/${req.file.filename}`;

    const member = await updateProfileImage(
      user_id,
      profile_image
    );

    if (!member) {
      return res.status(404).json({
        message: "Member profile not found",
      });
    }

    res.status(200).json({
      message: "Profile image uploaded successfully",
      member,
    });
  } catch (error) {
    console.error("Upload Profile Image Error:", error);

    res.status(500).json({
      message: "Failed to upload profile image",
    });
  }
};

const checkMembershipExpiry = async (req, res) => {
  try {
    const expiredMembers = await updateExpiredMemberships();

    res.status(200).json({
      message: "Membership expiry check completed",
      expiredCount: expiredMembers.length,
      expiredMembers,
    });
  } catch (error) {
    console.error("Membership Expiry Error:", error);

    res.status(500).json({
      message: "Failed to check membership expiry",
    });
  }
};


// Status transitions are audited when the Phase 3 migration has been applied.
const changeMembershipStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body || {};
  if (!["Active", "Suspended"].includes(status)) {
    return res.status(400).json({ message: "Status must be Active or Suspended" });
  }
  if (status === "Suspended" && (!reason || !String(reason).trim())) {
    return res.status(400).json({ message: "Suspension reason is required" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id, membership_status, membership_expiry FROM members WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (!existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Member not found" });
    }
    if (status === "Active" && existing.rows[0].membership_expiry < new Date()) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Renew expired membership before reactivation" });
    }
    const updated = await client.query(
      `UPDATE members SET membership_status = $1,
       suspended_at = CASE WHEN $1 = 'Suspended' THEN NOW() ELSE NULL END,
       suspension_reason = CASE WHEN $1 = 'Suspended' THEN $2 ELSE NULL END
       WHERE id = $3 RETURNING *`,
      [status, status === "Suspended" ? String(reason).trim() : null, id]
    );
    await client.query(
      `INSERT INTO membership_status_history
       (member_id, previous_status, new_status, reason, changed_by_user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, existing.rows[0].membership_status, status, reason || null, req.user.id]
    );
    await client.query("COMMIT");
    return res.status(200).json({ message: "Membership status updated", member: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Membership status update error:", error);
    return res.status(500).json({ message: "Failed to update membership status; ensure Phase 3 migration is applied" });
  } finally {
    client.release();
  }
};

module.exports = {
  changeMembershipStatus,
  getMembers,
  getMember,
  addMember,
  editMember,
  updateMyMemberProfile,
  uploadProfileImage,
  removeMember,
  getMyProfile,
  checkMembershipExpiry,
};