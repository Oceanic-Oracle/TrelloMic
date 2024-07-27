package main

import (
	"authentication/Env"
	"authentication/Postgres"
	"authentication/Routers"
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
)

func main() {
	Env.EnvLoad()
	Postgres.ConDatabase()

	r := mux.NewRouter()
	authRouter := r.PathPrefix("/auth").Subrouter()

	authRouter.HandleFunc("/login", Routers.LoginHandler)
	authRouter.HandleFunc("/registration", Routers.RegHandler)

	port := fmt.Sprintf(":%s", Env.Envfile.PORT)
	http.ListenAndServe(port, r)
}