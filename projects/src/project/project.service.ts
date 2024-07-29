import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProjectDto } from "./dto/get-project.dto";
import { HttpService } from "@nestjs/axios";
import { catchError, lastValueFrom } from "rxjs";
import { AxiosResponse } from "axios";

@Injectable()
export class ProjectService {
    constructor(private readonly prismaService: PrismaService,
        private readonly httpService: HttpService
    ) {}

    async getProjects(req) {
        const userId = await this.tokenUserId(req);
        const projects = await this.prismaService.project.findMany({
            where: {
                userId: userId
            }
        });
        return projects;
    }

    async getProject(req, projectId: number) {
        const userId = await this.tokenUserId(req);
        const project = await this.prismaService.project.findMany({
            where: {
                id: projectId,
                userId: userId
            }
        })
        return project;
    }

    async createProject(req, dto: CreateProjectDto) {
        const userId = await this.tokenUserId(req);
        const project = await this.prismaService.project.create({
            data: {
                name: dto.name,
                userId: userId
            }
        })
        return project;
    }
    
    async deleteProject(req, projectId: number) {
        const userId = await this.tokenUserId(req);
        await this.prismaService.task.deleteMany({
            where: {
                progress: {
                    projectId: projectId,
                    userId: userId
                }
            }
        });
        await this.prismaService.progress.deleteMany({
            where: {
                projectId: projectId,
                userId: userId
            }
        });
        const project = await this.prismaService.project.delete({
            where: {
                id: projectId, 
                userId: userId
            }
        })
        return project;
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
