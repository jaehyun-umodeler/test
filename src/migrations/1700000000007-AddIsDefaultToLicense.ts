import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDefaultToLicense1700000000007 implements MigrationInterface {
  name = 'AddIsDefaultToLicense1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // license 테이블에 is_default 컬럼 추가
      await queryRunner.query(`
        ALTER TABLE license 
        ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE
      `);

      console.log('✅ Added is_default column to license table');
    } catch (error) {
      console.log(
        'ℹ️ Failed to add is_default column to license table:',
        error.message,
      );
      console.log('ℹ️ Continuing migration...');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    try {
      // is_default 컬럼 제거
      await queryRunner.query(`
        ALTER TABLE license 
        DROP COLUMN is_default
      `);

      console.log('✅ Removed is_default column from license table');
    } catch (error) {
      console.log(
        'ℹ️ Failed to remove is_default column from license table:',
        error.message,
      );
      console.log('ℹ️ Continuing migration rollback...');
    }
  }
}
