import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Fruits & Vegetables' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
