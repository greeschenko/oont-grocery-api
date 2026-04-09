import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductDto } from './dto/product.dto';
import { PaginatedProductsDto } from './dto/paginated-products.dto';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiResponse({ status: 200, type: PaginatedProductsDto })
    async getAll(@Query() query: GetProductsDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    @ApiResponse({ status: 200, type: ProductDto })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async getOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create new product' })
    @ApiResponse({ status: 201, type: ProductDto })
    async create(@Body() data: CreateProductDto) {
        return this.productsService.create(data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update product' })
    @ApiResponse({ status: 200, type: ProductDto })
    async update(@Param('id') id: string, @Body() data: CreateProductDto) {
        return this.productsService.update(id, data);
    }

    @Delete(':id')
    @ApiResponse({ status: 200, type: ProductDto })
    async remove(@Param('id') id: string) {
        return this.productsService.softDelete(id);
    }

    @Patch(':id/restore')
    @ApiResponse({ status: 200, type: ProductDto })
    async restore(@Param('id') id: string) {
        return this.productsService.restore(id);
    }
}
