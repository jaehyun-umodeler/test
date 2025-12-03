import { Controller } from '@nestjs/common';
import { ResourceFilesService } from './resource-files.service';

@Controller('resource-files')
export class ResourceFilesController {
  constructor(private readonly resourceFilesService: ResourceFilesService) {}
}
