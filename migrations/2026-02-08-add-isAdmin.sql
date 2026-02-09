-- example execute function - wrangler d1 execute bm_itemdb --local --file=./migrations/2026-02-08-add-isAdmin.sql


-- COMPLETED 
ALTER TABLE users ADD COLUMN isAdmin INTEGER NOT NULL DEFAULT 0;
