// src/team/team.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from 'src/team/entities/team.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { decryptEmail } from 'src/utils/util';
import { InvitesService } from 'src/invites/invites.service';
import { invalidTeamNames } from 'src/utils/constants';
import { AppException } from 'src/utils/app-exception';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly inviteService: InvitesService,
  ) {}

  // 공통: team 객체의 members, invitedMembers를 사용자 DTO 배열로 매핑하는 함수
  private async mapTeamUsers(team: Team): Promise<Team> {
    const users = [];
    let insertUsers = null;
    const invitesNonUsers = await this.inviteService.findByTeamId(team.id);
    if (invitesNonUsers) {
      insertUsers = [];
      for (const invite of invitesNonUsers) {
        const user = {
          email: decryptEmail(invite.email),
          teamAt: invite.createdAt,
        };
        insertUsers.push(user);
      }
    }

    (team as any).users = users;
    // (team as any).invitedUsers = invitedUsers;
    (team as any).invitesNonUsers = insertUsers;

    return team;
  }

  // 팀 생성 (조직에 속함)
  async createTeam(
    organization: Organization,
    teamName: string,
  ): Promise<Team> {
    const newTeam = this.teamRepository.create({
      name: teamName,
      organization,
    });
    return this.teamRepository.save(newTeam);
  }

  // 특정 팀 조회 (organization, members, invitedMembers 관계 포함)
  async getTeamById(teamId: number): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['organization', 'members', 'invitedMembers'],
    });
    if (!team) throw new NotFoundException('Team not found');

    // 공통 매핑 로직 사용
    return this.mapTeamUsers(team);
  }

  // 팀 정보 수정 (이름 변경 등)
  async updateTeam(teamId: number, newName: string): Promise<Team> {
    const team = await this.getTeamById(teamId);
    team.name = newName;
    return this.teamRepository.save(team);
  }

  // // 팀 삭제
  // async deleteTeam(teamId: number): Promise<void> {
  //   const team = await this.getTeamById(teamId);
  //   await this.teamRepository.remove(team);
  // }

  // // 팀에 멤버 추가 (AccountExt를 통해 관리)
  // async addMember(teamId: number, userId: number): Promise<Team> {
  //   const team = await this.getTeamById(teamId);
  //   const accountExt = await this.accountExtRepository.findOne({
  //     where: { accountDataId: userId },
  //   });
  //   if (!accountExt)
  //     throw new NotFoundException('Account extension not found for user');

  //   // 중복 추가 방지: 이미 해당 팀에 속해 있다면 변경 없음
  //   if (accountExt.team && accountExt.team.id === team.id) {
  //     return team;
  //   }

  //   accountExt.organization = team.organization;
  //   accountExt.team = team;
  //   accountExt.teamInvited = null;
  //   accountExt.teamAt = new Date();

  //   await this.accountExtRepository.save(accountExt);
  //   return this.getTeamById(teamId);
  // }

  // // 팀에서 멤버 제거
  // async removeMember(
  //   teamId: number,
  //   email: string,
  //   from?: number,
  // ): Promise<{ msg: string; teams: Team[] }> {
  //   const team = await this.getTeamById(teamId);
  //   const user = await this.userService.findByEmail(email);
  //   if (!user) {
  //     const invited = await this.inviteService.findOneByEmail(
  //       encryptEmail(email),
  //     );
  //     if (invited) {
  //       await this.inviteService.remove(invited.id);
  //     }

  //     return { msg: 'success', teams: await this.getTeams(team.organization) };
  //   } else {
  //     // 사용자에게 할당된 모든 라이선스 조회
  //     const licenses = await this.licenseService.getLicensesByUserWithoutGroup(
  //       user.id,
  //     );
  //     await Promise.all(
  //       licenses.map(async (license) => {
  //         await this.licenseService.removeLicense(license.id, from, user.id);
  //       }),
  //     );

  //     const accountExt = await this.accountExtRepository.findOne({
  //       where: { accountDataId: user.id },
  //     });
  //     if (!accountExt)
  //       throw new NotFoundException('Account extension not found for user');

  //     accountExt.team = null;
  //     accountExt.teamInvited = null;
  //     accountExt.teamAt = null;

  //     await this.accountExtRepository.save(accountExt);

  //     return { msg: 'success', teams: await this.getTeams(team.organization) };
  //   }
  // }

  // // 멤버를 다른 팀으로 이동 (fromTeam에서 제거하고 toTeam에 추가)
  // async moveMember(
  //   fromTeamId: number,
  //   toTeamId: number,
  //   email: string,
  // ): Promise<{ msg: string; teams?: Team[] }> {
  //   console.log(
  //     'fromTeamId: ',
  //     fromTeamId,
  //     'toTeamId: ',
  //     toTeamId,
  //     'email: ',
  //     email,
  //   );
  //   const fromTeam = await this.getTeamById(fromTeamId);
  //   const toTeam = await this.getTeamById(toTeamId);

  //   const user = await this.userService.findByEmail(email);
  //   if (user) {
  //     const accountExt = await this.accountExtRepository.findOne({
  //       where: { accountDataId: user.id },
  //       relations: ['teamInvited', 'team'],
  //     });

  //     console.log('fromTeam: ', fromTeam);
  //     console.log('toTeam: ', toTeam);
  //     console.log('user: ', user);
  //     console.log('accountExt: ', accountExt);

  //     if (!accountExt)
  //       throw new NotFoundException('Account extension not found for user');
  //     console.log(
  //       'accountExt.team.id : ',
  //       accountExt.team?.id,
  //       ', accountExt.teamInvited : ',
  //       accountExt.teamInvited?.id,
  //       ', fromTeam.id: ',
  //       fromTeam.id,
  //     );
  //     if (accountExt.team && accountExt.team.id === fromTeam.id) {
  //       accountExt.team = toTeam;
  //     } else if (
  //       accountExt.teamInvited &&
  //       accountExt.teamInvited.id === fromTeam.id
  //     ) {
  //       accountExt.teamInvited = toTeam;
  //     } else {
  //       return { msg: 'err1' };
  //     }
  //     accountExt.teamAt = new Date();

  //     await this.accountExtRepository.save(accountExt);

  //     const teams = await this.getTeams(fromTeam.organization);
  //     return { msg: 'success', teams: teams };
  //   } else {
  //     const invited = await this.inviteService.findOneByEmail(
  //       encryptEmail(email),
  //     );
  //     if (invited) {
  //       await this.inviteService.update(invited.id, fromTeam.id, toTeam.id);
  //     }

  //     return {
  //       msg: 'success',
  //       teams: await this.getTeams(fromTeam.organization),
  //     };
  //   }
  // }

  async getTeams(organization: Organization): Promise<Team[]> {
    // console.log("getTeams, managers: ", managers);

    // const managerIds = managers.map(manager => manager.id);

    // const organization = await this.organizationRepository
    //   .createQueryBuilder('organization')
    //   .leftJoin('organization.organizationManager', 'user')
    //   .leftJoinAndSelect('organization.teams', 'team')
    //   .where('user.id IN (:...managerIds)', { managerIds })
    //   .getOne();

    if (!organization) {
      return [];
    }
    const teams =
      organization.teams ||
      (await this.teamRepository.find({ where: { organization } }));

    const teamIds = teams.map((t) => t.id);

    const result: Team[] = [];
    for (const tId of teamIds) {
      const teamDetail = await this.getTeamById(tId);
      result.push(teamDetail);
    }

    return result;
  }

  async validateTeamName(teamName: string): Promise<void> {
    const existTeam = await this.teamRepository.exists({
      where: { name: teamName },
    });
    if (existTeam) {
      throw AppException.teamAlreadyExists({ teamName });
    }
    if (invalidTeamNames.includes(teamName)) {
      throw AppException.invalidTeamName();
    }
  }
}
