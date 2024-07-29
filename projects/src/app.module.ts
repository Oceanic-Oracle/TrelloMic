import { Module } from '@nestjs/common';
import { ProjectModule } from './project/project.module';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [ProjectModule],
  providers: [RabbitMQService]
})
export class AppModule {}
