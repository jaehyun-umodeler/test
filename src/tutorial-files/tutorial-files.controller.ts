import { Controller } from '@nestjs/common';
import { TutorialFilesService } from './tutorial-files.service';

@Controller('tutorial-files')
export class TutorialFilesController {
  constructor(private readonly tutorialFilesService: TutorialFilesService) {}
}
