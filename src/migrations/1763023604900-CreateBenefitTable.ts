import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBenefitTable1763023604900 implements MigrationInterface {
  name = 'CreateBenefitTable1763023604900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create benefits table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'benefits',
          columns: [
            {
              name: 'id',
              type: 'binary',
              length: '16',
              isPrimary: true,
            },
            {
              name: 'title',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'type',
              type: 'tinyint',
            },
            {
              name: 'data',
              type: 'text',
              comment: 'JSON string',
            },
            {
              name: 'start_date',
              type: 'timestamp',
            },
            {
              name: 'end_date',
              type: 'timestamp',
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
            {
              name: 'deleted_at',
              type: 'timestamp',
              isNullable: true,
            },
          ],
        }),
        true,
      );
      console.log('✅ benefits table created');
    } catch (error) {
      console.log(
        'ℹ️ benefits table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'benefits',
        new TableIndex({
          name: 'IDX_BENEFITS_TYPE',
          columnNames: ['type'],
        }),
      );
      console.log('✅ IDX_BENEFITS_TYPE index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_BENEFITS_TYPE exists or creation failed:',
        (error as any).message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop Indexes
    try {
      await queryRunner.dropIndex('benefits', 'IDX_BENEFITS_TYPE');
      console.log('✅ IDX_BENEFITS_TYPE index dropped');
    } catch (error) {
      console.log('ℹ️ drop IDX_BENEFITS_TYPE failed:', (error as any).message);
    }

    // Drop table
    try {
      await queryRunner.dropTable('benefits');
      console.log('✅ benefits table dropped');
    } catch (error) {
      console.log('ℹ️ drop benefits table failed:', (error as any).message);
    }
  }
}
