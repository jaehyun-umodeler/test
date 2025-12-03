import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetDefaultProviderForAccountLink1700000000008
  implements MigrationInterface
{
  name = 'SetDefaultProviderForAccountLink1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 먼저 기존 데이터 중 provider가 NULL인 경우 기본값으로 업데이트
    try {
      await queryRunner.query(`
        UPDATE account_link 
        SET provider = 'local' 
        WHERE provider IS NULL
      `);
      console.log('✅ 기존 NULL provider 데이터 업데이트 완료');
    } catch (error) {
      console.log(
        'ℹ️ 기존 데이터 업데이트 중 오류 발생 (계속 진행):',
        error.message,
      );
    }

    // provider 컬럼에 기본값 설정
    try {
      await queryRunner.query(`
        ALTER TABLE account_link 
        MODIFY COLUMN provider ENUM('local', 'google') NOT NULL DEFAULT 'local'
      `);
      console.log('✅ AccountLink provider 기본값 설정 완료');
    } catch (error) {
      console.log(
        'ℹ️ provider 기본값 설정 중 오류 발생 (계속 진행):',
        error.message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // 기본값 제거 (NOT NULL은 유지)
    try {
      await queryRunner.query(`
        ALTER TABLE account_link 
        MODIFY COLUMN provider ENUM('local', 'google') NOT NULL
      `);
      console.log('✅ AccountLink provider 기본값 제거 완료');
    } catch (error) {
      console.log(
        'ℹ️ provider 기본값 제거 중 오류 발생 (계속 진행):',
        error.message,
      );
    }
  }
}
