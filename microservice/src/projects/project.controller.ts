import { Controller } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { CreateProjectDto } from "./dto/get-project.dto";

@Controller()
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @MessagePattern({cmd: 'get-projects'})
    async getProjects(@Payload() data: { token: string }){
        const { token } = data;
        return await this.projectService.getProjects(token);
    }

    @MessagePattern({cmd: 'get-project'})
    async getProject(@Payload() data: { token: string, projectId: number }){
        const { token, projectId } = data;
        return await this.projectService.getProject(token, projectId);
    }

    @MessagePattern({cmd: 'create-project'})
    async createProject(@Payload() data: { token: string, dto: CreateProjectDto }){
        const { token, dto } = data;
        return await  this.projectService.createProject(token, dto);
    }

    @MessagePattern({cmd: 'delete-project'})
    async deleteProject(@Payload() data: { token: string, projectId: number }){
        const { token, projectId } = data;
        return await this.projectService.deleteProject(token, projectId);
    }
}