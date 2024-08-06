import { Module } from '@nestjs/common';
import { ProjectModule } from './projects/project.module';

@Module({
  imports: [ProjectModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
