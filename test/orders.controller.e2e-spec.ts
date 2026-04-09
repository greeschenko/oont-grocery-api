import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { OrdersModule } from '../src/orders/orders.module';
import { OrdersService } from '../src/orders/orders.service';

describe('OrdersController (e2e)', () => {
    let app: INestApplication;
    const ordersServiceMock = {
        createFromCart: jest.fn(),
        findOne: jest.fn(),
        cancel: jest.fn(),
    };

    const mockOrder = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        items: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440002',
                quantity: 2,
                product: {
                    id: '550e8400-e29b-41d4-a716-446655440002',
                    name: 'Apple',
                    price: 100
                }
            },
        ],
        total: 200,
        status: 'created',
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [OrdersModule],
        })
            .overrideProvider(OrdersService)
            .useValue(ordersServiceMock)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ---------------- POST /orders ----------------
    it('/orders (POST) should create order from cart', async () => {
        ordersServiceMock.createFromCart.mockResolvedValue(mockOrder);

        const res = await request(app.getHttpServer())
            .post('/orders')
            .send({ userId: '550e8400-e29b-41d4-a716-446655440000' })
            .expect(201);

        expect(res.body).toEqual(mockOrder);
    });

    it('/orders (POST) should return 400 if cart is empty', async () => {
        ordersServiceMock.createFromCart.mockRejectedValue(new BadRequestException('Cart is empty'));

        await request(app.getHttpServer())
            .post('/orders')
            .send({ userId: 'user-empty' })
            .expect(400);
    });

    // ---------------- GET /orders/:id ----------------
    it('/orders/:id (GET) should return order by id', async () => {
        ordersServiceMock.findOne.mockResolvedValue(mockOrder);

        const res = await request(app.getHttpServer())
            .get('/orders/550e8400-e29b-41d4-a716-446655440001')
            .expect(200);

        expect(res.body).toEqual(mockOrder);
    });

    it('/orders/:id (GET) should return 404 if order not found', async () => {
        ordersServiceMock.findOne.mockRejectedValue(new NotFoundException('Order not found'));

        await request(app.getHttpServer())
            .get('/orders/order-unknown')
            .expect(404);
    });

    // ---------------- POST /orders/:id/cancel ----------------
    it('/orders/:id/cancel (POST) should cancel order', async () => {
        const cancelledOrder = { ...mockOrder, status: 'cancelled' };
        ordersServiceMock.cancel.mockResolvedValue(cancelledOrder);

        const res = await request(app.getHttpServer())
            .post('/orders/550e8400-e29b-41d4-a716-446655440001/cancel')
            .expect(200);

        expect(res.body.status).toBe('cancelled');
    });

    it('/orders/:id/cancel (POST) should return 400 if cannot cancel', async () => {
        ordersServiceMock.cancel.mockRejectedValue(new BadRequestException('Order cannot be cancelled'));

        await request(app.getHttpServer())
            .post('/orders/order-1/cancel')
            .expect(400);
    });

    it('/orders/:id/cancel (POST) should return 404 if order not found', async () => {
        ordersServiceMock.cancel.mockRejectedValue(new NotFoundException('Order not found'));

        await request(app.getHttpServer())
            .post('/orders/order-unknown/cancel')
            .expect(404);
    });
});
