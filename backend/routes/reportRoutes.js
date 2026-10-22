const router=require("express").Router();
const auth=require("../middleware/authMiddleware");
const roles=require("../middleware/roleMiddleware");
const {getBorrowingReportController,getReportSummaryController}=require("../controllers/reportController");
router.use(auth,roles("admin","librarian"));
router.get("/borrowing",getBorrowingReportController);
router.get("/summary",getReportSummaryController);
module.exports=router;
