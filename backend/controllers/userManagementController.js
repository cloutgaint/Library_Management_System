const bcrypt = require("bcrypt");
const crypto = require("node:crypto");

const {
  normalizeEmail,
  validateEmail,
  validateFullName,
  toPublicUser,
} = require("../services/accountPolicy");

const { sendAccountLink } = require("../services/accountTokenService");

const {
  createLibrarian,
  createMemberAccount,
  emailExists,
  getLibrarianById,
  listLibrarians,
  replaceLibrarianBranches,
  setLibrarianActive,
  updateLibrarianDetails,
} = require("../models/userModel");

const isPositiveId = (value) => /^[1-9]\d{0,17}$/.test(String(value));

// Accounts created by staff get a password nobody knows; the owner sets
// their own through the emailed invitation link.
const unusablePasswordHash = () => bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);

const parseBranchIds = (value) => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every(isPositiveId)) return null;
  return [...new Set(value.map(String))];
};

const validateAccountDetails = (body) => {
  const email = normalizeEmail(body.email);
  const error = validateFullName(body.full_name) || validateEmail(email);
  return { error, email, fullName: typeof body.full_name === "string" ? body.full_name.trim() : "" };
};

const sendError = (res, error, fallback) => {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error.code === "23505") {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  console.error(`${fallback}:`, error.message);
  return res.status(500).json({ message: fallback });
};

const librarianResponse = (librarian) => ({
  ...toPublicUser(librarian),
  branches: librarian.branches,
  password_set: Boolean(librarian.password_changed_at),
});

const getLibrarians = async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const status = ["active", "inactive"].includes(req.query.status) ? req.query.status : "all";
    const librarians = await listLibrarians({ search, status });

    res.json({ librarians: librarians.map((l) => ({ ...toPublicUser(l), branches: l.branches })) });
  } catch (error) {
    sendError(res, error, "Failed to fetch librarians");
  }
};

const getLibrarian = async (req, res) => {
  if (!isPositiveId(req.params.id)) {
    return res.status(400).json({ message: "Invalid librarian id" });
  }

  try {
    const librarian = await getLibrarianById(req.params.id);

    if (!librarian) {
      return res.status(404).json({ message: "Librarian not found" });
    }

    res.json({ librarian: librarianResponse(librarian) });
  } catch (error) {
    sendError(res, error, "Failed to fetch librarian");
  }
};

const addLibrarian = async (req, res) => {
  const body = req.body || {};

  // This endpoint only ever creates librarians; any other requested role is refused.
  if (body.role !== undefined && body.role !== "librarian") {
    return res.status(403).json({ message: "Only librarian accounts can be created here" });
  }

  const { error, email, fullName } = validateAccountDetails(body);
  const branchIds = parseBranchIds(body.branch_ids);

  if (error) return res.status(400).json({ message: error });
  if (!branchIds) return res.status(400).json({ message: "branch_ids must be a list of branch ids" });

  try {
    if (await emailExists(email)) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const id = await createLibrarian({
      fullName,
      email,
      passwordHash: await unusablePasswordHash(),
      branchIds,
      createdBy: req.user.id,
    });

    const librarian = await getLibrarianById(id);
    const invitationSent = await sendAccountLink(librarian, "invite");

    res.status(201).json({
      message: invitationSent
        ? "Librarian created. An invitation to set a password has been emailed."
        : "Librarian created, but the invitation email could not be sent. Use “Send password link” to retry.",
      invitation_sent: invitationSent,
      librarian: librarianResponse(librarian),
    });
  } catch (error) {
    sendError(res, error, "Failed to create librarian");
  }
};

const editLibrarian = async (req, res) => {
  if (!isPositiveId(req.params.id)) {
    return res.status(400).json({ message: "Invalid librarian id" });
  }

  const { error, email, fullName } = validateAccountDetails(req.body || {});

  if (error) return res.status(400).json({ message: error });

  try {
    if (await emailExists(email, req.params.id)) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const updated = await updateLibrarianDetails(req.params.id, { fullName, email }, req.user.id);

    if (!updated) {
      return res.status(404).json({ message: "Librarian not found" });
    }

    res.json({
      message: "Librarian updated",
      librarian: librarianResponse(await getLibrarianById(req.params.id)),
    });
  } catch (error) {
    sendError(res, error, "Failed to update librarian");
  }
};

const changeLibrarianStatus = async (req, res) => {
  if (!isPositiveId(req.params.id)) {
    return res.status(400).json({ message: "Invalid librarian id" });
  }

  if (typeof req.body?.is_active !== "boolean") {
    return res.status(400).json({ message: "is_active must be true or false" });
  }

  try {
    const updated = await setLibrarianActive(req.params.id, req.body.is_active, req.user.id);

    if (!updated) {
      return res.status(404).json({ message: "Librarian not found" });
    }

    res.json({
      message: req.body.is_active ? "Librarian activated" : "Librarian deactivated",
      librarian: librarianResponse(await getLibrarianById(req.params.id)),
    });
  } catch (error) {
    sendError(res, error, "Failed to change librarian status");
  }
};

const setLibrarianBranches = async (req, res) => {
  if (!isPositiveId(req.params.id)) {
    return res.status(400).json({ message: "Invalid librarian id" });
  }

  const branchIds = parseBranchIds(req.body?.branch_ids);

  if (!branchIds || req.body?.branch_ids === undefined) {
    return res.status(400).json({ message: "branch_ids must be a list of branch ids" });
  }

  try {
    const updated = await replaceLibrarianBranches(req.params.id, branchIds, req.user.id);

    if (!updated) {
      return res.status(404).json({ message: "Librarian not found" });
    }

    res.json({
      message: "Branch assignments updated",
      librarian: librarianResponse(await getLibrarianById(req.params.id)),
    });
  } catch (error) {
    sendError(res, error, "Failed to update branch assignments");
  }
};

// Emails an invitation if the librarian never set a password, otherwise a reset link.
const sendLibrarianPasswordLink = async (req, res) => {
  if (!isPositiveId(req.params.id)) {
    return res.status(400).json({ message: "Invalid librarian id" });
  }

  try {
    const librarian = await getLibrarianById(req.params.id);

    if (!librarian) {
      return res.status(404).json({ message: "Librarian not found" });
    }

    if (!librarian.is_active) {
      return res.status(409).json({ message: "Activate the account before sending a password link" });
    }

    const purpose = librarian.password_changed_at ? "reset" : "invite";
    const sent = await sendAccountLink(librarian, purpose);

    if (!sent) {
      return res.status(502).json({ message: "The email could not be sent. Check the email service configuration." });
    }

    res.json({
      message: purpose === "invite" ? "Invitation link sent" : "Password reset link sent",
    });
  } catch (error) {
    sendError(res, error, "Failed to send password link");
  }
};

// Staff-created member accounts (Admin or Librarian). Role is always 'member'.
const addMemberAccount = async (req, res) => {
  const body = req.body || {};

  if (body.role !== undefined && body.role !== "member") {
    return res.status(403).json({ message: "Only member accounts can be created here" });
  }

  const { error, email, fullName } = validateAccountDetails(body);

  if (error) return res.status(400).json({ message: error });

  try {
    if (await emailExists(email)) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const member = await createMemberAccount({
      fullName,
      email,
      passwordHash: await unusablePasswordHash(),
      createdBy: req.user.id,
      phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "",
      address: typeof body.address === "string" ? body.address.trim() : "",
    });

    const invitationSent = await sendAccountLink(member, "invite");

    res.status(201).json({
      message: invitationSent
        ? "Member created. An invitation to set a password has been emailed."
        : "Member created, but the invitation email could not be sent. The member can use “Forgot password” to set one.",
      invitation_sent: invitationSent,
      member: { ...toPublicUser(member), member_id: member.member_id },
    });
  } catch (error) {
    sendError(res, error, "Failed to create member");
  }
};

module.exports = {
  getLibrarians,
  getLibrarian,
  addLibrarian,
  editLibrarian,
  changeLibrarianStatus,
  setLibrarianBranches,
  sendLibrarianPasswordLink,
  addMemberAccount,
};
