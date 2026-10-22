const pool = require("../config/db");
const getRoleDashboard = async (role, userId) => {
 if(role==="member"){
  const result=await pool.query(`
   SELECT
    COUNT(*) FILTER (WHERE bt.transaction_status='Issued')::int AS active_loans,
    COUNT(*) FILTER (WHERE bt.transaction_status='Returned')::int AS returned_loans,
    COUNT(*) FILTER (WHERE bt.transaction_status='Issued' AND bt.due_date<CURRENT_DATE)::int AS overdue_loans,
    COUNT(*) FILTER (WHERE bt.transaction_status='Issued' AND bt.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE+7)::int AS due_soon
   FROM members m LEFT JOIN borrow_transactions bt ON bt.member_id=m.id WHERE m.user_id=$1`,[userId]);
  const reservations=await pool.query(`SELECT COUNT(*)::int AS active_reservations FROM reservations r JOIN members m ON m.id=r.member_id
    WHERE m.user_id=$1 AND r.status IN ('Waiting','Ready')`,[userId]);
  const fines=await pool.query(`SELECT COALESCE(SUM(f.fine_amount),0)::numeric AS unpaid_fines FROM fines f
   JOIN members m ON m.id=f.member_id WHERE m.user_id=$1 AND f.payment_status='Unpaid'`,[userId]);
  const notifications=await pool.query("SELECT COUNT(*)::int AS unread_notifications FROM notifications WHERE user_id=$1 AND is_read=FALSE",[userId]);
  return {...result.rows[0],...reservations.rows[0],...fines.rows[0],...notifications.rows[0]};
 }
 const summary=await pool.query(`SELECT
  (SELECT COUNT(*)::int FROM books) AS catalog_titles,
  (SELECT COALESCE(SUM(total_copies),0)::int FROM books) AS physical_copies,
  (SELECT COALESCE(SUM(available_copies),0)::int FROM books) AS available_copies,
  (SELECT COUNT(*)::int FROM members) AS members,
  (SELECT COUNT(*)::int FROM borrow_transactions WHERE transaction_status='Issued') AS active_loans,
  (SELECT COUNT(*)::int FROM borrow_transactions WHERE transaction_status='Issued' AND due_date<CURRENT_DATE) AS overdue_loans,
  (SELECT COUNT(*)::int FROM reservations WHERE status='Waiting') AS waiting_reservations,
  (SELECT COUNT(*)::int FROM reservations WHERE status='Ready') AS ready_reservations,
  (SELECT COALESCE(SUM(fine_amount),0)::numeric FROM fines WHERE payment_status='Unpaid') AS unpaid_fines`);
 return summary.rows[0];
};
module.exports={getRoleDashboard};
