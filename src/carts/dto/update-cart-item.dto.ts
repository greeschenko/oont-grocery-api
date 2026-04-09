import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity for the cart item (minimum 1)',
    example: 3,
    minimum: 1,
    required: true,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
