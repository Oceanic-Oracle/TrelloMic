import { Body, Controller, Delete, Get, Param, Post, Request } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { CreateProjectDto} from "./dto/get-project.dto";

@Controller('/project')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @Get()
    async getProjects(@Request() req) {
        return await this.projectService.getProjects(req);
    }

    @Get('/:projectId')
    async getProject(@Request() req, @Param('projectId') projectId: number) {
        return await this.projectService.deleteProject(req, projectId)
    }

    @Post()
    async createProject(@Request() req, @Body() dto: CreateProjectDto) {
        return await this.projectService.createProject(req, dto)
    }

    @Delete('/:projectId')
    async deleteProject(@Request() req, @Param('projectId') projectId: number) {
        return await this.projectService.deleteProject(req, projectId)
    }
}