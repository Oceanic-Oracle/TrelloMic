import { Module } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { ProjectController } from "./project.controller";
import { ProgressService } from "./progress/progress.service";
import { TaskService } from "./progress/task/task.service";
import { ProgressController } from "./progress/progress.controller";
import { TaskController } from "./progress/task/task.controller";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
    imports: [
        ClientsModule.register([
        {
          name: 'PRISMA_SERVICE',
          transport: Transport.RMQ,
          options: {
            urls: ['amqp://localhost:5672'],
            queue: 'prisma-queue',
            queueOptions: {
              durable: true
            },
          },
        },
      ]),
    ],
    controllers: [ProjectController, ProgressController, TaskController],
    providers: [ProjectService, ProgressService, TaskService, ]
})
export class ProjectModule {}