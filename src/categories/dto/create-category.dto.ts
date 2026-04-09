import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fruits' })
  @IsString()
  @MinLength(1)
  name: string;
}
