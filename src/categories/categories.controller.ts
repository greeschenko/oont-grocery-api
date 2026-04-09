import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Prisma, Category } from '@prisma/client';
import { ProductsService } from '../products/products.service';
import { GetProductsDto } from '../products/dto/get-products.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories returned successfully',
  })
  async getAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id/products')
  @ApiOperation({
    summary: 'Get products by category id',
  })
  @ApiParam({
    name: 'id',
    example: 'category-uuid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'apple',
  })
  @ApiResponse({
    status: 200,
    description: 'Products returned successfully',
  })
  async getProductsByCategory(
    @Param('id') categoryId: string,
    @Query() query: GetProductsDto,
  ) {
    const dto = { ...query, categoryId };
    return this.productsService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by id',
  })
  @ApiParam({
    name: 'id',
    example: 'category-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Category returned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async getOne(@Param('id') id: string): Promise<Category | null> {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new category',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  async create(@Body() data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.categoriesService.create(data);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update category',
  })
  @ApiParam({
    name: 'id',
    example: 'category-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.CategoryUpdateInput,
  ): Promise<Category> {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete category',
  })
  @ApiParam({
    name: 'id',
    example: 'category-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async remove(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.remove(id);
  }
}
