import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateProductDto {
    @ApiProperty({ example: 'Apple', description: 'Product name' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Red apple', description: 'Product description' })
    @IsString()
    description: string;

    @ApiProperty({ example: 120, description: 'Product price' })
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    price: number;

    @ApiProperty({ example: 100, description: 'Stock quantity' })
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    stock: number;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440222', description: 'Category ID' })
    @IsUUID()
    categoryId: string;
}
