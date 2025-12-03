import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FilesModule } from '@/files/files.module';
import { TutorialFileUser } from '@/tutorial-files/entities/tutorial-file-user.entity';
import { TutorialFile } from '@/tutorial-files/entities/tutorial-file.entity';
import { TutorialFilesModule } from '@/tutorial-files/tutorial-files.module';
import { User } from '@/users/entities/user.entity';

import { HubTutorialFilesController } from './tutorial-files/hub.tutorial-files.controller';
import { HubTutorialFilesService } from './tutorial-files/hub.tutorial-files.service';

@Module({
  imports: [
    TutorialFilesModule,
    TypeOrmModule.forFeature([TutorialFile, TutorialFileUser, User]),
    FilesModule,
    RouterModule.register([
      {
        path: 'hub',
        children: [
          {
            path: '',
            module: HubModule,
          },
        ],
      },
    ]),
  ],
  controllers: [HubTutorialFilesController],
  providers: [HubTutorialFilesService],
})
export class HubModule {}
