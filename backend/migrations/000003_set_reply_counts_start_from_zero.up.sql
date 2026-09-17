-- =========================================================
-- SET REPLY COUNTS TO START FROM 0
-- PostgreSQL
--
-- Keeps the existing forum behavior the same.
--
-- After this migration:
--   threads.messages_count = number of replies only
--   neon_auth."user".replies_count = number of replies only
--
-- A new thread starts with messages_count = 0.
-- Each reply increments both the thread count and author's user count.
-- Deleting replies recalculates/decrements the counts correctly.
-- =========================================================

BEGIN;

-- =========================================================
-- THREAD COUNT DEFINITION
-- Change from "opening post + replies" to "replies only".
-- =========================================================

ALTER TABLE threads
    ALTER COLUMN messages_count SET DEFAULT 0;

ALTER TABLE threads
    DROP CONSTRAINT IF EXISTS threads_messages_count_check;

ALTER TABLE threads
    ADD CONSTRAINT threads_messages_count_check
    CHECK (messages_count >= 0);


-- =========================================================
-- THREAD INITIAL VALUES
-- New threads must start with 0 replies.
-- =========================================================

CREATE OR REPLACE FUNCTION forum_prepare_thread_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'new thread user_id cannot be NULL';
    END IF;

    IF NEW.created_at IS NULL THEN
        NEW.created_at := clock_timestamp();
    END IF;

    -- replies only: a new thread has zero replies
    NEW.messages_count := 0;

    NEW.last_post_title := NEW.title;
    NEW.last_post_author_id := NEW.user_id;
    NEW.last_post_date := NEW.created_at;

    RETURN NEW;
END;
$$;


-- =========================================================
-- BACKFILL EXISTING THREAD COUNTS
--
-- The normal guard trigger prevents direct writes to messages_count.
-- Temporarily remove only that trigger while repairing stored counts.
-- The guard function itself is left unchanged.
-- =========================================================

DROP TRIGGER IF EXISTS threads_guard_denormalized_update ON threads;

UPDATE threads AS t
SET messages_count = (
    SELECT COUNT(*)::BIGINT
    FROM replies AS r
    WHERE r.thread_id = t.id
);

CREATE TRIGGER threads_guard_denormalized_update
BEFORE UPDATE OF
    messages_count,
    last_post_title,
    last_post_author_id,
    last_post_date
ON threads
FOR EACH ROW
EXECUTE FUNCTION forum_guard_thread_denormalized_update();


-- =========================================================
-- BACKFILL EXISTING USER REPLY COUNTS
-- Users with no replies are explicitly reset to 0.
-- =========================================================

UPDATE neon_auth."user" AS u
SET replies_count = COALESCE((
    SELECT COUNT(*)::BIGINT
    FROM replies AS r
    WHERE r.user_id = u.id
), 0);


-- =========================================================
-- REPLY AFTER INSERT
--
-- Existing logic is already correct for reply-only counts:
--   thread.messages_count += 1
--   forum.messages_count  += 1
--   user.replies_count    += 1
--
-- Recreate it here so this migration is self-contained and guarantees
-- the expected behavior after older migrations have run.
-- =========================================================

CREATE OR REPLACE FUNCTION forum_after_reply_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_forum_id BIGINT;
    v_thread_title TEXT;
BEGIN
    UPDATE threads
    SET
        messages_count = messages_count + 1,
        last_post_title = CASE
            WHEN last_post_date IS NULL OR NEW.created_at >= last_post_date
                THEN title
            ELSE last_post_title
        END,
        last_post_author_id = CASE
            WHEN last_post_date IS NULL OR NEW.created_at >= last_post_date
                THEN NEW.user_id
            ELSE last_post_author_id
        END,
        last_post_date = CASE
            WHEN last_post_date IS NULL OR NEW.created_at >= last_post_date
                THEN NEW.created_at
            ELSE last_post_date
        END
    WHERE id = NEW.thread_id
    RETURNING forum_id, title
    INTO v_forum_id, v_thread_title;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'thread % does not exist', NEW.thread_id;
    END IF;

    PERFORM 1
    FROM forums
    WHERE id = v_forum_id
    FOR UPDATE;

    -- Forum count intentionally remains:
    -- total forum messages = threads + replies.
    UPDATE forums
    SET
        messages_count = messages_count + 1,
        last_post_thread_id = CASE
            WHEN last_post_date IS NULL OR NEW.created_at >= last_post_date
                THEN NEW.thread_id
            ELSE last_post_thread_id
        END,
        last_post_title = CASE
            WHEN last_post_date IS NULL OR NEW.created_at >= last_post_date
                THEN v_thread_title
            ELSE last_post_title
        END,
        last_post_author_id = CASE
            WHEN last_post_date IS NULL OR NEW.created_at >= last_post_date
                THEN NEW.user_id
            ELSE last_post_author_id
        END,
        last_post_date = CASE
            WHEN last_post_date IS NULL OR NEW.created_at >= last_post_date
                THEN NEW.created_at
            ELSE last_post_date
        END
    WHERE id = v_forum_id;

    UPDATE neon_auth."user"
    SET replies_count = replies_count + 1
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$;


-- =========================================================
-- REPLY AFTER DELETE
--
-- Important change:
-- thread.messages_count is recalculated as COUNT(replies),
-- NOT 1 + COUNT(replies).
-- =========================================================

CREATE OR REPLACE FUNCTION forum_after_reply_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_thread_id BIGINT;
    v_forum_id BIGINT;
    v_thread_title TEXT;
    v_thread_user_id UUID;
    v_thread_created_at TIMESTAMPTZ;
    v_last_reply_id UUID;
    v_last_reply_user_id UUID;
    v_last_reply_created_at TIMESTAMPTZ;
    v_latest_thread_id BIGINT;
    v_latest_title TEXT;
    v_latest_author_id UUID;
    v_latest_date TIMESTAMPTZ;
BEGIN
    -- Decrement each affected user's reply count.
    UPDATE neon_auth."user" AS u
    SET replies_count = GREATEST(u.replies_count - d.deleted_count, 0)
    FROM (
        SELECT user_id, COUNT(*)::BIGINT AS deleted_count
        FROM deleted_replies
        WHERE user_id IS NOT NULL
        GROUP BY user_id
    ) AS d
    WHERE u.id = d.user_id;

    -- Recalculate each affected surviving thread.
    FOR v_thread_id IN
        SELECT DISTINCT thread_id
        FROM deleted_replies
    LOOP
        SELECT t.forum_id, t.title, t.user_id, t.created_at
        INTO v_forum_id, v_thread_title, v_thread_user_id, v_thread_created_at
        FROM threads AS t
        WHERE t.id = v_thread_id
        FOR UPDATE;

        -- During ON DELETE CASCADE from threads, the thread may already
        -- be gone. In that case there is nothing to recalculate here.
        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        v_last_reply_id := NULL;
        v_last_reply_user_id := NULL;
        v_last_reply_created_at := NULL;

        SELECT r.id, r.user_id, r.created_at
        INTO v_last_reply_id, v_last_reply_user_id, v_last_reply_created_at
        FROM replies AS r
        WHERE r.thread_id = v_thread_id
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT 1;

        UPDATE threads
        SET
            -- replies only
            messages_count = (
                SELECT COUNT(*)::BIGINT
                FROM replies AS r
                WHERE r.thread_id = v_thread_id
            ),
            last_post_title = v_thread_title,
            last_post_author_id = CASE
                WHEN v_last_reply_id IS NOT NULL THEN v_last_reply_user_id
                ELSE v_thread_user_id
            END,
            last_post_date = COALESCE(
                v_last_reply_created_at,
                v_thread_created_at
            )
        WHERE id = v_thread_id;
    END LOOP;

    -- Forum semantics stay unchanged:
    -- forum.messages_count = threads + replies.
    FOR v_forum_id IN
        SELECT DISTINCT t.forum_id
        FROM deleted_replies AS d
        JOIN threads AS t ON t.id = d.thread_id
    LOOP
        PERFORM 1
        FROM forums
        WHERE id = v_forum_id
        FOR UPDATE;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        v_latest_thread_id := NULL;
        v_latest_title := NULL;
        v_latest_author_id := NULL;
        v_latest_date := NULL;

        SELECT
            t.id,
            t.last_post_title,
            t.last_post_author_id,
            t.last_post_date
        INTO
            v_latest_thread_id,
            v_latest_title,
            v_latest_author_id,
            v_latest_date
        FROM threads AS t
        WHERE t.forum_id = v_forum_id
        ORDER BY t.last_post_date DESC NULLS LAST, t.id DESC
        LIMIT 1;

        UPDATE forums AS f
        SET
            messages_count =
                (
                    SELECT COUNT(*)::BIGINT
                    FROM threads AS t
                    WHERE t.forum_id = v_forum_id
                )
                +
                (
                    SELECT COUNT(*)::BIGINT
                    FROM replies AS r
                    JOIN threads AS t ON t.id = r.thread_id
                    WHERE t.forum_id = v_forum_id
                ),
            last_post_thread_id = v_latest_thread_id,
            last_post_title = COALESCE(v_latest_title, ''),
            last_post_author_id = v_latest_author_id,
            last_post_date = v_latest_date
        WHERE f.id = v_forum_id;
    END LOOP;

    RETURN NULL;
END;
$$;


-- =========================================================
-- ENSURE THE EXISTING TRIGGERS POINT TO THE CORRECT FUNCTIONS
-- =========================================================

DROP TRIGGER IF EXISTS threads_prepare_insert ON threads;
CREATE TRIGGER threads_prepare_insert
BEFORE INSERT ON threads
FOR EACH ROW
EXECUTE FUNCTION forum_prepare_thread_insert();

DROP TRIGGER IF EXISTS replies_after_insert ON replies;
CREATE TRIGGER replies_after_insert
AFTER INSERT ON replies
FOR EACH ROW
EXECUTE FUNCTION forum_after_reply_insert();

DROP TRIGGER IF EXISTS replies_after_delete ON replies;
CREATE TRIGGER replies_after_delete
AFTER DELETE ON replies
REFERENCING OLD TABLE AS deleted_replies
FOR EACH STATEMENT
EXECUTE FUNCTION forum_after_reply_delete();


-- =========================================================
-- COMMENTS
-- =========================================================

COMMENT ON COLUMN threads.messages_count
IS 'Total number of replies in the thread; opening post is not counted';

COMMENT ON COLUMN neon_auth."user".replies_count
IS 'Total number of replies currently authored by this user';

COMMIT;
