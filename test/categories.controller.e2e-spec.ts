import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { CategoriesModule } from '../src/categories/categories.module';
import { CategoriesService } from '../src/categories/categories.service';
import { ProductsService } from '../src/products/products.service';
import { Prisma } from '@prisma/client';

describe('CategoriesController (e2e)', () => {
    let app: INestApplication;
    let categoriesService: CategoriesService;
    let productsService: ProductsService;

    const mockCategory = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Fruits',
    };

    const mockProduct = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Apple',
        price: 100,
        categoryId: mockCategory.id,
    };

    const categoriesServiceMock = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const productsServiceMock = {
        findAll: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [CategoriesModule],
        })
            .overrideProvider(CategoriesService)
            .useValue(categoriesServiceMock)
            .overrideProvider(ProductsService)
            .useValue(productsServiceMock)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        categoriesService = moduleFixture.get<CategoriesService>(CategoriesService);
        productsService = moduleFixture.get<ProductsService>(ProductsService);
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ---------------- GET /categories ----------------
    it('/categories (GET) should return all categories', async () => {
        categoriesServiceMock.findAll.mockResolvedValue([mockCategory]);

        const res = await request(app.getHttpServer())
            .get('/categories')
            .expect(200);

        expect(res.body).toEqual([mockCategory]);
    });

    // ---------------- GET /categories/:id ----------------
    it('/categories/:id (GET) should return a category', async () => {
        categoriesServiceMock.findOne.mockResolvedValue(mockCategory);

        const res = await request(app.getHttpServer())
            .get(`/categories/${mockCategory.id}`)
            .expect(200);

        expect(res.body).toEqual(mockCategory);
    });

    it('/categories/:id (GET) should return 404 if category not found', async () => {
        categoriesServiceMock.findOne.mockRejectedValue(new NotFoundException('Category not found'));

        await request(app.getHttpServer())
            .get('/categories/non-existent-id')
            .expect(404);
    });

    // ---------------- POST /categories ----------------
    it('/categories (POST) should create a category', async () => {
        const createDto: Prisma.CategoryCreateInput = { name: 'Vegetables' };
        const createdCategory = { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Vegetables' };

        categoriesServiceMock.create.mockResolvedValue(createdCategory);

        const res = await request(app.getHttpServer())
            .post('/categories')
            .send(createDto)
            .expect(201);

        expect(res.body).toEqual(createdCategory);
    });

    // ---------------- PUT /categories/:id ----------------
    it('/categories/:id (PUT) should update a category', async () => {
        const updateDto: Prisma.CategoryUpdateInput = { name: 'Fruits & Vegetables' };
        const updatedCategory = { ...mockCategory, ...updateDto };

        categoriesServiceMock.update.mockResolvedValue(updatedCategory);

        const res = await request(app.getHttpServer())
            .put(`/categories/${mockCategory.id}`)
            .send(updateDto)
            .expect(200);

        expect(res.body).toEqual(updatedCategory);
    });

    it('/categories/:id (PUT) should return 404 if category not found', async () => {
        const updateDto: Prisma.CategoryUpdateInput = { name: 'Nothing' };
        categoriesServiceMock.update.mockRejectedValue(new NotFoundException());

        await request(app.getHttpServer())
            .put('/categories/non-existent-id')
            .send(updateDto)
            .expect(404);
    });

    // ---------------- DELETE /categories/:id ----------------
    it('/categories/:id (DELETE) should delete a category', async () => {
        categoriesServiceMock.remove.mockResolvedValue(mockCategory);

        const res = await request(app.getHttpServer())
            .delete(`/categories/${mockCategory.id}`)
            .expect(200);

        expect(res.body).toEqual(mockCategory);
    });

    it('/categories/:id (DELETE) should return 404 if category not found', async () => {
        categoriesServiceMock.remove.mockRejectedValue(new NotFoundException());

        await request(app.getHttpServer())
            .delete('/categories/non-existent-id')
            .expect(404);
    });

    // ---------------- GET /categories/:id/products ----------------
    it('/categories/:id/products (GET) should return products of a category', async () => {
        productsServiceMock.findAll.mockResolvedValue([mockProduct]);

        const res = await request(app.getHttpServer())
            .get(`/categories/${mockCategory.id}/products`)
            .query({ page: 1, limit: 20, search: '' })
            .expect(200);

        expect(res.body).toEqual([mockProduct]);
    });
});
