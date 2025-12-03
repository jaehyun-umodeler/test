import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { TutorialFile } from './tutorial-file.entity';
import { UuidTransformer } from 'src/common/transformers/uuid.transformer';

@Entity({ name: 'tutorial_file_user' })
@Unique(['userId', 'tutorialFileId'])
export class TutorialFileUser {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    name: 'tutorial_file_id',
    type: 'binary',
    length: 16,
    transformer: new UuidTransformer(),
  })
  tutorialFileId: string;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.tutorialFileUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(
    () => TutorialFile,
    (tutorialFile) => tutorialFile.tutorialFileUsers,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'tutorial_file_id' })
  tutorialFile: TutorialFile;
}
