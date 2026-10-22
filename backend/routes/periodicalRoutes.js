const router=require("express").Router();
const auth=require("../middleware/authMiddleware");
const role=require("../middleware/roleMiddleware");
const model=require("../models/periodicalModel");
const {requireBranchAccess,branchFromBody}=require("../middleware/branchAccessMiddleware");
router.use(auth);
const staff=role("admin","librarian");
const handler=fn=>async(req,res)=>{try{res.json(await fn(req));}catch(e){
 res.status(e.code==="23505"?409:e.code==="23503"?404:500).json({message:"Periodical operation failed"});
}};
router.get("/subscriptions",handler(()=>model.subscriptions()));
router.post("/subscriptions",staff,requireBranchAccess(branchFromBody("branchId")),handler(req=>{
 const {branchId,title,issn,publisher,frequency,startsOn,endsOn}=req.body;
 if(!branchId||typeof title!=="string"||!title.trim())throw new Error("Invalid subscription");
 return model.subscribe({branchId,title:title.trim(),issn,publisher,frequency,startsOn,endsOn});
}));
router.get("/issues",handler(req=>model.issues(req.query.subscriptionId)));
router.post("/issues",staff,handler(req=>{
 if(!req.body.subscriptionId)throw new Error("Subscription required");
 return model.addIssue(req.body);
}));
router.patch("/issues/:id",staff,handler(req=>{
 if(!["Expected","Received","Missing"].includes(req.body.status))throw new Error("Invalid status");
 return model.updateIssue(req.params.id,req.body.status);
}));
module.exports=router;
