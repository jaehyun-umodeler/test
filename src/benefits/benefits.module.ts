import { forwardRef, Module } from '@nestjs/common';
import { BenefitsService } from './benefits.service';
import { BenefitsController } from './benefits.controller';
import { Benefit } from './entities/benefit.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceFilesModule } from 'src/resource-files/resource-files.module';
import { UserBenefit } from './entities/user-benefit.entity';
import { LicensesModule } from 'src/licenses/licenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Benefit, UserBenefit]),
    forwardRef(() => ResourceFilesModule),
    forwardRef(() => LicensesModule),
  ],
  controllers: [BenefitsController],
  providers: [BenefitsService],
  exports: [BenefitsService],
})
export class BenefitsModule {}
