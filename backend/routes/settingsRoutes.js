const router=require("express").Router();
const auth=require("../middleware/authMiddleware");
const role=require("../middleware/roleMiddleware");
const {getSettings,updateSettings,defaults}=require("../models/settingsModel");
router.use(auth);
router.get("/",role("admin","librarian"),async(req,res)=>{
 try{res.json({settings:await getSettings()});}
 catch(e){res.status(503).json({message:"Settings storage unavailable; migration may be pending"});}
});
router.patch("/",role("admin"),async(req,res)=>{
 const changes=req.body;
 if(!changes||typeof changes!=="object"||Array.isArray(changes)||!Object.keys(changes).length)
 return res.status(400).json({message:"Settings object required"});
 for(const [key,value] of Object.entries(changes)){
  if(!(key in defaults)||!Number.isSafeInteger(value)||value<0||value>3650)
   return res.status(400).json({message:"Invalid setting: "+key});
 }
 try{res.json({updated:await updateSettings(changes,req.user.id)});}
 catch(e){res.status(503).json({message:"Unable to update settings"});}
});
module.exports=router;
