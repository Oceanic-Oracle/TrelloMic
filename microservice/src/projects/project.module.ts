import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProjectService } from './project.service';
import { ProgressController } from './progress/progress.controller';
import { TaskController } from './progress/task/task.controller';
import { ProgressService } from './progress/progress.service';
import { TaskService } from './progress/task/task.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectController, ProgressController, TaskController],
  providers: [ProjectService, ProgressService, TaskService],
})
export class ProjectModule {}
