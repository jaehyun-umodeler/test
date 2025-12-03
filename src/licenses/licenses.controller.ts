import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { LicenseService } from './licenses.service';
import { LicenseGroup } from './entities/license-group.entity';
import { License } from './entities/license.entity';
import { LicenseDto } from './dtos/license.dto';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { AdminAuthorities } from 'src/auth/decorators/admin-authority.decorator';
import { AdminAuthority } from 'src/utils/constants';
import { ResponseDto } from 'src/common/dto/response.dto';
@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  @UseGuards(JwtAccessAuthGuard)
  async getLicenseList(@Req() req: Request) {
    const accessPayload = req.accessPayload;
    const userId = accessPayload.sub;
    await this.licenseService.setAutoDefaultLicense(userId);
    return new ResponseDto<LicenseDto[]>(
      await this.licenseService.getLicensesByUser(userId),
    );
  }

  /**
   * 라이선스 그룹 생성
   */
  @Post('group')
  @UseGuards(JwtAccessAuthGuard)
  async createLicenseGroup(
    @Body()
    body: {
      groupOwnerId: number;
      sucEmail: any;
      totalLicenses: number;
      createdAt: Date;
      expiredAt: Date;
      licenseCategory: number;
      etc: string;
      email?: string;
      paystatus: number;
    },
  ): Promise<LicenseGroup> {
    const {
      groupOwnerId,
      totalLicenses,
      createdAt,
      expiredAt,
      licenseCategory,
      etc,
      email,
      sucEmail,
      paystatus,
    } = body;
    return await this.licenseService.createLicenseGroup(
      groupOwnerId,
      totalLicenses,
      createdAt,
      expiredAt,
      licenseCategory,
      etc,
      email,
      sucEmail,
      paystatus,
    );
  }

  @Post('group/filter')
  async getLicenseGroups(
    @Body() filters: { startDate?: string; endDate?: string; email?: string },
  ): Promise<LicenseGroup[]> {
    return await this.licenseService.getLicenseGroups(filters);
  }

  /**
   * 라이선스 그룹 전체 조회
   */
  @Get('group/:id')
  async getLicenseGroup(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LicenseGroup> {
    return await this.licenseService.getLicenseGroup(id);
  }

  /**
   * 라이선스 그룹 조회
   */
  @Post('groupAll')
  async groupAll(@Body() data: { ids: any }) {
    const { ids } = data;
    //console.log(ids);
    return await this.licenseService.getLicenseGroupall(ids);
  }

  /**
   * 라이선스 리스트 조회 (관리자)
   */
  @Post('list')
  async getLicenses(
    @Body()
    filters: {
      startDate?: string;
      endDate?: string;
      emailNameLicenseNo?: string;
      category?: string;
      subscriptionType?: string;
      status?: string;
    },
  ): Promise<License[]> {
    return await this.licenseService.getLicenses(
      filters.startDate,
      filters.endDate,
      filters.emailNameLicenseNo,
      filters.category,
      filters.subscriptionType,
      filters.status,
    );
  }

  /**
   * 라이선스 할당
   */
  @Patch('assign')
  @UseGuards(JwtAccessAuthGuard)
  @AdminAuthorities(AdminAuthority.VIEWER)
  async assignLicense(
    @Body() body: { licenseId: number; userId: number },
  ): Promise<License> {
    return await this.licenseService.assignLicense(body.licenseId, body.userId);
  }

  /**
   * 라이선스 회수
   */
  @Patch('revoke/:licenseId')
  async revokeLicense(
    @Param('licenseId', ParseIntPipe) licenseId: number,
  ): Promise<License> {
    return await this.licenseService.revokeLicense(licenseId);
  }

  @Patch('revokenotduser/:licenseId')
  async revokenotduserLicense(
    @Param('licenseId', ParseIntPipe) licenseId: number,
  ): Promise<License> {
    return await this.licenseService.revokenotduserLicense(licenseId);
  }

  @Patch('remove/:licenseId')
  @UseGuards(JwtAccessAuthGuard)
  async removeLicense(
    @Param('licenseId', ParseIntPipe) licenseId: number,
  ): Promise<void> {
    await this.licenseService.removeLicense(licenseId);
  }

  /**
   * 라이선스 그룹 전체 회수
   */
  @Patch('revokeAll/:groupId')
  async revokeAllLicenses(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Boolean> {
    try {
      return await this.licenseService.revokeAllLicenses(groupId);
    } catch (e) {
      return false;
    }
  }

  /**
   * 라이선스 그룹 전체 회수
   */
  @Patch('revokeAllNotdeleteLicenses/:groupId')
  async revokeAllNotdeleteLicenses(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Boolean> {
    try {
      return await this.licenseService.revokeAllNotdeleteLicenses(groupId);
    } catch (e) {
      return false;
    }
  }

  /* @Get('user/group/:userId')
  async getLicenseGroupByUser(@Param('userId', ParseIntPipe) userId: number): Promise<LicenseGroup[]> {
    console.log("userId", userId);
    return await this.licenseService.getLicenseGroupByUser(userId);
  } */

  /**
   * 특정 유저가 가진 라이선스 조회
   */
  @Get('user/:userId')
  @UseGuards(JwtAccessAuthGuard)
  async getLicensesByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<LicenseDto[]> {
    console.log('userId', userId);
    const res = await this.licenseService.getLicensesByUser(userId);
    return res;
  }

  @Get('user/free/:userId')
  @UseGuards(JwtAccessAuthGuard)
  async getFreeLicenseByUser(@Param('userId', ParseIntPipe) userId: number) {
    return await this.licenseService.getFreeLicenseByUser(userId);
  }

  /* @Get('user/edu/:userId')
  async getEduLicensesByUser(@Param('userId', ParseIntPipe) userId: number): Promise<LicenseDto> {
    console.log("userId", userId);
    const licenses = await this.licenseService.getLicensesByUser(userId);
    return licenses.filter(license => !license.licenseGroup)[0];
  } */

  /**
   * LicenseGroup에 Manager를 추가하는 엔드포인트
   * POST /license/group/:groupId/manager
   * Body: { userId: number }
   */
  @Post('group/:groupId/manager/:userId')
  @UseGuards(JwtAccessAuthGuard)
  async addManager(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<LicenseGroup> {
    return await this.licenseService.addManagerToGroup(groupId, userId);
  }

  /**
   * LicenseGroup에서 Manager를 제거하는 엔드포인트
   * DELETE /license/group/:groupId/manager/:userId
   */
  @Delete('group/:groupId/manager/:userId')
  @UseGuards(JwtAccessAuthGuard)
  async removeManager(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<LicenseGroup> {
    return await this.licenseService.removeManagerFromGroup(groupId, userId);
  }

  /**
   * LicenseGroup에 Owner를 추가하는 엔드포인트
   * POST /license/group/:groupId/owner
   * Body: { userId: number }
   */
  @Post('group/:groupId/owner/:userId')
  @UseGuards(JwtAccessAuthGuard)
  async addOwner(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<LicenseGroup> {
    return await this.licenseService.addOwnerToGroup(groupId, userId);
  }

  /**
   * LicenseGroup에서 Owner를 제거하는 엔드포인트
   * DELETE /license/group/:groupId/owner/:userId
   */
  @Delete('group/:groupId/owner/:userId')
  @UseGuards(JwtAccessAuthGuard)
  async removeOwner(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<LicenseGroup> {
    return await this.licenseService.removeOwnerFromGroup(groupId, userId);
  }

  /**
   * 사용자의 기본 라이선스 조회
   * @param req 요청 객체
   */
  @Get('default')
  @UseGuards(JwtAccessAuthGuard)
  async getDefaultLicense(@Req() req: Request): Promise<LicenseDto | null> {
    const accessPayload = req.accessPayload;

    return await this.licenseService.getDefaultLicense(accessPayload.sub);
  }

  /**
   * 사용자의 기본 라이선스 설정
   * @param req 요청 객체
   * @param body 요청 바디
   * @param body.licenseId 라이선스 ID
   */
  @Post('default')
  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setDefaultLicense(
    @Req() req: Request,
    @Body() body: { licenseId: number },
  ) {
    const accessPayload = req.accessPayload;

    await this.licenseService.setDefaultLicense(
      accessPayload.sub,
      body.licenseId,
    );
  }

  /**
   * 사용자의 기본 라이선스 해제
   * @param req 요청 객체
   */
  @Delete('default')
  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unsetDefaultLicense(@Req() req: Request) {
    const accessPayload = req.accessPayload;

    await this.licenseService.unsetDefaultLicense(accessPayload.sub);
  }
}
