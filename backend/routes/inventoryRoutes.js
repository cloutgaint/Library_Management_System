const express=require("express");
const router=express.Router();
const auth=require("../middleware/authMiddleware");
const roles=require("../middleware/roleMiddleware");
const inventory=require("../models/inventoryModel");
const transfers=require("../models/transferModel");
const {requireBranchAccess,branchFromBody}=require("../middleware/branchAccessMiddleware");
router.use(auth);
const staff=roles("admin","librarian");
const requireReconciled=(req,res,next)=>{
 if(process.env.LMS_PHASE7_INVENTORY_ENABLED!=="true") return res.status(503).json({message:"Branch inventory writes disabled until reconciliation is verified"});
 next();
};
const run=fn=>async(req,res)=>{try{const result=await fn(req);res.json(result);}catch(e){
 const conflict=/unavailable|transferable|transition|differ|duplicate/i.test(e.message);
 res.status(e.code==="23505"?409:e.code==="23503"?404:conflict?409:500)
 .json({message:e.code==="23505"?"Duplicate record":e.message});
}};
router.get("/branches",run(()=>inventory.listBranches()));
router.post("/branches",roles("admin"),run(req=>{
 const {code,name,address}=req.body;
 if(!code?.trim()||!name?.trim())throw new Error("Branch code and name required");
 return inventory.addBranch({code:code.trim(),name:name.trim(),address});
}));
router.get("/copies",run(req=>inventory.listInventory(req.query.branchId)));
router.post("/copies",staff,requireBranchAccess(branchFromBody("branchId")),requireReconciled,run(req=>{
 const {bookId,branchId,barcode,shelfLocation}=req.body;
 if(!Number.isSafeInteger(Number(bookId))||!Number.isSafeInteger(Number(branchId))||!barcode?.trim())throw new Error("Valid book, branch and barcode required");
 return inventory.addCopy({bookId,branchId,barcode:barcode.trim(),shelfLocation});
}));
router.get("/transfers",staff,run(()=>transfers.list()));
router.post("/transfers",staff,requireReconciled,run(req=>{
 const {copyId,destinationBranchId}=req.body;
 if(!Number.isSafeInteger(Number(copyId))||!Number.isSafeInteger(Number(destinationBranchId)))throw new Error("Invalid copy or branch");
 return transfers.request(copyId,destinationBranchId,req.user.id);
}));
router.patch("/transfers/:id/status",staff,requireReconciled,run(req=>{
 if(!["Approved","Rejected","Cancelled","Dispatched","Received"].includes(req.body.status))throw new Error("Invalid status");
 return transfers.transition(req.params.id,req.body.status,req.user.id,req.body.note);
}));
module.exports=router;
