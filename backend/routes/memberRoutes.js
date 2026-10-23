const express = require("express");

const router = express.Router();

const {
  getMembers,
  getMember,
  addMember,
  editMember,
  updateMyMemberProfile,
  uploadProfileImage,
  removeMember,
  getMyProfile,
  checkMembershipExpiry,
  changeMembershipStatus,
} = require("../controllers/memberController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const multer = require("multer");
const handleProfileImageUpload = (req, res, next) => {
  uploadMiddleware.single("profile_image")(req, res, (err) => {
    if (!err) return next();
    console.error("Profile image upload middleware error:", err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Profile image must be 5 MB or smaller." : err.message });
    }
    if (err.message && err.message.startsWith("Only JPG")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Profile image upload could not be completed. Check backend logs and upload directory permissions." });
  });
};
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getMembers
);

router.get(
  "/profile",
  authMiddleware,
  getMyProfile
);

router.put(
  "/profile",
  authMiddleware,
  updateMyMemberProfile
);
router.put(
  "/profile/image",
  authMiddleware,
  handleProfileImageUpload,
  uploadProfileImage
);

router.get(
  "/check-expiry",
  authMiddleware,
  roleMiddleware("admin"),
  checkMembershipExpiry
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getMember
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  addMember
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  editMember
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  changeMembershipStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  removeMember
);

module.exports = router;