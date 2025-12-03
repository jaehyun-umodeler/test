import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * 인증 코드 엔티티
 */
@Entity({ name: 'verification_code' })
export class VerificationCode {
  /** 아이디 */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 이메일 */
  @Column({ name: 'encrypted_email', length: 2048 })
  encryptedEmail: string;

  /** 인증 코드 */
  @Column({ name: 'code', length: 4 })
  code: string;

  /** 생성일 */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  /** 만료일 */
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;
}
