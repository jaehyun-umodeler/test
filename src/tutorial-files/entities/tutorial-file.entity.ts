import { UuidTransformer } from 'src/common/transformers/uuid.transformer';
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
  UpdateDateColumn,
} from 'typeorm';
import { File } from 'src/files/entities/file.entity';
import { uuidv7 } from 'uuidv7';
import { TutorialDifficulty } from 'src/utils/constants';
import { TutorialFileUser } from './tutorial-file-user.entity';

@Entity({ name: 'tutorial_files' })
export class TutorialFile {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  id: string;

  @ManyToOne(() => File, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'file_id' })
  file: File;

  @Column({
    name: 'file_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
    nullable: true,
  })
  @Index()
  fileId: string;

  @Column({ name: 'title', type: 'text' })
  title: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'technics', type: 'text' })
  technics: string;

  @Column({
    name: 'difficulty',
    type: 'tinyint',
    default: TutorialDifficulty.EASY,
  })
  difficulty: TutorialDifficulty;

  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl: string;

  @ManyToOne(() => File, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'thumbnail_id' })
  thumbnail: File;

  @Column({
    name: 'thumbnail_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
    nullable: true,
  })
  @Index()
  thumbnailId: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'sequence', type: 'int', default: 0 })
  sequence: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(
    () => TutorialFileUser,
    (tutorialFileUser) => tutorialFileUser.tutorialFile,
  )
  tutorialFileUsers: TutorialFileUser[];

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
