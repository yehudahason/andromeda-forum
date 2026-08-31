-- 1. Insert test thread and reply
INSERT INTO forums (name) VALUES ('Test Forum');
INSERT INTO threads (forum_id, user_id, title, content) VALUES (1, 2147f6d2-fd51-4ee0-bdb8-1db49803c9a3, 'Test Thread', 'Body');
INSERT INTO replies (thread_id, user_id, post) VALUES (1, 2147f6d2-fd51-4ee0-bdb8-1db49803c9a3, 'Test Reply');

-- Check count (should be 1)
SELECT replies_count FROM neon_auth."user" WHERE id = 2147f6d2-fd51-4ee0-bdb8-1db49803c9a3;

-- 2. Delete the THREAD directly (triggering FK CASCADE)
DELETE FROM threads WHERE id = 1;

-- 3. Check count again (it will still be 1, because the trigger was skipped!)
SELECT replies_count FROM neon_auth."user" WHERE id = 2147f6d2-fd51-4ee0-bdb8-1db49803c9a3;