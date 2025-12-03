import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Youtube {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  titleKr: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titleEn: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;
}