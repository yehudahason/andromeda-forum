-- =========================================================
-- FORUM MIGRATION - DOWN
-- =========================================================


-- =========================================================
-- DROP REPLY TRIGGERS
-- =========================================================

DROP TRIGGER IF EXISTS replies_update_after_delete
ON replies;

DROP TRIGGER IF EXISTS replies_update_after_insert
ON replies;

DROP TRIGGER IF EXISTS replies_updated_at
ON replies;


-- =========================================================
-- DROP THREAD TRIGGERS
-- =========================================================

DROP TRIGGER IF EXISTS threads_update_forum_after_delete
ON threads;

DROP TRIGGER IF EXISTS threads_update_forum
ON threads;

DROP TRIGGER IF EXISTS threads_title_update
ON threads;

DROP TRIGGER IF EXISTS threads_set_initial_values
ON threads;

DROP TRIGGER IF EXISTS threads_updated_at
ON threads;


-- =========================================================
-- DROP FORUM TRIGGERS
-- =========================================================

DROP TRIGGER IF EXISTS forums_set_initial_dates
ON forums;

DROP TRIGGER IF EXISTS forums_updated_at
ON forums;


-- =========================================================
-- DROP FUNCTIONS
-- =========================================================

DROP FUNCTION IF EXISTS update_after_reply_delete();

DROP FUNCTION IF EXISTS update_after_reply_insert();

DROP FUNCTION IF EXISTS update_forum_after_thread_delete();

DROP FUNCTION IF EXISTS handle_thread_title_update();

DROP FUNCTION IF EXISTS update_forum_after_thread_insert();

DROP FUNCTION IF EXISTS handle_thread_insert();

DROP FUNCTION IF EXISTS set_forum_initial_dates();

DROP FUNCTION IF EXISTS update_updated_at_column();


-- =========================================================
-- DROP INDEXES
-- =========================================================

DROP INDEX IF EXISTS idx_replies_thread_created_at;
DROP INDEX IF EXISTS idx_replies_created_at;
DROP INDEX IF EXISTS idx_replies_user_id;
DROP INDEX IF EXISTS idx_replies_thread_id;

DROP INDEX IF EXISTS idx_threads_forum_last_post_date;
DROP INDEX IF EXISTS idx_threads_last_post_date;
DROP INDEX IF EXISTS idx_threads_created_at;
DROP INDEX IF EXISTS idx_threads_user_id;
DROP INDEX IF EXISTS idx_threads_forum_id;


-- =========================================================
-- DROP TABLES
-- =========================================================

DROP TABLE IF EXISTS replies;

DROP TABLE IF EXISTS threads;

DROP TABLE IF EXISTS forums;


-- =========================================================
-- REMOVE USER COLUMN
-- =========================================================

ALTER TABLE neon_auth."user"
DROP COLUMN IF EXISTS replies_count;