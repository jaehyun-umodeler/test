import { Test, TestingModule } from '@nestjs/testing';
import { AdminTutorialFilesController } from './admin.tutorial-files.controller';

describe('AdminTutorialFilesController', () => {
  let controller: AdminTutorialFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTutorialFilesController],
    }).compile();

    controller = module.get<AdminTutorialFilesController>(
      AdminTutorialFilesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
