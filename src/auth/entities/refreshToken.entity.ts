import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'refresh_tokens' })
@Index(['token', 'expiresAt'])
@Index(['userId', 'expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'token', unique: true, length: 255 })
  token: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;
}
