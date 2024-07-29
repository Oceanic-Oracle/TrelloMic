package Common

import (
	"github.com/streadway/amqp"
	"log"
)

var (
	Conn          *amqp.Connection
	Ch            *amqp.Channel
	Msgs          <-chan amqp.Delivery
	ResponseQueue amqp.Queue
)

func FailOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}
