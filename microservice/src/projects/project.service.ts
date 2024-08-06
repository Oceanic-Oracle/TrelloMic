import { Injectable, OnModuleInit, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProjectDto } from "./dto/get-project.dto";
import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectService implements OnModuleInit {
    private readonly rabbitMQUrl = 'amqp://guest:guest@localhost:5672/';
    private channel: amqp.Channel;

    constructor(private readonly prismaService: PrismaService) {}

    async onModuleInit() {
        await this.initRabbitMQ();
    }

    private async initRabbitMQ() {
        try {
            const connection = await amqp.connect(this.rabbitMQUrl);
            this.channel = await connection.createChannel();
            await this.channel.assertQueue('auth_user_userId');
            await this.channel.assertQueue('auth_project_userId');
            console.log('RabbitMQ initialized successfully');
        } catch (error) {
            console.error('Failed to initialize RabbitMQ:', error);
        }
    }

    async getProjects(token: string) {
        try {
            const userId = await this.userId(token);
            console.log(`Fetching projects for userId: ${userId}`);
            const projects = await this.prismaService.project.findMany({
                where: {
                    userId: {
                        equals: userId
                    }
                }
            });
            console.log(`Projects fetched:`, projects);
            return projects;
        } catch (error) {
            console.error('Error in getProjects:', error);
            throw new InternalServerErrorException('Failed to get projects');
        }
    }
    
    async getProject(token: string, projectId: number){
        try {
            const userId = await this.userId(token);
            console.log(`Fetching project with id: ${projectId} for userId: ${userId}`);
            const project = await this.prismaService.project.findMany({
                where: {
                    id: projectId,
                    userId: {
                        equals: userId
                    }
                }
            });
            console.log(`Project fetched:`, project);
            return project;
        } catch (error) {
            console.error('Error in getProject:', error);
            throw new InternalServerErrorException('Failed to get project');
        }
    }
    
    async createProject(token: string, dto: CreateProjectDto){
        try {
            const userId = await this.userId(token);
            console.log(`Creating project for userId: ${userId}`);
            const project = await this.prismaService.project.create({
                data: {
                    name: dto.name,
                    userId: userId
                }
            });
            console.log(`Project created:`, project);
            return project;
        } catch (error) {
            console.error('Error in createProject:', error);
            throw new InternalServerErrorException('Failed to create project');
        }
    }
    
    async deleteProject(token: string, projectId: number){
        try {
            const userId = await this.userId(token);
            console.log(`Deleting project with id: ${projectId} for userId: ${userId}`);
            await this.prismaService.task.deleteMany({
                where: {
                    progress: {
                        projectId: projectId,
                        userId: {
                            equals: userId
                        }
                    }
                }
            });
            await this.prismaService.progress.deleteMany({
                where: {
                    projectId: projectId,
                    userId: {
                        equals: userId
                    }
                }
            });
            const project = await this.prismaService.project.delete({
                where: {
                    id: projectId, 
                    userId: {
                        equals: userId
                    }
                }
            });
            console.log(`Project deleted:`, project);
            return project;
        } catch (error) {
            console.error('Error in deleteProject:', error);
            throw new InternalServerErrorException('Failed to delete project');
        }
    }

    private async userId(token: string) {
        const responseQueue = 'auth_user_userId';
        const requestQueue = 'auth_project_userId';
    
        const message = JSON.stringify({ token });
        try {
            console.log(`Sending message to queue ${requestQueue}:`, message);
            this.channel.sendToQueue(requestQueue, Buffer.from(message));
        } catch (error) {
            console.error('Failed to send message to queue:', error);
            throw error;
        }
    
        return new Promise<number>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout: No response received from RabbitMQ'));
            }, 20000);
    
            this.channel.consume(responseQueue, (msg) => {
                if (msg) {
                    clearTimeout(timeout);
                    const content = msg.content.toString();
                    console.log(`Received message from queue ${responseQueue}:`, content);
                    try {
                        const parsedContent = JSON.parse(content);
                        if (parsedContent && typeof parsedContent.id === 'number') {
                            const userId = parsedContent.id;
                            console.log(userId);
                            clearTimeout(timeout)
                            resolve(userId);
                        } else {
                            reject(new Error(`Invalid userId received: ${content}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse message content: ${content}`));
                    }
                    this.channel.ack(msg);
                } else {
                    reject(new Error('No message received'));
                }
            }, { noAck: false });
        });
    }
}