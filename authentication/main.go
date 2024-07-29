package main

import (
	"authentication/Env"
	"authentication/Postgres"
	"authentication/RabbitMQ"
	"authentication/Routers"
	"fmt"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func main() {
	Env.EnvLoad()
	Postgres.ConDatabase()
	go func() {
		err := RabbitMQ.RabbitMQ()
		if err != nil {
			log.Fatalf("Error connecting to RabbitMQ: %v", err)
		}
	}()

	r := mux.NewRouter()
	authRouter := r.PathPrefix("/auth").Subrouter()

	authRouter.HandleFunc("/login", Routers.LoginHandler)
	authRouter.HandleFunc("/registration", Routers.RegHandler)

	port := fmt.Sprintf(":%s", Env.Envfile.PORT)
	http.ListenAndServe(port, r)
}
