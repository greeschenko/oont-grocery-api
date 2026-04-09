import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655441111' })
    id: string;

    @ApiProperty({ example: 'Apple' })
    name: string;

    @ApiProperty({ example: 'Red apple', required: false })
    description?: string | null;

    @ApiProperty({ example: 120 }) //price in p
    price: number;

    @ApiProperty({ example: 100 })
    stock: number;

    @ApiProperty({ example: 'e521a84f-2cd6-44e6-9d92-626e5ddfe03e' })
    categoryId: string;
}
