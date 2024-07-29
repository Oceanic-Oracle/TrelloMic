import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProjectDto } from "./dto/get-project.dto";
import { RabbitMQService } from "src/rabbitmq.service";

@Injectable()
export class ProjectService {
    constructor(private readonly prismaService: PrismaService,
        private readonly rabbitMQService: RabbitMQService
    ) {}

    async getProjects(req) {
        const userId = await this.tokenUserId(req);
        const projects = await this.prismaService.project.findMany({
            where: {
                userId: userId
            }
        });
        return projects;
    }

    async getProject(req, projectId: number) {
        const userId = await this.tokenUserId(req);
        const project = await this.prismaService.project.findMany({
            where: {
                id: projectId,
                userId: userId
            }
        })
        return project;
    }

    async createProject(req, dto: CreateProjectDto) {
        const userId = await this.tokenUserId(req);
        const project = await this.prismaService.project.create({
            data: {
                name: dto.name,
                userId: userId
            }
        })
        return project;
    }
    
    async deleteProject(req, projectId: number) {
        const userId = await this.tokenUserId(req);
        await this.prismaService.task.deleteMany({
            where: {
                progress: {
                    projectId: projectId,
                    userId: userId
                }
            }
        });
        await this.prismaService.progress.deleteMany({
            where: {
                projectId: projectId,
                userId: userId
            }
        });
        const project = await this.prismaService.project.delete({
            where: {
                id: projectId, 
                userId: userId
            }
        })
        return project;
    }

    private async tokenUserId(req): Promise<any> {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const correlationId = this.generateUuid();
            const responseQueue = 'auth_response_userId';
    
            await this.rabbitMQService.publish('auth_userId', JSON.stringify({ token }), {
                correlationId: correlationId,
                replyTo: responseQueue
            });
    
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new HttpException('Request timeout', HttpStatus.REQUEST_TIMEOUT));
                }, 10000);
    
                this.rabbitMQService.consume(responseQueue, (msg) => {
                    if (msg.properties.correlationId === correlationId) {
                        clearTimeout(timeout);
                        const response = JSON.parse(msg.content.toString());
                        resolve(response.id);
                    }
                });
            });
        } catch (error) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
    }
    
    private generateUuid(): string {
        return Math.random().toString() + Math.random().toString() + Math.random().toString();
    }      
}