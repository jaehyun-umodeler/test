import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateData1700000000006 implements MigrationInterface {
  name = 'PopulateData1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert account_link records
    try {
      const result = await queryRunner.query(`
        INSERT INTO account_link (user_id, provider, provider_id, email, created_at, updated_at)
        SELECT
            id as user_id,
            'google' as provider,
            google_id as provider_id,
            CAST(AES_DECRYPT(FROM_BASE64(encrypted_email), "TRIPOLYGON-KEY09") AS CHAR) as email,
            created_at,
            NOW() as updated_at
        FROM account_data
        WHERE google_id IS NOT NULL
          AND google_id != ''
          AND NOT EXISTS (
            SELECT 1 FROM account_link
            WHERE account_link.user_id = account_data.id
              AND account_link.provider = 'google'
          )
      `);

      console.log(
        `✅ ${
          result.affectedRows || result[1] || 0
        } account_link records inserted`,
      );
    } catch (error) {
      console.log('ℹ️ Account link records insert failed:', error.message);
    }

    // Insert user_organization records
    try {
      const result = await queryRunner.query(`
        INSERT INTO user_organization (
          user_id,
          organization_id,
          organization_role,
          is_default,
          created_at,
          updated_at
        )
        SELECT
          ae.account_data_id as user_id,
          ae.organizationId as organization_id,
          0 as organization_role, -- Default to USER role (0)
          1 as is_default, -- Set as default organization for the user
          COALESCE(ae.teamAt, NOW()) as created_at, -- Use teamAt if available, otherwise current time
          NOW() as updated_at
        FROM account_ext ae
        WHERE ae.organizationId IS NOT NULL
        AND ae.account_data_id IS NOT NULL
        AND NOT EXISTS (
          -- Avoid duplicates
          SELECT 1 FROM user_organization uo
          WHERE uo.user_id = ae.account_data_id
            AND uo.organization_id = ae.organizationId
        )
      `);

      console.log(
        `✅ ${
          result.affectedRows || result[1] || 0
        } user_organization records inserted`,
      );
    } catch (error) {
      console.log('ℹ️ User organization records insert failed:', error.message);
    }

    // Insert user_team records
    try {
      const result = await queryRunner.query(`
        INSERT INTO user_team (
          user_id,
          team_id,
          organization_id,
          created_at,
          updated_at
        )
        SELECT
          ae.account_data_id as user_id,
          ae.teamId as team_id,
          ae.organizationId as organization_id,
          COALESCE(ae.teamAt, NOW()) as created_at, -- Use teamAt if available, otherwise current time
          NOW() as updated_at
        FROM account_ext ae
        WHERE ae.teamId IS NOT NULL
        AND ae.account_data_id IS NOT NULL
        AND ae.organizationId IS NOT NULL
        AND NOT EXISTS (
          -- Avoid duplicates based on unique constraint (user_id, organization_id)
          SELECT 1 FROM user_team ut
          WHERE ut.user_id = ae.account_data_id
            AND ut.organization_id = ae.organizationId
        )
      `);

      console.log(
        `✅ ${
          result.affectedRows || result[1] || 0
        } user_team records inserted`,
      );
    } catch (error) {
      console.log('ℹ️ User team records insert failed:', error.message);
    }

    // Update organization_manager records to organization_role=1 in user_organization table
    try {
      const result = await queryRunner.query(`
        UPDATE user_organization
        SET organization_role = 2
        WHERE organization_role = 0
        AND EXISTS (
          SELECT 1 FROM organization_manager om
          WHERE om.userId = user_organization.user_id
          AND om.organizationId = user_organization.organization_id
        )
      `);

      console.log(
        `✅ Updated ${
          result.affectedRows || result[1] || 0
        } organization manager records to role=2`,
      );
    } catch (error) {
      console.log('ℹ️ Organization manager role update failed:', error.message);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Revert organization_role=2 back to organization_role=0
    try {
      const result = await queryRunner.query(`
        UPDATE user_organization
        SET organization_role = 0
        WHERE organization_role = 2
      `);

      console.log(
        `✅ Reverted ${
          result.affectedRows || result[1] || 0
        } organization manager records back to role=2`,
      );
    } catch (error) {
      console.log('ℹ️ Organization manager role revert failed:', error.message);
    }

    // Truncate user_team table
    try {
      await queryRunner.query('TRUNCATE TABLE user_team');
      console.log(`✅ user_team records truncated`);
    } catch (error) {
      console.log('ℹ️ User team records truncate failed:', error.message);
    }

    // Truncate user_organization table
    try {
      await queryRunner.query('TRUNCATE TABLE user_organization');
      console.log(`✅ user_organization records truncated`);
    } catch (error) {
      console.log(
        'ℹ️ User organization records truncate failed:',
        error.message,
      );
    }

    // Revert account_link records
    try {
      await queryRunner.query('TRUNCATE TABLE account_link');
      console.log(`✅ account_link records truncated`);
    } catch (error) {
      console.log('ℹ️ Account link records truncate failed:', error.message);
    }
  }
}
