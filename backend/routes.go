package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
)

func getForums(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	forums := []Forum{}

	rows, err := db.Query(
		r.Context(),
		`
		SELECT
			f.id,
			f.name,
			f.description,
			f.messages_count,
			f.last_post_thread_id,
			f.last_post_title,
			u.name AS last_post_author,
			f.last_post_date
		FROM forums AS f
		LEFT JOIN neon_auth."user" AS u
			ON u.id = f.last_post_author_id
		ORDER BY f.id ASC;
		`,
	)
	if err != nil {
		http.Error(w, "Failed to get forums", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var forum Forum

		err := rows.Scan(
			&forum.ID,
			&forum.Name,
			&forum.Description,
			&forum.MessagesCount,
			&forum.LastPostThreadId,
			&forum.LastPostTitle,
			&forum.LastPostAuthor,
			&forum.LastPostDate,
		)
		if err != nil {
			http.Error(w, "Failed to scan forum", http.StatusInternalServerError)
			return
		}

		forums = append(forums, forum)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to read forums", http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(forums); err != nil {
		http.Error(w, "Failed to encode forums", http.StatusInternalServerError)
		return
	}
}

func getThreads(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	const perPage = 14

	forumIDString := r.PathValue("forumID")

	var forumName string

	err := db.QueryRow(
		r.Context(),
		`
	SELECT name
	FROM forums
	WHERE id = $1
	`,
		forumIDString,
	).Scan(&forumName)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Forum not found", http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to get forum", http.StatusInternalServerError)
		return
	}

	forumID, err := strconv.ParseInt(forumIDString, 10, 64)
	if err != nil || forumID <= 0 {
		http.Error(w, "Invalid forum ID", http.StatusBadRequest)
		return
	}

	page := 1

	if pageString := r.URL.Query().Get("page"); pageString != "" {
		page, err = strconv.Atoi(pageString)
		if err != nil || page < 1 {
			http.Error(w, "Invalid page", http.StatusBadRequest)
			return
		}
	}

	offset := (page - 1) * perPage

	var total int64

	err = db.QueryRow(
		r.Context(),
		`
		SELECT COUNT(*)
		FROM threads
		WHERE forum_id = $1
		`,
		forumID,
	).Scan(&total)

	if err != nil {
		http.Error(w, "Failed to count threads", http.StatusInternalServerError)
		return
	}

	threads := []Thread{}

	rows, err := db.Query(
		r.Context(),
		`
		SELECT
			t.id,
			t.forum_id,
			t.title,
			u.name AS author,
			t.messages_count,
			t.last_post_title,
			lp.name AS last_post_author,
			t.last_post_date,
			t.created_at
		FROM threads AS t

		LEFT JOIN neon_auth."user" AS u
			ON u.id = t.user_id

		LEFT JOIN neon_auth."user" AS lp
			ON lp.id = t.last_post_author_id

		WHERE t.forum_id = $1

		ORDER BY
			t.sticky DESC,
			t.last_post_date DESC,
			t.id DESC

		LIMIT $2
		OFFSET $3
		`,
		forumID,
		perPage,
		offset,
	)
	if err != nil {
		http.Error(w, "Failed to get threads", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var thread Thread

		err := rows.Scan(
			&thread.ID,
			&thread.ForumID,
			&thread.Title,
			&thread.Author,
			&thread.MessagesCount,
			&thread.LastPostTitle,
			&thread.LastPostAuthor,
			&thread.LastPostDate,
			&thread.CreatedAt,
		)
		if err != nil {
			http.Error(w, "Failed to scan thread", http.StatusInternalServerError)
			return
		}

		threads = append(threads, thread)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to read threads", http.StatusInternalServerError)
		return
	}

	response := ThreadListResponse{
		Threads:   threads,
		Total:     total,
		Page:      page,
		PerPage:   perPage,
		ForumName: forumName,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode threads", http.StatusInternalServerError)
		return
	}
}

func getReplies(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	const perPage = 14

	threadIDString := r.PathValue("threadID")

	threadID, err := strconv.ParseInt(threadIDString, 10, 64)
	if err != nil || threadID <= 0 {
		http.Error(w, "Invalid thread ID", http.StatusBadRequest)
		return
	}

	page := 1

	if pageString := r.URL.Query().Get("page"); pageString != "" {
		page, err = strconv.Atoi(pageString)
		if err != nil || page < 1 {
			http.Error(w, "Invalid page", http.StatusBadRequest)
			return
		}
	}

	// Make sure the thread exists.
	var threadTitle string

	err = db.QueryRow(
		r.Context(),
		`
		SELECT title
		FROM threads
		WHERE id = $1
		`,
		threadID,
	).Scan(&threadTitle)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Thread not found", http.StatusNotFound)
			return
		}

		// http.Error(w, "Failed to get thread", http.StatusInternalServerError)
		fmt.Print(err.Error())
		return
	}

	var total int64

	err = db.QueryRow(
		r.Context(),
		`
		SELECT COUNT(*)
		FROM replies
		WHERE thread_id = $1
		`,
		threadID,
	).Scan(&total)

	if err != nil {
		http.Error(w, "Failed to count replies", http.StatusInternalServerError)
		return
	}

	offset := (page - 1) * perPage

	replies := []Reply{}

	rows, err := db.Query(
		r.Context(),
		`
		SELECT
			r.id,
			r.thread_id,
			t.title,
			u.id,
			u.name,
			u.email,
			u.role,
			u.image,
			u.replies_count,
			r.post,
			r.created_at,
			r.updated_at
		FROM replies AS r

		JOIN threads AS t
			ON t.id = r.thread_id

		JOIN neon_auth."user" AS u
			ON u.id = r.user_id

		WHERE r.thread_id = $1

		ORDER BY
			r.created_at ASC,
			r.id ASC

		LIMIT $2
		OFFSET $3
		`,
		threadID,
		perPage,
		offset,
	)
	if err != nil {
		http.Error(w, "Failed to get replies", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var reply Reply

		err := rows.Scan(
			&reply.ID,
			&reply.ThreadID,
			&reply.Title,
			&reply.Author.ID,
			&reply.Author.Name,
			&reply.Author.Email,
			&reply.Author.Role,
			&reply.Author.ImageURL,
			&reply.Author.RepliesCounts,
			&reply.Post,
			&reply.CreatedAt,
			&reply.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Failed to scan reply", http.StatusInternalServerError)
			return
		}

		replies = append(replies, reply)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to read replies", http.StatusInternalServerError)
		return
	}

	response := ReplyListResponse{
		Replies: replies,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode replies", http.StatusInternalServerError)
		return
	}
}

func createThread(w http.ResponseWriter, r *http.Request) {
	// Get forum ID from:
	// POST /forums/{forumID}/threads
	forumIDString := r.PathValue("forumID")

	forumID, err := strconv.Atoi(forumIDString)
	if err != nil || forumID <= 0 {
		http.Error(w, "Invalid forum ID", http.StatusBadRequest)
		return
	}

	// Get logged-in user.
	user, err := getUserID(r)
	if err != nil {
		log.Printf("getUserID error: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var input CreateThreadRequest

	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Content = strings.TrimSpace(input.Content)

	if input.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	if input.Content == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	var thread CreateThreadResponse

	err = db.QueryRow(
		r.Context(),
		`
		INSERT INTO threads (
			forum_id,
			user_id,
			title,
			content,
			notify
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING
			id,
			forum_id,
			user_id,
			title,
			content,
			notify,
			created_at
		`,
		forumID,
		user.ID,
		input.Title,
		input.Content,
		input.Notify,
	).Scan(
		&thread.ID,
		&thread.ForumID,
		&thread.UserID,
		&thread.Title,
		&thread.Content,
		&thread.Notify,
		&thread.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Failed to create thread", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(thread); err != nil {
		return
	}
}
func getThreadByID(w http.ResponseWriter, r *http.Request) {
	var forumID int

	forumString := r.URL.Query().Get("f")
	if forumString == "" {
		http.Error(w, "Missing forum ID", http.StatusBadRequest)
		return
	}

	forumID, err := strconv.Atoi(forumString)
	if err != nil || forumID <= 0 {
		http.Error(w, "Invalid forum ID", http.StatusBadRequest)
		return
	}

	threadIDString := r.PathValue("threadID")

	threadID, err := strconv.ParseInt(threadIDString, 10, 64)
	if err != nil || threadID <= 0 {
		http.Error(w, "Invalid thread ID", http.StatusBadRequest)
		return
	}

	var thread ThreadDetails

	err = db.QueryRow(
		r.Context(),
		`
		SELECT
			t.id,
			f.name,
			COALESCE(u.name, 'Deleted user'),
			t.forum_id,
			u.image,
			COALESCE(u.replies_count, 0),
			t.title,
			t.content,
			t.created_at
		FROM threads AS t

		JOIN forums AS f
			ON f.id = t.forum_id

		LEFT JOIN neon_auth."user" AS u
			ON u.id = t.user_id

		WHERE t.id = $1
		`,
		threadID,
	).Scan(
		&thread.ID,
		&thread.ForumName,
		&thread.Author,
		&thread.ForumID,
		&thread.ImageURL,
		&thread.AuthorRepliesCount,
		&thread.Title,
		&thread.Content,
		&thread.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Thread not found", http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to get thread", http.StatusInternalServerError)
		return
	}

	if forumID != thread.ForumID {
		http.Error(w, "Thread not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(thread); err != nil {
		http.Error(w, "Failed to encode thread", http.StatusInternalServerError)
	}
}
func createReply(w http.ResponseWriter, r *http.Request) {
	forumIDString := r.PathValue("forumID")
	threadIDString := r.PathValue("threadID")

	forumID, err := strconv.ParseInt(forumIDString, 10, 64)
	if err != nil || forumID <= 0 {
		http.Error(w, "Invalid forum ID", http.StatusBadRequest)
		return
	}

	threadID, err := strconv.ParseInt(threadIDString, 10, 64)
	if err != nil || threadID <= 0 {
		http.Error(w, "Invalid thread ID", http.StatusBadRequest)
		return
	}

	user, err := getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input CreateReplyRequest

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	input.Post = strings.TrimSpace(input.Post)

	if input.Post == "" {
		http.Error(w, "Post is required", http.StatusBadRequest)
		return
	}

	// Make sure thread exists and belongs to this forum.
	var exists bool

	err = db.QueryRow(
		r.Context(),
		`
		SELECT EXISTS (
			SELECT 1
			FROM threads
			WHERE id = $1
			  AND forum_id = $2
		)
		`,
		threadID,
		forumID,
	).Scan(&exists)

	if err != nil {
		http.Error(w, "Failed to check thread", http.StatusInternalServerError)
		return
	}

	if !exists {
		http.Error(w, "Thread not found", http.StatusNotFound)
		return
	}

	var reply CreateReplyResponse

	err = db.QueryRow(
		r.Context(),
		`
		INSERT INTO replies (
			thread_id,
			user_id,
			post,
			notify
		)
		VALUES ($1, $2, $3, $4)
		RETURNING
			id,
			thread_id,
			user_id,
			post,
			notify,
			created_at
		`,
		threadID,
		user.ID,
		input.Post,
		input.Notify,
	).Scan(
		&reply.ID,
		&reply.ThreadID,
		&reply.UserID,
		&reply.Post,
		&reply.Notify,
		&reply.CreatedAt,
	)

	if err != nil {
		log.Printf("createReply INSERT error: %v", err)

		http.Error(
			w,
			"Failed to create reply",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(reply); err != nil {
		return
	}
}
