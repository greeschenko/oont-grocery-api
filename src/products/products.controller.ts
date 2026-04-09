import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Param,
    Body,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { Prisma, Product } from '@prisma/client';
import { ProductsService } from './products.service';
import { GetProductsDto } from './dto/get-products.dto';
import { PaginatedProductsDto } from './dto/paginated-products.dto';
import { ProductDto } from './dto/product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiResponse({
        status: 200,
        description: 'Products list returned successfully',
        type: PaginatedProductsDto, // <-- тут вказуємо наш DTO
    })
    async getAll(@Query() query: GetProductsDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    @ApiResponse({
        status: 200,
        description: 'Product returned successfully',
        type: ProductDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    async getOne(@Param('id') id: string): Promise<ProductDto | null> {
        return this.productsService.findOne(id);
    }

    @Post()
    @ApiOperation({
        summary: 'Create new product',
    })
    @ApiResponse({
        status: 201,
        description: 'Product created successfully',
    })
    async create(@Body() data: Prisma.ProductCreateInput): Promise<Product> {
        return this.productsService.create(data);
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Update existing product',
    })
    @ApiParam({
        name: 'id',
        example: 'product-uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Product updated successfully',
    })
    async update(
        @Param('id') id: string,
        @Body() data: Prisma.ProductUpdateInput,
    ): Promise<Product> {
        return this.productsService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Soft delete product',
    })
    @ApiParam({
        name: 'id',
        example: 'product-uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Product soft deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found or already deleted',
    })
    async remove(@Param('id') id: string): Promise<Product> {
        return this.productsService.softDelete(id);
    }

    @Patch(':id/restore')
    @ApiOperation({
        summary: 'Restore soft deleted product',
    })
    @ApiParam({
        name: 'id',
        example: 'product-uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Product restored successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found or not deleted',
    })
    async restore(@Param('id') id: string): Promise<Product> {
        return this.productsService.restore(id);
    }
}
