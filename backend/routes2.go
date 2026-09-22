package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// func getLatestPosts(w http.ResponseWriter, r *http.Request) {

// 	const perPage = 50

// 	page := 1

// 	if value := r.URL.Query().Get("page"); value != "" {
// 		n, err := strconv.Atoi(value)
// 		if err != nil || n < 1 {
// 			http.Error(w, "invalid page", http.StatusBadRequest)
// 			return
// 		}

// 		page = n
// 	}

// 	offset := (page - 1) * perPage
// 	const query = `
// 		SELECT *
// 		FROM (
// 			SELECT *
// 			FROM (
// 				SELECT DISTINCT ON (r.thread_id)
// 					r.id::text AS id,
// 					'reply'::text AS post_type,
// 					r.thread_id,
// 					t.forum_id,
// 					r.user_id,
// 					t.title AS thread_title,
// 					r.post AS content,
// 					r.created_at
// 				FROM replies r
// 				JOIN threads t ON t.id = r.thread_id
// 				ORDER BY r.thread_id, r.created_at DESC, r.id DESC
// 			) AS latest_replies

// 			UNION ALL

// 			SELECT
// 				t.id::text AS id,
// 				'thread'::text AS post_type,
// 				t.id AS thread_id,
// 				t.forum_id,
// 				t.user_id,
// 				t.title AS thread_title,
// 				t.content AS content,
// 				t.created_at
// 			FROM threads t
// 			WHERE NOT EXISTS (
// 				SELECT 1
// 				FROM replies r
// 				WHERE r.thread_id = t.id
// 			)
// 		) AS posts
// 		ORDER BY created_at DESC
// 		LIMIT $1
// 		OFFSET $2
// 	`

// 	rows, err := db.Query(
// 		r.Context(),
// 		query,
// 		perPage,
// 		offset,
// 	)
// 	if err != nil {
// 		logger.Error(
// 			"failed to query latest posts",
// 			"error", err,
// 		)

// 		http.Error(
// 			w,
// 			"failed to get latest posts",
// 			http.StatusInternalServerError,
// 		)
// 		return
// 	}
// 	defer rows.Close()

// 	posts := make([]LatestPost, 0, 50)
// 	for rows.Next() {
// 		var post LatestPost

// 		if err := rows.Scan(
// 			&post.ID,
// 			&post.PostType,
// 			&post.ThreadID,
// 			&post.ForumID,
// 			&post.UserID,
// 			&post.ThreadTitle,
// 			&post.Content,
// 			&post.CreatedAt,
// 		); err != nil {
// 			logger.Error(
// 				"failed to scan latest post",
// 				"error", err,
// 			)

// 			http.Error(
// 				w,
// 				"failed to get latest posts",
// 				http.StatusInternalServerError,
// 			)
// 			return
// 		}

// 		posts = append(posts, post)
// 	}

// 	if err := rows.Err(); err != nil {
// 		logger.Error(
// 			"error iterating latest posts",
// 			"error", err,
// 		)

// 		http.Error(
// 			w,
// 			"failed to get latest posts",
// 			http.StatusInternalServerError,
// 		)
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")

// 	if err := json.NewEncoder(w).Encode(posts); err != nil {
// 		logger.Error(
// 			"failed to encode latest posts",
// 			"error", err,
// 		)
// 	}
// }

func getLatestPosts(w http.ResponseWriter, r *http.Request) {
	const perPage = 50

	page := 1

	if value := r.URL.Query().Get("page"); value != "" {
		n, err := strconv.Atoi(value)
		if err != nil || n < 1 {
			http.Error(w, "invalid page", http.StatusBadRequest)
			return
		}

		page = n
	}

	offset := (page - 1) * perPage

	const query = `
		SELECT
			posts.id,
			posts.post_type,
			posts.thread_id,
			posts.forum_id,
			posts.user_id,
			posts.thread_title,
			posts.content,
			posts.created_at,

			u.id,
			COALESCE(u.name, ''),
			COALESCE(u.role, 'user'),
			COALESCE(u.image, ''),
			COALESCE(u.replies_count, 0)

		FROM (
			SELECT *
			FROM (
				SELECT DISTINCT ON (r.thread_id)
					r.id::text AS id,
					'reply'::text AS post_type,
					r.thread_id,
					t.forum_id,
					r.user_id,
					t.title AS thread_title,
					r.post AS content,
					r.created_at
				FROM replies r
				JOIN threads t
					ON t.id = r.thread_id
				ORDER BY
					r.thread_id,
					r.created_at DESC,
					r.id DESC
			) AS latest_replies

			UNION ALL

			SELECT
				t.id::text AS id,
				'thread'::text AS post_type,
				t.id AS thread_id,
				t.forum_id,
				t.user_id,
				t.title AS thread_title,
				t.content AS content,
				t.created_at
			FROM threads t
			WHERE NOT EXISTS (
				SELECT 1
				FROM replies r
				WHERE r.thread_id = t.id
			)
		) AS posts

		JOIN neon_auth."user" u
			ON u.id = posts.user_id

		ORDER BY posts.created_at DESC

		LIMIT $1
		OFFSET $2
	`

	rows, err := db.Query(
		r.Context(),
		query,
		perPage,
		offset,
	)

	if err != nil {
		logger.Error(
			"failed to query latest posts",
			"error", err,
			"status", http.StatusInternalServerError,
		)

		http.Error(
			w,
			"failed to get latest posts",
			http.StatusInternalServerError,
		)
		return
	}
	defer rows.Close()

	posts := make([]LatestPost, 0, perPage)

	for rows.Next() {
		var post LatestPost

		if err := rows.Scan(
			&post.ID,
			&post.PostType,
			&post.ThreadID,
			&post.ForumID,
			&post.UserID,
			&post.ThreadTitle,
			&post.Content,
			&post.CreatedAt,

			&post.User.ID,
			&post.User.Name,
			&post.User.Role,
			&post.User.Image,
			&post.User.RepliesCount,
		); err != nil {
			logger.Error(
				"failed to scan latest post",
				"error", err,
				"status", http.StatusInternalServerError,
			)

			http.Error(
				w,
				"failed to get latest posts",
				http.StatusInternalServerError,
			)
			return
		}

		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		logger.Error(
			"error iterating latest posts",
			"error", err,
			"status", http.StatusInternalServerError,
		)

		http.Error(
			w,
			"failed to get latest posts",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(posts); err != nil {
		logger.Error(
			"failed to encode latest posts",
			"error", err,
			"status", http.StatusOK,
		)
	}
}
