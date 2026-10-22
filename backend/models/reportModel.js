const pool=require("../config/db");
const getBorrowingReport=async({status,from,to,limit=50,offset=0}={})=>{
 const values=[status||null,from||null,to||null,limit,offset];
 const result=await pool.query(`SELECT bt.id,bt.book_id,b.title,bt.member_id,u.full_name,
 bt.issue_date,bt.due_date,bt.return_date,bt.transaction_status
 FROM borrow_transactions bt JOIN books b ON b.id=bt.book_id
 JOIN members m ON m.id=bt.member_id JOIN users u ON u.id=m.user_id
 WHERE ($1::text IS NULL OR bt.transaction_status=$1)
 AND ($2::date IS NULL OR bt.issue_date >= $2)
 AND ($3::date IS NULL OR bt.issue_date <= $3)
 ORDER BY bt.issue_date DESC,bt.id DESC LIMIT $4 OFFSET $5`,values);
 return result.rows;
};
const getReportSummary=async()=> (await pool.query(`SELECT
 COUNT(*)::int AS total_transactions,
 COUNT(*) FILTER(WHERE transaction_status='Issued')::int AS active_loans,
 COUNT(*) FILTER(WHERE transaction_status='Returned')::int AS returned_loans,
 COUNT(*) FILTER(WHERE transaction_status='Issued' AND due_date<CURRENT_DATE)::int AS overdue_loans
 FROM borrow_transactions`)).rows[0];
module.exports={getBorrowingReport,getReportSummary};
