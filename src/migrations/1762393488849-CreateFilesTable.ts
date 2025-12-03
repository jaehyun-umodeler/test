import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateFilesTable1762393488849 implements MigrationInterface {
  name = 'CreateFilesTable1762393488849';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create files table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'files',
          columns: [
            {
              name: 'id',
              type: 'binary',
              length: '16',
              isPrimary: true,
            },
            {
              name: 'name',
              type: 'text',
            },
            {
              name: 'storage_key',
              type: 'text',
            },
            {
              name: 'size',
              type: 'bigint',
            },
            {
              name: 'mime_type',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'folder_id',
              type: 'binary',
              length: '16',
              isNullable: true,
            },
            {
              name: 'uploaded_by_user_id',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
      console.log('✅ files table created');
    } catch (error) {
      console.log(
        'ℹ️ files table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'files',
        new TableIndex({
          name: 'IDX_FILES_FOLDER_ID',
          columnNames: ['folder_id'],
        }),
      );
      console.log('✅ IDX_FILES_FOLDER_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_FILES_FOLDER_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'files',
        new TableIndex({
          name: 'IDX_FILES_UPLOADED_BY_USER_ID',
          columnNames: ['uploaded_by_user_id'],
        }),
      );
      console.log('✅ IDX_FILES_UPLOADED_BY_USER_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_FILES_UPLOADED_BY_USER_ID exists or creation failed:',
        (error as any).message,
      );
    }

    // Foreign Keys
    try {
      await queryRunner.createForeignKey(
        'files',
        new TableForeignKey({
          name: 'FK_FILES_FOLDER',
          columnNames: ['folder_id'],
          referencedTableName: 'folders',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
      console.log('✅ FK_FILES_FOLDER foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_FILES_FOLDER exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'files',
        new TableForeignKey({
          name: 'FK_FILES_UPLOADED_BY_USER',
          columnNames: ['uploaded_by_user_id'],
          referencedTableName: 'account_data',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
      console.log('✅ FK_FILES_UPLOADED_BY_USER foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_FILES_UPLOADED_BY_USER exists or creation failed:',
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
      await queryRunner.dropForeignKey('files', 'FK_FILES_FOLDER');
      console.log('✅ FK_FILES_FOLDER foreign key dropped');
    } catch (error) {
      console.log('ℹ️ drop FK_FILES_FOLDER failed:', (error as any).message);
    }

    try {
      await queryRunner.dropForeignKey('files', 'FK_FILES_UPLOADED_BY_USER');
      console.log('✅ FK_FILES_UPLOADED_BY_USER foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_FILES_UPLOADED_BY_USER failed:',
        (error as any).message,
      );
    }

    // Drop Indexes
    try {
      await queryRunner.dropIndex('files', 'IDX_FILES_FOLDER_ID');
      console.log('✅ IDX_FILES_FOLDER_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_FILES_FOLDER_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex('files', 'IDX_FILES_UPLOADED_BY_USER_ID');
      console.log('✅ IDX_FILES_UPLOADED_BY_USER_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_FILES_UPLOADED_BY_USER_ID failed:',
        (error as any).message,
      );
    }

    // Drop table
    try {
      await queryRunner.dropTable('files');
      console.log('✅ files table dropped');
    } catch (error) {
      console.log('ℹ️ drop files table failed:', (error as any).message);
    }
  }
}
