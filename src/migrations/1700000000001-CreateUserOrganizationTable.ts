import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateUserOrganizationTable1700000000001
  implements MigrationInterface
{
  name = 'CreateUserOrganizationTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the user_organization table
    await queryRunner.createTable(
      new Table({
        name: 'user_organization',
        columns: [
          {
            name: 'id',
            type: 'int',
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
            name: 'organization_id',
            type: 'int',
            comment: 'Organization ID (Foreign Key)',
          },
          {
            name: 'organization_role',
            type: 'tinyint',
            default: 0,
            comment: 'Organization role (0: USER, 1: MANAGER, 2: OWNER)',
          },
          {
            name: 'is_default',
            type: 'tinyint',
            default: 0,
            comment: 'Is default organization for user',
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
        'user_organization',
        new TableIndex({
          name: 'IDX_USER_ORGANIZATION_USER_ID',
          columnNames: ['user_id'],
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_ORGANIZATION_USER_ID already exists, skipping...',
      );
    }

    try {
      await queryRunner.createIndex(
        'user_organization',
        new TableIndex({
          name: 'IDX_USER_ORGANIZATION_ORGANIZATION_ID',
          columnNames: ['organization_id'],
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_ORGANIZATION_ORGANIZATION_ID already exists, skipping...',
      );
    }

    try {
      await queryRunner.createIndex(
        'user_organization',
        new TableIndex({
          name: 'IDX_USER_ORGANIZATION_USER_ORG',
          columnNames: ['user_id', 'organization_id'],
          isUnique: true,
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_ORGANIZATION_USER_ORG already exists, skipping...',
      );
    }

    try {
      await queryRunner.createIndex(
        'user_organization',
        new TableIndex({
          name: 'IDX_USER_ORGANIZATION_ROLE',
          columnNames: ['organization_role'],
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_ORGANIZATION_ROLE already exists, skipping...',
      );
    }

    // Create foreign key constraints (only if they don't exist)
    try {
      await queryRunner.createForeignKey(
        'user_organization',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'account_data',
          onDelete: 'CASCADE',
          name: 'FK_USER_ORGANIZATION_USER_ID',
        }),
      );
    } catch (error) {
      console.log(
        'Foreign key FK_USER_ORGANIZATION_USER_ID already exists, skipping...',
      );
    }

    try {
      await queryRunner.createForeignKey(
        'user_organization',
        new TableForeignKey({
          columnNames: ['organization_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'organization',
          onDelete: 'CASCADE',
          name: 'FK_USER_ORGANIZATION_ORGANIZATION_ID',
        }),
      );
    } catch (error) {
      console.log(
        'Foreign key FK_USER_ORGANIZATION_ORGANIZATION_ID already exists, skipping...',
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
        'user_organization',
        'FK_USER_ORGANIZATION_USER_ID',
      );
    } catch (error) {
      console.log(
        'Foreign key FK_USER_ORGANIZATION_USER_ID not found, skipping...',
      );
    }

    try {
      await queryRunner.dropForeignKey(
        'user_organization',
        'FK_USER_ORGANIZATION_ORGANIZATION_ID',
      );
    } catch (error) {
      console.log(
        'Foreign key FK_USER_ORGANIZATION_ORGANIZATION_ID not found, skipping...',
      );
    }

    // Drop indexes (only if they exist)
    try {
      await queryRunner.dropIndex(
        'user_organization',
        'IDX_USER_ORGANIZATION_USER_ID',
      );
    } catch (error) {
      console.log('Index IDX_USER_ORGANIZATION_USER_ID not found, skipping...');
    }

    try {
      await queryRunner.dropIndex(
        'user_organization',
        'IDX_USER_ORGANIZATION_ORGANIZATION_ID',
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_ORGANIZATION_ORGANIZATION_ID not found, skipping...',
      );
    }

    try {
      await queryRunner.dropIndex(
        'user_organization',
        'IDX_USER_ORGANIZATION_USER_ORG',
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_ORGANIZATION_USER_ORG not found, skipping...',
      );
    }

    try {
      await queryRunner.dropIndex(
        'user_organization',
        'IDX_USER_ORGANIZATION_ROLE',
      );
    } catch (error) {
      console.log('Index IDX_USER_ORGANIZATION_ROLE not found, skipping...');
    }

    // Drop the table
    await queryRunner.dropTable('user_organization');
  }
}
