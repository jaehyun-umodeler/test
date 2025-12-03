import { Test, TestingModule } from '@nestjs/testing';
import { AdminCampaignsController } from './admin.campaigns.controller';
import { CampaignsService } from 'src/campaigns/campaigns.service';

describe('AdminCampaignsController', () => {
  let controller: AdminCampaignsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCampaignsController],
      providers: [CampaignsService],
    }).compile();

    controller = module.get<AdminCampaignsController>(AdminCampaignsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
