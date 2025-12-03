import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity()
export class Coupongroup {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column({ type: 'varchar', length: 255, comment: '지급대상선택' })
  targetType: string;

  @Column({ type: 'varchar', length: 255, comment: '할인률' })
  discount: string;

  @Column({ type: 'varchar', length: 255, comment: '유효기간' })
  validity: string;

  @Column({ type: 'datetime', nullable: true, precision: 0, comment: '유효기간날짜' })
  validityDate: Date;

  @Column({ type: 'varchar', length: 255, comment: '쿠폰코드 앞 3자리' })
  prefix: string;

  @Column({ type: 'varchar', length: 255, comment: '비고' })
  memo: string;

  @CreateDateColumn({ type: 'datetime', precision: 0, comment: '생성일', default: () => "CURRENT_TIMESTAMP" })
  create_dt: Date;

  @Column({ type: 'datetime', nullable: true, precision: 0, comment: '자동발행 리밋 날짜' })
  autosend_dt: Date;  

  @Column({ type: 'int', default: 0, comment: '0: 미발행, 1:발생' })
  autostatus: number; // 1: 미답변, 2: 답변 완료
}