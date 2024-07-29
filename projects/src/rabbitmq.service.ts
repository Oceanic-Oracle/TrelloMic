import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService {
    private connection: amqp.Connection;
    private channel: amqp.Channel;

    async connect() {
        if (!this.connection || !this.channel) {
            this.connection = await amqp.connect('amqp://guest:guest@localhost:5672/');
            this.channel = await this.connection.createChannel();
        }
    }

    async publish(queue: string, message: string, options?: amqp.Options.Publish) {
        await this.connect();
        await this.channel.assertQueue(queue, { durable: false });
        this.channel.sendToQueue(queue, Buffer.from(message), options);
    }

    async consume(queue: string, callback: (msg: amqp.Message) => void) {
        await this.connect();
        await this.channel.assertQueue(queue, { durable: false });
        this.channel.consume(queue, callback, { noAck: true });
    }
}
