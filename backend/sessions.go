package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var ErrUnauthorized = errors.New("unauthorized")

func getUserID(r *http.Request) (User, error) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return User{}, fmt.Errorf("%w: missing Authorization header", ErrUnauthorized)
	}

	parts := strings.Fields(authHeader)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return User{}, fmt.Errorf("%w: invalid Authorization header", ErrUnauthorized)
	}

	tokenString := strings.TrimSpace(parts[1])
	if tokenString == "" {
		return User{}, fmt.Errorf("%w: missing bearer token", ErrUnauthorized)
	}

	var claims jwt.RegisteredClaims

	token, err := jwt.ParseWithClaims(
		tokenString,
		&claims,
		jwks.Keyfunc,
		jwt.WithValidMethods([]string{"RS256", "ES256", "EdDSA"}),
	)
	if err != nil {
		return User{}, fmt.Errorf("%w: invalid token: %v", ErrUnauthorized, err)
	}

	if !token.Valid {
		return User{}, fmt.Errorf("%w: invalid token", ErrUnauthorized)
	}

	if claims.Subject == "" {
		return User{}, fmt.Errorf("%w: missing user ID", ErrUnauthorized)
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return User{}, fmt.Errorf("%w: invalid user ID", ErrUnauthorized)
	}

	var user User

	err = db.QueryRow(
		r.Context(),
		`
		SELECT
			id,
			name,
			role,
			email,
			image,
			replies_count
		FROM neon_auth."user"
		WHERE id = $1
		`,
		userID,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Role,
		&user.Email,
		&user.Image,
		&user.RepliesCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, fmt.Errorf("%w: user not found", ErrUnauthorized)
		}

		return User{}, fmt.Errorf("error getting user from db: %w", err)
	}

	return user, nil
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUserID(r)
	if err != nil {
		if errors.Is(err, ErrUnauthorized) {
			log.Printf("authentication failed: %v", err)

			w.Header().Set("WWW-Authenticate", "Bearer")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		log.Printf("meHandler database error: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("meHandler encode error: %v", err)
	}
}
