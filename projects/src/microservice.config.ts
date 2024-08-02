import { Transport } from '@nestjs/microservices';

export const microserviceOptions = {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://guest:guest@localhost:5672/'],
    queue: 'main_queue',
    queueOptions: {
      durable: false
    },
  },
};