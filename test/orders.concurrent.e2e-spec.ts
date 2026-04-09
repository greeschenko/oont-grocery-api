import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { OrdersModule } from '../src/orders/orders.module';
import { OrdersService } from '../src/orders/orders.service';

describe('OrdersController - concurrent stock test (e2e)', () => {
    let app: INestApplication;
    const ordersServiceMock = {
        createFromCart: jest.fn(),
    };

    // Hardcoded UUIDs for users and orders
    const user1Id = '550e8400-e29b-41d4-a716-446655440001';
    const user2Id = '550e8400-e29b-41d4-a716-446655440002';
    const order1Id = '550e8400-e29b-41d4-a716-446655440003';

    const mockOrderUser1 = { id: order1Id, userId: user1Id, status: 'created', total: 100 };

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

    it('should allow first user to create order and reject second due to stock', async () => {
        // Simulate concurrent order creation
        ordersServiceMock.createFromCart
            .mockResolvedValueOnce(mockOrderUser1) // first user succeeds
            .mockRejectedValueOnce(new BadRequestException('Insufficient stock')); // second user fails

        // Execute two requests concurrently
        const results = await Promise.all([
            request(app.getHttpServer())
                .post('/orders')
                .send({ userId: user1Id }),
            request(app.getHttpServer())
                .post('/orders')
                .send({ userId: user2Id }),
        ]);

        const [res1, res2] = results;

        // Check first request succeeded
        expect(res1.status).toBe(201);
        expect(res1.body).toEqual(mockOrderUser1);

        // Check second request failed due to insufficient stock
        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe('Insufficient stock');
    });
});
