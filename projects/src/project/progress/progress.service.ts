import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProjectDto } from "../dto/get-project.dto";
import { SwapProgressesDto } from "./dto/swap-progresses.dto";
import { AxiosResponse } from "axios";
import { catchError, lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class ProgressService {
    constructor(private readonly prismaService: PrismaService,
        private readonly httpService: HttpService
    ) {}

    async getProgresses(req: any, projectId: number) {
        const userId = await this.tokenUserId(req);
        const progresses = await this.prismaService.progress.findMany({
            where: {
                projectId: projectId,
                userId: userId
            }
        })
        return progresses;
    }

    async createProgress(req: any, projectId: number, dto: CreateProjectDto) {
        const userId = await this.tokenUserId(req);
        const progress = await this.prismaService.progress.create({
            data: {
                name: dto.name,
                userId: userId,
                projectId: projectId
            }
        })
        return progress;
    }

    async swapId(req: any, dto: SwapProgressesDto) {
        const userId = await this.tokenUserId(req);
        const progress1 = await this.prismaService.progress.findUnique({
            where: {
                id: dto.progress1,
                userId: userId
            }
        })
        const progress2 = await this.prismaService.progress.findUnique({
            where: {
                id: dto.progress2,
                userId: userId
            }
        })

        if (!progress1 || !progress2) {
            throw new HttpException('One or both progress entries not found', HttpStatus.NOT_FOUND);
        }

        const tempName = progress1.name;
        progress1.name = progress2.name;
        progress2.name = tempName;
      
        await this.prismaService.$transaction([
          this.prismaService.progress.update({
            where: { id: dto.progress1 },
            data: { name: progress1.name },
          }),
          this.prismaService.progress.update({
            where: { id: dto.progress2 },
            data: { name: progress2.name },
          }),
        ]);
      
        return { success: true };
    }

    async deleteProgress(req: any, projectId: number, progressId: number) {
        const userId = await this.tokenUserId(req);
        await this.prismaService.task.deleteMany({
            where: {
                progressId: progressId,
                userId: userId
            }
        });
        const progress = await this.prismaService.progress.delete({
            where: {
                id: progressId,
                projectId: projectId,
                userId: userId
            }
        });
        return progress;
    }

    private async tokenUserId(req): Promise<any> {
        try {
            const token = req.headers.authorization.split(' ')[1];
      
        const request$ = this.httpService.post('http://localhost:8080/auth/mic', {
            token: token,
        }, {
              headers: {
                'Content-Type': 'application/json',
            },
        }).pipe(
              catchError(error => {
                throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
            }),
        );
      
            const response: AxiosResponse<{ id: number }> = await lastValueFrom(request$);

            console.log(response.data.id)
      
            return response.data.id;
        } catch (error) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
    }
}