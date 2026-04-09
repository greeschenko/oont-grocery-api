import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../src/orders/orders.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

describe('OrdersService - full coverage', () => {
  let service: OrdersService;
  let prisma: any;

  const mockProduct = { id: 'prod-1', name: 'Apple', price: 100, stock: 5 };
  const mockCartItem = { id: 'item-1', cartId: 'cart-1', productId: 'prod-1', quantity: 2, product: mockProduct };
  const mockCart = { id: 'cart-1', userId: 'user-1', items: [mockCartItem] };
  const mockOrderItem = { id: 'order-item-1', productId: 'prod-1', quantity: 2, productNameSnapshot: 'Apple', priceSnapshot: 100 };
  const mockOrder = { id: 'order-1', userId: 'user-1', status: OrderStatus.PENDING, totalAmount: 200, items: [mockOrderItem] };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      cart: { findUnique: jest.fn() },
      product: { findMany: jest.fn(), update: jest.fn() },
      order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      cartItem: { deleteMany: jest.fn() },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createFromCart', () => {
    it('should create order successfully', async () => {
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.order.create.mockResolvedValue({ ...mockOrder, items: [mockOrderItem] });
      prisma.product.update.mockResolvedValue(mockProduct);
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.createFromCart('user-1');

      expect(result).toEqual(mockOrder);
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'prod-1' }, data: { stock: { decrement: 2 } } });
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
    });

    it('should throw BadRequestException if cart is empty', async () => {
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.cart.findUnique.mockResolvedValue({ ...mockCart, items: [] });

      await expect(service.createFromCart('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.product.findMany.mockResolvedValue([{ ...mockProduct, stock: 1 }]);
      prisma.$queryRaw.mockResolvedValue([]);

      await expect(service.createFromCart('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel order and increment stock', async () => {
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, items: [mockOrderItem] });
      prisma.product.update.mockResolvedValue(mockProduct);
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.cancel('order-1');

      expect(result.status).toEqual(OrderStatus.CANCELLED);
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'prod-1' }, data: { stock: { increment: 2 } } });
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.cancel('unknown')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order already cancelled', async () => {
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED, items: [mockOrderItem] });

      await expect(service.cancel('order-1')).rejects.toThrow(BadRequestException);
    });
  });
});
