import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'invoice_data' })
export class Invoice {
  @PrimaryGeneratedColumn({ name: 'seq' })
  seq: number;

  @Column({ name: 'user_uid', nullable: true })
  userUid: number;

  @Column({ type: 'int', default: 1 })
  product: number;

  @Column()
  invoice: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}