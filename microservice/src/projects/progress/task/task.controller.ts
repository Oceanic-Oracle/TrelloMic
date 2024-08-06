import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { TaskService } from "./task.service";
import { CreateTaskDto } from "./dto/create-task.dto";

@Controller()
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @MessagePattern({cmd: 'get-tasks'})
    async getTasks(@Payload() data: { token: string, projectId: number, progressId: number }){
        const { token, projectId, progressId } = data;
        return await this.taskService.getTasks(token, projectId, progressId);
    }

    @MessagePattern({cmd: 'create-task'})
    async createTask(@Payload() data: { token: string, projectId: number, dto: CreateTaskDto }){
        const { token, projectId, dto } = data;
        return await  this.taskService.createTask(token, projectId, dto);
    }

    @MessagePattern({cmd: 'delete-task'})
    async deleteTask(@Payload() data: { token: string, taskId: number }){
        const { token, taskId } = data;
        return await this.taskService.deleteTask(token, taskId);
    }
}