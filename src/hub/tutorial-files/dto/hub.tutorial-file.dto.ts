import { TutorialDifficulty } from 'src/utils/constants';

export class HubTutorialFileDto {
  id: string;
  title?: string;
  description?: string;
  technics?: string;
  difficulty?: TutorialDifficulty;
  fileName?: string;
  fileSize?: number;
  downloadUrl: string;
  documentUrl?: string;
  sequence?: number;
  isCompleted: boolean;
  createdAt?: Date;
}
