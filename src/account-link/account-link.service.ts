import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AccountLink } from './entities/accountLink.entity';
import { Provider } from 'src/auth/types/provider.type';
import { User } from 'src/users/entities/user.entity';
import { AppException } from 'src/utils/app-exception';

/**
 * 소셜 계정 연동 서비스
 */
@Injectable()
export class AccountLinkService {
  constructor(
    @InjectRepository(AccountLink)
    private readonly accountLinkRepository: Repository<AccountLink>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * 사용자의 모든 연동된 계정 조회
   * @param userId 사용자 ID
   * @returns 연동된 계정 목록
   */
  async getAccountLinks(user: User): Promise<AccountLink[]> {
    const accountLinks = await this.accountLinkRepository.find({
      where: { userId: user.id },
    });

    return accountLinks;
  }

  /**
   * 사용자의 연동된 계정 조회
   * @param userId 사용자 ID
   * @param provider 연동된 계정 제공자
   * @returns 연동된 계정 정보
   */
  async getAccountLink(
    userId: number,
    provider: Provider,
  ): Promise<AccountLink | null> {
    const accountLink = await this.accountLinkRepository.findOne({
      where: { userId, provider },
    });

    return accountLink || null;
  }

  /**
   * 연동된 계정 조회
   * @param provider 연동된 계정 제공자
   * @param providerId 연동된 계정 사용자 ID
   * @returns 연동된 계정 정보
   */
  async getAccountLinkByProviderId(
    provider: Provider,
    providerId: string,
  ): Promise<AccountLink | null> {
    const accountLink = await this.accountLinkRepository.findOne({
      where: { provider, providerId },
    });

    return accountLink || null;
  }

  /**
   * 연동된 계정 연동
   * @param userId 사용자 ID
   * @param provider 연동된 계정 제공자
   * @param providerId 연동된 계정 사용자 ID
   * @param email 연동된 계정 이메일
   * @returns 연동된 계정 정보
   */
  async linkAccount(
    userId: number,
    provider: Provider,
    providerId: string,
    email: string,
  ): Promise<AccountLink> {
    if (provider === Provider.LOCAL) {
      return;
    }

    // 계정 연동 정보 생성
    const accountLink = this.accountLinkRepository.create({
      userId,
      provider,
      providerId,
      email,
    });

    if (provider === Provider.GOOGLE) {
      await this.usersRepository.update(userId, { googleId: providerId });
    }

    return await this.accountLinkRepository.save(accountLink);
  }

  /**
   * 연동된 계정 해제
   * @param userId 사용자 ID
   * @param provider 소셜 서비스 제공자
   */
  async unlinkAccount(userId: number, provider: Provider): Promise<void> {
    // 계정 연동 정보 조회
    const accountLink = await this.accountLinkRepository.findOne({
      where: { userId, provider },
    });

    if (!accountLink) {
      throw AppException.notFound();
    }

    // 계정 연동 정보 삭제
    if (provider === Provider.GOOGLE) {
      await this.usersRepository.update(userId, { googleId: null });
    }
    await this.accountLinkRepository.delete({ userId, provider });
  }

  /**
   * 사용자의 모든 연동된 계정 해제
   * @param userId 사용자 ID
   */
  async unlinkAllAccounts(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { googleId: null });
    await this.accountLinkRepository.delete({ userId });
  }
}
