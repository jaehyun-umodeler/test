import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateUserTeamTable1700000000002 implements MigrationInterface {
  name = 'CreateUserTeamTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the user_team table
    await queryRunner.createTable(
      new Table({
        name: 'user_team',
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
            name: 'team_id',
            type: 'int',
            comment: 'Team ID (Foreign Key)',
          },
          {
            name: 'organization_id',
            type: 'int',
            comment: 'Organization ID (Foreign Key)',
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
        'user_team',
        new TableIndex({
          name: 'IDX_USER_TEAM_USER_ID',
          columnNames: ['user_id'],
        }),
      );
    } catch (error) {
      console.log('Index IDX_USER_TEAM_USER_ID already exists, skipping...');
    }

    try {
      await queryRunner.createIndex(
        'user_team',
        new TableIndex({
          name: 'IDX_USER_TEAM_TEAM_ID',
          columnNames: ['team_id'],
        }),
      );
    } catch (error) {
      console.log('Index IDX_USER_TEAM_TEAM_ID already exists, skipping...');
    }

    try {
      await queryRunner.createIndex(
        'user_team',
        new TableIndex({
          name: 'IDX_USER_TEAM_ORGANIZATION_ID',
          columnNames: ['organization_id'],
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_TEAM_ORGANIZATION_ID already exists, skipping...',
      );
    }

    // Create unique constraint for user_id + organization_id combination
    try {
      await queryRunner.createIndex(
        'user_team',
        new TableIndex({
          name: 'IDX_USER_TEAM_USER_ORGANIZATION_UNIQUE',
          columnNames: ['user_id', 'organization_id'],
          isUnique: true,
        }),
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_TEAM_USER_ORGANIZATION_UNIQUE already exists, skipping...',
      );
    }

    // Create foreign key constraints (only if they don't exist)
    try {
      await queryRunner.createForeignKey(
        'user_team',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'account_data',
          onDelete: 'CASCADE',
          name: 'FK_USER_TEAM_USER_ID',
        }),
      );
    } catch (error) {
      console.log(
        'Foreign key FK_USER_TEAM_USER_ID already exists, skipping...',
      );
    }

    try {
      await queryRunner.createForeignKey(
        'user_team',
        new TableForeignKey({
          columnNames: ['team_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'team',
          onDelete: 'CASCADE',
          name: 'FK_USER_TEAM_TEAM_ID',
        }),
      );
    } catch (error) {
      console.log(
        'Foreign key FK_USER_TEAM_TEAM_ID already exists, skipping...',
      );
    }

    try {
      await queryRunner.createForeignKey(
        'user_team',
        new TableForeignKey({
          columnNames: ['organization_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'organization',
          onDelete: 'CASCADE',
          name: 'FK_USER_TEAM_ORGANIZATION_ID',
        }),
      );
    } catch (error) {
      console.log(
        'Foreign key FK_USER_TEAM_ORGANIZATION_ID already exists, skipping...',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop foreign key constraints (only if they exist)
    try {
      await queryRunner.dropForeignKey('user_team', 'FK_USER_TEAM_USER_ID');
    } catch (error) {
      console.log('Foreign key FK_USER_TEAM_USER_ID not found, skipping...');
    }

    try {
      await queryRunner.dropForeignKey('user_team', 'FK_USER_TEAM_TEAM_ID');
    } catch (error) {
      console.log('Foreign key FK_USER_TEAM_TEAM_ID not found, skipping...');
    }

    try {
      await queryRunner.dropForeignKey(
        'user_team',
        'FK_USER_TEAM_ORGANIZATION_ID',
      );
    } catch (error) {
      console.log(
        'Foreign key FK_USER_TEAM_ORGANIZATION_ID not found, skipping...',
      );
    }

    // Drop indexes (only if they exist)
    try {
      await queryRunner.dropIndex('user_team', 'IDX_USER_TEAM_USER_ID');
    } catch (error) {
      console.log('Index IDX_USER_TEAM_USER_ID not found, skipping...');
    }

    try {
      await queryRunner.dropIndex('user_team', 'IDX_USER_TEAM_TEAM_ID');
    } catch (error) {
      console.log('Index IDX_USER_TEAM_TEAM_ID not found, skipping...');
    }

    try {
      await queryRunner.dropIndex('user_team', 'IDX_USER_TEAM_ORGANIZATION_ID');
    } catch (error) {
      console.log('Index IDX_USER_TEAM_ORGANIZATION_ID not found, skipping...');
    }

    try {
      await queryRunner.dropIndex(
        'user_team',
        'IDX_USER_TEAM_USER_ORGANIZATION_UNIQUE',
      );
    } catch (error) {
      console.log(
        'Index IDX_USER_TEAM_USER_ORGANIZATION_UNIQUE not found, skipping...',
      );
    }

    // Drop the table
    await queryRunner.dropTable('user_team');
  }
}
