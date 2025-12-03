import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { TutorialDifficulty } from 'src/utils/constants';

export class CreateTutorialFileTable1762396317920
  implements MigrationInterface
{
  name = 'CreateTutorialFileTable1762396317920';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tutorial_files table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'tutorial_files',
          columns: [
            {
              name: 'id',
              type: 'binary',
              length: '16',
              isPrimary: true,
            },
            {
              name: 'file_id',
              type: 'binary',
              length: '16',
              isNullable: true,
            },
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
            {
              name: 'technics',
              type: 'text',
            },
            {
              name: 'difficulty',
              type: 'tinyint',
              default: TutorialDifficulty.EASY,
            },
            {
              name: 'document_url',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'thumbnail_id',
              type: 'binary',
              length: '16',
              isNullable: true,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'is_default',
              type: 'boolean',
              default: false,
            },
            {
              name: 'sequence',
              type: 'int',
              default: 0,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
      console.log('✅ tutorial_files table created');
    } catch (error) {
      console.log(
        'ℹ️ tutorial_files table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'tutorial_files',
        new TableIndex({
          name: 'IDX_TUTORIAL_FILES_FILE_ID',
          columnNames: ['file_id'],
        }),
      );
      console.log('✅ IDX_TUTORIAL_FILES_FILE_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_TUTORIAL_FILES_FILE_ID exists or creation failed:',
        (error as any).message,
      );
    }

    // Foreign Keys
    try {
      await queryRunner.createForeignKey(
        'tutorial_files',
        new TableForeignKey({
          name: 'FK_TUTORIAL_FILES_FILE',
          columnNames: ['file_id'],
          referencedTableName: 'files',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
      console.log('✅ FK_TUTORIAL_FILES_FILE foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_TUTORIAL_FILES_FILE exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'tutorial_files',
        new TableForeignKey({
          name: 'FK_TUTORIAL_FILES_THUMBNAIL',
          columnNames: ['thumbnail_id'],
          referencedTableName: 'files',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
      console.log('✅ FK_TUTORIAL_FILES_THUMBNAIL foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_TUTORIAL_FILES_THUMBNAIL exists or creation failed:',
        (error as any).message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop Foreign Keys
    try {
      await queryRunner.dropForeignKey(
        'tutorial_files',
        'FK_TUTORIAL_FILES_THUMBNAIL',
      );
      console.log('✅ FK_TUTORIAL_FILES_THUMBNAIL foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_TUTORIAL_FILES_THUMBNAIL failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropForeignKey(
        'tutorial_files',
        'FK_TUTORIAL_FILES_FILE',
      );
      console.log('✅ FK_TUTORIAL_FILES_FILE foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_TUTORIAL_FILES_FILE failed:',
        (error as any).message,
      );
    }

    // Drop Indexes
    try {
      await queryRunner.dropIndex(
        'tutorial_files',
        'IDX_TUTORIAL_FILES_FILE_ID',
      );
      console.log('✅ IDX_TUTORIAL_FILES_FILE_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_TUTORIAL_FILES_FILE_ID failed:',
        (error as any).message,
      );
    }

    // Drop table
    try {
      await queryRunner.dropTable('tutorial_files');
      console.log('✅ tutorial_files table dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop tutorial_files table failed:',
        (error as any).message,
      );
    }
  }
}
