const pool = require("../config/db");
const listBranches = async () => (await pool.query("SELECT * FROM library_branches ORDER BY name")).rows;
const addBranch = async ({code,name,address}) => (await pool.query(
 "INSERT INTO library_branches(code,name,address) VALUES ($1,$2,$3) RETURNING *",
 [code,name,address || ""])).rows[0];
const listInventory = async branchId => (await pool.query(`
 SELECT c.*,b.title,b.author,b.isbn,lb.name AS branch_name
 FROM book_copies c JOIN books b ON b.id=c.book_id
 JOIN library_branches lb ON lb.id=c.branch_id
 WHERE ($1::bigint IS NULL OR c.branch_id=$1)
 ORDER BY c.id DESC LIMIT 500
`,[branchId || null])).rows;
const addCopy = async ({bookId,branchId,barcode,shelfLocation}) => {
 const client=await pool.connect();
 try {
  await client.query("BEGIN");
  const b=await client.query("SELECT id FROM books WHERE id=$1 FOR UPDATE",[bookId]);
  if(!b.rows.length) throw new Error("Book not found");
  const r=await client.query(`INSERT INTO book_copies(book_id,branch_id,barcode,shelf_location)
   VALUES($1,$2,$3,$4) RETURNING *`,[bookId,branchId,barcode,shelfLocation||null]);
  await client.query("UPDATE books SET total_copies=total_copies+1,available_copies=available_copies+1 WHERE id=$1",[bookId]);
  await client.query("COMMIT");return r.rows[0];
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
};
module.exports={listBranches,addBranch,listInventory,addCopy};
