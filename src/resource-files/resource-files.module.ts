import { Module } from '@nestjs/common';
import { ResourceFilesService } from './resource-files.service';
import { ResourceFilesController } from './resource-files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceFile } from './entities/resource-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResourceFile])],
  controllers: [ResourceFilesController],
  providers: [ResourceFilesService],
  exports: [ResourceFilesService],
})
export class ResourceFilesModule {}
