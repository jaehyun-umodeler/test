import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'invites' })
export class Invites {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  category: number; // 0 : Admin 에서 라이센스 발급, 1 : 팀초대 발급

  @Column({default: null})
  userId: number; // 0 인 경우에는 null

  @Column({default: null})
  teamId: number; // 0 인 경우에는 null

  @CreateDateColumn()
  createdAt: Date;
}