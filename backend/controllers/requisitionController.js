const {
  createRequisition, listMyRequisitions, listRequisitions, updateRequisitionStatus
} = require("../models/requisitionModel");

const create = async (req, res) => {
  try {
    const { title, author, isbn, reason } = req.body;
    if (typeof title !== "string" || !title.trim() || title.length > 255 ||
        typeof author !== "string" || !author.trim() || author.length > 255 ||
        (isbn != null && (typeof isbn !== "string" || isbn.length > 32)) ||
        (reason != null && (typeof reason !== "string" || reason.length > 2000))) {
      return res.status(400).json({ message: "Invalid requisition details" });
    }
    const item = await createRequisition(req.user.id, {
      title: title.trim(), author: author.trim(), isbn: isbn?.trim(), reason: reason?.trim()
    });
    return res.status(201).json(item);
  } catch (error) {
    const known = { "Member profile not found": 404, "Active requisition already exists": 409 };
    const code = known[error.message] || 500;
    return res.status(code).json({ message: code === 500 ? "Unable to create requisition" : error.message });
  }
};

const mine = async (req, res) => {
  try { return res.json(await listMyRequisitions(req.user.id)); }
  catch (error) { return res.status(500).json({ message: "Unable to load requisitions" }); }
};
const all = async (req, res) => {
  try { return res.json(await listRequisitions()); }
  catch (error) { return res.status(500).json({ message: "Unable to load requisitions" }); }
};
const updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!["Approved","Rejected","Ordered","Acquired"].includes(status) ||
        (note != null && (typeof note !== "string" || note.length > 2000))) {
      return res.status(400).json({ message: "Invalid status or note" });
    }
    return res.json(await updateRequisitionStatus(req.params.id, req.user.id, status, note));
  } catch (error) {
    const code = error.message === "Requisition not found" ? 404 :
      error.message === "Invalid requisition status transition" ? 409 : 500;
    return res.status(code).json({ message: code === 500 ? "Unable to update requisition" : error.message });
  }
};
module.exports = { create, mine, all, updateStatus };
