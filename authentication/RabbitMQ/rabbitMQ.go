package RabbitMQ

import (
	"authentication/RabbitMQ/Common"
	"authentication/Routers/Mic"
	"fmt"
	"log"

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
		"auth_userId", // name
		false,         // durable
		false,         // delete when unused
		false,         // exclusive
		false,         // no-wait
		nil,           // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare a queue: %v", err)
	}
	log.Println("Queue declared:", q.Name)

	Common.ResponseQueue, err = Common.Ch.QueueDeclare(
		"auth_response_userId", // name
		false,                  // durable
		false,                  // delete when unused
		false,                  // exclusive
		false,                  // no-wait
		nil,                    // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare a response queue: %v", err)
	}
	log.Println("Response queue declared:", Common.ResponseQueue.Name)

	Common.Msgs, err = Common.Ch.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		return fmt.Errorf("failed to register a consumer: %v", err)
	}
	log.Println("Consumer registered")

	go Mic.GetId()

	// Обработка сообщений в отдельной горутине
	go func() {
		for msg := range Common.Msgs {
			log.Println("Received a message:", string(msg.Body))
			// Обработка сообщения
			// TODO: Добавьте ваш код для обработки сообщения здесь

			// Подтверждение сообщения
			msg.Ack(false)
		}
	}()

	// Ожидание завершения работы горутины
	select {}
}
