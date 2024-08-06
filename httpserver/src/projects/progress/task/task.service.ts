import { Inject, Injectable } from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { ClientProxy } from "@nestjs/microservices";
import { timeout } from "rxjs";

@Injectable()
export class TaskService {
    constructor(@Inject('PRISMA_SERVICE') private rabbitClient: ClientProxy) {}

    async getTasks(req: any, projectId: number, progressId: number) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'get-tasks' }, { token, projectId, progressId })
        .pipe(timeout(5000));
    }

    async createTask(req: any, projectId: number, progressId: number, dto: CreateTaskDto) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'get-task' }, { token, projectId, progressId, dto })
        .pipe(timeout(5000));
    }

    async deleteTask(req: any, projectId: number, progressId: number, taskId: number) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'get-task' }, { token, taskId })
        .pipe(timeout(5000));
    }
}