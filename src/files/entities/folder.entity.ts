import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
import { FolderType } from 'src/utils/constants';

import { User } from '../../users/entities/user.entity';
import { File } from './file.entity';

@Entity({ name: 'folders' })
export class Folder {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'type', type: 'tinyint', default: FolderType.OTHER })
  @Index()
  type: FolderType;

  @ManyToOne(() => Folder, (folder) => folder.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  @Index()
  parent: Folder | null;

  @Column({
    name: 'parent_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  @Index()
  parentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'owner_id' })
  @Index()
  owner: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children: Folder[];

  @OneToMany(() => File, (file) => file.folder)
  files: File[];

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
