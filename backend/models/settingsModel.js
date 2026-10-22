const pool=require("../config/db");
const defaults={loan_days:14,max_renewals:2,max_active_loans:5,fine_per_day:5,reservation_pickup_days:2};
const getSettings=async()=>{const r=await pool.query("SELECT key,value FROM library_settings");
 return {...defaults,...Object.fromEntries(r.rows.map(x=>[x.key,x.value]))};};
const updateSettings=async(changes,userId)=>{
 const client=await pool.connect();
 try{await client.query("BEGIN");const result={};
 for(const [key,value] of Object.entries(changes)){
  const prev=await client.query("SELECT value FROM library_settings WHERE key=$1 FOR UPDATE",[key]);
  await client.query(`INSERT INTO library_settings(key,value,updated_by) VALUES($1,$2::jsonb,$3)
   ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=NOW()`,[key,JSON.stringify(value),userId]);
  await client.query(`INSERT INTO library_settings_audit(key,previous_value,new_value,actor_user_id)
   VALUES($1,$2::jsonb,$3::jsonb,$4)`,[key,prev.rows.length?JSON.stringify(prev.rows[0].value):null,JSON.stringify(value),userId]);
  result[key]=value;
 }
 await client.query("COMMIT");return result;
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
};
module.exports={getSettings,updateSettings,defaults};
