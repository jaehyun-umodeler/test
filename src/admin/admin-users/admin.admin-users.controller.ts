import {
  Controller,
  UseGuards,
  Body,
  Param,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Query,
} from '@nestjs/common';

import { AdminAdminUsersService } from './admin.admin-users.service';
import { UsersService } from 'src/users/users.service';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AccountAdmin } from '../entities/accountAdmin.entity';
import { AdminDto } from './dtos/admin.dto';
import { AdminAuthority } from 'src/utils/constants';
import { decryptEmail } from 'src/utils/util';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { UpdateAdminDto } from './dtos/update-admin.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { ListQueryDto } from 'src/common/dto/list-query.dto';

@UseGuards(JwtAccessAuthGuard)
@Controller('admin-users')
export class AdminAdminUsersController {
  constructor(
    private readonly adminAdminUsersService: AdminAdminUsersService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 모든 관리자 목록 조회
   * @returns 관리자 정보 배열
   */
  @Get()
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: ListQueryDto,
  ): Promise<ResponseDto<AdminDto[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const keyword = query.keyword || null;
    return this.adminAdminUsersService.findAll(page, limit, keyword);
  }

  /**
   * 관리자 ID로 특정 관리자 조회
   * @param id 관리자 ID
   * @returns 관리자 정보
   */
  @Get(':id')
  @AdminAuthorities(AdminAuthority.VIEWER)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: number): Promise<AdminDto> {
    const accountAdmin = await this.adminAdminUsersService.findOne(id);

    return {
      id: accountAdmin.id,
      userId: accountAdmin.user.id,
      email: decryptEmail(accountAdmin.user.email),
      name: accountAdmin.name,
      department: accountAdmin.department,
      authority: accountAdmin.authority,
      createdAt: accountAdmin.createdAt,
      updatedAt: accountAdmin.updatedAt,
    };
  }

  /**
   * 새로운 관리자 생성
   * @param createAdminDto 관리자 생성 데이터
   * @returns 생성된 관리자 정보
   */
  @Post()
  @AdminAuthorities(AdminAuthority.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAdminDto: CreateAdminDto): Promise<AccountAdmin> {
    const user = await this.usersService.findByEmail(createAdminDto.email);

    if (!user) {
      throw new NotFoundException({ errorCode: 'USER_NOT_FOUND' });
    }

    const accountAdmin = await this.adminAdminUsersService.findOneByUserId(
      user.id,
    );

    if (accountAdmin) {
      throw new BadRequestException({ errorCode: 'ADMIN_ALREADY_EXISTS' });
    }

    return await this.adminAdminUsersService.create(createAdminDto);
  }

  /**
   * 관리자 정보 수정
   * @param id 관리자 ID
   * @param updateAdminDto 관리자 수정 데이터
   * @returns 수정된 관리자 정보
   */
  @Patch(':id')
  @AdminAuthorities(AdminAuthority.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<AccountAdmin> {
    const accountAdmin = await this.adminAdminUsersService.findOne(id);

    if (!accountAdmin) {
      throw new NotFoundException({ errorCode: 'ADMIN_NOT_FOUND' });
    }

    return await this.adminAdminUsersService.update(id, updateAdminDto);
  }

  /**
   * 관리자 삭제
   * @param id 관리자 ID
   * @returns 삭제된 관리자 정보
   */
  @Delete(':id')
  @AdminAuthorities(AdminAuthority.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: number): Promise<AccountAdmin> {
    const accountAdmin = await this.adminAdminUsersService.findOne(id);

    if (!accountAdmin) {
      throw new NotFoundException({ errorCode: 'ADMIN_NOT_FOUND' });
    }

    return await this.adminAdminUsersService.delete(id);
  }
}
