import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { ResponseDto } from 'src/common/dto/response.dto';
import { FilesService } from 'src/files/files.service';
import { UpdateTutorialFileDto } from 'src/tutorial-files/dto/update-tutorial-file.dto';
import { TutorialFileUser } from 'src/tutorial-files/entities/tutorial-file-user.entity';
import { TutorialFile } from 'src/tutorial-files/entities/tutorial-file.entity';
import { User } from 'src/users/entities/user.entity';
import { AppException } from 'src/utils/app-exception';
import { encryptEmail } from 'src/utils/util';

import { HubTutorialFileDto } from './dto/hub.tutorial-file.dto';

@Injectable()
export class HubTutorialFilesService {
  constructor(
    @InjectRepository(TutorialFile)
    private readonly tutorialFileRepository: Repository<TutorialFile>,
    @InjectRepository(TutorialFileUser)
    private readonly tutorialFileUserRepository: Repository<TutorialFileUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly entityManager: EntityManager,
    private readonly filesService: FilesService,
  ) { }

  async findAll(email: string): Promise<ResponseDto<HubTutorialFileDto[]>> {
    const user = await this.userRepository.findOne({
      where: { email: encryptEmail(email) },
    });
    if (!user) {
      throw AppException.userNotFound();
    }
    const [tutorialFiles, totalCount] =
      await this.tutorialFileRepository.findAndCount({
        where: { isActive: true },
        relations: ['file', 'tutorialFileUsers', 'tutorialFileUsers.user'],
        order: {
          isDefault: 'DESC',
          sequence: 'ASC',
        },
      });

    const tutorialFilesWithUrls: HubTutorialFileDto[] = [];
    for (const tutorialFile of tutorialFiles) {
      const result = new HubTutorialFileDto();
      result.id = tutorialFile.id;
      result.title = tutorialFile.title;
      result.description = tutorialFile.description;
      result.technics = tutorialFile.technics;
      result.difficulty = tutorialFile.difficulty;
      result.fileName = tutorialFile.file.name;
      result.fileSize = tutorialFile.file.size;
      result.documentUrl = tutorialFile.documentUrl;
      result.sequence = tutorialFile.sequence;
      result.isCompleted =
        tutorialFile.tutorialFileUsers?.some(
          (tutorialFileUser) =>
            tutorialFileUser.user.id === user.id &&
            tutorialFileUser.isCompleted,
        ) ?? false;
      result.createdAt = tutorialFile.createdAt;
      tutorialFilesWithUrls.push(result);
    }

    return new ResponseDto<HubTutorialFileDto[]>(
      tutorialFilesWithUrls,
      totalCount,
    );
  }

  async findOne(id: string): Promise<ResponseDto<HubTutorialFileDto>> {
    const tutorialFile = await this.tutorialFileRepository.findOne({
      where: { id },
      relations: ['file', 'file.folder'],
    });
    if (!tutorialFile) {
      throw AppException.tutorialFileNotFound();
    }
    const result = new HubTutorialFileDto();
    result.id = tutorialFile.id;
    if (tutorialFile.file?.storageKey) {
      try {
        result.downloadUrl = await this.filesService.getDownloadUrl(
          tutorialFile.file,
        );
      } catch (error) {
        console.error(
          `Failed to generate download URL for file ${tutorialFile.file.id}:`,
          error,
        );
        result.downloadUrl = null;
      }
    } else {
      result.downloadUrl = null;
    }
    return new ResponseDto<HubTutorialFileDto>(result, 1);
  }

  async update(
    id: string,
    updateTutorialFileDto: UpdateTutorialFileDto,
  ): Promise<void> {
    const tutorialFile = await this.tutorialFileRepository.findOne({
      where: { id },
    });
    if (!tutorialFile) {
      throw AppException.tutorialFileNotFound();
    }
    Object.assign(tutorialFile, updateTutorialFileDto);
    await this.tutorialFileRepository.save(tutorialFile);
  }

  async complete(id: string, email: string): Promise<void> {
    const tutorialFile = await this.tutorialFileRepository.findOne({
      where: { id },
    });
    if (!tutorialFile) {
      throw AppException.tutorialFileNotFound();
    }
    const user = await this.userRepository.findOne({
      where: { email: encryptEmail(email) },
    });
    if (!user) {
      throw AppException.userNotFound();
    }
    await this.tutorialFileUserRepository.upsert(
      {
        user: { id: user.id },
        tutorialFile: { id: tutorialFile.id },
        isCompleted: true,
      },
      { conflictPaths: ['userId', 'tutorialFileId'] },
    );
  }
}
