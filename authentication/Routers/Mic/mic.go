package Mic

import (
	"authentication/JwtTokens"
	"authentication/Postgres"
	"authentication/RabbitMQ/Common"
	"context"
	"encoding/json"
	"fmt"
	"github.com/streadway/amqp"
	"log"
)

func GetId() {
	for d := range Common.Msgs {
		fmt.Println("Received Message")

		var userTokenReq struct {
			Token string `json:"token"`
		}
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
}
