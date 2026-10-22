-- READ ONLY. Run manually on the live database before any Phase 9 migration.
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position;
SELECT conrelid::regclass AS table_name,conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY 1,2;
SELECT COUNT(*) AS users FROM users;
SELECT role,COUNT(*) AS count FROM users GROUP BY role ORDER BY role;
