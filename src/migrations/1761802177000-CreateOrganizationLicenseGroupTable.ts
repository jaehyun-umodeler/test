import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateOrganizationLicenseGroupTable1761802177000
  implements MigrationInterface
{
  name = 'CreateOrganizationLicenseGroupTable1761802177000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'organization_license_group',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'organization_id', type: 'int' },
            { name: 'license_group_id', type: 'int' },
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
          uniques: [
            {
              name: 'UQ_ORG_LICENSE_GROUP_PAIR',
              columnNames: ['organization_id', 'license_group_id'],
            },
          ],
        }),
        true,
      );
      console.log('✅ organization_license_group table created');
    } catch (error) {
      console.log(
        'ℹ️ organization_license_group table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'organization_license_group',
        new TableIndex({
          name: 'IDX_ORG_LICENSE_GROUP_ORG_ID',
          columnNames: ['organization_id'],
        }),
      );
    } catch (error) {
      console.log(
        'ℹ️ IDX_ORG_LICENSE_GROUP_ORG_ID exists or creation failed:',
        (error as any).message,
      );
    }
    try {
      await queryRunner.createIndex(
        'organization_license_group',
        new TableIndex({
          name: 'IDX_ORG_LICENSE_GROUP_LG_ID',
          columnNames: ['license_group_id'],
        }),
      );
    } catch (error) {
      console.log(
        'ℹ️ IDX_ORG_LICENSE_GROUP_LG_ID exists or creation failed:',
        (error as any).message,
      );
    }

    // FKs
    try {
      await queryRunner.createForeignKey(
        'organization_license_group',
        new TableForeignKey({
          name: 'FK_ORG_LICENSE_GROUP_ORG',
          columnNames: ['organization_id'],
          referencedTableName: 'organization',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    } catch (error) {
      console.log(
        'ℹ️ FK_ORG_LICENSE_GROUP_ORG exists or creation failed:',
        (error as any).message,
      );
    }
    try {
      await queryRunner.createForeignKey(
        'organization_license_group',
        new TableForeignKey({
          name: 'FK_ORG_LICENSE_GROUP_LG',
          columnNames: ['license_group_id'],
          referencedTableName: 'license_group',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    } catch (error) {
      console.log(
        'ℹ️ FK_ORG_LICENSE_GROUP_LG exists or creation failed:',
        (error as any).message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop FKs
    try {
      await queryRunner.dropForeignKey(
        'organization_license_group',
        'FK_ORG_LICENSE_GROUP_LG',
      );
    } catch (error) {
      console.log(
        'ℹ️ drop FK_ORG_LICENSE_GROUP_LG failed:',
        (error as any).message,
      );
    }
    try {
      await queryRunner.dropForeignKey(
        'organization_license_group',
        'FK_ORG_LICENSE_GROUP_ORG',
      );
    } catch (error) {
      console.log(
        'ℹ️ drop FK_ORG_LICENSE_GROUP_ORG failed:',
        (error as any).message,
      );
    }

    // Drop indexes
    try {
      await queryRunner.dropIndex(
        'organization_license_group',
        'IDX_ORG_LICENSE_GROUP_LG_ID',
      );
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_ORG_LICENSE_GROUP_LG_ID failed:',
        (error as any).message,
      );
    }
    try {
      await queryRunner.dropIndex(
        'organization_license_group',
        'IDX_ORG_LICENSE_GROUP_ORG_ID',
      );
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_ORG_LICENSE_GROUP_ORG_ID failed:',
        (error as any).message,
      );
    }

    // Drop table
    try {
      await queryRunner.dropTable('organization_license_group');
    } catch (error) {
      console.log(
        'ℹ️ drop organization_license_group failed:',
        (error as any).message,
      );
    }
  }
}
