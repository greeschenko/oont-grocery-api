import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../src/categories/categories.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Prisma, Category } from '@prisma/client';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: any;

  const mockCategory: Category & { products?: any[] } = {
    id: 'cat-1',
    name: 'Fruits',
    createdAt: new Date(),
    updatedAt: new Date(),
    products: [{ id: 'prod-1', name: 'Apple', stock: 10 }],
  };

  beforeEach(async () => {
    prismaService = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories with products (id, name, stock)', async () => {
      prismaService.category.findMany.mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        include: { products: { select: { id: true, name: true, stock: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id with products', async () => {
      prismaService.category.findUnique.mockResolvedValue(mockCategory);
      const result = await service.findOne('cat-1');
      expect(result).toEqual(mockCategory);
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: { products: { select: { id: true, name: true, stock: true } } },
      });
    });

    it('should return null if category not found', async () => {
      prismaService.category.findUnique.mockResolvedValue(null);
      const result = await service.findOne('unknown-id');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createData: Prisma.CategoryCreateInput = { name: 'Vegetables' };
      prismaService.category.create.mockResolvedValue(mockCategory);
      const result = await service.create(createData);
      expect(result).toEqual(mockCategory);
      expect(prismaService.category.create).toHaveBeenCalledWith({ data: createData });
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      const updateData: Prisma.CategoryUpdateInput = { name: 'Updated Fruits' };
      const updatedCategory = { ...mockCategory, name: 'Updated Fruits' };
      prismaService.category.update.mockResolvedValue(updatedCategory);
      const result = await service.update('cat-1', updateData);
      expect(result).toEqual(updatedCategory);
      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: updateData,
      });
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      prismaService.category.delete.mockResolvedValue(mockCategory);
      const result = await service.remove('cat-1');
      expect(result).toEqual(mockCategory);
      expect(prismaService.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });
  });
});
