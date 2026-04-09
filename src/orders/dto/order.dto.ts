import { ApiProperty } from '@nestjs/swagger';
import { OrderItemDto } from './order-item.dto';
import { OrderStatus } from '@prisma/client';

export class OrderDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440111' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440122' })
  userId: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ example: 25.5 })
  totalAmount: number;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];
}
