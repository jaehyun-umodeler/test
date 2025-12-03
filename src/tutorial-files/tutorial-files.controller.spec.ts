import { Test, TestingModule } from '@nestjs/testing';
import { TutorialFilesController } from './tutorial-files.controller';
import { TutorialFilesService } from './tutorial-files.service';

describe('TutorialFilesController', () => {
  let controller: TutorialFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TutorialFilesController],
      providers: [TutorialFilesService],
    }).compile();

    controller = module.get<TutorialFilesController>(TutorialFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
