package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

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
}

func getTasks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	user, err := getUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	var rows pgx.Rows

	if user.Role == "admin" {
		// Admin gets all tasks
		rows, err = db.Query(
			r.Context(),
			`SELECT id, name, email, task, completed
			 FROM public."tasks"
			 ORDER BY id`,
		)
	} else {
		// Normal user gets only their tasks
		rows, err = db.Query(
			r.Context(),
			`SELECT id, name, email, task, completed
			 FROM public."tasks"
			 WHERE auth_user_id = $1
			 ORDER BY id`,
			user.ID,
		)
	}

	if err != nil {
		http.Error(w, "Failed to get tasks", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tasks := []Task{}

	for rows.Next() {
		var task Task

		err := rows.Scan(
			&task.ID,
			&task.Name,
			&task.Email,
			&task.Task,
			&task.Completed,
		)
		if err != nil {
			http.Error(w, "Failed to read task", http.StatusInternalServerError)
			return
		}

		tasks = append(tasks, task)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to read tasks", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tasks)
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
