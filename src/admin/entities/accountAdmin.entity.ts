import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'account_admin' })
export class AccountAdmin {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'account_data_id', unique: true })
  accountDataId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_data_id' })
  user: User;

  @Column({ name: 'authority', default: 0 })
  authority: number;

  @Column({ name: 'name', length: 255 })
  name: string;

  @Column({ name: 'department', length: 255 })
  department: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
