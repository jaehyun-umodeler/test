import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import * as sanitizeHtml from 'sanitize-html';

import { Qna } from 'src/etc/entities/qna.entity';

export class InquiryEmailDto {
  @Transform(({ value }) => sanitizeHtml(value))
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  email: string;

  @Transform(({ value }) => sanitizeHtml(value))
  @IsString()
  @IsOptional()
  affiliation?: string;

  @Transform(({ value }) => sanitizeHtml(value))
  @IsString()
  @IsOptional()
  position?: string;

  @Transform(({ value }) => sanitizeHtml(value))
  @IsString()
  @IsOptional()
  message?: string;

  @Transform(({ value }) => JSON.parse(value))
  @IsArray()
  // @ValidateNested({ each: true })
  @Type(() => Qna)
  qna: Qna[];
}
