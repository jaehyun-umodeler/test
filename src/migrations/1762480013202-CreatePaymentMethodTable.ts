import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import { OwnerType, PaymentMethodType } from 'src/utils/constants';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePaymentMethodTable1762480013202
  implements MigrationInterface
{
  name = 'CreatePaymentMethodTable1762480013202';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_methods table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'payment_methods',
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
              default: PaymentMethodType.CARD,
              comment: '0: Card, 1: Bank Account, 2: PayPal',
            },
            {
              name: 'data',
              type: 'text',
              isNullable: true,
              comment: 'JSON string',
            },
            {
              name: 'is_default',
              type: 'tinyint',
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
              name: 'external_id',
              type: 'varchar',
              length: '255',
              isNullable: true,
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
      console.log('✅ payment_methods table created');
    } catch (error) {
      console.log(
        'ℹ️ payment_methods table exists or creation failed:',
        (error as any).message,
      );
    }

    // Indexes
    try {
      await queryRunner.createIndex(
        'payment_methods',
        new TableIndex({
          name: 'IDX_PAYMENT_METHODS_USER_ID',
          columnNames: ['user_id'],
        }),
      );
      console.log('✅ IDX_PAYMENT_METHODS_USER_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_PAYMENT_METHODS_USER_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'payment_methods',
        new TableIndex({
          name: 'IDX_PAYMENT_METHODS_ORG_ID',
          columnNames: ['organization_id'],
        }),
      );
      console.log('✅ IDX_PAYMENT_METHODS_ORG_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_PAYMENT_METHODS_ORG_ID exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createIndex(
        'payment_methods',
        new TableIndex({
          name: 'IDX_PAYMENT_METHODS_EXTERNAL_ID',
          columnNames: ['external_id'],
        }),
      );
      console.log('✅ IDX_PAYMENT_METHODS_EXTERNAL_ID index created');
    } catch (error) {
      console.log(
        'ℹ️ IDX_PAYMENT_METHODS_EXTERNAL_ID exists or creation failed:',
        (error as any).message,
      );
    }

    // Foreign Keys
    try {
      await queryRunner.createForeignKey(
        'payment_methods',
        new TableForeignKey({
          name: 'FK_PAYMENT_METHODS_USER',
          columnNames: ['user_id'],
          referencedTableName: 'account_data',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_PAYMENT_METHODS_USER foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_PAYMENT_METHODS_USER exists or creation failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.createForeignKey(
        'payment_methods',
        new TableForeignKey({
          name: 'FK_PAYMENT_METHODS_ORG',
          columnNames: ['organization_id'],
          referencedTableName: 'organization',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      console.log('✅ FK_PAYMENT_METHODS_ORG foreign key created');
    } catch (error) {
      console.log(
        'ℹ️ FK_PAYMENT_METHODS_ORG exists or creation failed:',
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
        'payment_methods',
        'FK_PAYMENT_METHODS_ORG',
      );
      console.log('✅ FK_PAYMENT_METHODS_ORG foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_PAYMENT_METHODS_ORG failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropForeignKey(
        'payment_methods',
        'FK_PAYMENT_METHODS_USER',
      );
      console.log('✅ FK_PAYMENT_METHODS_USER foreign key dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop FK_PAYMENT_METHODS_USER failed:',
        (error as any).message,
      );
    }

    // Drop Indexes
    try {
      await queryRunner.dropIndex(
        'payment_methods',
        'IDX_PAYMENT_METHODS_EXTERNAL_ID',
      );
      console.log('✅ IDX_PAYMENT_METHODS_EXTERNAL_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_PAYMENT_METHODS_EXTERNAL_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex(
        'payment_methods',
        'IDX_PAYMENT_METHODS_ORG_ID',
      );
      console.log('✅ IDX_PAYMENT_METHODS_ORG_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_PAYMENT_METHODS_ORG_ID failed:',
        (error as any).message,
      );
    }

    try {
      await queryRunner.dropIndex(
        'payment_methods',
        'IDX_PAYMENT_METHODS_USER_ID',
      );
      console.log('✅ IDX_PAYMENT_METHODS_USER_ID index dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop IDX_PAYMENT_METHODS_USER_ID failed:',
        (error as any).message,
      );
    }

    // Drop table
    try {
      await queryRunner.dropTable('payment_methods');
      console.log('✅ payment_methods table dropped');
    } catch (error) {
      console.log(
        'ℹ️ drop payment_methods table failed:',
        (error as any).message,
      );
    }
  }
}
