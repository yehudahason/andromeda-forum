package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

func getUserID(r *http.Request) (User, error) {
	authHeader := r.Header.Get("Authorization")

	if authHeader == "" {
		return User{}, fmt.Errorf("missing Authorization header")
	}

	parts := strings.SplitN(authHeader, " ", 2)

	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return User{}, fmt.Errorf("invalid Authorization header")
	}

	tokenString := parts[1]

	var claims jwt.RegisteredClaims

	token, err := jwt.ParseWithClaims(
		tokenString,
		&claims,
		jwks.Keyfunc,
		jwt.WithValidMethods([]string{"EdDSA"}),
	)
	if err != nil {
		return User{}, fmt.Errorf("invalid token: %w", err)
	}

	if !token.Valid {
		return User{}, fmt.Errorf("invalid token")
	}

	if claims.Subject == "" {
		return User{}, fmt.Errorf("missing user ID")
	}

	var user User
	var userID = claims.Subject

	err = db.QueryRow(
		context.Background(),
		`SELECT name, role, email ,image  FROM neon_auth."user" WHERE id = $1`,
		userID,
	).Scan(&user.Name, &user.Role, &user.Email, &user.Image)

	if err != nil {
		return User{}, fmt.Errorf("error getting user from db: %w", err)
	}

	user.ID, err = uuid.Parse(userID)
	if err != nil {
		return User{}, fmt.Errorf("wrong uuid: %w", err)
	}

	return user, nil
}
func meHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUserID(r)
	if err != nil {
		log.Printf("authentication failed: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	log.Printf("authenticated user: %v", user)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
