import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ProductsModule } from '../src/products/products.module';
import { ProductsService } from '../src/products/products.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ProductsController (e2e)', () => {
    let app: INestApplication;
    let service: ProductsService;

    const CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440010';
    const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440020';

    const mockProduct = {
        id: 'prod-1',
        name: 'Apple',
        description: 'Red apple',
        price: 100,
        stock: 50,
        categoryId: CATEGORY_ID,
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

    it('/products/:id (GET) should return 404 if product not found', async () => {
        prismaMock.product.findUnique.mockResolvedValue(null);

        await request(app.getHttpServer())
            .get('/products/not-exist')
            .expect(404);
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
                categoryId: CATEGORY_ID,
            })
            .expect(201);

        expect(res.body).toEqual(mockProduct);
    });

    // ---------------- PUT /products/:id ----------------
    it('/products/:id (PUT) should update product', async () => {
        const updatedProduct = {
            ...mockProduct,
            name: 'Banana',
        };

        prismaMock.product.update.mockResolvedValue(updatedProduct);

        const res = await request(app.getHttpServer())
            .put(`/products/${PRODUCT_ID}`)
            .send({
                name: 'Banana',
                description: mockProduct.description,
                price: mockProduct.price,
                stock: mockProduct.stock,
                categoryId: mockProduct.categoryId,
            })
            .expect(200);

        expect(res.body).toEqual(updatedProduct);
    });

    // ---------------- DELETE /products/:id ----------------
    it('/products/:id (DELETE) should soft delete product', async () => {
        prismaMock.product.findUnique.mockResolvedValue(mockProduct);

        const deletedProduct = {
            ...mockProduct,
            deletedAt: new Date(),
        };

        prismaMock.product.update.mockResolvedValue(deletedProduct);

        const res = await request(app.getHttpServer())
            .delete(`/products/${PRODUCT_ID}`)
            .expect(200);

        expect(res.body).toEqual({
            id: mockProduct.id,
            name: mockProduct.name,
            description: mockProduct.description,
            price: mockProduct.price,
            stock: mockProduct.stock,
            categoryId: mockProduct.categoryId,
        });
    });

    it('/products/:id (DELETE) should return 404 if product not found', async () => {
        prismaMock.product.findUnique.mockResolvedValue(null);

        await request(app.getHttpServer())
            .delete('/products/prod-2')
            .expect(404);
    });

    // ---------------- PATCH /products/:id/restore ----------------
    it('/products/:id/restore (PATCH) should restore soft-deleted product', async () => {
        prismaMock.product.findUnique.mockResolvedValue({
            ...mockProduct,
            deletedAt: new Date(),
        });

        prismaMock.product.update.mockResolvedValue(mockProduct);

        const res = await request(app.getHttpServer())
            .patch(`/products/${PRODUCT_ID}/restore`)
            .expect(200);

        expect(res.body).toEqual({
            id: mockProduct.id,
            name: mockProduct.name,
            description: mockProduct.description,
            price: mockProduct.price,
            stock: mockProduct.stock,
            categoryId: mockProduct.categoryId,
        });
    });

    it('/products/:id/restore (PATCH) should return 404 if product is not deleted', async () => {
        prismaMock.product.findUnique.mockResolvedValue(mockProduct);

        await request(app.getHttpServer())
            .patch('/products/prod-1/restore')
            .expect(404);
    });

    // ---------------- VALIDATION ----------------
    it('/products (POST) should return 400 if required fields are invalid', async () => {
        const invalidProduct = {
            name: '',
            description: 'Red apple',
            price: -100,
            stock: 0,
            categoryId: 'not-uuid',
        };

        const res = await request(app.getHttpServer())
            .post('/products')
            .send(invalidProduct)
            .expect(400);

        expect(res.body.message).toBeDefined();
    });
});
