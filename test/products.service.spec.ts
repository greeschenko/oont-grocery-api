import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../src/products/products.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  const baseProduct = {
    id: 'prod-1',
    name: 'Apple',
    price: 100,
    description: 'Fresh apple',
    stock: 50,
    categoryId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockMapToDto = (product: any) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    categoryId: product.categoryId,
  });

  beforeEach(async () => {
    prisma = {
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
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns paginated products with optional filters', async () => {
      prisma.product.findMany.mockResolvedValue([baseProduct]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, search: 'apple', categoryId: 'cat-1' });

      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        items: [mockMapToDto(baseProduct)],
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null, name: { contains: 'apple', mode: 'insensitive' }, categoryId: 'cat-1' },
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
      });

      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { deletedAt: null, name: { contains: 'apple', mode: 'insensitive' }, categoryId: 'cat-1' },
      });
    });
  });

  describe('findOne', () => {
    it('returns product if exists', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      const result = await service.findOne('prod-1');
      expect(result).toEqual(mockMapToDto(baseProduct));
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
    });

    it('throws NotFoundException if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a new product', async () => {
      prisma.product.create.mockResolvedValue(baseProduct);
      const createData = { ...baseProduct, id: undefined };
      const result = await service.create(createData);
      expect(result).toEqual(mockMapToDto(baseProduct));
      expect(prisma.product.create).toHaveBeenCalledWith({ data: createData });
    });
  });

  describe('update', () => {
    it('updates an existing product', async () => {
      const updated = { ...baseProduct, name: 'Updated Apple' };
      prisma.product.update.mockResolvedValue(updated);
      const result = await service.update('prod-1', { name: 'Updated Apple' });
      expect(result).toEqual(mockMapToDto(updated));
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'prod-1' }, data: { name: 'Updated Apple' } });
    });
  });

  describe('softDelete', () => {
    it('soft deletes a product', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      const deleted = { ...baseProduct, deletedAt: new Date() };
      prisma.product.update.mockResolvedValue(deleted);

      const result = await service.softDelete('prod-1');
      expect(result).toEqual(mockMapToDto(deleted));
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'prod-1' }, data: { deletedAt: expect.any(Date) } });
    });

    it('throws if product not found or already deleted', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.softDelete('unknown')).rejects.toThrow('Product not found or already deleted');

      prisma.product.findUnique.mockResolvedValue({ ...baseProduct, deletedAt: new Date() });
      await expect(service.softDelete('prod-1')).rejects.toThrow('Product not found or already deleted');
    });
  });

  describe('restore', () => {
    it('restores a deleted product', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...baseProduct, deletedAt: new Date() });
      prisma.product.update.mockResolvedValue(baseProduct);

      const result = await service.restore('prod-1');
      expect(result).toEqual(mockMapToDto(baseProduct));
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'prod-1' }, data: { deletedAt: null } });
    });

    it('throws if product not found or not deleted', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.restore('unknown')).rejects.toThrow('Product not found or not deleted');

      prisma.product.findUnique.mockResolvedValue(baseProduct);
      await expect(service.restore('prod-1')).rejects.toThrow('Product not found or not deleted');
    });
  });
});
