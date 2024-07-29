package Mic

import (
	"authentication/DTO"
	"authentication/JwtTokens"
	"authentication/Postgres"
	"authentication/RabbitMQ/Common"
	"context"
	"encoding/json"
	"fmt"
	"github.com/streadway/amqp"
	"log"
)

// GetId обрабатывает сообщения из очереди RabbitMQ и отправляет ответы
func GetId() {
	fmt.Println("GetId")
	for d := range Common.Msgs {
		fmt.Println("Received Message")

		// Распаковка JSON-структуры из тела сообщения
		var userTokenReq DTO.UserTokenDTO
		err := json.Unmarshal(d.Body, &userTokenReq)
		if err != nil {
			log.Printf("Error decoding JSON: %s", err)
			d.Nack(false, true) // Отправка сообщения обратно в очередь
			continue
		}

		// Проверка токена через JWT
		userReq, err := JwtTokens.ParseJWTToken(userTokenReq.Token)
		if err != nil {
			log.Printf("Parse error: %v", err)
			d.Nack(false, true) // Отправка сообщения обратно в очередь
			continue
		}

		// Запрос к базе данных для получения userId
		var userId int64
		err = Postgres.Conn.QueryRow(context.Background(), "SELECT id FROM users WHERE login = $1", userReq.Login).Scan(&userId)
		if err != nil {
			log.Printf("Unable to query row: %v", err)
			d.Nack(false, true) // Отправка сообщения обратно в очередь
			continue
		}

		// Формирование ответа
		response := struct {
			Id int64 `json:"id"`
		}{Id: userId}

		responseBody, err := json.Marshal(response)
		if err != nil {
			log.Printf("Error encoding JSON: %s", err)
			d.Nack(false, true) // Отправка сообщения обратно в очередь
			continue
		}

		// Отправка ответа в очередь ответов
		err = Common.Ch.Publish(
			"",
			Common.ResponseQueue.Name, // routing key
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        responseBody,
			})
		if err != nil {
			log.Printf("Failed to publish a message: %v", err)
			d.Nack(false, true) // Отправка сообщения обратно в очередь
			continue
		}

		d.Ack(false) // Подтверждение успешной обработки сообщения
	}
}
