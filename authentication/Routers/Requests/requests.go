package Requests

import (
	"authentication/DTO"
	"authentication/JwtTokens"
	"authentication/Postgres"
	"context"
	"encoding/json"
	"fmt"
	"github.com/jackc/pgx/v4"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
)

func Login(w http.ResponseWriter, r *http.Request) {
	var userReq DTO.UserDTO
	var userStored DTO.UserDTO

	err := json.NewDecoder(r.Body).Decode(&userReq)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "unable to parse body: %v", err)
		return
	}

	err = Postgres.Conn.QueryRow(context.Background(), "SELECT login, password FROM users WHERE login = $1", userReq.Login).Scan(&userStored.Login, &userStored.Password)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Wrong login or password", http.StatusNotFound)
		} else {
			http.Error(w, "Error finding user", http.StatusInternalServerError)
		}
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(userStored.Password), []byte(userReq.Password))
	if err != nil {
		http.Error(w, "Wrong login or password", http.StatusUnauthorized)
		return
	}

	token, err := JwtTokens.GenerateJWTToken(userReq.Login, userReq.Password)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	response := struct {
		Token string `json:"token"`
	}{
		Token: token,
	}
	json.NewEncoder(w).Encode(response)
	return
}

func Registration(w http.ResponseWriter, r *http.Request) {
	var user DTO.UserDTO

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		fmt.Fprintf(w, "unable to parse body: %v", err)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Error hashing password: %v", err)
	}

	rows, err := Postgres.Conn.Query(context.Background(), "SELECT * FROM users WHERE login = $1", user.Login)
	if err != nil {
		log.Fatalf("Error finding user: %v", err)
	}
	defer rows.Close()
	if rows.Next() {
		response := struct {
			Message string `json:"message"`
		}{
			Message: "Login is already exist",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	ctx := context.Background()
	tx, err := Postgres.Conn.Begin(ctx)
	if err != nil {
		log.Fatalf("Error starting transaction: %v", err)
	}
	defer tx.Rollback(ctx)

	var newUserID int64
	err = tx.QueryRow(ctx, "INSERT INTO users (login, password) VALUES ($1, $2) RETURNING id", user.Login, string(hashedPassword)).Scan(&newUserID)
	if err != nil {
		log.Fatalf("Error inserting user: %v", err)
	}

	_, err = tx.Exec(ctx, "INSERT INTO userroles (userid, roleid) VALUES ($1, $2)", newUserID, 1)
	if err != nil {
		log.Fatalf("Role assignment error: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		log.Fatalf("Error committing transaction: %v", err)
	}

	token, err := JwtTokens.GenerateJWTToken(user.Login, user.Password)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := struct {
		Token string `json:"token"`
	}{
		Token: token,
	}
	json.NewEncoder(w).Encode(response)
	return
}
