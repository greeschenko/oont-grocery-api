import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { CartsModule } from '../src/carts/carts.module';
import { CartsService } from '../src/carts/carts.service';

describe('CartsController (e2e)', () => {
    let app: INestApplication;
    let service: CartsService;

    const mockCart = {
        userId: 'user-1',
        items: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                quantity: 2,
                product: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: 'Apple',
                    price: 100
                }
            },
        ],
    };

    const cartsServiceMock = {
        getCartByUserId: jest.fn(),
        addItem: jest.fn(),
        updateItem: jest.fn(),
        removeItem: jest.fn(),
        clearCart: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [CartsModule],
        })
            .overrideProvider(CartsService)
            .useValue(cartsServiceMock)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();
        service = moduleFixture.get<CartsService>(CartsService);
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ---------------- GET /cart/:userId ----------------
    it('/cart/:userId (GET) should return user cart', async () => {
        cartsServiceMock.getCartByUserId.mockResolvedValue(mockCart);

        const res = await request(app.getHttpServer())
            .get('/cart/user-1')
            .expect(200);

        expect(res.body).toEqual(mockCart);
    });

    it('/cart/:userId (GET) should return 404 if cart not found', async () => {
        cartsServiceMock.getCartByUserId.mockRejectedValue(new NotFoundException('Cart not found'));

        await request(app.getHttpServer())
            .get('/cart/user-unknown')
            .expect(404);
    });

    // ---------------- POST /cart/:userId/items ----------------
    it('/cart/:userId/items (POST) should add item to cart', async () => {
        const newItem = {
            productId: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 1,
            product: {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Banana',
                price: 50
            }
        };
        cartsServiceMock.addItem.mockResolvedValue({ ...mockCart, items: [...mockCart.items, newItem] });

        const res = await request(app.getHttpServer())
            .post('/cart/user-1/items')
            .send({ productId: newItem.productId, quantity: newItem.quantity })
            .expect(201);

        expect(res.body.items.length).toBe(2);
        expect(res.body.items[1]).toEqual(newItem);
    });

    // ---------------- PUT /cart/:userId/items/:productId ----------------
    it('/cart/:userId/items/:productId (PUT) should update cart item', async () => {
        const updatedCart = { ...mockCart, items: [{ ...mockCart.items[0], quantity: 5 }] };
        cartsServiceMock.updateItem.mockResolvedValue(updatedCart);

        const res = await request(app.getHttpServer())
            .put(`/cart/user-1/items/${mockCart.items[0].productId}`)
            .send({ quantity: 5 })
            .expect(200);

        expect(res.body.items[0].quantity).toBe(5);
    });

    // ---------------- DELETE /cart/:userId/items/:productId ----------------
    it('/cart/:userId/items/:productId (DELETE) should remove item from cart', async () => {
        const updatedCart = { ...mockCart, items: [] };
        cartsServiceMock.removeItem.mockResolvedValue(updatedCart);

        const res = await request(app.getHttpServer())
            .delete(`/cart/user-1/items/${mockCart.items[0].productId}`)
            .expect(200);

        expect(res.body.items.length).toBe(0);
    });

    // ---------------- DELETE /cart/:userId ----------------
    it('/cart/:userId (DELETE) should clear entire cart', async () => {
        cartsServiceMock.clearCart.mockResolvedValue({ userId: 'user-1', items: [] });

        const res = await request(app.getHttpServer())
            .delete('/cart/user-1')
            .expect(200);

        expect(res.body.items.length).toBe(0);
    });
});
