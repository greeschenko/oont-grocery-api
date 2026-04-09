import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { CartsModule } from '../src/carts/carts.module';
import { CartsService } from '../src/carts/carts.service';

describe('CartsController (e2e)', () => {
  let app: INestApplication;

  const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440002';

  const mockCart = {
    userId: USER_ID,
    items: [
      {
        productId: PRODUCT_ID,
        quantity: 2,
        product: {
          id: PRODUCT_ID,
          name: 'Apple',
          price: 100,
        },
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
    const module: TestingModule = await Test.createTestingModule({
      imports: [CartsModule],
    })
      .overrideProvider(CartsService)
      .useValue(cartsServiceMock)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => await app.close());
  afterEach(() => jest.clearAllMocks());

  // ---------------- GET ----------------
  it('GET /cart/:userId - should return user cart', async () => {
    cartsServiceMock.getCartByUserId.mockResolvedValue(mockCart);

    const res = await request(app.getHttpServer())
      .get(`/cart/${USER_ID}`)
      .expect(200);

    expect(res.body).toEqual(mockCart);
  });

  it('GET /cart/:userId - should return 404 if not found', async () => {
    cartsServiceMock.getCartByUserId.mockRejectedValue(
      new NotFoundException('Cart not found'),
    );

    await request(app.getHttpServer())
      .get(`/cart/${OTHER_USER_ID}`)
      .expect(404);
  });

  // ---------------- POST ----------------
  it('POST /cart/:userId/items - should add item', async () => {
    const newItem = {
      productId: PRODUCT_ID,
      quantity: 1,
      product: {
        id: PRODUCT_ID,
        name: 'Banana',
        price: 50,
      },
    };

    cartsServiceMock.addItem.mockResolvedValue({
      ...mockCart,
      items: [...mockCart.items, newItem],
    });

    const res = await request(app.getHttpServer())
      .post(`/cart/${USER_ID}/items`)
      .send({ productId: PRODUCT_ID, quantity: 1 })
      .expect(201);

    expect(res.body.items).toHaveLength(2);
  });

  // ---------------- PUT ----------------
  it('PUT /cart/:userId/items/:productId - should update quantity', async () => {
    const updatedCart = {
      ...mockCart,
      items: [{ ...mockCart.items[0], quantity: 5 }],
    };

    cartsServiceMock.updateItem.mockResolvedValue(updatedCart);

    const res = await request(app.getHttpServer())
      .put(`/cart/${USER_ID}/items/${PRODUCT_ID}`)
      .send({ quantity: 5 })
      .expect(200);

    expect(res.body.items[0].quantity).toBe(5);
  });

  // ---------------- DELETE ITEM ----------------
  it('DELETE /cart/:userId/items/:productId - should remove item', async () => {
    const updatedCart = { ...mockCart, items: [] };

    cartsServiceMock.removeItem.mockResolvedValue(updatedCart);

    const res = await request(app.getHttpServer())
      .delete(`/cart/${USER_ID}/items/${PRODUCT_ID}`)
      .expect(200);

    expect(res.body.items).toHaveLength(0);
  });

  // ---------------- DELETE CART ----------------
  it('DELETE /cart/:userId - should clear entire cart', async () => {
    cartsServiceMock.clearCart.mockResolvedValue({
      userId: USER_ID,
      items: [],
    });

    const res = await request(app.getHttpServer())
      .delete(`/cart/${USER_ID}`)
      .expect(200);

    expect(res.body.items).toHaveLength(0);
  });
});
