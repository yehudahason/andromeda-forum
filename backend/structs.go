package main

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Role         string    `json:"role"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Image        string    `json:"image"`
	RepliesCount int64     `json:"replies_count"`
}

type Thread struct {
	ID             int64      `json:"id"`
	ForumID        int64      `json:"forum_id"`
	Title          string     `json:"title"`
	Author         *string    `json:"author"`
	MessagesCount  int64      `json:"messages_count"`
	LastPostTitle  *string    `json:"last_post_title"`
	LastPostAuthor *string    `json:"last_post_author"`
	LastPostDate   *time.Time `json:"last_post_date"`
	CreatedAt      time.Time  `json:"created_at"`
}

type ThreadListResponse struct {
	Threads   []Thread `json:"threads"`
	ForumName string   `json:"forum_name"`
	Total     int64    `json:"total"`
	Page      int      `json:"page"`
	PerPage   int      `json:"per_page"`
}
type Forum struct {
	ID               int64      `json:"id"`
	Name             string     `json:"name"`
	Description      string     `json:"description"`
	MessagesCount    int64      `json:"messages_count"`
	LastPostThreadId *int64     `json:"last_post_thread_id"`
	LastPostTitle    *string    `json:"last_post_title"`
	LastPostAuthor   *string    `json:"last_post_author"`
	LastPostDate     *time.Time `json:"last_post_date"`
}
type ThreadDetails struct {
	ID                 int64     `json:"id"`
	AuthorRepliesCount int64     `json:"author_replies_count"`
	ForumName          string    `json:"forum_name"`
	ForumID            int64     `json:"forum_id"`
	Author             string    `json:"author"`
	Title              string    `json:"title"`
	Content            string    `json:"content"`
	CreatedAt          time.Time `json:"created_at"`
	ImageURL           *string   `json:"image_url"`
}

type ReplyAuthor struct {
	ID            *uuid.UUID `json:"id"`
	Name          string     `json:"name"`
	Email         string     `json:"email"`
	Role          string     `json:"role"`
	ImageURL      *string    `json:"image_url"`
	RepliesCounts int64      `json:"replies_count"`
}

type Reply struct {
	ID        uuid.UUID   `json:"id"`
	ThreadID  int64       `json:"thread_id"`
	Title     string      `json:"title"`
	Author    ReplyAuthor `json:"author"`
	Post      string      `json:"post"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

type ReplyListResponse struct {
	Replies []Reply `json:"replies"`
	Total   int64   `json:"total"`
	Page    int     `json:"page"`
	PerPage int     `json:"per_page"`
}

type CreateThreadRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Notify  bool   `json:"notify"`
}

type CreateThreadResponse struct {
	ID        int64     `json:"id"`
	ForumID   int64     `json:"forum_id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Notify    bool      `json:"notify"`
	CreatedAt time.Time `json:"created_at"`
}
type CreateReplyRequest struct {
	Post   string `json:"post"`
	Notify bool   `json:"notify"`
}

type CreateReplyResponse struct {
	ID        uuid.UUID `json:"id"`
	ThreadID  int64     `json:"thread_id"`
	UserID    string    `json:"user_id"`
	Post      string    `json:"post"`
	Notify    bool      `json:"notify"`
	CreatedAt time.Time `json:"created_at"`
}
