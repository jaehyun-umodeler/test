import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAccountLinkTable1700000000000 implements MigrationInterface {
  name = 'CreateAccountLinkTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the account_link table
    await queryRunner.createTable(
      new Table({
        name: 'account_link',
        columns: [
          {
            name: 'user_id',
            type: 'int',
            isPrimary: true,
            comment: 'User ID (Primary Key)',
          },
          {
            name: 'provider',
            type: 'enum',
            enum: ['local', 'google'],
            isPrimary: true,
            comment: 'Provider type (Primary Key)',
          },
          {
            name: 'provider_id',
            type: 'varchar',
            length: '255',
            comment: 'Provider-specific user ID',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            comment: 'Email address from provider',
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

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'account_link',
      new TableIndex({
        name: 'IDX_ACCOUNT_LINK_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'account_link',
      new TableIndex({
        name: 'IDX_ACCOUNT_LINK_PROVIDER_ID',
        columnNames: ['provider_id'],
      }),
    );

    await queryRunner.createIndex(
      'account_link',
      new TableIndex({
        name: 'IDX_ACCOUNT_LINK_EMAIL',
        columnNames: ['email'],
      }),
    );

    // Create foreign key constraint to account_data table
    await queryRunner.createForeignKey(
      'account_link',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'account_data',
        onDelete: 'CASCADE',
        name: 'FK_ACCOUNT_LINK_USER_ID',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop foreign key constraint
    await queryRunner.dropForeignKey('account_link', 'FK_ACCOUNT_LINK_USER_ID');

    // Drop indexes
    await queryRunner.dropIndex('account_link', 'IDX_ACCOUNT_LINK_USER_ID');
    await queryRunner.dropIndex('account_link', 'IDX_ACCOUNT_LINK_PROVIDER_ID');
    await queryRunner.dropIndex('account_link', 'IDX_ACCOUNT_LINK_EMAIL');

    // Drop the table
    await queryRunner.dropTable('account_link');
  }
}
