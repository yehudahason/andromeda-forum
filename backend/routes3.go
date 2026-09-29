package main

import (
	"net/http"
	"strconv"
)

func deleteThread(w http.ResponseWriter, r *http.Request) {
	threadIDString := r.PathValue("threadID")

	threadID, err := strconv.ParseInt(threadIDString, 10, 64)
	if err != nil || threadID <= 0 {
		http.Error(w, "Invalid thread ID", http.StatusBadRequest)
		return
	}

	userID, err := getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if userID.Role != "admin" {
		http.Error(w, "Unauthorized non admin", http.StatusUnauthorized)
		return
	}
	result, err := db.Exec(
		r.Context(),
		`
		DELETE FROM threads
		WHERE id = $1
		`,
		threadID,
	)
	if err != nil {
		http.Error(w, "Failed to delete thread", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Thread not found or not owned by user", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
