const {getBorrowingReport,getReportSummary}=require("../models/reportModel");
const getBorrowingReportController=async(req,res)=>{
 const {status,from,to}=req.query;
 if(status&&!["Issued","Returned"].includes(status))return res.status(400).json({message:"Invalid status"});
 const date=/^\\d{4}-\\d{2}-\\d{2}$/;
 if((from&&!date.test(from))||(to&&!date.test(to))||(from&&to&&from>to))
 return res.status(400).json({message:"Invalid date range"});
 const page=Number(req.query.page||1),pageSize=Number(req.query.pageSize||50);
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>200)
 return res.status(400).json({message:"Invalid pagination"});
 try{res.json({message:"Borrowing report generated successfully",
 report:await getBorrowingReport({status,from,to,limit:pageSize,offset:(page-1)*pageSize}),page,pageSize});}
 catch(e){console.error("Report failed",e);res.status(500).json({message:"Failed to generate borrowing report"});}
};
const getReportSummaryController=async(req,res)=>{
 try{res.json({summary:await getReportSummary()});}
 catch(e){console.error("Summary failed",e);res.status(500).json({message:"Failed to generate summary"});}
};
module.exports={getBorrowingReportController,getReportSummaryController};
