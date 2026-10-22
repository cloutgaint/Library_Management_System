const pool=require("../config/db");
const subscriptions=async()=> (await pool.query(`SELECT p.*,b.name AS branch_name FROM periodical_subscriptions p
 JOIN library_branches b ON b.id=p.branch_id ORDER BY p.created_at DESC LIMIT 300`)).rows;
const subscribe=async({branchId,title,issn,publisher,frequency,startsOn,endsOn})=>
 (await pool.query(`INSERT INTO periodical_subscriptions(branch_id,title,issn,publisher,frequency,starts_on,ends_on)
 VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[branchId,title,issn||null,publisher||null,frequency||null,startsOn||null,endsOn||null])).rows[0];
const issues=async(subscriptionId)=> (await pool.query(`SELECT * FROM periodical_issues
 WHERE ($1::bigint IS NULL OR subscription_id=$1) ORDER BY expected_on DESC NULLS LAST,id DESC LIMIT 500`,[subscriptionId||null])).rows;
const addIssue=async({subscriptionId,volume,issueNumber,expectedOn})=>
 (await pool.query(`INSERT INTO periodical_issues(subscription_id,volume,issue_number,expected_on)
 VALUES($1,$2,$3,$4) RETURNING *`,[subscriptionId,volume||null,issueNumber||null,expectedOn||null])).rows[0];
const updateIssue=async(id,status)=> (await pool.query(`UPDATE periodical_issues
 SET status=$2,received_on=CASE WHEN $2='Received' THEN CURRENT_DATE ELSE NULL END
 WHERE id=$1 RETURNING *`,[id,status])).rows[0];
module.exports={subscriptions,subscribe,issues,addIssue,updateIssue};
