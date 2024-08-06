package RabbitMQ

import (
	"authentication/RabbitMQ/Common"
	"authentication/Routers/Mic"
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
		true,
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
		true,
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

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	return nil
}
