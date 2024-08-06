import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ProgressService } from "./progress.service";
import { CreateProjectDto } from "../dto/get-project.dto";

@Controller()
export class ProgressController {
    constructor(private readonly progressService: ProgressService) {}

    @MessagePattern({ cmd: 'get-progresses' })
    async getProgresses(@Payload() data: { token: string, projectId: number }) {
        const { token, projectId } = data;
        return await this.progressService.getProgresses(token, projectId);
    }

    @MessagePattern({cmd: 'create-progress'})
    async createProgress(@Payload() data: { token: string, projectId: number,  dto: CreateProjectDto }){
        const { token, projectId,  dto } = data;
        return await  this.progressService.createProgress(token, projectId,  dto);
    }

    @MessagePattern({cmd: 'delete-progress'})
    async deleteProgress(@Payload() data: { token: string, taskId: number }){
        const { token, taskId } = data;
        return await this.progressService.deleteProgress(token, taskId);
    }
}