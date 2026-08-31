-- =========================================================
-- FORUM MIGRATION - UP
-- =========================================================
--
-- Counter semantics:
--
-- forums.messages_count
--     = threads + replies inside the forum
--
-- threads.messages_count
--     = replies inside the thread
--
-- neon_auth."user".replies_count
--     = replies written by the user
--
-- last_post_title always stores the CURRENT thread title.
-- =========================================================


-- =========================================================
-- FORUMS
-- =========================================================

CREATE TABLE forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',

    messages_count BIGINT NOT NULL DEFAULT 0
        CHECK (messages_count >= 0),

    last_post_title TEXT NOT NULL DEFAULT '',
    last_post_author_id UUID,
    last_post_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT forums_last_post_author_fk
        FOREIGN KEY (last_post_author_id)
        REFERENCES neon_auth."user"(id)
        ON DELETE SET NULL
);


-- =========================================================
-- GENERIC updated_at FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER forums_updated_at
BEFORE UPDATE ON forums
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- =========================================================
-- THREADS
-- =========================================================

CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    forum_id UUID NOT NULL,
    user_id UUID NOT NULL,

    title TEXT NOT NULL,
    content TEXT NOT NULL,

    messages_count BIGINT NOT NULL DEFAULT 0
        CHECK (messages_count >= 0),

    last_post_title TEXT NOT NULL DEFAULT '',
    last_post_author_id UUID,
    last_post_date TIMESTAMPTZ,

    notify BOOLEAN NOT NULL DEFAULT FALSE,
    sticky BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT threads_forum_id_fkey
        FOREIGN KEY (forum_id)
        REFERENCES forums(id)
        ON DELETE CASCADE,

    CONSTRAINT threads_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES neon_auth."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT threads_last_post_author_id_fkey
        FOREIGN KEY (last_post_author_id)
        REFERENCES neon_auth."user"(id)
        ON DELETE SET NULL
);


CREATE TRIGGER threads_updated_at
BEFORE UPDATE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- =========================================================
-- REPLIES
-- =========================================================

CREATE TABLE replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    thread_id UUID NOT NULL,
    user_id UUID NOT NULL,

    post TEXT NOT NULL,

    notify BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT replies_thread_id_fkey
        FOREIGN KEY (thread_id)
        REFERENCES threads(id)
        ON DELETE CASCADE,

    CONSTRAINT replies_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES neon_auth."user"(id)
        ON DELETE CASCADE
);


CREATE TRIGGER replies_updated_at
BEFORE UPDATE ON replies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- =========================================================
-- USER REPLY COUNT
-- =========================================================

ALTER TABLE neon_auth."user"
ADD COLUMN replies_count BIGINT NOT NULL DEFAULT 0;


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_threads_forum_id
    ON threads(forum_id);

CREATE INDEX idx_threads_user_id
    ON threads(user_id);

CREATE INDEX idx_threads_created_at
    ON threads(created_at DESC);

CREATE INDEX idx_threads_last_post_date
    ON threads(last_post_date DESC NULLS LAST);

CREATE INDEX idx_threads_forum_last_post_date
    ON threads(forum_id, last_post_date DESC, id DESC);


CREATE INDEX idx_replies_thread_id
    ON replies(thread_id);

CREATE INDEX idx_replies_user_id
    ON replies(user_id);

CREATE INDEX idx_replies_created_at
    ON replies(created_at DESC);

CREATE INDEX idx_replies_thread_created_at
    ON replies(thread_id, created_at DESC, id DESC);


-- =========================================================
-- FORUM BEFORE INSERT
--
-- An empty forum starts with its creation time as its
-- activity date.
-- =========================================================

CREATE OR REPLACE FUNCTION set_forum_initial_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_post_date IS NULL THEN
        NEW.last_post_date := NEW.created_at;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER forums_set_initial_dates
BEFORE INSERT ON forums
FOR EACH ROW
EXECUTE FUNCTION set_forum_initial_dates();


-- =========================================================
-- THREAD BEFORE INSERT
--
-- The original thread post is initially the thread's
-- latest activity.
-- =========================================================

CREATE OR REPLACE FUNCTION handle_thread_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_post_date IS NULL THEN
        NEW.last_post_date := NEW.created_at;
    END IF;

    -- last_post_title always mirrors the current thread title.
    NEW.last_post_title := NEW.title;

    IF NEW.last_post_author_id IS NULL THEN
        NEW.last_post_author_id := NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER threads_set_initial_values
BEFORE INSERT ON threads
FOR EACH ROW
EXECUTE FUNCTION handle_thread_insert();


-- =========================================================
-- THREAD AFTER INSERT
--
-- Forum:
--   messages_count + 1
--
-- Latest metadata is changed only when the inserted
-- thread is at least as recent as the forum's current
-- latest activity. This prevents old/backfilled rows from
-- moving latest activity backwards.
-- =========================================================

CREATE OR REPLACE FUNCTION update_forum_after_thread_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE forums
    SET
        messages_count = messages_count + 1,

        last_post_date =
            CASE
                WHEN last_post_date IS NULL
                  OR NEW.last_post_date >= last_post_date
                THEN NEW.last_post_date
                ELSE last_post_date
            END,

        last_post_title =
            CASE
                WHEN last_post_date IS NULL
                  OR NEW.last_post_date >= last_post_date
                THEN NEW.title
                ELSE last_post_title
            END,

        last_post_author_id =
            CASE
                WHEN last_post_date IS NULL
                  OR NEW.last_post_date >= last_post_date
                THEN NEW.last_post_author_id
                ELSE last_post_author_id
            END

    WHERE id = NEW.forum_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER threads_update_forum
AFTER INSERT ON threads
FOR EACH ROW
EXECUTE FUNCTION update_forum_after_thread_insert();


-- =========================================================
-- THREAD TITLE UPDATE
--
-- last_post_title always stores the current thread title.
--
-- If this thread currently represents the newest activity
-- in its forum, synchronize the forum title as well.
-- =========================================================

CREATE OR REPLACE FUNCTION handle_thread_title_update()
RETURNS TRIGGER AS $$
DECLARE
    v_latest_thread_id UUID;
BEGIN
    IF NEW.title IS DISTINCT FROM OLD.title THEN

        NEW.last_post_title := NEW.title;

        SELECT t.id
        INTO v_latest_thread_id
        FROM threads t
        WHERE t.forum_id = NEW.forum_id
        ORDER BY
            t.last_post_date DESC NULLS LAST,
            t.id DESC
        LIMIT 1;

        IF v_latest_thread_id = NEW.id THEN
            UPDATE forums
            SET last_post_title = NEW.title
            WHERE id = NEW.forum_id;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER threads_title_update
BEFORE UPDATE OF title ON threads
FOR EACH ROW
EXECUTE FUNCTION handle_thread_title_update();


-- =========================================================
-- THREAD AFTER DELETE
--
-- OLD.messages_count is the number of replies that belonged
-- to this thread.
--
-- Forum removes:
--   1 original thread post
--   + OLD.messages_count replies
--
-- Replies deleted by ON DELETE CASCADE still run the reply
-- delete trigger so user.replies_count is maintained.
--
-- The reply delete trigger does not decrement forum/thread
-- counters when its parent thread is already gone.
-- =========================================================

CREATE OR REPLACE FUNCTION update_forum_after_thread_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_last_thread RECORD;
BEGIN

    UPDATE forums
    SET messages_count = GREATEST(
        messages_count - (1 + OLD.messages_count),
        0
    )
    WHERE id = OLD.forum_id;


    SELECT
        t.last_post_title,
        t.last_post_author_id,
        t.last_post_date
    INTO v_last_thread
    FROM threads t
    WHERE t.forum_id = OLD.forum_id
    ORDER BY
        t.last_post_date DESC NULLS LAST,
        t.id DESC
    LIMIT 1;


    IF FOUND THEN

        UPDATE forums
        SET
            last_post_title = v_last_thread.last_post_title,
            last_post_author_id = v_last_thread.last_post_author_id,
            last_post_date = v_last_thread.last_post_date
        WHERE id = OLD.forum_id;

    ELSE

        UPDATE forums f
        SET
            last_post_title = '',
            last_post_author_id = NULL,
            last_post_date = f.created_at
        WHERE f.id = OLD.forum_id;

    END IF;


    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER threads_update_forum_after_delete
AFTER DELETE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_forum_after_thread_delete();


-- =========================================================
-- REPLY AFTER INSERT
--
-- Thread:
--   messages_count + 1
--
-- Forum:
--   messages_count + 1
--
-- User:
--   replies_count + 1
--
-- Latest activity is updated only if this reply is at
-- least as recent as the stored latest activity.
-- =========================================================

CREATE OR REPLACE FUNCTION update_after_reply_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_forum_id UUID;
    v_thread_title TEXT;
BEGIN

    UPDATE threads
    SET
        messages_count = messages_count + 1,

        -- Thread title always stays synchronized.
        last_post_title = title,

        last_post_date =
            CASE
                WHEN last_post_date IS NULL
                  OR NEW.created_at >= last_post_date
                THEN NEW.created_at
                ELSE last_post_date
            END,

        last_post_author_id =
            CASE
                WHEN last_post_date IS NULL
                  OR NEW.created_at >= last_post_date
                THEN NEW.user_id
                ELSE last_post_author_id
            END

    WHERE id = NEW.thread_id

    RETURNING
        forum_id,
        title
    INTO
        v_forum_id,
        v_thread_title;


    UPDATE forums
    SET
        messages_count = messages_count + 1,

        last_post_date =
            CASE
                WHEN last_post_date IS NULL
                  OR NEW.created_at >= last_post_date
                THEN NEW.created_at
                ELSE last_post_date
            END,

        last_post_title =
            CASE
                WHEN last_post_date IS NULL
                  OR NEW.created_at >= last_post_date
                THEN v_thread_title
                ELSE last_post_title
            END,

        last_post_author_id =
            CASE
                WHEN last_post_date IS NULL
                  OR NEW.created_at >= last_post_date
                THEN NEW.user_id
                ELSE last_post_author_id
            END

    WHERE id = v_forum_id;


    UPDATE neon_auth."user"
    SET replies_count = replies_count + 1
    WHERE id = NEW.user_id;


    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER replies_update_after_insert
AFTER INSERT ON replies
FOR EACH ROW
EXECUTE FUNCTION update_after_reply_insert();


-- =========================================================
-- REPLY AFTER DELETE
--
-- A reply can disappear in two ways:
--
-- 1. Direct reply deletion:
--      thread.messages_count - 1
--      forum.messages_count  - 1
--      user.replies_count    - 1
--      recalculate latest activity
--
-- 2. Parent thread deletion via ON DELETE CASCADE:
--      parent thread no longer exists
--      user.replies_count - 1
--      thread delete trigger handles forum count/metadata
-- =========================================================

CREATE OR REPLACE FUNCTION update_after_reply_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_forum_id UUID;
    v_thread_title TEXT;
    v_thread_user_id UUID;
    v_thread_created_at TIMESTAMPTZ;

    v_last_reply RECORD;
    v_forum_last_thread RECORD;
BEGIN

    -- Always maintain the author's reply count.
    UPDATE neon_auth."user"
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.user_id;


    -- If the parent thread still exists, this is a direct
    -- reply delete and its aggregate values must be updated.
    SELECT
        t.forum_id,
        t.title,
        t.user_id,
        t.created_at
    INTO
        v_forum_id,
        v_thread_title,
        v_thread_user_id,
        v_thread_created_at
    FROM threads t
    WHERE t.id = OLD.thread_id;


    -- Parent thread was already deleted by the statement
    -- that caused the reply cascade.
    IF NOT FOUND THEN
        RETURN OLD;
    END IF;


    UPDATE threads
    SET messages_count = GREATEST(messages_count - 1, 0)
    WHERE id = OLD.thread_id;


    UPDATE forums
    SET messages_count = GREATEST(messages_count - 1, 0)
    WHERE id = v_forum_id;


    -- Find newest remaining reply in this thread.
    SELECT
        r.user_id,
        r.created_at
    INTO v_last_reply
    FROM replies r
    WHERE r.thread_id = OLD.thread_id
    ORDER BY
        r.created_at DESC,
        r.id DESC
    LIMIT 1;


    IF FOUND THEN

        UPDATE threads
        SET
            last_post_title = v_thread_title,
            last_post_author_id = v_last_reply.user_id,
            last_post_date = v_last_reply.created_at
        WHERE id = OLD.thread_id;

    ELSE

        -- No replies remain.
        -- The original thread post is latest again.
        UPDATE threads
        SET
            last_post_title = v_thread_title,
            last_post_author_id = v_thread_user_id,
            last_post_date = v_thread_created_at
        WHERE id = OLD.thread_id;

    END IF;


    -- Recalculate latest activity for the whole forum.
    SELECT
        t.last_post_title,
        t.last_post_author_id,
        t.last_post_date
    INTO v_forum_last_thread
    FROM threads t
    WHERE t.forum_id = v_forum_id
    ORDER BY
        t.last_post_date DESC NULLS LAST,
        t.id DESC
    LIMIT 1;


    IF FOUND THEN

        UPDATE forums
        SET
            last_post_title = v_forum_last_thread.last_post_title,
            last_post_author_id = v_forum_last_thread.last_post_author_id,
            last_post_date = v_forum_last_thread.last_post_date
        WHERE id = v_forum_id;

    ELSE

        UPDATE forums f
        SET
            last_post_title = '',
            last_post_author_id = NULL,
            last_post_date = f.created_at
        WHERE f.id = v_forum_id;

    END IF;


    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER replies_update_after_delete
AFTER DELETE ON replies
FOR EACH ROW
EXECUTE FUNCTION update_after_reply_delete();