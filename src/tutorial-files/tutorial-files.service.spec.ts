import { Test, TestingModule } from '@nestjs/testing';
import { TutorialFilesService } from './tutorial-files.service';

describe('TutorialFilesService', () => {
  let service: TutorialFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TutorialFilesService],
    }).compile();

    service = module.get<TutorialFilesService>(TutorialFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
