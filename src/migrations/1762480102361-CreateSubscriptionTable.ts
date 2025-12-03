import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { OwnerType, SubscriptionStatus } from '../utils/constants';

export class CreateSubscriptionTable1762480102361
  implements MigrationInterface
{
  name = 'CreateSubscriptionTable1762480102361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscriptions table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'subscriptions',
          columns: [
            {
              name: 'id',
              type: 'binary',
              length: '16',
              isPrimary: true,
            },
            {
              name: 'total_price',
              type: 'bigint',
              default: 0,
            },
            {
              name: 'owner_type',
              type: 'tinyint',
              default: OwnerType.USER,
              comment: '0: User, 1: Organization',
            },
            {
              name: 'user_id',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'organization_id',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'plan_id',
              type: 'binary',
              length: '16',
              isNullable: true,
            },
            {
              name: 'external_id',
              type: 'varchar',
              length: '255',
              isNullable: true,
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
              name: 'last_billing_date',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'next_billing_date',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'seat_quantity',
              type: 'int',
              default: 0,
            },
            {
              name: 'status',
              type: 'tinyint',
              default: SubscriptionStatus.NONE,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
      console.log('✅ subscriptions table created');
    } catch (error) {
      console.log(
        'ℹ️ subscriptions table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'subscriptions',
        new TableIndex({
          name: 'IDX_SUBSCRIPTIONS_USER_ID',
          columnNames: ['user_id'],
        }),
      );
      console.log('✅ IDX_SUBSCRIPTIONS_USER_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_SUBSCRIPTIONS_USER_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'subscriptions',
        new TableIndex({
          name: 'IDX_SUBSCRIPTIONS_ORG_ID',
          columnNames: ['organization_id'],
        }),
      );
      console.log('✅ IDX_SUBSCRIPTIONS_ORG_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_SUBSCRIPTIONS_ORG_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'subscriptions',
        new TableIndex({
          name: 'IDX_SUBSCRIPTIONS_PLAN_ID',
          columnNames: ['plan_id'],
        }),
      );
      console.log('✅ IDX_SUBSCRIPTIONS_PLAN_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_SUBSCRIPTIONS_PLAN_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'subscriptions',
        new TableIndex({
          name: 'IDX_SUBSCRIPTIONS_EXTERNAL_ID',
          columnNames: ['external_id'],
        }),
      );
      console.log('✅ IDX_SUBSCRIPTIONS_EXTERNAL_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_SUBSCRIPTIONS_EXTERNAL_ID exists or creation failed:',
        (error as any).message,
      );
    }

    // Foreign Keys
    try {
      await queryRunner.createForeignKey(
        'subscriptions',
        new TableForeignKey({
          name: 'FK_SUBSCRIPTIONS_USER',
          columnNames: ['user_id'],
          referencedTableName: 'account_data',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_SUBSCRIPTIONS_USER foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_SUBSCRIPTIONS_USER exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'subscriptions',
        new TableForeignKey({
          name: 'FK_SUBSCRIPTIONS_ORG',
          columnNames: ['organization_id'],
          referencedTableName: 'organization',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_SUBSCRIPTIONS_ORG foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_SUBSCRIPTIONS_ORG exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'subscriptions',
        new TableForeignKey({
          name: 'FK_SUBSCRIPTIONS_PLAN',
          columnNames: ['plan_id'],
          referencedTableName: 'plans',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
      console.log('✅ FK_SUBSCRIPTIONS_PLAN foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_SUBSCRIPTIONS_PLAN exists or creation failed:',
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
        'subscriptions',
        'FK_SUBSCRIPTIONS_PLAN',
      );
      console.log('✅ FK_SUBSCRIPTIONS_PLAN foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_SUBSCRIPTIONS_PLAN failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropForeignKey('subscriptions', 'FK_SUBSCRIPTIONS_ORG');
      console.log('✅ FK_SUBSCRIPTIONS_ORG foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_SUBSCRIPTIONS_ORG failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropForeignKey(
        'subscriptions',
        'FK_SUBSCRIPTIONS_USER',
      );
      console.log('✅ FK_SUBSCRIPTIONS_USER foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_SUBSCRIPTIONS_USER failed:',
        (error as any).message,
      );
    }

    // Drop Indexes
    try {
      await queryRunner.dropIndex(
        'subscriptions',
        'IDX_SUBSCRIPTIONS_EXTERNAL_ID',
      );
      console.log('✅ IDX_SUBSCRIPTIONS_EXTERNAL_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_SUBSCRIPTIONS_EXTERNAL_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex('subscriptions', 'IDX_SUBSCRIPTIONS_PLAN_ID');
      console.log('✅ IDX_SUBSCRIPTIONS_PLAN_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_SUBSCRIPTIONS_PLAN_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex('subscriptions', 'IDX_SUBSCRIPTIONS_ORG_ID');
      console.log('✅ IDX_SUBSCRIPTIONS_ORG_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_SUBSCRIPTIONS_ORG_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex('subscriptions', 'IDX_SUBSCRIPTIONS_USER_ID');
      console.log('✅ IDX_SUBSCRIPTIONS_USER_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_SUBSCRIPTIONS_USER_ID failed:',
        (error as any).message,
      );
    }

    // Drop table
    try {
      await queryRunner.dropTable('subscriptions');
      console.log('✅ subscriptions table dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop subscriptions table failed:',
        (error as any).message,
      );
    }
  }
}
