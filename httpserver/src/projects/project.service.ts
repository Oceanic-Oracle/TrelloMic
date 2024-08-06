import { Inject, Injectable } from "@nestjs/common";
import { CreateProjectDto } from "./dto/get-project.dto";
import { ClientProxy } from "@nestjs/microservices";
import { timeout } from 'rxjs';

@Injectable()
export class ProjectService {
    constructor(@Inject('PRISMA_SERVICE') private rabbitClient: ClientProxy) {}

    async getProjects(req) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'get-projects' }, { token })
        .pipe(timeout(5000));
    }

    async getProject(req, projectId: number) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'get-project' }, { token, projectId })
        .pipe(timeout(5000));
    }

    async createProject(req, dto: CreateProjectDto) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'create-project' }, { token, dto })
        .pipe(timeout(5000));
    }
    
    async deleteProject(req, projectId: number) {
        const token = req.headers.authorization.split(' ')[1];

        return this.rabbitClient
        .send({ cmd: 'delete-project' }, { token, projectId })
        .pipe(timeout(5000));
    }
}