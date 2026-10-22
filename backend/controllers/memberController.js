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
      membership_status || "Active"
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

module.exports = {
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