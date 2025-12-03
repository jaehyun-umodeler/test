import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddDateColumnOrganization1700000000003
  implements MigrationInterface
{
  name = 'AddDateColumnOrganization1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add created_at column
    try {
      await queryRunner.addColumn(
        'organization',
        new TableColumn({
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          comment: 'Created timestamp',
        }),
      );
      console.log('✅ created_at column added successfully');
    } catch (error) {
      console.log(
        'ℹ️ created_at column already exists or creation failed:',
        error.message,
      );
    }

    // Add updated_at column
    try {
      await queryRunner.addColumn(
        'organization',
        new TableColumn({
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          comment: 'Updated timestamp',
        }),
      );
      console.log('✅ updated_at column added successfully');
    } catch (error) {
      console.log(
        'ℹ️ updated_at column already exists or creation failed:',
        error.message,
      );
    }

    // Add deleted_at column
    try {
      await queryRunner.addColumn(
        'organization',
        new TableColumn({
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
          comment: 'Soft delete timestamp',
        }),
      );
      console.log('✅ deleted_at column added successfully');
    } catch (error) {
      console.log(
        'ℹ️ deleted_at column already exists or creation failed:',
        error.message,
      );
    }

    // Create index for deleted_at column
    try {
      await queryRunner.createIndex(
        'organization',
        new TableIndex({
          name: 'IDX_ORGANIZATION_DELETED_AT',
          columnNames: ['deleted_at'],
        }),
      );
      console.log('✅ IDX_ORGANIZATION_DELETED_AT index created successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_ORGANIZATION_DELETED_AT index already exists or creation failed:',
        error.message,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reverting migrations is disabled in production.');
    }

    // Drop index first
    try {
      await queryRunner.dropIndex(
        'organization',
        'IDX_ORGANIZATION_DELETED_AT',
      );
      console.log('✅ IDX_ORGANIZATION_DELETED_AT index dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ IDX_ORGANIZATION_DELETED_AT index does not exist or drop failed:',
        error.message,
      );
    }

    // Drop deleted_at column
    try {
      await queryRunner.dropColumn('organization', 'deleted_at');
      console.log('✅ deleted_at column dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ deleted_at column does not exist or drop failed:',
        error.message,
      );
    }

    // Drop updated_at column
    try {
      await queryRunner.dropColumn('organization', 'updated_at');
      console.log('✅ updated_at column dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ updated_at column does not exist or drop failed:',
        error.message,
      );
    }

    // Drop created_at column
    try {
      await queryRunner.dropColumn('organization', 'created_at');
      console.log('✅ created_at column dropped successfully');
    } catch (error) {
      console.log(
        'ℹ️ created_at column does not exist or drop failed:',
        error.message,
      );
    }
  }
}
