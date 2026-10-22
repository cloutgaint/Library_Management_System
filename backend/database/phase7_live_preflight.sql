-- Phase 7 read-only preflight: run against LIVE database before migration.
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public' AND table_name IN
 ('books','borrow_transactions','reservations','library_branches','book_copies','branch_transfers')
 ORDER BY table_name;
SELECT column_name,data_type,is_nullable FROM information_schema.columns
 WHERE table_schema='public' AND table_name IN ('books','borrow_transactions','reservations')
 ORDER BY table_name,ordinal_position;
SELECT b.id,b.title,b.total_copies,b.available_copies,
 COUNT(bt.id) FILTER(WHERE bt.transaction_status='Issued') AS active_loans,
 b.total_copies-b.available_copies AS unavailable_total
 FROM books b LEFT JOIN borrow_transactions bt ON bt.book_id=b.id
 GROUP BY b.id,b.title,b.total_copies,b.available_copies
 ORDER BY b.id;
SELECT bt.id,bt.member_id,bt.book_id,bt.issue_date,bt.due_date
 FROM borrow_transactions bt WHERE bt.transaction_status='Issued'
 ORDER BY bt.book_id,bt.id;
SELECT r.book_id,r.status,COUNT(*) AS count
 FROM reservations r WHERE r.status IN ('Waiting','Ready')
 GROUP BY r.book_id,r.status ORDER BY r.book_id,r.status;
