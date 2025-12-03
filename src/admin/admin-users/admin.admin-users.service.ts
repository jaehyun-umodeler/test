import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { TokenService } from 'src/auth/services/token.service';
import { UsersService } from 'src/users/users.service';
import { AccountAdmin } from 'src/admin/entities/accountAdmin.entity';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { UpdateAdminDto } from './dtos/update-admin.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { decryptEmail, encryptEmail } from 'src/utils/util';
import { AdminDto } from './dtos/admin.dto';

/**
 * 관리자 서비스
 * - 관리자 조회 및 관리
 * - 사용자와 관리자 연결 관리
 */
@Injectable()
export class AdminAdminUsersService {
  constructor(
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
    private readonly userService: UsersService,
    @InjectRepository(AccountAdmin)
    private readonly accountAdminRepository: Repository<AccountAdmin>,
  ) {}

  /**
   * 모든 관리자 목록 조회
   * @returns 관리자 정보 배열
   */
  async findAll(
    page: number,
    limit: number,
    keyword: string,
  ): Promise<ResponseDto<AdminDto[]>> {
    const queryBuilder =
      this.accountAdminRepository.createQueryBuilder('accountAdmin');
    queryBuilder.leftJoinAndSelect('accountAdmin.user', 'user');
    if (keyword !== null) {
      queryBuilder.andWhere(
        '(user.encrypted_email = :email OR accountAdmin.name LIKE :name)',
        { email: encryptEmail(keyword), name: `%${keyword}%` },
      );
    }
    const [accountAdmins, totalCount] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const adminDtos: AdminDto[] = accountAdmins.map((accountAdmin) => ({
      id: accountAdmin.id,
      userId: accountAdmin.user.id,
      email: decryptEmail(accountAdmin.user.email),
      name: accountAdmin.name,
      department: accountAdmin.department,
      authority: accountAdmin.authority,
      createdAt: accountAdmin.createdAt,
      updatedAt: accountAdmin.updatedAt,
    }));

    return new ResponseDto(adminDtos, totalCount);
  }

  /**
   * 관리자 ID로 특정 관리자 조회
   * @param id 관리자 ID
   * @returns 관리자 정보
   */
  async findOne(id: number): Promise<AccountAdmin> {
    return await this.accountAdminRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  /**
   * 사용자 ID로 관리자 조회
   * @param userId 사용자 ID
   * @returns 관리자 정보
   */
  async findOneByUserId(userId: number): Promise<AccountAdmin> {
    return await this.accountAdminRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  /**
   * 새로운 관리자 생성
   * @param createAdminDto 관리자 생성 데이터
   * @returns 생성된 관리자 정보
   */
  async create(createAdminDto: CreateAdminDto): Promise<AccountAdmin> {
    const user = await this.userService.findByEmail(createAdminDto.email);
    const accountAdmin = this.accountAdminRepository.create({
      user: user,
      name: createAdminDto.name,
      department: createAdminDto.department,
      authority: createAdminDto.authority,
    });

    return await this.accountAdminRepository.save(accountAdmin);
  }

  /**
   * 관리자 정보 수정
   * @param id 관리자 ID
   * @param updateAdminDto 관리자 수정 데이터
   * @returns 수정된 관리자 정보
   */
  async update(
    id: number,
    updateAdminDto: UpdateAdminDto,
  ): Promise<AccountAdmin> {
    const accountAdmin = await this.accountAdminRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    Object.assign(accountAdmin, updateAdminDto);

    return await this.accountAdminRepository.save(accountAdmin);
  }

  /**
   * 관리자 삭제
   * @param id 관리자 ID
   * @returns 삭제된 관리자 정보
   */
  async delete(id: number): Promise<AccountAdmin> {
    const accountAdmin = await this.accountAdminRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    await this.tokenService.revokeAllRefreshTokens(accountAdmin.user.id);

    return await this.accountAdminRepository.remove(accountAdmin);
  }
}
