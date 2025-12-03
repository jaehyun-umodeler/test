import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Partner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  email: string;
}