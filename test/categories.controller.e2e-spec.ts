import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { CategoriesModule } from '../src/categories/categories.module';
import { CategoriesService } from '../src/categories/categories.service';
import { ProductsService } from '../src/products/products.service';

describe('CategoriesController (e2e)', () => {
    let app: INestApplication;
    let categoriesService: CategoriesService;
    let productsService: ProductsService;

    const mockCategory = {
        id: 'cat-1',
        name: 'Fruits',
        products: [],
    };

    const mockProduct = { id: 'prod-1', name: 'Apple', price: 100, categoryId: mockCategory.id };

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
        const module: TestingModule = await Test.createTestingModule({
            imports: [CategoriesModule],
        })
            .overrideProvider(CategoriesService)
            .useValue(categoriesServiceMock)
            .overrideProvider(ProductsService)
            .useValue(productsServiceMock)
            .compile();

        app = module.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        categoriesService = module.get<CategoriesService>(CategoriesService);
        productsService = module.get<ProductsService>(ProductsService);
    });

    afterAll(async () => await app.close());
    afterEach(() => jest.clearAllMocks());

    // ---------------- GET /categories ----------------
    it('GET /categories - should return all categories', async () => {
        categoriesServiceMock.findAll.mockResolvedValue([mockCategory]);

        const res = await request(app.getHttpServer()).get('/categories').expect(200);
        expect(res.body).toEqual([mockCategory]);
    });

    // ---------------- GET /categories/:id ----------------
    it('GET /categories/:id - should return a category', async () => {
        categoriesServiceMock.findOne.mockResolvedValue(mockCategory);

        const res = await request(app.getHttpServer()).get(`/categories/${mockCategory.id}`).expect(200);
        expect(res.body).toEqual(mockCategory);
    });

    it('GET /categories/:id - should return 404 if not found', async () => {
        categoriesServiceMock.findOne.mockResolvedValue(null);
        await request(app.getHttpServer()).get('/categories/non-existent').expect(404);
    });

    // ---------------- POST /categories ----------------
    it('POST /categories - should create a category', async () => {
        const createDto = { name: 'Vegetables' };
        const createdCategory = { id: 'cat-2', ...createDto };
        categoriesServiceMock.create.mockResolvedValue(createdCategory);

        const res = await request(app.getHttpServer()).post('/categories').send(createDto).expect(201);
        expect(res.body).toEqual(createdCategory);
    });

    // ---------------- PUT /categories/:id ----------------
    it('PUT /categories/:id - should update a category', async () => {
        const updateDto = { name: 'Fruits & Veg' };
        const updatedCategory = { id: 'cat-1', name: 'Fruits & Veg' };
        categoriesServiceMock.update.mockResolvedValue(updatedCategory);

        const res = await request(app.getHttpServer())
            .put(`/categories/${mockCategory.id}`)
            .send(updateDto)
            .expect(200);

        expect(res.body).toEqual(updatedCategory);
    });

    it('PUT /categories/:id - should return 404 if not found', async () => {
        categoriesServiceMock.update.mockRejectedValue(new NotFoundException());
        await request(app.getHttpServer()).put('/categories/non-existent').send({ name: 'Test' }).expect(404);
    });

    // ---------------- DELETE /categories/:id ----------------
    it('DELETE /categories/:id - should delete a category', async () => {
        categoriesServiceMock.remove.mockResolvedValue(mockCategory);

        const res = await request(app.getHttpServer())
            .delete(`/categories/${mockCategory.id}`)
            .expect(200);

        expect(res.body).toEqual({
            id: mockCategory.id,
            name: mockCategory.name,
        });
    });

    // ---------------- GET /categories/:id/products ----------------
    it('GET /categories/:id/products - should return products of a category', async () => {
        productsServiceMock.findAll.mockResolvedValue([mockProduct]);

        const res = await request(app.getHttpServer())
            .get(`/categories/${mockCategory.id}/products`)
            .query({ page: 1, limit: 20, search: '' })
            .expect(200);

        expect(res.body).toEqual([mockProduct]);
    });
});
