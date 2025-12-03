import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateTutorialFileUserTable1763003786999
  implements MigrationInterface
{
  name = 'CreateTutorialFileUserTable1763003786999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the tutorial_file_user table
    await queryRunner.createTable(
      new Table({
        name: 'tutorial_file_user',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'Primary key',
          },
          {
            name: 'user_id',
            type: 'int',
            comment: 'User ID (Foreign Key)',
          },
          {
            name: 'tutorial_file_id',
            type: 'binary',
            length: '16',
            comment: 'Tutorial File ID (Foreign Key)',
          },
          {
            name: 'is_completed',
            type: 'boolean',
            default: false,
            comment: 'Whether the tutorial file is completed by the user',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Creation timestamp',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Last update timestamp',
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance (only if they don't exist)
    try {
      await queryRunner.createIndex(
        'tutorial_file_user',
        new TableIndex({
          name: 'IDX_TUTORIAL_FILE_USER_USER_ID',
          columnNames: ['user_id'],
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_TUTORIAL_FILE_USER_USER_ID already exists, skipping...',
      );
    }

    try {
      await queryRunner.createIndex(
        'tutorial_file_user',
        new TableIndex({
          name: 'IDX_TUTORIAL_FILE_USER_TUTORIAL_FILE_ID',
          columnNames: ['tutorial_file_id'],
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_TUTORIAL_FILE_USER_TUTORIAL_FILE_ID already exists, skipping...',
      );
    }

    // Create unique constraint for user_id + tutorial_file_id combination
    try {
      await queryRunner.createIndex(
        'tutorial_file_user',
        new TableIndex({
          name: 'IDX_TUTORIAL_FILE_USER_USER_TUTORIAL_FILE_UNIQUE',
          columnNames: ['user_id', 'tutorial_file_id'],
          isUnique: true,
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_TUTORIAL_FILE_USER_USER_TUTORIAL_FILE_UNIQUE already exists, skipping...',
      );
    }

    // Create foreign key constraints (only if they don't exist)
    try {
      await queryRunner.createForeignKey(
        'tutorial_file_user',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'account_data',
          onDelete: 'CASCADE',
          name: 'FK_TUTORIAL_FILE_USER_USER_ID',
        }),
      );
    } catch (error) {
      console.log(
        'Foreign key FK_TUTORIAL_FILE_USER_USER_ID already exists, skipping...',
      );
    }

    try {
      await queryRunner.createForeignKey(
        'tutorial_file_user',
        new TableForeignKey({
          columnNames: ['tutorial_file_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'tutorial_files',
          onDelete: 'CASCADE',
          name: 'FK_TUTORIAL_FILE_USER_TUTORIAL_FILE_ID',
        }),
      );
    } catch (error) {
      console.log(
        'Foreign key FK_TUTORIAL_FILE_USER_TUTORIAL_FILE_ID already exists, skipping...',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop foreign key constraints (only if they exist)
    try {
      await queryRunner.dropForeignKey(
        'tutorial_file_user',
        'FK_TUTORIAL_FILE_USER_USER_ID',
      );
    } catch (error) {
      console.log(
        'Foreign key FK_TUTORIAL_FILE_USER_USER_ID not found, skipping...',
      );
    }

    try {
      await queryRunner.dropForeignKey(
        'tutorial_file_user',
        'FK_TUTORIAL_FILE_USER_TUTORIAL_FILE_ID',
      );
    } catch (error) {
      console.log(
        'Foreign key FK_TUTORIAL_FILE_USER_TUTORIAL_FILE_ID not found, skipping...',
      );
    }

    // Drop indexes (only if they exist)
    try {
      await queryRunner.dropIndex(
        'tutorial_file_user',
        'IDX_TUTORIAL_FILE_USER_USER_ID',
      );
    } catch (error) {
      console.log(
        'Index IDX_TUTORIAL_FILE_USER_USER_ID not found, skipping...',
      );
    }

    try {
      await queryRunner.dropIndex(
        'tutorial_file_user',
        'IDX_TUTORIAL_FILE_USER_TUTORIAL_FILE_ID',
      );
    } catch (error) {
      console.log(
        'Index IDX_TUTORIAL_FILE_USER_TUTORIAL_FILE_ID not found, skipping...',
      );
    }

    try {
      await queryRunner.dropIndex(
        'tutorial_file_user',
        'IDX_TUTORIAL_FILE_USER_USER_TUTORIAL_FILE_UNIQUE',
      );
    } catch (error) {
      console.log(
        'Index IDX_TUTORIAL_FILE_USER_USER_TUTORIAL_FILE_UNIQUE not found, skipping...',
      );
    }

    // Drop the table
    await queryRunner.dropTable('tutorial_file_user');
  }
}
