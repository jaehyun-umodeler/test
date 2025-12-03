import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TutorialFile } from './entities/tutorial-file.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TutorialFilesService {
  constructor(
    @InjectRepository(TutorialFile)
    private readonly tutorialFileRepository: Repository<TutorialFile>,
  ) {}
}
