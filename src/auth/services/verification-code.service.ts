import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';
import { VerificationCode } from 'src/auth/entities/verification-code.entity';
import { encryptEmail } from 'src/utils/util';
import { AppException } from 'src/utils/app-exception';
import { ErrorCode } from 'src/utils/error-codes';

/**
 * 인증 코드 서비스
 */
@Injectable()
export class VerificationCodeService {
  private readonly jwtConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
  ) {
    this.jwtConfig = this.configService.get('jwt');
  }

  /**
   * 인증 코드 발송
   * @param email 이메일 주소
   * @param language 언어 설정
   * @param resetPassword 비밀번호 초기화 모드
   * @param school 학교 모드
   * @returns 생성된 인증 코드
   */
  async sendCode(
    email: string,
    language: string,
    resetPassword = false,
    school = false,
  ): Promise<string> {
    const user = await this.usersService.findByEmail(email);
    const encryptedEmail = encryptEmail(email);

    if (!resetPassword) {
      // 회원 가입을 하는 경우
      // 이미 사용자가 있는 경우
      if (user && user.validType === 'valid') {
        throw AppException.userAlreadyExists();
      }
      // 탈퇴한 사용자인 경우
      if (user && user.validType === 'expired') {
        throw new AppException(ErrorCode.ACCOUNT_DISABLED);
      }
    } else if (!school) {
      // 비밀번호 찾기를 하는 경우
      // 사용자가 없는 경우
      if (
        !user ||
        user.validType === 'unknown' ||
        user.validType === 'invalid'
      ) {
        throw AppException.userNotFound();
      }

      // 탈퇴한 사용자인 경우
      if (user.validType === 'expired') {
        throw new AppException(ErrorCode.ACCOUNT_DISABLED);
      }
    }

    // 이메일 인증 코드 발송
    const code = await this.emailService.sendVerificationCode(email, language);

    // 기존 인증 코드 삭제 후 새 인증 코드 저장
    await this.verificationCodeRepository.delete({ encryptedEmail });
    await this.verificationCodeRepository.save({
      encryptedEmail,
      code,
      expiresAt: new Date(
        new Date().getTime() + this.jwtConfig.expiresIn.verification * 1000,
      ),
    });

    return code;
  }

  /**
   * 인증 코드 검증
   * @param email 이메일 주소
   * @param code 인증번호
   * @returns 검증 성공 여부
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    const encryptedEmail = encryptEmail(email);
    const record = await this.verificationCodeRepository.findOne({
      where: { encryptedEmail, code },
      order: { createdAt: 'DESC' },
    });

    // 인증 코드가 존재하지 않는 경우
    if (!record) {
      return false;
    }

    // 인증 코드가 만료된 경우
    if (record.expiresAt < new Date()) {
      return false;
    }

    // 사용된 인증 코드 삭제
    await this.verificationCodeRepository.delete(record.id);

    return true;
  }
}
