import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'resource_files' })
export class ResourceFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'title', type: 'text' })
  title: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'license_id', type: 'int' })
  licenseId: number;

  @Column({ name: 'asset_store_link', type: 'text' })
  assetStoreLink: string;

  @Column({ name: 'path', type: 'text' })
  path: string;

  @Column({ name: 'size', type: 'bigint' })
  size: number;

  @Column({ name: 'download_count', type: 'int' })
  downloadCount: number;

  @Column({ name: 'valid', type: 'int' })
  valid: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
