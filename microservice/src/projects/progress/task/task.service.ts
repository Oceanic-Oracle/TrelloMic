import { Injectable, OnModuleInit, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as amqp from 'amqplib';
import { CreateTaskDto } from "./dto/create-task.dto";

@Injectable()
export class TaskService implements OnModuleInit {
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

    async getTasks(token: string, projectId: number, progressId: number) {
        try {
            const userId = await this.userId(token);
            console.log(`Fetching projects for userId: ${userId}`);
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
            console.log(`Projects fetched:`, tasks);
            return tasks;  
        } catch (error) {
            console.error('Error in getProjects:', error);
            throw new InternalServerErrorException('Failed to get projects');
        }
    }
    
    async createTask(token: string, progressId: number, dto: CreateTaskDto){
        try {
            const userId = await this.userId(token);
            const task = await this.prismaService.task.create({
                data: {
                    name: dto.name,
                    text: dto.text,
                    progressId: progressId,
                    userId: userId
                }
            });
            console.log(`Project created:`, task);
            return task;
        } catch (error) {
            console.error('Error in createProject:', error);
            throw new InternalServerErrorException('Failed to create project');
        }
    }
    
    async deleteTask(token: string, taskId: number){
        try {
            const userId = await this.userId(token);
            console.log(`Deleting progress with id: ${taskId} for userId: ${userId}`);
            const task = await this.prismaService.task.delete({
                where: {
                    id: taskId,
                    userId: userId
                }
            });
            console.log(`Project deleted:`, task);
            return task;
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