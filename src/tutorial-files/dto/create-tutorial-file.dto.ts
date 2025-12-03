import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTutorialFileDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  technics: string;

  @IsString()
  @IsNotEmpty()
  documentUrl: string;

  @IsNumber()
  @IsNotEmpty()
  difficulty: number;

  @IsString()
  @IsNotEmpty()
  isDefault: string;

  @IsNumber()
  @IsNotEmpty()
  sequence: number;
}
