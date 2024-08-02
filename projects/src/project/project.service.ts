import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProjectDto } from "./dto/get-project.dto";
import { RabbitMQService } from "src/rabbitmq.service";
import { v4 as uuidv4 } from 'uuid';

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
            const responseQueue = 'auth_user_userId';
            const requestQueue = 'auth_project_userId';
            const correlationId = uuidv4();
            console.log('Generated correlationId:', correlationId);
    
            await this.rabbitMQService.publish(requestQueue, JSON.stringify({ token }), { correlationId: correlationId });
            console.log('Published message with correlationId:', correlationId);
    
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new HttpException('Request timeout', HttpStatus.REQUEST_TIMEOUT));
                }, 10000);
    
                const consumeHandler = (msg) => {
                    try {
                        console.log('Received message:', msg);
    
                        const receivedCorrelationId = msg.properties.correlationId;
                        console.log('Received correlationId:', receivedCorrelationId);
                        console.log('Expected correlationId:', correlationId);
    
                        if (receivedCorrelationId === correlationId) {
                            console.log('Received message with matching correlationId:', correlationId);
                            clearTimeout(timeout);
                            const response = JSON.parse(msg.content.toString());
                            console.log('Parsed response:', response);
                            this.rabbitMQService.ack(msg);
    
                            resolve(response.id);
                        } else {
                            console.log('Received message with different correlationId:', receivedCorrelationId);
                        }
                    } catch (error) {
                        console.error('Error processing message:', error);
                        reject(new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR));
                    }
                };
    
                this.rabbitMQService.consume(responseQueue, consumeHandler);
            });
        } catch (error) {
            console.error('Error in tokenUserId:', error);
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
    }
}