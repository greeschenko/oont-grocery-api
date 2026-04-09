import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductDto } from './dto/product.dto';
import { PaginatedProductsDto } from './dto/paginated-products.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    private _mapToDto(product: any): ProductDto {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: Number(product.price),
            stock: product.stock,
            categoryId: product.categoryId,
        };
    }

    // Soft delete a product
    async softDelete(id: string): Promise<ProductDto> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product || product.deletedAt) {
            throw new NotFoundException('Product not found or already deleted');
        }
        const updated = await this.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return this._mapToDto(updated);
    }

    // Restore soft-deleted product
    async restore(id: string): Promise<ProductDto> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product || !product.deletedAt) {
            throw new NotFoundException('Product not found or not deleted');
        }
        const restored = await this.prisma.product.update({
            where: { id },
            data: { deletedAt: null },
        });
        return this._mapToDto(restored);
    }

    // Get all products with pagination and filtering
    async findAll(dto: GetProductsDto): Promise<PaginatedProductsDto> {
        const { page = 1, limit = 20, search, categoryId } = dto;
        const skip = (page - 1) * limit;

        const where: any = { deletedAt: null };
        if (search) where.name = { contains: search, mode: 'insensitive' };
        if (categoryId) where.categoryId = categoryId;

        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            items: items.map(this._mapToDto),
        };
    }

    // Get single product
    async findOne(id: string): Promise<ProductDto> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');
        return this._mapToDto(product);
    }

    // Create a product
    async create(data: CreateProductDto): Promise<ProductDto> {
        const product = await this.prisma.product.create({ data });
        return this._mapToDto(product);
    }

    // Update a product
    async update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductDto> {
        const product = await this.prisma.product.update({ where: { id }, data });
        return this._mapToDto(product);
    }
}
