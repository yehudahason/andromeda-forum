BEGIN;

-- =========================================================
-- ADD forums.last_post_thread_id
-- Keeps the parent thread ID of the latest forum activity.
-- =========================================================

ALTER TABLE forums
ADD COLUMN last_post_thread_id BIGINT;

ALTER TABLE forums
ADD CONSTRAINT forums_last_post_thread_fk
    FOREIGN KEY (last_post_thread_id)
    REFERENCES threads(id)
    ON DELETE SET NULL;

CREATE INDEX idx_forums_last_post_thread_id
    ON forums(last_post_thread_id);

-- Backfill existing forums from the same ordering already used by the
-- migration when determining the most recently active thread.
UPDATE forums AS f
SET last_post_thread_id = (
    SELECT t.id
    FROM threads AS t
    WHERE t.forum_id = f.id
    ORDER BY t.last_post_date DESC NULLS LAST, t.id DESC
    LIMIT 1
);

-- =========================================================
-- FORUM INITIAL VALUES
-- =========================================================

CREATE OR REPLACE FUNCTION forum_prepare_forum_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.messages_count := 0;
    NEW.last_post_thread_id := NULL;
    NEW.last_post_title := '';
    NEW.last_post_author_id := NULL;
    NEW.last_post_date := NULL;
    RETURN NEW;
END;
$$;

-- =========================================================
-- PROTECT TRIGGER-MAINTAINED FORUM FIELDS
-- NULL is allowed for last_post_thread_id so ON DELETE SET NULL can run
-- while the thread-delete trigger recalculates the surviving latest thread.
-- =========================================================

CREATE OR REPLACE FUNCTION forum_guard_forum_denormalized_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF pg_trigger_depth() = 1 THEN
        IF NEW.messages_count IS DISTINCT FROM OLD.messages_count
           OR NEW.last_post_title IS DISTINCT FROM OLD.last_post_title
           OR NEW.last_post_date IS DISTINCT FROM OLD.last_post_date
           OR (
                NEW.last_post_thread_id IS DISTINCT FROM OLD.last_post_thread_id
                AND NEW.last_post_thread_id IS NOT NULL
           )
           OR (
                NEW.last_post_author_id IS DISTINCT FROM OLD.last_post_author_id
                AND NEW.last_post_author_id IS NOT NULL
           ) THEN
            RAISE EXCEPTION 'forum message/last-post fields are trigger-maintained';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forums_guard_denormalized_update ON forums;
CREATE TRIGGER forums_guard_denormalized_update
BEFORE UPDATE OF
    messages_count,
    last_post_thread_id,
    last_post_title,
    last_post_author_id,
    last_post_date
ON forums
FOR EACH ROW
EXECUTE FUNCTION forum_guard_forum_denormalized_update();

-- =========================================================
-- THREAD AFTER INSERT
-- =========================================================

CREATE OR REPLACE FUNCTION forum_after_thread_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM 1 FROM forums WHERE id = NEW.forum_id FOR UPDATE;

    UPDATE forums
    SET
        messages_count = messages_count + 1,
        last_post_thread_id = CASE
            WHEN last_post_date IS NULL OR NEW.last_post_date >= last_post_date
                THEN NEW.id
            ELSE last_post_thread_id
        END,
        last_post_title = CASE
            WHEN last_post_date IS NULL OR NEW.last_post_date >= last_post_date
                THEN NEW.title
            ELSE last_post_title
        END,
        last_post_author_id = CASE
            WHEN last_post_date IS NULL OR NEW.last_post_date >= last_post_date
                THEN NEW.last_post_author_id
            ELSE last_post_author_id
        END,
        last_post_date = CASE
            WHEN last_post_date IS NULL OR NEW.last_post_date >= last_post_date
                THEN NEW.last_post_date
            ELSE last_post_date
        END
    WHERE id = NEW.forum_id;

    RETURN NEW;
END;
$$;

-- =========================================================
-- REPLY AFTER INSERT
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

    PERFORM 1 FROM forums WHERE id = v_forum_id FOR UPDATE;

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
    UPDATE neon_auth."user" AS u
    SET replies_count = GREATEST(u.replies_count - d.deleted_count, 0)
    FROM (
        SELECT user_id, COUNT(*)::BIGINT AS deleted_count
        FROM deleted_replies
        WHERE user_id IS NOT NULL
        GROUP BY user_id
    ) AS d
    WHERE u.id = d.user_id;

    FOR v_thread_id IN
        SELECT DISTINCT thread_id
        FROM deleted_replies
    LOOP
        SELECT t.forum_id, t.title, t.user_id, t.created_at
        INTO v_forum_id, v_thread_title, v_thread_user_id, v_thread_created_at
        FROM threads AS t
        WHERE t.id = v_thread_id
        FOR UPDATE;

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
            messages_count = 1 + (
                SELECT COUNT(*)
                FROM replies AS r
                WHERE r.thread_id = v_thread_id
            ),
            last_post_title = v_thread_title,
            last_post_author_id = CASE
                WHEN v_last_reply_id IS NOT NULL THEN v_last_reply_user_id
                ELSE v_thread_user_id
            END,
            last_post_date = COALESCE(v_last_reply_created_at, v_thread_created_at)
        WHERE id = v_thread_id;
    END LOOP;

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
                (SELECT COUNT(*) FROM threads AS t WHERE t.forum_id = v_forum_id)
                +
                (SELECT COUNT(*)
                 FROM replies AS r
                 JOIN threads AS t ON t.id = r.thread_id
                 WHERE t.forum_id = v_forum_id),
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
-- THREAD AFTER DELETE
-- =========================================================

CREATE OR REPLACE FUNCTION forum_after_thread_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_forum_id BIGINT;
    v_latest_thread_id BIGINT;
    v_latest_title TEXT;
    v_latest_author_id UUID;
    v_latest_date TIMESTAMPTZ;
BEGIN
    FOR v_forum_id IN
        SELECT DISTINCT forum_id
        FROM deleted_threads
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
                (SELECT COUNT(*) FROM threads AS t WHERE t.forum_id = v_forum_id)
                +
                (SELECT COUNT(*)
                 FROM replies AS r
                 JOIN threads AS t ON t.id = r.thread_id
                 WHERE t.forum_id = v_forum_id),
            last_post_thread_id = v_latest_thread_id,
            last_post_title = COALESCE(v_latest_title, ''),
            last_post_author_id = v_latest_author_id,
            last_post_date = v_latest_date
        WHERE f.id = v_forum_id;
    END LOOP;

    RETURN NULL;
END;
$$;

COMMENT ON COLUMN forums.last_post_thread_id
IS 'Thread ID containing the most recent forum activity';

COMMIT;
