package Env

import (
	"github.com/joho/godotenv"
	"log"
	"os"
)

type ENVFile struct {
	PORT         string `env:"PORT,required"`
	DATABASE_URL string `env:"DATABASE_URL,required"`
	JWT_KEY      string `env:"JWT_KEY,required"`
}

var Envfile ENVFile

func EnvLoad() {
	envPath := "./.env"
	err := godotenv.Load(envPath)
	if err != nil {
		log.Fatalf("Error loading .env file from %s: %v", envPath, err)
	}
	Envfile.PORT = os.Getenv("PORT")
	Envfile.DATABASE_URL = os.Getenv("DATABASE_URL")
	Envfile.JWT_KEY = os.Getenv("JWT_KEY")
}
