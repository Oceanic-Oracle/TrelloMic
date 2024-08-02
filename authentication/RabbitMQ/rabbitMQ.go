package RabbitMQ

import (
	"authentication/DTO"
	"authentication/JwtTokens"
	"authentication/Postgres"
	"authentication/RabbitMQ/Common"
	"authentication/Routers/Mic"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/streadway/amqp"
)

func RabbitMQ() error {
	var err error
	Common.Conn, err = amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %v", err)
	}
	log.Println("Successfully connected to RabbitMQ")
	defer Common.Conn.Close()

	Common.Ch, err = Common.Conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open a channel: %v", err)
	}
	defer Common.Ch.Close()

	q, err := Common.Ch.QueueDeclare(
		"auth_project_userId",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to declare a queue: %v", err)
	}
	log.Println("Queue declared:", q.Name)

	Common.ResponseQueue, err = Common.Ch.QueueDeclare(
		"auth_user_userId",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to declare a response queue: %v", err)
	}
	log.Println("Response queue declared:", Common.ResponseQueue.Name)

	Common.Msgs, err = Common.Ch.Consume(
		q.Name,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to register a consumer: %v", err)
	}
	log.Println("Consumer registered")

	go Mic.GetId()

	go func() {
		for d := range Common.Msgs {
			fmt.Println("Received Message")

			var userTokenReq DTO.UserTokenDTO
			err := json.Unmarshal(d.Body, &userTokenReq)
			fmt.Println(userTokenReq)
			if err != nil {
				log.Printf("Error decoding JSON: %s", err)
				d.Nack(false, true)
				continue
			}

			userReq, err := JwtTokens.ParseJWTToken(userTokenReq.Token)
			fmt.Println(userReq)
			if err != nil {
				log.Printf("Parse error: %v", err)
				d.Nack(false, true)
				continue
			}

			var userId int64
			err = Postgres.Conn.QueryRow(context.Background(), "SELECT id FROM users WHERE login = $1", userReq.Login).Scan(&userId)
			if err != nil {
				log.Printf("Unable to query row: %v", err)
				d.Nack(false, true)
				continue
			}

			response := struct {
				Id int64 `json:"id"`
			}{Id: userId}
			fmt.Println(response)
			responseBody, err := json.Marshal(response)
			if err != nil {
				log.Printf("Error encoding JSON: %s", err)
				d.Nack(false, true)
				continue
			}
			fmt.Println(string(responseBody))

			err = Common.Ch.Publish(
				"",
				Common.ResponseQueue.Name,
				false,
				false,
				amqp.Publishing{
					ContentType:   "application/json",
					Body:          responseBody,
					CorrelationId: d.CorrelationId,
				})
			if err != nil {
				log.Printf("Failed to publish a message: %v", err)
				d.Nack(false, true)
				continue
			}

			d.Ack(false)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	return nil
}
