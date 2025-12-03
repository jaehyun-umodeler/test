import { Controller, UseGuards } from '@nestjs/common';
import { JwtHubAuthGuard } from 'src/auth/guards/jwt.guard';

@UseGuards(JwtHubAuthGuard)
export abstract class HubController {}
