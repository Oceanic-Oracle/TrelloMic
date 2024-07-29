import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { AxiosResponse } from "axios";
import { catchError, lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class TaskService {
    constructor(private readonly prismaService: PrismaService,
        private readonly httpService: HttpService
    ) {}

    async getTasks(req: any, projectId: number, progressId: number) {
        const userId = await this.tokenUserId(req);
        const tasks = await this.prismaService.task.findMany({
            where: {
                userId: userId,
                progressId: progressId,
                progress: {
                    projectId: projectId
                }
            },
            include: {
                progress: true
            }
        })
        return tasks;
    }

    async createTask(req: any, projectId: number, progressId: number, dto: CreateTaskDto) {
        const userId = await this.tokenUserId(req);
        const task = await this.prismaService.task.create({
            data: {
                name: dto.name,
                text: dto.text,
                progressId: progressId,
                userId: userId
            }
        });
        return task;
    }

    async deleteTask(req: any, projectId: number, progressId: number, taskId: number) {
        const userId = await this.tokenUserId(req);
        const task = await this.prismaService.task.delete({
            where: {
                id: taskId,
                userId: userId,
                progressId: progressId
            }
        });
        return task
    }

    private async tokenUserId(req): Promise<any> {
        try {
            const token = req.headers.authorization.split(' ')[1];
      
        const request$ = this.httpService.post('http://localhost:8080/auth/mic', {
            token: token,
        }, {
              headers: {
                'Content-Type': 'application/json',
            },
        }).pipe(
              catchError(error => {
                throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
            }),
        );
      
            const response: AxiosResponse<{ id: number }> = await lastValueFrom(request$);
      
            return response.data.id;
        } catch (error) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
    }
}