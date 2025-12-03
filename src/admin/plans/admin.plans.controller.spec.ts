import { Test, TestingModule } from '@nestjs/testing';
import { AdminPlansController } from './admin.plans.controller';
import { PlansService } from 'src/plans/plans.service';

describe('AdminPlansController', () => {
  let controller: AdminPlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPlansController],
      providers: [PlansService],
    }).compile();

    controller = module.get<AdminPlansController>(AdminPlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
