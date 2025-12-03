import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'redeemcode_data' })
export class RedeemCode {
  @PrimaryGeneratedColumn({ name: 'seq' })
  seq: number;

  @Column({ type: 'int', default: 1 })
  product: number;

  @Column({ length: 24 })
  code: string;

  @Column({ name: 'expire_at', type: 'datetime', nullable: true })
  expireAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}