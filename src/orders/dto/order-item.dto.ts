import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440044' })
  productId: string;

  @ApiProperty({ example: 'Apple' })
  productNameSnapshot: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 3.5 })
  priceSnapshot: number;
}
