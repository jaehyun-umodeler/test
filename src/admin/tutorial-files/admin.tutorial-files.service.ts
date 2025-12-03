import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { ResponseDto } from 'src/common/dto/response.dto';
import { FilesService } from 'src/files/files.service';
import { CreateTutorialFileDto } from 'src/tutorial-files/dto/create-tutorial-file.dto';
import { UpdateTutorialFileDto } from 'src/tutorial-files/dto/update-tutorial-file.dto';
import { TutorialFile } from 'src/tutorial-files/entities/tutorial-file.entity';
import { AppException } from 'src/utils/app-exception';
import { FolderType } from 'src/utils/constants';

import { AdminTutorialFileDto } from './dto/admin.tutorial-file.dto';

@Injectable()
export class AdminTutorialFilesService {
  constructor(
    @InjectRepository(TutorialFile)
    private readonly tutorialFileRepository: Repository<TutorialFile>,
    private readonly entityManager: EntityManager,
    private readonly filesService: FilesService,
  ) {}

  async create(
    userId: number,
    uploadedFile: Express.Multer.File,
    createTutorialFileDto: CreateTutorialFileDto,
  ): Promise<TutorialFile> {
    return this.entityManager.transaction(async (entityManager) => {
      const file = await this.filesService.upload(
        userId,
        entityManager,
        uploadedFile,
        FolderType.TUTORIAL,
      );
      const tutorialFile = entityManager.create(TutorialFile, {
        fileId: file.id,
        title: createTutorialFileDto.title,
        description: createTutorialFileDto.description,
        technics: createTutorialFileDto.technics,
        documentUrl: createTutorialFileDto.documentUrl,
        difficulty: Number(createTutorialFileDto.difficulty),
        isDefault: createTutorialFileDto.isDefault === 'true',
        sequence: Number(createTutorialFileDto.sequence),
      });
      return entityManager.save(tutorialFile);
    });
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<ResponseDto<AdminTutorialFileDto[]>> {
    const [tutorialFiles, totalCount] =
      await this.tutorialFileRepository.findAndCount({
        relations: ['file', 'file.folder'],
        order: {
          isDefault: 'DESC',
          sequence: 'ASC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

    const tutorialFilesWithUrls: AdminTutorialFileDto[] = [];
    for (const tutorialFile of tutorialFiles) {
      const result = new AdminTutorialFileDto();
      result.id = tutorialFile.id;
      result.title = tutorialFile.title;
      result.description = tutorialFile.description;
      result.technics = tutorialFile.technics;
      result.difficulty = tutorialFile.difficulty;
      result.fileName = tutorialFile.file.name;
      result.fileSize = tutorialFile.file.size;
      result.mimeType = tutorialFile.file.mimeType;
      result.documentUrl = tutorialFile.documentUrl;
      result.isActive = tutorialFile.isActive;
      result.isDefault = tutorialFile.isDefault;
      result.sequence = tutorialFile.sequence;
      result.createdAt = tutorialFile.createdAt;
      result.updatedAt = tutorialFile.updatedAt;
      // if (tutorialFile.file?.storageKey) {
      //   try {
      //     result.downloadUrl = await this.filesService.getDownloadUrl(
      //       tutorialFile.file,
      //     );
      //   } catch (error) {
      //     console.error(
      //       `Failed to generate download URL for file ${tutorialFile.file.id}:`,
      //       error,
      //     );
      //     result.downloadUrl = null;
      //   }
      // } else {
      //   result.downloadUrl = null;
      // }
      tutorialFilesWithUrls.push(result);
    }

    return new ResponseDto<AdminTutorialFileDto[]>(
      tutorialFilesWithUrls,
      totalCount,
    );
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

  async remove(id: string): Promise<void> {
    await this.entityManager.transaction(async (entityManager) => {
      const tutorialFile = await entityManager.findOne(TutorialFile, {
        where: { id },
        relations: ['file', 'file.folder', 'thumbnail'],
      });
      if (tutorialFile) {
        await entityManager.delete(TutorialFile, id);
        await this.filesService.delete(entityManager, tutorialFile.file);
      }
    });
  }
}
