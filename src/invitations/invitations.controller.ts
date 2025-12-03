import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { InvitationsService } from './invitations.service';
import { JwtAccessAuthGuard } from 'src/auth/guards/jwt.guard';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { InvitationDto } from './dto/invitation.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':invitationToken')
  @UseGuards(JwtAccessAuthGuard)
  findOneByToken(
    @Req() req: Request,
    @Param('invitationToken') invitationToken: string,
  ): Promise<InvitationDto> {
    const accessPayload = req.accessPayload;

    return this.invitationsService.findOneByToken(
      accessPayload.sub,
      invitationToken,
    );
  }

  @Patch(':invitationToken')
  @UseGuards(JwtAccessAuthGuard)
  async update(
    @Req() req: Request,
    @Param('invitationToken') invitationToken: string,
    @Body() updateInvitationDto: UpdateInvitationDto,
  ): Promise<InvitationDto> {
    const accessPayload = req.accessPayload;

    return this.invitationsService.update(
      accessPayload.sub,
      invitationToken,
      updateInvitationDto,
    );
  }

  @Delete(':invitationToken')
  @UseGuards(JwtAccessAuthGuard)
  remove(
    @Req() req: Request,
    @Param('invitationToken') invitationToken: string,
  ): Promise<void> {
    const accessPayload = req.accessPayload;

    return this.invitationsService.remove(accessPayload.sub, invitationToken);
  }
}
