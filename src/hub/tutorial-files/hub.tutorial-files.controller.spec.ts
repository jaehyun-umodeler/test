import { Test, TestingModule } from '@nestjs/testing';
import { HubTutorialFilesController } from './hub.tutorial-files.controller';

describe('HubTutorialFilesController', () => {
  let controller: HubTutorialFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HubTutorialFilesController],
    }).compile();

    controller = module.get<HubTutorialFilesController>(
      HubTutorialFilesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
