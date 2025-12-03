import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateData1761805568000 implements MigrationInterface {
  name = 'PopulateData1761805568000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      const result = await queryRunner.query(`
        INSERT INTO organization_license_group (organization_id, license_group_id, created_at, updated_at)
        SELECT DISTINCT
          uo.organization_id AS organization_id,
          lgo.licenseGroupId AS license_group_id,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        FROM license_group_owner lgo
        INNER JOIN user_organization uo
          ON uo.user_id = lgo.userId
        LEFT JOIN organization_license_group olg
          ON olg.organization_id = uo.organization_id
         AND olg.license_group_id = lgo.licenseGroupId
        LEFT JOIN license_group lg
          ON lg.id = lgo.licenseGroupId
        WHERE olg.id IS NULL AND lg.licenseCategory = 5;
      `);

      const affected = result.affectedRows || 0;
      console.log(
        `✅ organization_license_group populated: ${affected} rows inserted`,
      );
    } catch (error) {
      console.log(
        'ℹ️ organization_license_group population skipped or failed:',
        (error as any)?.message,
      );
    }

    try {
      const result = await queryRunner.query(`
        UPDATE account_data SET countryCode = 'US' WHERE countryCode IS NULL OR countryCode = '';
      `);
      const affected = result.affectedRows || 0;
      console.log(
        `✅ account_data countryCode updated: ${affected} rows updated`,
      );
    } catch (error) {
      console.log('ℹ️ account_data countryCode update failed:', error.message);
    }

    try {
      const result = await queryRunner.query(`
        UPDATE account_data SET language = 'en' WHERE language IS NULL OR language = '';
      `);
      const affected = result.affectedRows || 0;
      console.log(`✅ account_data language updated: ${affected} rows updated`);
    } catch (error) {
      console.log('ℹ️ account_data language update failed:', error.message);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    try {
      await queryRunner.query('TRUNCATE TABLE organization_license_group');
      console.log(`✅ organization_license_group records truncated`);
    } catch (error) {
      console.log(
        'ℹ️ organization_license_group records truncate failed:',
        error.message,
      );
    }
  }
}
