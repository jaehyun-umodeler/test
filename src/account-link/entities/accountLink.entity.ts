import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Provider } from 'src/auth/types/provider.type';

@Entity({ name: 'account_link' })
export class AccountLink {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({
    name: 'provider',
    type: 'enum',
    enum: Provider,
    default: Provider.LOCAL,
  })
  provider: Provider;

  @Column({ name: 'provider_id', length: 255 })
  providerId: string;

  @Column({ name: 'email', length: 255 })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
