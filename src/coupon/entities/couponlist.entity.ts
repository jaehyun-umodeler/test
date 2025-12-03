import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity()
export class Couponlist {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column({ type: 'int', precision: 11, comment: '결제구독고유번호' })
  couponIdx: number;

  @Column({ type: 'varchar', length: 255, comment: '이메일' })
  email: string;

  @Column({ type: 'varchar', length: 255, comment: '쿠폰코드앞3자리' })
  prefix: string;

  @Column({ type: 'varchar', length: 255, comment: '쿠폰코드' })
  couponCode: string;

  @Column({ type: 'tinyint', precision: 2, comment: '0: 미사용, 1: 사용' })
  status: number;

  @Column({ type: 'datetime', nullable: true, precision: 0, comment: '유효기간날짜' })
  validityDate: Date;

  @CreateDateColumn({ type: 'datetime', precision: 0, comment: '생성일', default: () => "CURRENT_TIMESTAMP" })
  create_dt: Date;
}