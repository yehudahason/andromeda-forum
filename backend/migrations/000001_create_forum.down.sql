-- =========================================================
-- FORUM MIGRATION - DOWN
-- Reverse 000001_create_forum.up.sql (PRODUCTION HARDENED)
-- =========================================================

-- =========================================================
-- DROP TRIGGERS (Explicitly drop before dropping functions)
-- =========================================================

DROP TRIGGER IF EXISTS replies_after_delete ON replies;
DROP TRIGGER IF EXISTS replies_after_insert ON replies;
DROP TRIGGER IF EXISTS replies_validate_insert ON replies;
DROP TRIGGER IF EXISTS replies_prevent_relation_changes ON replies;
DROP TRIGGER IF EXISTS replies_set_updated_at ON replies;

DROP TRIGGER IF EXISTS threads_after_delete ON threads;
DROP TRIGGER IF EXISTS threads_after_title_update ON threads;
DROP TRIGGER IF EXISTS threads_sync_title ON threads;
DROP TRIGGER IF EXISTS threads_guard_denormalized_update ON threads;
DROP TRIGGER IF EXISTS threads_after_insert ON threads;
DROP TRIGGER IF EXISTS threads_prevent_relation_changes ON threads;
DROP TRIGGER IF EXISTS threads_prepare_insert ON threads;
DROP TRIGGER IF EXISTS threads_set_updated_at ON threads;

DROP TRIGGER IF EXISTS forums_guard_denormalized_update ON forums;
DROP TRIGGER IF EXISTS forums_prepare_insert ON forums;
DROP TRIGGER IF EXISTS forums_set_updated_at ON forums;


-- =========================================================
-- DROP FUNCTIONS (Reverse dependency order)
-- =========================================================

DROP FUNCTION IF EXISTS forum_after_thread_delete();
DROP FUNCTION IF EXISTS forum_after_reply_delete();
DROP FUNCTION IF EXISTS forum_guard_thread_denormalized_update();
DROP FUNCTION IF EXISTS forum_guard_forum_denormalized_update();
DROP FUNCTION IF EXISTS forum_validate_reply_insert();
DROP FUNCTION IF EXISTS forum_prepare_forum_insert();
DROP FUNCTION IF EXISTS forum_after_reply_insert();
DROP FUNCTION IF EXISTS forum_after_thread_title_update();
DROP FUNCTION IF EXISTS forum_sync_thread_title();
DROP FUNCTION IF EXISTS forum_after_thread_insert();
DROP FUNCTION IF EXISTS forum_prevent_reply_relation_changes();
DROP FUNCTION IF EXISTS forum_prevent_thread_relation_changes();
DROP FUNCTION IF EXISTS forum_prepare_thread_insert();
DROP FUNCTION IF EXISTS forum_set_updated_at();


-- =========================================================
-- DROP INDEXES (Explicitly drop for safety)
-- =========================================================

DROP INDEX IF EXISTS idx_replies_thread_created_at;
DROP INDEX IF EXISTS idx_replies_created_at;
DROP INDEX IF EXISTS idx_replies_user_id;
DROP INDEX IF EXISTS idx_replies_thread_id;

DROP INDEX IF EXISTS idx_threads_notify;
DROP INDEX IF EXISTS idx_threads_forum_sticky_last_post;
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


