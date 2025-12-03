import { TutorialDifficulty } from 'src/utils/constants';

export class AdminTutorialFileDto {
  id: string;
  title: string;
  description: string;
  technics: string;
  difficulty: TutorialDifficulty;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  documentUrl: string;
  isActive: boolean;
  isDefault: boolean;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
}
