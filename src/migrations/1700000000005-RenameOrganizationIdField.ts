import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameOrganizationIdField1700000000005
  implements MigrationInterface
{
  name = 'RenameOrganizationIdField1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename organizationId column to organization_id
    try {
      await queryRunner.renameColumn(
        'team',
        'organizationId',
        'organization_id',
      );
      console.log(
        '✅ organizationId column renamed to organization_id successfully',
      );
    } catch (error) {
      console.log(
        'ℹ️ organizationId column rename failed or column does not exist:',
        error.message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Rename organization_id column back to organizationId
    try {
      await queryRunner.renameColumn(
        'team',
        'organization_id',
        'organizationId',
      );
      console.log(
        '✅ organization_id column renamed back to organizationId successfully',
      );
    } catch (error) {
      console.log(
        'ℹ️ organization_id column rename failed or column does not exist:',
        error.message,
      );
    }
  }
}
