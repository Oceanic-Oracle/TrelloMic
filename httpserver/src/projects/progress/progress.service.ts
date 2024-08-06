import { Inject, Injectable } from "@nestjs/common";
import { CreateProjectDto } from "../dto/get-project.dto";
import { timeout } from "rxjs";
import { ClientProxy } from "@nestjs/microservices";
@Injectable()
export class ProgressService {
    constructor(@Inject('PRISMA_SERVICE') private rabbitClient: ClientProxy) {}

    async getProgresses(req: any, projectId: number) {
        const token = req.headers.authorization.split(' ')[1];
    
        console.log(`Sending message with cmd: 'get-progresses', token: ${token}, projectId: ${projectId}`);
    
        return this.rabbitClient
            .send({ cmd: 'get-progresses' }, { token, projectId })
            .pipe(timeout(5000));
    }

    async createProgress(req: any, projectId: number, dto: CreateProjectDto) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'create-progress' }, { token, projectId, dto })
        .pipe(timeout(5000));
    }

    async deleteProgress(req: any, projectId: number, progressId: number) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'delete-progress' }, { token, progressId })
        .pipe(timeout(5000));
    }
}