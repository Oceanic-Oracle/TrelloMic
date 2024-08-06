import { Body, Controller, Delete, Get, Param, Post, Request } from "@nestjs/common";
import { TaskService } from "./task.service";
import { CreateTaskDto } from "./dto/create-task.dto";

@Controller('/project/:projectId/progress/:progressId/task')
export class TaskController {
    constructor(private readonly  taskService: TaskService) {}

    @Get()
    async getTasks(@Request() req: any, @Param('projectId') projectId: number, @Param('progressId') progressId: number) {
        return this.taskService.getTasks(req, projectId, progressId)
    }

    @Post()
    async createTask(@Request() req: any, @Param('projectId') projectId: number, @Param('progressId') progressId: number, @Body() dto: CreateTaskDto) {
        return this.taskService.createTask(req, projectId, progressId, dto)
    }

    @Delete('/:taskId')
    async deleteTask(@Request() req: any, @Param('projectId') projectId: number, @Param('progressId') progressId: number, @Param('taskId') taskId: number) {
        return this.taskService.deleteTask(req, projectId, progressId, taskId)
    }
}