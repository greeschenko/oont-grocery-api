import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartsService } from '../src/carts/carts.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CartsService', () => {
    let service: CartsService;
    let prismaService: any;

    const mockProduct = {
        id: 'prod-1',
        name: 'Apple',
        price: 100,
        deletedAt: null,
    };

    const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
    };

    const mockCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        quantity: 2,
        product: mockProduct,
    };

    beforeEach(async () => {
        prismaService = {
            cart: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
            cartItem: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                deleteMany: jest.fn(),
            },
            product: {
                findFirst: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartsService,
                { provide: PrismaService, useValue: prismaService },
            ],
        }).compile();

        service = module.get<CartsService>(CartsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getCartByUserId', () => {
        it('should return existing cart', async () => {
            prismaService.cart.findUnique.mockResolvedValue(mockCart);
            const result = await service.getCartByUserId('user-1');
            expect(result).toEqual(mockCart);
            expect(prismaService.cart.findUnique).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                include: { items: { include: { product: true } } },
            });
        });

        it('should create cart if not exists', async () => {
            prismaService.cart.findUnique.mockResolvedValue(null);
            prismaService.cart.create.mockResolvedValue(mockCart);
            const result = await service.getCartByUserId('user-1');
            expect(result).toEqual(mockCart);
            expect(prismaService.cart.create).toHaveBeenCalledWith({
                data: { userId: 'user-1' },
                include: { items: { include: { product: true } } },
            });
        });
    });

    describe('addItem', () => {
        it('should add new item to cart', async () => {
            prismaService.product.findFirst.mockResolvedValue(mockProduct);
            prismaService.cart.findUnique.mockResolvedValue(mockCart);
            prismaService.cartItem.findUnique.mockResolvedValue(null);
            prismaService.cartItem.create.mockResolvedValue(mockCartItem);
            prismaService.cart.findUnique.mockResolvedValue(mockCart);

            const result = await service.addItem('user-1', 'prod-1', 2);
            expect(result).toEqual(mockCart);
            expect(prismaService.cartItem.create).toHaveBeenCalledWith({
                data: { cartId: 'cart-1', productId: 'prod-1', quantity: 2 },
            });
        });

        it('should update quantity if item already exists', async () => {
            prismaService.product.findFirst.mockResolvedValue(mockProduct);
            prismaService.cart.findUnique.mockResolvedValue(mockCart);
            prismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);
            prismaService.cartItem.update.mockResolvedValue({
                ...mockCartItem,
                quantity: 4,
            });
            prismaService.cart.findUnique.mockResolvedValue(mockCart);

            const result = await service.addItem('user-1', 'prod-1', 2);
            expect(result).toEqual(mockCart);
            expect(prismaService.cartItem.update).toHaveBeenCalledWith({
                where: { id: 'item-1' },
                data: { quantity: 4 },
            });
        });

        it('should throw NotFoundException if product not found', async () => {
            prismaService.product.findFirst.mockResolvedValue(null);
            await expect(
                service.addItem('user-1', 'prod-unknown', 1),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateItem', () => {
        it('should update item quantity', async () => {
            prismaService.cart.findUnique.mockResolvedValue(mockCart);
            prismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);
            prismaService.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 5 });
            prismaService.cart.findUnique.mockResolvedValue(mockCart);

            const result = await service.updateItem('user-1', 'prod-1', 5);
            expect(result).toEqual(mockCart);
            expect(prismaService.cartItem.update).toHaveBeenCalledWith({
                where: { id: 'item-1' },
                data: { quantity: 5 },
            });
        });

        it('should throw BadRequestException for quantity <= 0', async () => {
            prismaService.cart.findUnique.mockResolvedValue(mockCart);
            prismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);

            await expect(
                service.updateItem('user-1', 'prod-1', 0),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if cart not found', async () => {
            prismaService.cart.findUnique.mockResolvedValue(null);
            await expect(
                service.updateItem('user-1', 'prod-1', 2),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('removeItem', () => {
        it('should remove an item', async () => {
            prismaService.cart.findUnique.mockResolvedValue(mockCart);
            prismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);
            prismaService.cartItem.delete.mockResolvedValue(mockCartItem);
            prismaService.cart.findUnique.mockResolvedValue(mockCart);

            const result = await service.removeItem('user-1', 'prod-1');
            expect(result).toEqual(mockCart);
            expect(prismaService.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
        });

        it('should throw NotFoundException if cartItem not found', async () => {
            prismaService.cart.findUnique.mockResolvedValue(mockCart);
            prismaService.cartItem.findUnique.mockResolvedValue(null);
            await expect(service.removeItem('user-1', 'prod-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('clearCart', () => {
        it('should clear all items in cart', async () => {
            prismaService.cart.findUnique.mockResolvedValue(mockCart);
            prismaService.cartItem.deleteMany.mockResolvedValue({});
            const result = await service.clearCart('user-1');
            expect(result).toEqual({ message: 'Cart cleared successfully' });
            expect(prismaService.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
        });

        it('should throw NotFoundException if cart not found', async () => {
            prismaService.cart.findUnique.mockResolvedValue(null);
            await expect(service.clearCart('user-1')).rejects.toThrow(NotFoundException);
        });
    });
});
