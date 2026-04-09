import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../src/products/products.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ProductsService', () => {
    let service: ProductsService;
    let prismaService: {
        product: {
            findUnique: jest.Mock;
            findMany: jest.Mock;
            count: jest.Mock;
            create: jest.Mock;
            update: jest.Mock;
            delete: jest.Mock;
        };
    };

    const mockProduct = {
        id: 'prod-1',
        name: 'Apple',
        description: 'Fresh apple',
        price: 100,
        stock: 50,
        categoryId: 'cat-1',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        prismaService = {
            product: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                {
                    provide: PrismaService,
                    useValue: prismaService,
                },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated products', async () => {
            prismaService.product.findMany.mockResolvedValue([mockProduct]);
            prismaService.product.count.mockResolvedValue(1);

            const result = await service.findAll({
                page: 1,
                limit: 20,
            });

            expect(result).toEqual({
                page: 1,
                limit: 20,
                total: 1,
                items: [mockProduct],
            });

            expect(prismaService.product.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                },
                skip: 0,
                take: 20,
                include: { category: true },
                orderBy: { name: 'asc' },
            });

            expect(prismaService.product.count).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                },
            });
        });

        it('should apply search filter', async () => {
            prismaService.product.findMany.mockResolvedValue([mockProduct]);
            prismaService.product.count.mockResolvedValue(1);

            await service.findAll({
                search: 'apple',
            });

            expect(prismaService.product.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    name: {
                        contains: 'apple',
                        mode: 'insensitive',
                    },
                },
                skip: 0,
                take: 20,
                include: { category: true },
                orderBy: { name: 'asc' },
            });
        });

        it('should apply category filter', async () => {
            prismaService.product.findMany.mockResolvedValue([mockProduct]);
            prismaService.product.count.mockResolvedValue(1);

            await service.findAll({
                categoryId: 'cat-1',
            });

            expect(prismaService.product.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    categoryId: 'cat-1',
                },
                skip: 0,
                take: 20,
                include: { category: true },
                orderBy: { name: 'asc' },
            });
        });
    });

    describe('findOne', () => {
        it('should return product by id', async () => {
            prismaService.product.findUnique.mockResolvedValue(mockProduct);

            const result = await service.findOne('prod-1');

            expect(result).toEqual(mockProduct);
            expect(prismaService.product.findUnique).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
                include: { category: true },
            });
        });

        it('should return null if product does not exist', async () => {
            prismaService.product.findUnique.mockResolvedValue(null);

            const result = await service.findOne('unknown-id');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a product', async () => {
            const createData = {
                name: 'Apple',
                description: 'Fresh apple',
                price: 100,
                stock: 50,
            };

            prismaService.product.create.mockResolvedValue(mockProduct);

            const result = await service.create(createData as any);

            expect(result).toEqual(mockProduct);
            expect(prismaService.product.create).toHaveBeenCalledWith({
                data: createData,
            });
        });
    });

    describe('update', () => {
        it('should update a product', async () => {
            const updatedProduct = {
                ...mockProduct,
                name: 'Updated Apple',
            };

            prismaService.product.update.mockResolvedValue(updatedProduct);

            const result = await service.update('prod-1', {
                name: 'Updated Apple',
            });

            expect(result).toEqual(updatedProduct);
            expect(prismaService.product.update).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
                data: {
                    name: 'Updated Apple',
                },
            });
        });
    });

    describe('remove', () => {
        it('should delete a product', async () => {
            prismaService.product.delete.mockResolvedValue(mockProduct);

            const result = await service.remove('prod-1');

            expect(result).toEqual(mockProduct);
            expect(prismaService.product.delete).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
            });
        });
    });

    describe('softDelete', () => {
        it('should soft delete existing product', async () => {
            prismaService.product.findUnique.mockResolvedValue(mockProduct);

            const deletedProduct = {
                ...mockProduct,
                deletedAt: new Date(),
            };

            prismaService.product.update.mockResolvedValue(deletedProduct);

            const result = await service.softDelete('prod-1');

            expect(result).toEqual(deletedProduct);
            expect(prismaService.product.findUnique).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
            });

            expect(prismaService.product.update).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
                data: {
                    deletedAt: expect.any(Date),
                },
            });
        });

        it('should throw NotFoundException if product does not exist', async () => {
            prismaService.product.findUnique.mockResolvedValue(null);

            await expect(service.softDelete('unknown-id')).rejects.toThrow(
                NotFoundException,
            );

            await expect(service.softDelete('unknown-id')).rejects.toThrow(
                'Product not found or already deleted',
            );
        });

        it('should throw NotFoundException if product already deleted', async () => {
            prismaService.product.findUnique.mockResolvedValue({
                ...mockProduct,
                deletedAt: new Date(),
            });

            await expect(service.softDelete('prod-1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('restore', () => {
        it('should restore deleted product', async () => {
            prismaService.product.findUnique.mockResolvedValue({
                ...mockProduct,
                deletedAt: new Date(),
            });

            prismaService.product.update.mockResolvedValue({
                ...mockProduct,
                deletedAt: null,
            });

            const result = await service.restore('prod-1');

            expect(result.deletedAt).toBeNull();

            expect(prismaService.product.update).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
                data: {
                    deletedAt: null,
                },
            });
        });

        it('should throw NotFoundException if product does not exist', async () => {
            prismaService.product.findUnique.mockResolvedValue(null);

            await expect(service.restore('unknown-id')).rejects.toThrow(
                NotFoundException,
            );

            await expect(service.restore('unknown-id')).rejects.toThrow(
                'Product not found or not deleted',
            );
        });

        it('should throw NotFoundException if product is not deleted', async () => {
            prismaService.product.findUnique.mockResolvedValue(mockProduct);

            await expect(service.restore('prod-1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
