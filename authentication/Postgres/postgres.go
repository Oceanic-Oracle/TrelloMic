package Postgres

import (
	"authentication/Env"
	"context"
	"fmt"
	"github.com/jackc/pgx/v4"
	"log"
)

var Conn *pgx.Conn

func connectDB(connStr string) (*pgx.Conn, error) {
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}
	return conn, nil
}

func pingDB(conn *pgx.Conn) error {
	err := conn.Ping(context.Background())
	if err != nil {
		return fmt.Errorf("unable to ping database: %v", err)
	}
	return nil
}

func ConDatabase() {
	var err error
	Conn, err = connectDB(Env.Envfile.DATABASE_URL)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}
	err = pingDB(Conn)
	if err != nil {
		log.Fatalf("unable to ping database: %v", err)
	}
}
