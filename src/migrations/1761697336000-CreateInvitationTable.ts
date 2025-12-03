import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateInvitationTable1761697336000 implements MigrationInterface {
  name = 'CreateInvitationTable1761697336000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the invitations table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'invitations',
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
              name: 'email',
              type: 'varchar',
              length: '255',
              comment: 'Email address of the invited user',
            },
            {
              name: 'invitation_type',
              type: 'tinyint',
              default: 0,
              comment:
                '0: Organization, 1: License, 2: Organization and License',
            },
            {
              name: 'status',
              type: 'tinyint',
              default: 0,
              comment:
                '0: Pending, 1: Accepted, 2: Declined, 3: Expired, 4: Cancelled',
            },
            {
              name: 'invited_by_user_id',
              type: 'int',
              isNullable: true,
              comment: 'User who sent the invitation',
            },
            {
              name: 'organization_id',
              type: 'int',
              isNullable: true,
              comment: 'Organization ID (Foreign Key)',
            },
            {
              name: 'team_id',
              type: 'int',
              isNullable: true,
              comment: 'Team ID (Foreign Key)',
            },
            {
              name: 'organization_role',
              type: 'tinyint',
              default: 0,
              isNullable: true,
              comment: 'Role to assign when invitation is accepted',
            },
            {
              name: 'invitation_token',
              type: 'varchar',
              length: '255',
              isUnique: true,
              comment: 'Unique token for invitation link',
            },
            {
              name: 'expires_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'Invitation expiration timestamp',
            },
            {
              name: 'accepted_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'When invitation was accepted',
            },
            {
              name: 'declined_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'When invitation was declined',
            },
            {
              name: 'message',
              type: 'text',
              isNullable: true,
              comment: 'Optional message with invitation',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              comment: 'Created timestamp',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
              comment: 'Updated timestamp',
            },
            {
              name: 'deleted_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'Soft delete timestamp',
            },
          ],
        }),
        true,
      );
      console.log('✅ Invitations table created successfully');
    } catch (error) {
      console.log(
        'ℹ️ Invitations table already exists or creation failed:',
        error.message,
      );
    }

    // Create indexes for better performance
    try {
      await queryRunner.createIndex(
        'invitations',
        new TableIndex({
          name: 'IDX_INVITATIONS_EMAIL',
          columnNames: ['email'],
        }),
      );
      console.log('✅ IDX_INVITATIONS_EMAIL index created successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_INVITATIONS_EMAIL index already exists or creation failed:',
        error.message,
      );
    }

    try {
      await queryRunner.createIndex(
        'invitations',
        new TableIndex({
          name: 'IDX_INVITATIONS_STATUS',
          columnNames: ['status'],
        }),
      );
      console.log('✅ IDX_INVITATIONS_STATUS index created successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_INVITATIONS_STATUS index already exists or creation failed:',
        error.message,
      );
    }

    try {
      await queryRunner.createIndex(
        'invitations',
        new TableIndex({
          name: 'IDX_INVITATIONS_TOKEN',
          columnNames: ['invitation_token'],
        }),
      );
      console.log('✅ IDX_INVITATIONS_TOKEN index created successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_INVITATIONS_TOKEN index already exists or creation failed:',
        error.message,
      );
    }

    try {
      await queryRunner.createIndex(
        'invitations',
        new TableIndex({
          name: 'IDX_INVITATIONS_EXPIRES_AT',
          columnNames: ['expires_at'],
        }),
      );
      console.log('✅ IDX_INVITATIONS_EXPIRES_AT index created successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_INVITATIONS_EXPIRES_AT index already exists or creation failed:',
        error.message,
      );
    }

    // Create foreign key constraints
    try {
      await queryRunner.createForeignKey(
        'invitations',
        new TableForeignKey({
          columnNames: ['invited_by_user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'account_data',
          onDelete: 'SET NULL',
          name: 'FK_INVITATIONS_INVITED_BY_USER',
        }),
      );
      console.log(
        '✅ FK_INVITATIONS_INVITED_BY_USER foreign key created successfully',
      );
    } catch (error) {
      console.log(
        'ℹ️ FK_INVITATIONS_INVITED_BY_USER foreign key already exists or creation failed:',
        error.message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'invitations',
        new TableForeignKey({
          columnNames: ['organization_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'organization',
          onDelete: 'CASCADE',
          name: 'FK_INVITATIONS_ORGANIZATION',
        }),
      );
      console.log(
        '✅ FK_INVITATIONS_ORGANIZATION foreign key created successfully',
      );
    } catch (error) {
      console.log(
        'ℹ️ FK_INVITATIONS_ORGANIZATION foreign key already exists or creation failed:',
        error.message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'invitations',
        new TableForeignKey({
          columnNames: ['team_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'team',
          onDelete: 'CASCADE',
          name: 'FK_INVITATIONS_TEAM',
        }),
      );
      console.log('✅ FK_INVITATIONS_TEAM foreign key created successfully');
    } catch (error) {
      console.log(
        'ℹ️ FK_INVITATIONS_TEAM foreign key already exists or creation failed:',
        error.message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop foreign key constraints first
    try {
      await queryRunner.dropForeignKey('invitations', 'FK_INVITATIONS_TEAM');
      console.log('✅ FK_INVITATIONS_TEAM foreign key dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ FK_INVITATIONS_TEAM foreign key does not exist or drop failed:',
        error.message,
      );
    }

    try {
      await queryRunner.dropForeignKey(
        'invitations',
        'FK_INVITATIONS_ORGANIZATION',
      );
      console.log(
        '✅ FK_INVITATIONS_ORGANIZATION foreign key dropped successfully',
      );
    } catch (error) {
      console.log(
        'ℹ️ FK_INVITATIONS_ORGANIZATION foreign key does not exist or drop failed:',
        error.message,
      );
    }

    try {
      await queryRunner.dropForeignKey(
        'invitations',
        'FK_INVITATIONS_INVITED_BY_USER',
      );
      console.log(
        '✅ FK_INVITATIONS_INVITED_BY_USER foreign key dropped successfully',
      );
    } catch (error) {
      console.log(
        'ℹ️ FK_INVITATIONS_INVITED_BY_USER foreign key does not exist or drop failed:',
        error.message,
      );
    }

    // Drop indexes
    try {
      await queryRunner.dropIndex('invitations', 'IDX_INVITATIONS_EXPIRES_AT');
      console.log('✅ IDX_INVITATIONS_EXPIRES_AT index dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_INVITATIONS_EXPIRES_AT index does not exist or drop failed:',
        error.message,
      );
    }

    try {
      await queryRunner.dropIndex('invitations', 'IDX_INVITATIONS_TOKEN');
      console.log('✅ IDX_INVITATIONS_TOKEN index dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_INVITATIONS_TOKEN index does not exist or drop failed:',
        error.message,
      );
    }

    try {
      await queryRunner.dropIndex('invitations', 'IDX_INVITATIONS_STATUS');
      console.log('✅ IDX_INVITATIONS_STATUS index dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_INVITATIONS_STATUS index does not exist or drop failed:',
        error.message,
      );
    }

    try {
      await queryRunner.dropIndex('invitations', 'IDX_INVITATIONS_EMAIL');
      console.log('✅ IDX_INVITATIONS_EMAIL index dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_INVITATIONS_EMAIL index does not exist or drop failed:',
        error.message,
      );
    }

    // Drop the invitations table
    try {
      await queryRunner.dropTable('invitations');
      console.log('✅ Invitations table dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ Invitations table does not exist or drop failed:',
        error.message,
      );
    }
  }
}
