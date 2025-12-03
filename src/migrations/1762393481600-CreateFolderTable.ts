import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { FolderType } from 'src/utils/constants';

export class CreateFolderTable1762393481600 implements MigrationInterface {
  name = 'CreateFolderTable1762393481600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create folders table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'folders',
          columns: [
            {
              name: 'id',
              type: 'binary',
              length: '16',
              isPrimary: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'type',
              type: 'tinyint',
              default: FolderType.IMAGE,
            },
            {
              name: 'parent_id',
              type: 'binary',
              length: '16',
              isNullable: true,
            },
            {
              name: 'owner_id',
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
      console.log('✅ folders table created');
    } catch (error) {
      console.log(
        'ℹ️ folders table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'folders',
        new TableIndex({
          name: 'IDX_FOLDERS_PARENT_ID',
          columnNames: ['parent_id'],
        }),
      );
      console.log('✅ IDX_FOLDERS_PARENT_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_FOLDERS_PARENT_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'folders',
        new TableIndex({
          name: 'IDX_FOLDERS_OWNER_ID',
          columnNames: ['owner_id'],
        }),
      );
      console.log('✅ IDX_FOLDERS_OWNER_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_FOLDERS_OWNER_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'folders',
        new TableIndex({
          name: 'IDX_FOLDERS_TYPE',
          columnNames: ['type'],
        }),
      );
      console.log('✅ IDX_FOLDERS_TYPE index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_FOLDERS_TYPE exists or creation failed:',
        (error as any).message,
      );
    }

    // Foreign Keys
    try {
      await queryRunner.createForeignKey(
        'folders',
        new TableForeignKey({
          name: 'FK_FOLDERS_PARENT',
          columnNames: ['parent_id'],
          referencedTableName: 'folders',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_FOLDERS_PARENT foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_FOLDERS_PARENT exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'folders',
        new TableForeignKey({
          name: 'FK_FOLDERS_OWNER',
          columnNames: ['owner_id'],
          referencedTableName: 'account_data',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_FOLDERS_OWNER foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_FOLDERS_OWNER exists or creation failed:',
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
      await queryRunner.dropForeignKey('folders', 'FK_FOLDERS_OWNER');
      console.log('✅ FK_FOLDERS_OWNER foreign key dropped');
    } catch (error) {
      console.log('ℹ️ drop FK_FOLDERS_OWNER failed:', (error as any).message);
    }

    try {
      await queryRunner.dropForeignKey('folders', 'FK_FOLDERS_PARENT');
      console.log('✅ FK_FOLDERS_PARENT foreign key dropped');
    } catch (error) {
      console.log('ℹ️ drop FK_FOLDERS_PARENT failed:', (error as any).message);
    }

    // Drop Indexes
    try {
      await queryRunner.dropIndex('folders', 'IDX_FOLDERS_TYPE');
      console.log('✅ IDX_FOLDERS_TYPE index dropped');
    } catch (error) {
      console.log('ℹ️ drop IDX_FOLDERS_TYPE failed:', (error as any).message);
    }

    try {
      await queryRunner.dropIndex('folders', 'IDX_FOLDERS_OWNER_ID');
      console.log('✅ IDX_FOLDERS_OWNER_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_FOLDERS_OWNER_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex('folders', 'IDX_FOLDERS_PARENT_ID');
      console.log('✅ IDX_FOLDERS_PARENT_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_FOLDERS_PARENT_ID failed:',
        (error as any).message,
      );
    }

    // Drop table
    try {
      await queryRunner.dropTable('folders');
      console.log('✅ folders table dropped');
    } catch (error) {
      console.log('ℹ️ drop folders table failed:', (error as any).message);
    }
  }
}
