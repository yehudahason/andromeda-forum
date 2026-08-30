CREATE TABLE forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    forum_id UUID NOT NULL,
    user_id UUID NOT NULL,

    title TEXT NOT NULL,
    content TEXT NOT NULL,

    notify BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT threads_forum_id_fkey
        FOREIGN KEY (forum_id)
        REFERENCES forums(id)
        ON DELETE CASCADE,

    CONSTRAINT threads_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    thread_id UUID NOT NULL,
    user_id UUID NOT NULL,

    content TEXT NOT NULL,

    notify BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT replies_thread_id_fkey
        FOREIGN KEY (thread_id)
        REFERENCES threads(id)
        ON DELETE CASCADE,

    CONSTRAINT replies_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_threads_forum_id
    ON threads(forum_id);

CREATE INDEX idx_threads_user_id
    ON threads(user_id);

CREATE INDEX idx_threads_created_at
    ON threads(created_at DESC);


CREATE INDEX idx_replies_thread_id
    ON replies(thread_id);

CREATE INDEX idx_replies_user_id
    ON replies(user_id);

CREATE INDEX idx_replies_created_at
    ON replies(created_at);

