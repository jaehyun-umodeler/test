import { Test, TestingModule } from '@nestjs/testing';
import { AdminBenefitsController } from './admin.benefits.controller';
import { BenefitsService } from 'src/benefits/benefits.service';

describe('AdminBenefitsController', () => {
  let controller: AdminBenefitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBenefitsController],
      providers: [BenefitsService],
    }).compile();

    controller = module.get<AdminBenefitsController>(AdminBenefitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
