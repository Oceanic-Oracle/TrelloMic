import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from "@nestjs/common";
import { ProgressService } from "./progress.service";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateProjectDto } from "../dto/get-project.dto";
import { SwapProgressesDto } from "./dto/swap-progresses.dto";

@ApiTags('Прогресс')
@Controller('/project/:projectId/progress') 
export class ProgressController {
    constructor(private readonly progressService: ProgressService) {}

    @ApiOperation({summary: "Получение столбцов"})
    @ApiResponse({status: 200})
    @ApiParam({ name: 'projectId', description: 'Project ID', required: true, type: Number })
    @ApiBearerAuth()
    @Get()
    async getProgresses(@Request() req, @Param('projectId') projectId) {
        const progresses = await this.progressService.getProgresses(req, Number(projectId));
        return progresses;
    }

    @ApiOperation({summary: "Создание столбца"})
    @ApiResponse({status: 200})
    @ApiParam({ name: 'projectId', description: 'Project ID', required: false, type: Number })
    @ApiBearerAuth()
    @Post()
    async createProgress(@Request() req: any, @Param('projectId') projectId, @Body() dto: CreateProjectDto) {
        const progress = await this.progressService.createProgress(req, Number(projectId), dto);
        return progress;
    }

    @ApiOperation({summary: "Поменять местами столбцы"})
    @ApiResponse({status: 200})
    @ApiParam({ name: 'projectId', description: 'Project ID', required: false, type: Number })
    @ApiBearerAuth()
    @Put()
    async swapId(@Request() req: any, @Body() dto: SwapProgressesDto) {
        const progress = await this.progressService.swapId(req, dto);
        return progress;
    }

    @ApiOperation({summary: "Удаление столбца"})
    @ApiResponse({status: 200})
    @ApiParam({ name: 'projectId', description: 'Project ID', required: false, type: Number })
    @ApiParam({ name: 'progressId', description: 'Progress ID', required: true, type: Number })
    @ApiBearerAuth()
    @Delete('/:progressId')
    async deleteProgress(@Request() req: any, @Param('projectId') projectId: number, @Param('progressId') progressId: number) {
        const progress = await this.progressService.deleteProgress(req, Number(projectId), Number(progressId));
        return progress;
    }
}