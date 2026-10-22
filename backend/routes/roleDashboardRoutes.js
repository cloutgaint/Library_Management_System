const router=require("express").Router();
const auth=require("../middleware/authMiddleware");
const {getRoleDashboard}=require("../models/roleDashboardModel");
router.get("/",auth,async(req,res)=>{
 if(!["admin","librarian","member"].includes(req.user.role))return res.status(403).json({message:"Access denied"});
 try{res.json({overview:await getRoleDashboard(req.user.role,req.user.id)});}
 catch(e){console.error("Role dashboard error",e);res.status(500).json({message:"Unable to load dashboard"});}
});
module.exports=router;
