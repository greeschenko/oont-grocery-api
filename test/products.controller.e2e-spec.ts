import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ProductsModule } from '../src/products/products.module';
import { ProductsService } from '../src/products/products.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ProductsController (e2e)', () => {
    let app: INestApplication;
    let service: ProductsService;

    const mockProduct = {
        id: 'prod-1',
        name: 'Apple',
        description: 'Red apple',
        price: 100,
        stock: 50,
        categoryId: 'cat-1',
        deletedAt: null,
        category: { id: 'cat-1', name: 'Fruits' },
    };

    const prismaMock = {
        product: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ProductsModule],
        })
            .overrideProvider(PrismaService)
            .useValue(prismaMock)
            .compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
            }),
        );

        await app.init();

        service = moduleFixture.get<ProductsService>(ProductsService);
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ---------------- GET /products ----------------
    it('/products (GET) should return paginated products', async () => {
        prismaMock.product.findMany.mockResolvedValue([mockProduct]);
        prismaMock.product.count.mockResolvedValue(1);

        const res = await request(app.getHttpServer())
            .get('/products')
            .query({ page: 1, limit: 10 })
            .expect(200);

        expect(res.body).toEqual({
            page: 1,
            limit: 10,
            total: 1,
            items: [mockProduct],
        });
    });

    // ---------------- GET /products/:id ----------------
    it('/products/:id (GET) should return single product', async () => {
        prismaMock.product.findUnique.mockResolvedValue(mockProduct);

        const res = await request(app.getHttpServer())
            .get('/products/prod-1')
            .expect(200);

        expect(res.body).toEqual(mockProduct);
    });

    it('/products/:id (GET) should return null if product not found', async () => {
        prismaMock.product.findUnique.mockResolvedValue(null);

        const res = await request(app.getHttpServer())
            .get('/products/not-exist')
            .expect(200);

        expect(res.body).toEqual({});
        expect(res.text).toBe('');
    });

    // ---------------- POST /products ----------------
    it('/products (POST) should create product', async () => {
        prismaMock.product.create.mockResolvedValue(mockProduct);

        const res = await request(app.getHttpServer())
            .post('/products')
            .send({
                name: 'Apple',
                description: 'Red apple',
                price: 100,
                stock: 50,
                categoryId: 'cat-1',
            })
            .expect(201);

        expect(res.body).toEqual(mockProduct);
    });

    // ---------------- PUT /products/:id ----------------
    it('/products/:id (PUT) should update product', async () => {
        const updatedProduct = { ...mockProduct, name: 'Banana' };
        prismaMock.product.update.mockResolvedValue(updatedProduct);

        const res = await request(app.getHttpServer())
            .put('/products/prod-1')
            .send({ name: 'Banana' })
            .expect(200);

        expect(res.body).toEqual(updatedProduct);
    });

    // ---------------- DELETE /products/:id ----------------
    it('/products/:id (DELETE) should soft delete product', async () => {
        prismaMock.product.findUnique.mockResolvedValue(mockProduct);
        const deletedProduct = { ...mockProduct, deletedAt: new Date() };
        prismaMock.product.update.mockResolvedValue(deletedProduct);

        const res = await request(app.getHttpServer())
            .delete('/products/prod-1')
            .expect(200);

        expect(new Date(res.body.deletedAt).toString()).not.toBe('Invalid Date');
    });

    it('/products/:id (DELETE) should return 404 if product not found', async () => {
        prismaMock.product.findUnique.mockResolvedValue(null);

        await request(app.getHttpServer())
            .delete('/products/prod-2')
            .expect(404);
    });

    // ---------------- PATCH /products/:id/restore ----------------
    it('/products/:id/restore (PATCH) should restore soft-deleted product', async () => {
        prismaMock.product.findUnique.mockResolvedValue({ ...mockProduct, deletedAt: new Date() });
        prismaMock.product.update.mockResolvedValue(mockProduct);

        const res = await request(app.getHttpServer())
            .patch('/products/prod-1/restore')
            .expect(200);

        expect(res.body.deletedAt).toBeNull();
    });

    it('/products/:id/restore (PATCH) should return 404 if product is not deleted', async () => {
        prismaMock.product.findUnique.mockResolvedValue(mockProduct);

        await request(app.getHttpServer())
            .patch('/products/prod-1/restore')
            .expect(404);
    });
});
