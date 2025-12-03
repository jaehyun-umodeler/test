import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invites } from './entities/invites.entity';
import { CreateInviteDto } from './dtos/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invites)
    private invitesRepository: Repository<Invites>,
  ) {}

  async create(createInviteDto: CreateInviteDto): Promise<Invites> {
    const was = await this.invitesRepository.findOne({ where: { email: createInviteDto.email } });
    if (!was) {
      const invite = this.invitesRepository.create(createInviteDto);
      return await this.invitesRepository.save(invite);
    }
    return was;
  }

  async findAll(): Promise<Invites[]> {
    return await this.invitesRepository.find();
  }

  async findByTeamId(teamId: number): Promise<Invites[]> {
    return await this.invitesRepository.find({ where: { teamId } });
  }

  async findOne(id: number): Promise<Invites> {
    const invite = await this.invitesRepository.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException(`Invite #${id} not found`);
    }
    return invite;
  }

  async findOneByEmail(email: string): Promise<Invites> {
    const invite = await this.invitesRepository.findOne({ where: { email } });
    console.log('findOneByEmail, invite : ', invite);
    // if (!invite) {
    //   throw new NotFoundException(`Invite ${email} not found`);
    // }
    return invite;
  }

  async update(id: number, fronTeamId: number, toTeamId: number): Promise<Invites> {
    const invite = await this.invitesRepository.findOne({ where: { id, teamId: fronTeamId } });
    if (invite) {
      invite.teamId = toTeamId;
      return await this.invitesRepository.save(invite);
    }
    return invite;
  };

  async remove(id: number): Promise<void> {
    const result = await this.invitesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Invite #${id} not found`);
    }
  }
}