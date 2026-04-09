import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Product } from '@prisma/client';
import { GetProductsDto } from './dto/get-products.dto';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    // Soft delete a product
    async softDelete(id: string): Promise<Product> {
        // Check if product exists and not already deleted
        const product = await this.prisma.product.findUnique({
            where: { id },
        });
        if (!product || product.deletedAt) {
            throw new NotFoundException('Product not found or already deleted');
        }

        // Set deletedAt timestamp
        return this.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // Get all products
    async findAll(dto: GetProductsDto) {
        const { page = 1, limit = 20, search, categoryId } = dto;

        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null, // exclude soft deleted products
        };

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: { category: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            items,
        };
    }

    // Get single product by ID
    async findOne(id: string): Promise<Product | null> {
        return this.prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
    }

    // Create a new product
    async create(data: Prisma.ProductCreateInput): Promise<Product> {
        return this.prisma.product.create({ data });
    }

    // Update an existing product
    async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    // Delete a product
    async remove(id: string): Promise<Product> {
        return this.prisma.product.delete({
            where: { id },
        });
    }

    // Restore a soft-deleted product
    async restore(id: string): Promise<Product> {
        // Check if product exists and is actually deleted
        const product = await this.prisma.product.findUnique({
            where: { id },
        });
        if (!product || !product.deletedAt) {
            throw new NotFoundException('Product not found or not deleted');
        }

        // Clear deletedAt timestamp
        return this.prisma.product.update({
            where: { id },
            data: { deletedAt: null },
        });
    }
}
