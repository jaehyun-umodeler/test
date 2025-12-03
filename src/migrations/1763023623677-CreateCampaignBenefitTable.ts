import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateCampaignBenefitTable1763023623677
  implements MigrationInterface
{
  name = 'CreateCampaignBenefitTable1763023623677';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create campaign_benefit table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'campaign_benefit',
          columns: [
            {
              name: 'id',
              type: 'binary',
              length: '16',
              isPrimary: true,
            },
            {
              name: 'campaign_id',
              type: 'binary',
              length: '16',
            },
            {
              name: 'benefit_id',
              type: 'binary',
              length: '16',
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
      console.log('✅ campaign_benefit table created');
    } catch (error) {
      console.log(
        'ℹ️ campaign_benefit table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'campaign_benefit',
        new TableIndex({
          name: 'IDX_CAMPAIGN_BENEFIT_CAMPAIGN_ID',
          columnNames: ['campaign_id'],
        }),
      );
      console.log('✅ IDX_CAMPAIGN_BENEFIT_CAMPAIGN_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_CAMPAIGN_BENEFIT_CAMPAIGN_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'campaign_benefit',
        new TableIndex({
          name: 'IDX_CAMPAIGN_BENEFIT_BENEFIT_ID',
          columnNames: ['benefit_id'],
        }),
      );
      console.log('✅ IDX_CAMPAIGN_BENEFIT_BENEFIT_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_CAMPAIGN_BENEFIT_BENEFIT_ID exists or creation failed:',
        (error as any).message,
      );
    }

    // Foreign Keys
    try {
      await queryRunner.createForeignKey(
        'campaign_benefit',
        new TableForeignKey({
          name: 'FK_CAMPAIGN_BENEFIT_CAMPAIGN',
          columnNames: ['campaign_id'],
          referencedTableName: 'campaigns',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_CAMPAIGN_BENEFIT_CAMPAIGN foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_CAMPAIGN_BENEFIT_CAMPAIGN exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'campaign_benefit',
        new TableForeignKey({
          name: 'FK_CAMPAIGN_BENEFIT_BENEFIT',
          columnNames: ['benefit_id'],
          referencedTableName: 'benefits',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_CAMPAIGN_BENEFIT_BENEFIT foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_CAMPAIGN_BENEFIT_BENEFIT exists or creation failed:',
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
        'campaign_benefit',
        'FK_CAMPAIGN_BENEFIT_BENEFIT',
      );
      console.log('✅ FK_CAMPAIGN_BENEFIT_BENEFIT foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_CAMPAIGN_BENEFIT_BENEFIT failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropForeignKey(
        'campaign_benefit',
        'FK_CAMPAIGN_BENEFIT_CAMPAIGN',
      );
      console.log('✅ FK_CAMPAIGN_BENEFIT_CAMPAIGN foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_CAMPAIGN_BENEFIT_CAMPAIGN failed:',
        (error as any).message,
      );
    }

    // Drop Indexes
    try {
      await queryRunner.dropIndex(
        'campaign_benefit',
        'IDX_CAMPAIGN_BENEFIT_BENEFIT_ID',
      );
      console.log('✅ IDX_CAMPAIGN_BENEFIT_BENEFIT_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_CAMPAIGN_BENEFIT_BENEFIT_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex(
        'campaign_benefit',
        'IDX_CAMPAIGN_BENEFIT_CAMPAIGN_ID',
      );
      console.log('✅ IDX_CAMPAIGN_BENEFIT_CAMPAIGN_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_CAMPAIGN_BENEFIT_CAMPAIGN_ID failed:',
        (error as any).message,
      );
    }

    // Drop table
    try {
      await queryRunner.dropTable('campaign_benefit');
      console.log('✅ campaign_benefit table dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop campaign_benefit table failed:',
        (error as any).message,
      );
    }
  }
}
