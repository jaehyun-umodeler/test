export class CreateInviteDto {
    email: string;
    category: number; // 0: Admin 라이센스 발급, 1: 팀초대 발급
    userId?: number;
    teamId?: number;
  }