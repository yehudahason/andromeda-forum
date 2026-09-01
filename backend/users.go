package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Task struct {
	ID           uuid.UUID `json:"id"`
	Auth_user_id uuid.UUID `json:"auth_user_id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Task         string    `json:"task"`
	Completed    *bool     `json:"completed"`
	Role         string    `json:"role"`
}

type User struct {
	ID    uuid.UUID `json:"id"`
	Role  string    `json:"role"`
	Name  string    `json:"name"`
	Email string    `json:"email"`
	Image string    `json:"image"`
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
	ID             int64      `json:"id"`
	Name           string     `json:"name"`
	Description    string     `json:"description"`
	MessagesCount  int64      `json:"messages_count"`
	LastPostTitle  *string    `json:"last_post_title"`
	LastPostAuthor *string    `json:"last_post_author"`
	LastPostDate   *time.Time `json:"last_post_date"`
}

type ReplyAuthor struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Role          string    `json:"role"`
	ImageURL      *string   `json:"image_url"`
	RepliesCounts int64     `json:"replies_counts"`
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
			f.last_post_title,
			u.name AS last_post_author,
			f.last_post_date
		FROM forums AS f
		LEFT JOIN neon_auth."user" AS u
			ON u.id = f.last_post_author_id
		ORDER BY f.id ASC
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

func getTask(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var task Task

	err = db.QueryRow(
		r.Context(),
		`SELECT id, name, email, task, completed
		 FROM public."tasks"
		 WHERE id = $1`,
		id,
	).Scan(
		&task.ID,
		&task.Name,
		&task.Email,
		&task.Task,
		&task.Completed,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, "Failed to get task", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func createTask(w http.ResponseWriter, r *http.Request) {
	var task Task

	err := json.NewDecoder(r.Body).Decode(&task)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := validateUser(task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	authUserID, err := getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	taskID := uuid.New()

	_, err = db.Exec(
		r.Context(),
		`INSERT INTO public."tasks"
			(id, auth_user_id, name, email, task, completed)
		 VALUES
			($1, $2, $3, $4, $5, $6)`,
		taskID,
		authUserID.ID,
		task.Name,
		task.Email,
		task.Task,
		task.Completed,
	)

	if err != nil {
		log.Printf("failed to create task: %v", err)
		http.Error(w, "Failed to create task", http.StatusInternalServerError)
		return
	}

	task.ID = taskID

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(task); err != nil {
		log.Printf("failed to encode task: %v", err)
	}
}
func updateTask(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var updatedTask Task

	err = json.NewDecoder(r.Body).Decode(&updatedTask)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := validateUser(updatedTask); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		r.Context(),
		`UPDATE public."tasks"
		 SET name = $1,
		     email = $2,
		     task = $3,
		     completed = $4
		 WHERE id = $5`,
		updatedTask.Name,
		updatedTask.Email,
		updatedTask.Task,
		updatedTask.Completed,
		id,
	)

	if err != nil {
		http.Error(w, "Failed to update task", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	updatedTask.ID = id

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedTask)
}

type ThreadDetails struct {
	ID        int64     `json:"id"`
	ForumName string    `json:"forum_name"`
	ForumID   int       `json:"forum_id"`
	Author    string    `json:"author"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	ImageURL  *string   `json:"image_url"`
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
func deleteTask(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		r.Context(),
		`DELETE FROM public."tasks"
		 WHERE id = $1`,
		id,
	)

	if err != nil {
		http.Error(w, "Failed to delete task", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
