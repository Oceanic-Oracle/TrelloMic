package Mic

import (
	"authentication/DTO"
	"authentication/JwtTokens"
	"authentication/Postgres"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

func GetId(w http.ResponseWriter, r *http.Request) {
	var userTokenReq DTO.UserTokenDTO
	var userReq DTO.UserDTO
	err := json.NewDecoder(r.Body).Decode(&userTokenReq)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "unable to parse body: %v", err)
		return
	}

	userReq, err = JwtTokens.ParseJWTToken(userTokenReq.Token)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "parse error: %v", err)
		return
	}

	var userId int64
	err = Postgres.Conn.QueryRow(context.Background(), "SELECT id FROM users WHERE login = $1", userReq.Login).Scan(&userId)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "unable to query row: %v", err)
		return
	}

	response := struct {
		Id int64 `json:"id"`
	}{Id: userId}

	fmt.Println(response)

	json.NewEncoder(w).Encode(response)
	return
}

func DecToken(w http.ResponseWriter, r *http.Request) {
	var userTokenReq DTO.UserTokenDTO
	var userReq DTO.UserDTO
	err := json.NewDecoder(r.Body).Decode(&userTokenReq)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "unable to parse body: %v", err)
	}

	userReq, err = JwtTokens.ParseJWTToken(userTokenReq.Token)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "parse error: %v", err)
		return
	}

	response := struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}{
		Login:    userReq.Login,
		Password: userReq.Password,
	}

	fmt.Println(response)

	json.NewEncoder(w).Encode(response)
	return
}
