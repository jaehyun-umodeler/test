import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class RenameEmailCodeToVerificationCode1761879270303
  implements MigrationInterface
{
  name = 'RenameEmailCodeToVerificationCode1761879270303';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. verification_code 테이블 삭제
    try {
      await queryRunner.dropTable('verification_code', true);
      console.log('✅ verification_code table dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ verification_code table does not exist or drop failed:',
        error.message,
      );
    }

    // 2. email_code 테이블을 verification_code로 이름 변경
    try {
      await queryRunner.renameTable('email_code', 'verification_code');
      console.log(
        '✅ email_code table renamed to verification_code successfully',
      );
    } catch (error) {
      console.log('ℹ️ email_code table rename failed:', error.message);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // 1. verification_code 테이블을 email_code로 되돌리기
    try {
      await queryRunner.renameTable('verification_code', 'email_code');
      console.log(
        '✅ verification_code table renamed back to email_code successfully',
      );
    } catch (error) {
      console.log(
        'ℹ️ verification_code table rename back failed:',
        error.message,
      );
    }

    // 2. verification_code 테이블 재생성 (되돌리기용)
    try {
      await queryRunner.createTable(
        new Table({
          name: 'verification_code',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'email',
              type: 'varchar',
            },
            {
              name: 'code',
              type: 'varchar',
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
      console.log('✅ verification_code table recreated successfully');
    } catch (error) {
      console.log(
        'ℹ️ verification_code table recreation failed:',
        error.message,
      );
    }
  }
}
