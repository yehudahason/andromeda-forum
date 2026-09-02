package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/MicahParks/keyfunc"
)

var jwks *keyfunc.JWKS

// PostgreSQL connection pool.
var db *pgxpool.Pool

func initJWKS() error {
	var err error

	jwks, err = keyfunc.Get(os.Getenv("JWKS_URL"), keyfunc.Options{})
	if err != nil {
		return fmt.Errorf("failed to load JWKS: %w", err)
	}

	return nil
}
func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("failed to load .env:", err)
	}
	if err := initJWKS(); err != nil {
		log.Fatal(err)
	}
	ctx := context.Background()

	// Initialize PostgreSQL connection pool
	var err error

	db, err = pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal("failed to connect to database:", err)
	}
	defer db.Close()

	// Verify the connection
	if err := db.Ping(ctx); err != nil {
		log.Fatal("failed to ping database:", err)
	}
	log.Println("Connected to PostgreSQL")

	mux := http.NewServeMux()
	//Public Endpoints
	mux.HandleFunc("GET /api/forums", getForums)
	mux.HandleFunc("GET /api/forums/{forumID}/threads", getThreads)
	mux.HandleFunc("GET /api/threads/{threadID}/replies", getReplies)
	mux.HandleFunc("GET /api/threads/{threadID}", getThreadByID)
	//Authrized endpoints by Neon better-auth token
	mux.HandleFunc("POST /api/forums/{forumID}/threads", createThread)
	mux.HandleFunc("GET /api/me", meHandler)
	mux.HandleFunc(
		"POST /api/forums/{forumID}/threads/{threadID}/replies",
		createReply,
	)

	server := http.Server{
		Addr:    ":4000",
		Handler: corsMiddleware(mux),
	}

	log.Println("Server running on http://localhost:4000")

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		//Allowed Origins
		allowedOrigins := map[string]bool{
			"http://localhost:5173":          true,
			"https://lab.pitron-halomot.org": true,
		}

		origin := r.Header.Get("Origin")

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, DELETE, OPTIONS",
			)
			w.Header().Set(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization",
			)
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
