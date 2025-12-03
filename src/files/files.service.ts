import { Bucket, Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { AppException } from 'src/utils/app-exception';
import { FolderType } from 'src/utils/constants';

import { UpdateFileDto } from './dto/update-file.dto';
import { File } from './entities/file.entity';
import { Folder } from './entities/folder.entity';

@Injectable()
export class FilesService {
  private storage: Storage;

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    private readonly configService: ConfigService,
  ) {
    const gcpConfig = this.configService.get('gcp.storage');
    const storageOptions: any = {};
    if (gcpConfig.keyFilename) {
      storageOptions.keyFilename = gcpConfig.keyFilename;
    }
    this.storage = new Storage(storageOptions);
  }

  async upload(
    userId: number,
    entityManager: EntityManager,
    uploadedFile: Express.Multer.File,
    folderType: FolderType,
  ): Promise<File> {
    try {
      const { bucket, folderName } = await this.getBucket(folderType);
      const folder = await this.ensureFolderExists(
        entityManager,
        folderName,
        folderType,
      );
      const timestamp = Date.now();
      const sanitizedFileName = uploadedFile.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        '_',
      );
      const fileName = `${timestamp}-${sanitizedFileName}`;
      const storageFile = bucket.file(`${folderName}/${fileName}`);
      await storageFile.save(uploadedFile.buffer, {
        metadata: {
          contentType: uploadedFile.mimetype,
        },
      });
      const fileEntity = entityManager.create(File, {
        folderId: folder.id,
        name: sanitizedFileName,
        storageKey: fileName,
        size: uploadedFile.buffer.length,
        mimeType: uploadedFile.mimetype,
        uploadedByUser: {
          id: userId,
        },
      });
      const result = await entityManager.insert(File, fileEntity);
      return entityManager.findOne(File, {
        where: {
          id: result.identifiers[0].id,
        },
      });
    } catch (error) {
      console.error(error);
      throw AppException.uploadFailed(error.message);
    }
  }

  async delete(entityManager: EntityManager, file: File): Promise<void> {
    const { bucket, folderName } = await this.getBucket(file.folder.type);
    await entityManager.delete(File, file.id);
    const storageFile = bucket.file(`${folderName}/${file.storageKey}`);
    await storageFile.delete();
  }

  async getDownloadUrl(
    file: File,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    try {
      if (!file.storageKey) {
        throw AppException.fileNotFound();
      }
      const { bucket, folderName } = await this.getBucket(file.folder.type);
      const storageFile = bucket.file(`${folderName}/${file.storageKey}`);
      const expiresInSeconds = expiresInMinutes * 60;
      const [signedUrl] = await storageFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      });
      return signedUrl;
    } catch (error) {
      throw AppException.badRequest(
        `Failed to generate download URL: ${error.message}`,
        error.stack,
      );
    }
  }

  private async getBucket(
    folderType: FolderType,
  ): Promise<{ bucket: Bucket; folderName: string }> {
    const bucketNameDownload = this.configService.get(
      'gcp.storage.bucketNameDownload',
    );
    const bucketNameMedia = this.configService.get(
      'gcp.storage.bucketNameMedia',
    );
    let bucketName: string;
    let folderName: string;
    switch (folderType) {
      case FolderType.TUTORIAL:
        bucketName = bucketNameDownload;
        folderName = 'downloads/tutorials';
        break;
      case FolderType.PACKAGE:
        bucketName = bucketNameDownload;
        folderName = 'downloads/packages';
        break;
      case FolderType.TEMPLATE:
        bucketName = bucketNameDownload;
        folderName = 'downloads/templates';
        break;
      case FolderType.IMAGE:
        bucketName = bucketNameMedia;
        folderName = 'media/images';
        break;
      case FolderType.VIDEO:
        bucketName = bucketNameMedia;
        folderName = 'media/videos';
        break;
      case FolderType.OTHER:
        bucketName = bucketNameMedia;
        folderName = 'media/others';
        break;
      default:
        bucketName = bucketNameDownload;
        folderName = 'downloads/others';
        break;
    }
    const bucket = this.storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      await bucket.create({
        location: 'US',
      });
    }
    return { bucket, folderName };
  }

  private async ensureFolderExists(
    entityManager: EntityManager,
    folderName: string,
    folderType: FolderType,
  ): Promise<Folder> {
    const folderNames = folderName.split('/');
    let folder: Folder;
    let parent: Folder;
    for (const folderName of folderNames) {
      folder = await entityManager.findOne(Folder, {
        where: {
          name: folderName,
        },
      });
      if (!folder) {
        const result = await entityManager.insert(
          Folder,
          entityManager.create(Folder, {
            name: folderName,
            type: folderType,
            parent: parent,
          }),
        );
        folder = await entityManager.findOne(Folder, {
          where: {
            id: result.identifiers[0].id,
          },
        });
      }
      parent = folder;
    }
    return folder;
  }

  findAll() {
    return `This action returns all files`;
  }

  findOne(id: number) {
    return `This action returns a #${id} file`;
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  remove(id: number) {
    return `This action removes a #${id} file`;
  }
}
