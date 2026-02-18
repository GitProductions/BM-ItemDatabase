# 1. Create timestamped backup directory
BACKUP_TS=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_TS"
cd "$BACKUP_TS"

# 2. Backup all tables with timestamp
wrangler d1 execute bm_itemdb --command="SELECT * FROM items;" --json --remote > items.json
wrangler d1 execute bm_itemdb --command="SELECT * FROM submissions;" --json --remote > submissions.json
wrangler d1 execute bm_itemdb --command="SELECT * FROM suggestions;" --json --remote > suggestions.json
wrangler d1 execute bm_itemdb --command="SELECT * FROM users;" --json --remote > users.json
wrangler d1 execute bm_itemdb --command="SELECT * FROM api_tokens;" --json --remote > api_tokens.json

# 3. Get row counts for verification
wrangler d1 execute bm_itemdb --command="
SELECT 'items' as table_name, COUNT(*) as count FROM items
UNION ALL SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'suggestions', COUNT(*) FROM suggestions
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'api_tokens', COUNT(*) FROM api_tokens;
" --remote > row_counts.txt

cd ../..