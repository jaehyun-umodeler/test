import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { BillingCycle, PlanType } from '../utils/constants';
import { uuidv7 } from 'uuidv7';
import { UuidTransformer } from 'src/common/transformers/uuid.transformer';

export class CreatePlanTable1762479889184 implements MigrationInterface {
  name = 'CreatePlanTable1762479889184';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create plans table
    try {
      await queryRunner.createTable(
        new Table({
          name: 'plans',
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
              comment:
                '0: Pro Personal Monthly, 1: Pro Personal Yearly, 2: Pro Monthly, 3: Pro Yearly, 4: Enterprise Seat Yearly, 5: Enterprise Site Yearly',
            },
            {
              name: 'base_price',
              type: 'int',
              default: 0,
            },
            {
              name: 'price_per_seat',
              type: 'int',
              default: 0,
            },
            {
              name: 'base_seat_quantity',
              type: 'int',
              default: 1,
            },
            {
              name: 'billing_cycle',
              type: 'tinyint',
              default: BillingCycle.MONTHLY,
            },
            {
              name: 'trial_days',
              type: 'int',
              default: 0,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
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
            {
              name: 'deleted_at',
              type: 'timestamp',
              isNullable: true,
            },
          ],
        }),
        true,
      );
      console.log('✅ plans table created');
    } catch (error) {
      console.log(
        'ℹ️ plans table exists or creation failed:',
        (error as any).message,
      );
    }

    // Insert default plans
    try {
      const plans = [
        {
          id: uuidv7(),
          type: PlanType.PRO_PERSONAL,
          basePrice: 900,
          pricePerSeat: 0,
          baseSeatQuantity: 1,
          billingCycle: BillingCycle.MONTHLY,
          trialDays: 45,
          isActive: true,
        },
        {
          id: uuidv7(),
          type: PlanType.PRO_PERSONAL,
          basePrice: 742,
          pricePerSeat: 0,
          baseSeatQuantity: 1,
          billingCycle: BillingCycle.YEARLY,
          trialDays: 45,
          isActive: true,
        },
        {
          id: uuidv7(),
          type: PlanType.PRO,
          basePrice: 2000,
          pricePerSeat: 0,
          baseSeatQuantity: 1,
          billingCycle: BillingCycle.MONTHLY,
          trialDays: 45,
          isActive: true,
        },
        {
          id: uuidv7(),
          type: PlanType.PRO,
          basePrice: 1658,
          pricePerSeat: 0,
          baseSeatQuantity: 1,
          billingCycle: BillingCycle.YEARLY,
          trialDays: 45,
          isActive: true,
        },
        {
          id: uuidv7(),
          type: PlanType.ENTERPRISE,
          basePrice: 160000,
          pricePerSeat: 28000,
          baseSeatQuantity: 3,
          billingCycle: BillingCycle.YEARLY,
          trialDays: 0,
          isActive: true,
        },
        {
          id: uuidv7(),
          type: PlanType.ENTERPRISE,
          basePrice: 776000,
          pricePerSeat: 0,
          baseSeatQuantity: 1,
          billingCycle: BillingCycle.YEARLY,
          trialDays: 0,
          isActive: true,
        },
      ];
      for (const plan of plans) {
        await queryRunner.query(
          `INSERT INTO plans (id, type, base_price, price_per_seat, base_seat_quantity, billing_cycle, trial_days, is_active) VALUES (UUID_TO_BIN('${plan.id}'), ${plan.type}, ${plan.basePrice}, ${plan.pricePerSeat}, ${plan.baseSeatQuantity}, ${plan.billingCycle}, ${plan.trialDays}, ${plan.isActive})`,
        );
      }
      console.log('✅ default plans inserted');
    } catch (error) {
      console.log('ℹ️ default plans insertion failed:', (error as any).message);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop plans table
    try {
      await queryRunner.dropTable('plans');
      console.log('✅ plans table dropped');
    } catch (error) {
      console.log('ℹ️ drop plans table failed:', (error as any).message);
    }
  }
}
