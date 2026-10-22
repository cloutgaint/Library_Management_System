const router=require("express").Router();
const auth=require("../middleware/authMiddleware");
const role=require("../middleware/roleMiddleware");
const model=require("../models/copyConditionModel");
router.use(auth,role("admin","librarian"));
router.get("/",async(req,res)=>{try{res.json(await model.list());}catch(e){res.status(500).json({message:"Unable to load condition events"});}});
router.post("/",async(req,res)=>{
 if(process.env.LMS_PHASE7_INVENTORY_ENABLED!=="true")return res.status(503).json({message:"Inventory writes disabled until reconciliation"});
 const {copyId,condition,note}=req.body;
 if(!Number.isSafeInteger(Number(copyId))||!["Good","Worn","Damaged","Lost","Repair"].includes(condition))
  return res.status(400).json({message:"Valid copy and condition required"});
 try{res.status(201).json(await model.record(copyId,condition,req.user.id,note));}
 catch(e){res.status(/circulation|reconciliation/.test(e.message)?409:500).json({message:e.message});}
});
module.exports=router;
