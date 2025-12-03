import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Folder } from './folder.entity';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'files' })
export class File {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id: string;

  @Column({ name: 'name', type: 'text' })
  name: string;

  @Column({ name: 'storage_key', type: 'text', nullable: true })
  storageKey: string;

  @Column({ name: 'size', type: 'bigint', default: 0 })
  size: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string;

  @ManyToOne(() => Folder, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @Column({
    name: 'folder_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  @Index()
  folderId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by_user_id' })
  @Index()
  uploadedByUser: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
