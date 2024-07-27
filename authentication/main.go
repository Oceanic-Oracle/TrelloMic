package main

import (
	"authentication/DTO"
	"context"
	"encoding/json"
	"fmt"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v4"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"os"
	"time"
)

type ENVFile struct {
	PORT         string `env:"PORT,required"`
	DATABASE_URL string `env:"DATABASE_URL,required"`
	JWT_KEY      string `env:"JWT_KEY,required"`
}

var Env ENVFile
var Conn *pgx.Conn

func ConnectDB(connStr string) (*pgx.Conn, error) {
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}
	return conn, nil
}

func PingDB(conn *pgx.Conn) error {
	err := conn.Ping(context.Background())
	if err != nil {
		return fmt.Errorf("unable to ping database: %v", err)
	}
	return nil
}

func main() {
	envPath := "./.env"
	err := godotenv.Load(envPath)
	if err != nil {
		log.Fatalf("Error loading .env file from %s: %v", envPath, err)
	}
	Env.PORT = os.Getenv("PORT")
	Env.DATABASE_URL = os.Getenv("DATABASE_URL")
	Env.JWT_KEY = os.Getenv("JWT_KEY")

	Conn, err = ConnectDB(Env.DATABASE_URL)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}
	err = PingDB(Conn)
	if err != nil {
		log.Fatalf("unable to ping database: %v", err)
	}

	r := mux.NewRouter()
	authRouter := r.PathPrefix("/auth").Subrouter()

	authRouter.HandleFunc("/login", loginHandler)
	authRouter.HandleFunc("/registration", regHandler)

	port := fmt.Sprintf(":%s", Env.PORT)
	http.ListenAndServe(port, r)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		login(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		fmt.Fprintf(w, "Method not allowed")
	}
}

func regHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		registration(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		fmt.Fprintf(w, "Method not allowed")
	}
}

func login(w http.ResponseWriter, r *http.Request) {
	var userReq DTO.UserDTO
	var userStored DTO.UserDTO

	err := json.NewDecoder(r.Body).Decode(&userReq)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "unable to parse body: %v", err)
		return
	}

	var id int
	err = Conn.QueryRow(context.Background(), "SELECT id, login, password FROM users WHERE login = $1", userReq.Login).Scan(&id, &userStored.Login, &userStored.Password)
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
		// Пароли не совпадают
		http.Error(w, "Wrong login or password", http.StatusUnauthorized)
		return
	}

	token, err := generateJWTToken(userReq.Login, userStored.Password)
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
}

func registration(w http.ResponseWriter, r *http.Request) {
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

	rows, err := Conn.Query(context.Background(), "SELECT * FROM users WHERE login = $1", user.Login)
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
	tx, err := Conn.Begin(ctx)
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

	token, err := generateJWTToken(user.Login, user.Password)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := struct {
		Token string `json:"message"`
	}{
		Token: token,
	}
	json.NewEncoder(w).Encode(response)
	return
}

func generateJWTToken(login, password string) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["login"] = login
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()

	secretKey := []byte(Env.JWT_KEY)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
