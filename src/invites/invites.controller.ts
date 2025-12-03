import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dtos/create-invite.dto';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  /* @Post()
  create(@Body() createInviteDto: CreateInviteDto) {
    return this.invitesService.create(createInviteDto);
  } */

  /* @Get()
  findAll() {
    return this.invitesService.findAll();
  } */

  /* @Get(':id')
  findOne(@Param('id') id: number) {
    return this.invitesService.findOne(+id);
  } */

  /* @Delete(':id')
  remove(@Param('id') id: number) {
    return this.invitesService.remove(+id);
  } */
}