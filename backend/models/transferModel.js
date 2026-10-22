const pool=require("../config/db");
const list=async()=> (await pool.query(`
 SELECT t.*,c.barcode,b.title FROM branch_transfers t
 JOIN book_copies c ON c.id=t.copy_id JOIN books b ON b.id=c.book_id
 ORDER BY t.requested_at DESC LIMIT 300`)).rows;
const request=async(copyId,destinationBranchId,userId)=>{
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const c=await client.query("SELECT * FROM book_copies WHERE id=$1 FOR UPDATE",[copyId]);
  if(!c.rows.length) throw new Error("Copy not found");
  if(c.rows[0].circulation_status!=="Available" || !["Good","Worn"].includes(c.rows[0].condition)) throw new Error("Copy not transferable");
  if(String(c.rows[0].branch_id)===String(destinationBranchId)) throw new Error("Destination must differ");
  const r=await client.query(`INSERT INTO branch_transfers(copy_id,source_branch_id,destination_branch_id,requested_by)
   VALUES($1,$2,$3,$4) RETURNING *`,[copyId,c.rows[0].branch_id,destinationBranchId,userId]);
  await client.query(`INSERT INTO branch_transfer_events(transfer_id,new_status,actor_user_id)
   VALUES($1,'Requested',$2)`,[r.rows[0].id,userId]);
  await client.query("COMMIT");return r.rows[0];
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
};
const transition=async(id,status,userId,note)=>{
 const transitions={Requested:["Approved","Rejected","Cancelled"],Approved:["Dispatched","Cancelled"],Dispatched:["Received"]};
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const t=await client.query("SELECT * FROM branch_transfers WHERE id=$1 FOR UPDATE",[id]);
  if(!t.rows.length) throw new Error("Transfer not found");
  const before=t.rows[0];
  if(!transitions[before.status]?.includes(status)) throw new Error("Invalid transfer transition");
  const copy=await client.query("SELECT * FROM book_copies WHERE id=$1 FOR UPDATE",[before.copy_id]);
  if(status==="Dispatched"){
   if(copy.rows[0].circulation_status!=="Available" || !["Good","Worn"].includes(copy.rows[0].condition)) throw new Error("Copy unavailable");
   await client.query("UPDATE book_copies SET circulation_status='InTransit' WHERE id=$1",[before.copy_id]);
   await client.query("UPDATE books SET available_copies=available_copies-1 WHERE id=$1 AND available_copies>0",[copy.rows[0].book_id]);
  }
  if(status==="Received"){
   if(copy.rows[0].circulation_status!=="InTransit") throw new Error("Copy not in transit");
   await client.query("UPDATE book_copies SET branch_id=$2,circulation_status='Available' WHERE id=$1",[before.copy_id,before.destination_branch_id]);
   await client.query("UPDATE books SET available_copies=available_copies+1 WHERE id=$1",[copy.rows[0].book_id]);
   await client.query(`INSERT INTO inventory_movements(copy_id,from_branch_id,to_branch_id,movement_type,actor_user_id,reference_id,note)
    VALUES($1,$2,$3,'Transfer',$4,$5,$6)`,[before.copy_id,before.source_branch_id,before.destination_branch_id,userId,id,note||null]);
  }
  const result=await client.query(`UPDATE branch_transfers SET status=$2,reviewed_by=$3,updated_at=NOW() WHERE id=$1 RETURNING *`,[id,status,userId]);
  await client.query(`INSERT INTO branch_transfer_events(transfer_id,old_status,new_status,actor_user_id,note)
   VALUES($1,$2,$3,$4,$5)`,[id,before.status,status,userId,note||null]);
  await client.query("COMMIT");return result.rows[0];
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
};
module.exports={list,request,transition};
