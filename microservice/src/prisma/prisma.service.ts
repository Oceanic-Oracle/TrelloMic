import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor (private readonly configService: ConfigService) {
        super({
            datasources: {
                db: {
                    url: configService.get('DATABASE_URL'),
                },
            }
        });
    }

    async onModuleInit() {
        await this.$connect();
        const port = new URL(this.configService.get('DATABASE_URL')).port;
        console.log(`Data base connected on ${port}`);
    }
    async onModuleDestroy() {
        await this.$disconnect();
        console.log("Data base disconnected");
    }
}