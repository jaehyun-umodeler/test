import { Module } from '@nestjs/common';
import { TutorialFilesService } from './tutorial-files.service';
import { TutorialFilesController } from './tutorial-files.controller';
import { forwardRef } from '@nestjs/common';
import { FilesModule } from 'src/files/files.module';
import { TutorialFile } from './entities/tutorial-file.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([TutorialFile]),
    forwardRef(() => FilesModule),
  ],
  providers: [TutorialFilesService],
  controllers: [TutorialFilesController],
  exports: [TutorialFilesService],
})
export class TutorialFilesModule {}
