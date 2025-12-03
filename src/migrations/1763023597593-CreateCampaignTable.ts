import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCampaignTable1763023597593 implements MigrationInterface {
  name = 'CreateCampaignTable1763023597593';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create campaigns table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'campaigns',
          columns: [
            {
              name: 'id',
              type: 'binary',
              length: '16',
              isPrimary: true,
            },
            {
              name: 'type',
              type: 'tinyint',
            },
            {
              name: 'code',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
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
      console.log('✅ campaigns table created');
    } catch (error) {
      console.log(
        'ℹ️ campaigns table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'campaigns',
        new TableIndex({
          name: 'IDX_CAMPAIGNS_CODE',
          columnNames: ['code'],
        }),
      );
      console.log('✅ IDX_CAMPAIGNS_CODE index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_CAMPAIGNS_CODE exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'campaigns',
        new TableIndex({
          name: 'IDX_CAMPAIGNS_TYPE',
          columnNames: ['type'],
        }),
      );
      console.log('✅ IDX_CAMPAIGNS_TYPE index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_CAMPAIGNS_TYPE exists or creation failed:',
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
      await queryRunner.dropIndex('campaigns', 'IDX_CAMPAIGNS_TYPE');
      console.log('✅ IDX_CAMPAIGNS_TYPE index dropped');
    } catch (error) {
      console.log('ℹ️ drop IDX_CAMPAIGNS_TYPE failed:', (error as any).message);
    }

    try {
      await queryRunner.dropIndex('campaigns', 'IDX_CAMPAIGNS_CODE');
      console.log('✅ IDX_CAMPAIGNS_CODE index dropped');
    } catch (error) {
      console.log('ℹ️ drop IDX_CAMPAIGNS_CODE failed:', (error as any).message);
    }

    // Drop table
    try {
      await queryRunner.dropTable('campaigns');
      console.log('✅ campaigns table dropped');
    } catch (error) {
      console.log('ℹ️ drop campaigns table failed:', (error as any).message);
    }
  }
}
