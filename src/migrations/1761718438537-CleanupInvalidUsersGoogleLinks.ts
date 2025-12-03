import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupInvalidUsersGoogleLinks1761718438537
  implements MigrationInterface
{
  name = 'CleanupInvalidUsersGoogleLinks1761718438537';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      const result = await queryRunner.query(`
        UPDATE account_data
        SET google_id = NULL
        WHERE valid_type IN ('unknown', 'invalid', 'expired')
          AND google_id IS NOT NULL
          AND google_id != ''
      `);
      console.log(
        `✅ Cleared google_id for invalid users: ${
          (result && (result.affectedRows || result[1])) || 0
        } rows`,
      );
    } catch (error) {
      console.log(
        'ℹ️ Failed to clear google_id for invalid users (continuing):',
        (error as Error).message,
      );
    }

    try {
      const result = await queryRunner.query(`
        DELETE al
        FROM account_link al
        INNER JOIN account_data ad ON ad.id = al.user_id
        WHERE ad.valid_type IN ('unknown', 'invalid', 'expired')
          AND al.provider = 'google'
      `);
      console.log(
        `✅ Deleted account_link(google) for invalid users: ${
          (result && (result.affectedRows || result[1])) || 0
        } rows`,
      );
    } catch (error) {
      console.log(
        'ℹ️ Failed to delete account_link(google) for invalid users (continuing):',
        (error as Error).message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    console.log(
      'ℹ️ No-op down migration: cannot restore deleted/cleared data.',
    );
  }
}
