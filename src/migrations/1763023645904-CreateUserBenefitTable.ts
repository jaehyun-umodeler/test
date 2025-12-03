import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateUserBenefitTable1763023645904 implements MigrationInterface {
  name = 'CreateUserBenefitTable1763023645904';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_benefit table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'user_benefit',
          columns: [
            {
              name: 'id',
              type: 'binary',
              length: '16',
              isPrimary: true,
            },
            {
              name: 'user_id',
              type: 'int',
            },
            {
              name: 'benefit_id',
              type: 'binary',
              length: '16',
            },
            {
              name: 'is_used',
              type: 'boolean',
              default: false,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
      console.log('✅ user_benefit table created');
    } catch (error) {
      console.log(
        'ℹ️ user_benefit table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'user_benefit',
        new TableIndex({
          name: 'IDX_USER_BENEFIT_USER_ID',
          columnNames: ['user_id'],
        }),
      );
      console.log('✅ IDX_USER_BENEFIT_USER_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_USER_BENEFIT_USER_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'user_benefit',
        new TableIndex({
          name: 'IDX_USER_BENEFIT_BENEFIT_ID',
          columnNames: ['benefit_id'],
        }),
      );
      console.log('✅ IDX_USER_BENEFIT_BENEFIT_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_USER_BENEFIT_BENEFIT_ID exists or creation failed:',
        (error as any).message,
      );
    }

    // Foreign Keys
    try {
      await queryRunner.createForeignKey(
        'user_benefit',
        new TableForeignKey({
          name: 'FK_USER_BENEFIT_USER',
          columnNames: ['user_id'],
          referencedTableName: 'account_data',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_USER_BENEFIT_USER foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_USER_BENEFIT_USER exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'user_benefit',
        new TableForeignKey({
          name: 'FK_USER_BENEFIT_BENEFIT',
          columnNames: ['benefit_id'],
          referencedTableName: 'benefits',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_USER_BENEFIT_BENEFIT foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_USER_BENEFIT_BENEFIT exists or creation failed:',
        (error as any).message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop Foreign Keys
    try {
      await queryRunner.dropForeignKey(
        'user_benefit',
        'FK_USER_BENEFIT_BENEFIT',
      );
      console.log('✅ FK_USER_BENEFIT_BENEFIT foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_USER_BENEFIT_BENEFIT failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropForeignKey('user_benefit', 'FK_USER_BENEFIT_USER');
      console.log('✅ FK_USER_BENEFIT_USER foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_USER_BENEFIT_USER failed:',
        (error as any).message,
      );
    }

    // Drop Indexes
    try {
      await queryRunner.dropIndex(
        'user_benefit',
        'IDX_USER_BENEFIT_BENEFIT_ID',
      );
      console.log('✅ IDX_USER_BENEFIT_BENEFIT_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_USER_BENEFIT_BENEFIT_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex('user_benefit', 'IDX_USER_BENEFIT_USER_ID');
      console.log('✅ IDX_USER_BENEFIT_USER_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_USER_BENEFIT_USER_ID failed:',
        (error as any).message,
      );
    }

    // Drop table
    try {
      await queryRunner.dropTable('user_benefit');
      console.log('✅ user_benefit table dropped');
    } catch (error) {
      console.log('ℹ️ drop user_benefit table failed:', (error as any).message);
    }
  }
}
