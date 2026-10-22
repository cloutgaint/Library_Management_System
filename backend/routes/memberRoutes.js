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
} = require("../controllers/memberController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
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
  uploadMiddleware.single("profile_image"),
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
  roleMiddleware("admin"),
  editMember
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  removeMember
);

module.exports = router;