import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'UUID of the product to add',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product to add (minimum 1)',
    example: 2,
    minimum: 1,
    required: true,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
