import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Fruits' })
  name: string;
}

export class CategoryWithProductsDto extends CategoryDto {
  @ApiProperty({
    type: () => [CategoryProductDto],
    isArray: true,
  })
  products: CategoryProductDto[];
}

export class CategoryProductDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440222' })
  id: string;

  @ApiProperty({ example: 'Apple' })
  name: string;

  @ApiProperty({ example: 10 })
  stock: number;
}
