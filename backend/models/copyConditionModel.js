const pool=require("../config/db");
const list=async()=> (await pool.query(`SELECT e.*,c.barcode,b.title FROM copy_condition_events e
 JOIN book_copies c ON c.id=e.copy_id JOIN books b ON b.id=c.book_id
 ORDER BY e.created_at DESC LIMIT 300`)).rows;
const record=async(copyId,condition,userId,note)=>{
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const r=await client.query("SELECT * FROM book_copies WHERE id=$1 FOR UPDATE",[copyId]);
  if(!r.rows.length)throw new Error("Copy not found");
  const c=r.rows[0];
  if(c.circulation_status==="Issued"||c.circulation_status==="InTransit")throw new Error("Copy is in circulation");
  const beforeAvailable=c.circulation_status==="Available"&&["Good","Worn"].includes(c.condition);
  const afterAvailable=["Good","Worn"].includes(condition);
  const newStatus=afterAvailable?"Available":"Unavailable";
  await client.query("UPDATE book_copies SET condition=$2,circulation_status=$3 WHERE id=$1",[copyId,condition,newStatus]);
  if(beforeAvailable!==afterAvailable){
   const delta=afterAvailable?1:-1;
   const q=await client.query(`UPDATE books SET available_copies=available_copies+$2
    WHERE id=$1 AND available_copies+$2 BETWEEN 0 AND total_copies RETURNING id`,[c.book_id,delta]);
   if(!q.rows.length)throw new Error("Inventory reconciliation required");
  }
  const event=await client.query(`INSERT INTO copy_condition_events
   (copy_id,previous_condition,new_condition,reported_by,note)
   VALUES($1,$2,$3,$4,$5) RETURNING *`,[copyId,c.condition,condition,userId,note||null]);
  await client.query(`INSERT INTO inventory_movements(copy_id,from_branch_id,to_branch_id,movement_type,actor_user_id,note)
   VALUES($1,$2,$2,'Condition',$3,$4)`,[copyId,c.branch_id,userId,note||null]);
  await client.query("COMMIT");return event.rows[0];
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
};
module.exports={list,record};
