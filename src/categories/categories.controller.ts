import { Controller, Get, Post, Put, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { ProductsService } from '../products/products.service';
import { GetProductsDto } from '../products/dto/get-products.dto';
import { CategoryDto, CategoryWithProductsDto } from './dto/category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories returned successfully', type: [CategoryWithProductsDto] })
  async getAll(): Promise<CategoryWithProductsDto[]> {
    const categories = await this.categoriesService.findAll();
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      products: cat.products.map(prod => ({
        id: prod.id,
        name: prod.name,
        stock: prod.stock,
      })),
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiParam({ name: 'id', example: 'category-uuid' })
  @ApiResponse({ status: 200, description: 'Category returned successfully', type: CategoryWithProductsDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getOne(@Param('id') id: string): Promise<CategoryWithProductsDto> {
    const category = await this.categoriesService.findOne(id);
    if (!category) throw new NotFoundException('Category not found');
    return {
      id: category.id,
      name: category.name,
      products: category.products.map(prod => ({
        id: prod.id,
        name: prod.name,
        stock: prod.stock,
      })),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryDto })
  async create(@Body() data: CreateCategoryDto): Promise<CategoryDto> {
    const category = await this.categoriesService.create(data);
    return { id: category.id, name: category.name };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', example: 'category-uuid' })
  @ApiResponse({ status: 200, description: 'Category updated successfully', type: CategoryDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(@Param('id') id: string, @Body() data: UpdateCategoryDto): Promise<CategoryDto> {
    const category = await this.categoriesService.update(id, data);
    return { id: category.id, name: category.name };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', example: 'category-uuid' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully', type: CategoryDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string): Promise<CategoryDto> {
    const category = await this.categoriesService.remove(id);
    return { id: category.id, name: category.name };
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products by category id' })
  @ApiParam({ name: 'id', example: 'category-uuid' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'apple' })
  @ApiResponse({ status: 200, description: 'Products returned successfully', type: [GetProductsDto] })
  async getProductsByCategory(@Param('id') categoryId: string, @Query() query: GetProductsDto) {
    const dto = { ...query, categoryId };
    return this.productsService.findAll(dto);
  }
}
