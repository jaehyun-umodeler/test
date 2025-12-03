import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'terms' })
export class Terms {
  @PrimaryColumn()
  term: string;

  @PrimaryColumn()
  lang: string;

  @Column({ type: 'text', nullable: true })
  subTitle: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @UpdateDateColumn()
  updatedAt: Date;
}