import { Body, Controller, Delete, Get, Param, Post, Request } from "@nestjs/common";
import { CreateProjectDto } from "../dto/get-project.dto";
import { ProgressService } from "./progress.service";

@Controller('/project/:projectId/progress') 
export class ProgressController {
    constructor(private readonly progressService: ProgressService) {}

    @Get()
    async getProgresses(@Request() req, @Param('projectId') projectId) {
        return this.progressService.getProgresses(req, projectId)
    }

    @Post()
    async createProgress(@Request() req: any, @Param('projectId') projectId, @Body() dto: CreateProjectDto) {
        return this.progressService.createProgress(req, projectId, dto)
    }

    @Delete('/:progressId')
    async deleteProgress(@Request() req: any, @Param('projectId') projectId: number, @Param('progressId') progressId: number) {
        return this.progressService.deleteProgress(req, projectId, progressId)
    }
}