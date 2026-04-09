import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  productId: string;

  @ApiProperty({ example: 'Milk 1L' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;
}

export class CartDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ type: [CartItemDto] })
  items: CartItemDto[];
}
