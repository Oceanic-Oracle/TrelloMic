import { Module } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { ProjectController } from "./project.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { ProgressService } from "./progress/progress.service";
import { TaskService } from "./progress/task/task.service";
import { ProgressController } from "./progress/progress.controller";
import { TaskController } from "./progress/task/task.controller";
import { HttpModule } from "@nestjs/axios";
import { RabbitMQService } from "src/rabbitmq.service";

@Module({
    imports: [
        PrismaModule,
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
          }),
    ],
    controllers: [ProjectController, ProgressController, TaskController],
    providers: [ProjectService, ProgressService, TaskService, RabbitMQService]
})
export class ProjectModule {}