import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultValuesToLicenseGroupDates1762236836507
  implements MigrationInterface
{
  name = 'AddDefaultValuesToLicenseGroupDates1762236836507';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename columns to snake_case and add default values
    // Rename createdAt to created_at
    try {
      await queryRunner.query(`
        ALTER TABLE license_group 
        CHANGE COLUMN createdAt created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log(
        '✅ license_group.createdAt renamed to created_at with default value',
      );
    } catch (error) {
      // Column might already be named created_at
      try {
        await queryRunner.query(`
          ALTER TABLE license_group 
          MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log(
          '✅ license_group.created_at default value added successfully',
        );
      } catch (error2) {
        console.log(
          'ℹ️ license_group.createdAt/created_at column modification failed:',
          (error as any).message,
        );
      }
    }

    // Rename expiredAt to expired_at
    try {
      await queryRunner.query(`
        ALTER TABLE license_group 
        CHANGE COLUMN expiredAt expired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log(
        '✅ license_group.expiredAt renamed to expired_at with default value',
      );
    } catch (error) {
      // Column might already be named expired_at
      try {
        await queryRunner.query(`
          ALTER TABLE license_group 
          MODIFY COLUMN expired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log(
          '✅ license_group.expired_at default value added successfully',
        );
      } catch (error2) {
        console.log(
          'ℹ️ license_group.expiredAt/expired_at column modification failed:',
          (error as any).message,
        );
      }
    }

    // Rename licenseCategory to license_category
    try {
      await queryRunner.query(`
        ALTER TABLE license_group 
        CHANGE COLUMN licenseCategory license_category INT
      `);
      console.log(
        '✅ license_group.licenseCategory renamed to license_category',
      );
    } catch (error) {
      // Column might already be named license_category
      try {
        console.log(
          'ℹ️ license_group.licenseCategory/license_category column might already be renamed:',
          (error as any).message,
        );
      } catch (error2) {
        console.log(
          'ℹ️ license_group.licenseCategory/license_category column modification failed:',
          (error as any).message,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Rename license_category back to licenseCategory
    try {
      await queryRunner.query(`
        ALTER TABLE license_group 
        CHANGE COLUMN license_category licenseCategory INT
      `);
      console.log(
        '✅ license_group.license_category renamed back to licenseCategory',
      );
    } catch (error) {
      console.log(
        'ℹ️ license_group.license_category column rename failed:',
        (error as any).message,
      );
    }

    // Rename expired_at back to expiredAt and remove default value
    try {
      await queryRunner.query(`
        ALTER TABLE license_group 
        CHANGE COLUMN expired_at expiredAt TIMESTAMP NOT NULL
      `);
      console.log(
        '✅ license_group.expired_at renamed back to expiredAt without default value',
      );
    } catch (error) {
      console.log(
        'ℹ️ license_group.expired_at column rename failed:',
        (error as any).message,
      );
    }

    // Rename created_at back to createdAt and remove default value
    try {
      await queryRunner.query(`
        ALTER TABLE license_group 
        CHANGE COLUMN created_at createdAt TIMESTAMP NOT NULL
      `);
      console.log(
        '✅ license_group.created_at renamed back to createdAt without default value',
      );
    } catch (error) {
      console.log(
        'ℹ️ license_group.created_at column rename failed:',
        (error as any).message,
      );
    }
  }
}
