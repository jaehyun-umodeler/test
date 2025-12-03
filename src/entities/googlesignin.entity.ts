import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'googlesignin_data' })
export class GoogleSignin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sub: string;

  @Column({ name: 'encrypted_email', nullable: true })
  encryptedEmail: string;

  @Column({ name: 'email_verified', type: 'int', nullable: true })
  emailVerified: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ name: 'given_name' })
  givenName: string;

  @Column({ name: 'family_name' })
  familyName: string;

  @Column({ name: 'account_id', type: 'int', default: 0 })
  accountId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'login_acount', type: 'int', default: 1 })
  loginAccount: number;

  @Column({ name: 'instance_key', nullable: true })
  instanceKey: string;

  @UpdateDateColumn({ name: 'update_at' })
  updateAt: Date;
}