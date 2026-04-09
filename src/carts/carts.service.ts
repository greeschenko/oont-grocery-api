import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CartDto } from './dto/cart-item.dto';

@Injectable()
export class CartsService {
    constructor(private readonly prisma: PrismaService) { }

    private async _getOrCreateCart(userId: string) {
        let cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart) {
            cart = await this.prisma.cart.create({
                data: { userId },
                include: { items: { include: { product: true } } },
            });
        }

        return cart;
    }

    private _mapToDto(
        cart: Prisma.CartGetPayload<{
            include: { items: { include: { product: true } } };
        }>,
    ): CartDto {
        return {
            userId: cart.userId,
            items: cart.items.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                quantity: item.quantity,
            })),
        };
    }

    async getCartByUserId(userId: string): Promise<CartDto> {
        const cart = await this._getOrCreateCart(userId);
        return this._mapToDto(cart);
    }

    async addItem(userId: string, productId: string, quantity: number): Promise<CartDto> {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, deletedAt: null },
        });
        if (!product) throw new NotFoundException('Product not found');

        const cart = await this._getOrCreateCart(userId);

        const existingItem = await this.prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });

        if (existingItem) {
            await this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        } else {
            await this.prisma.cartItem.create({
                data: { cartId: cart.id, productId, quantity },
            });
        }

        const updatedCart = await this._getOrCreateCart(userId);
        return this._mapToDto(updatedCart);
    }

    async updateItem(userId: string, productId: string, quantity: number): Promise<CartDto> {
        if (quantity <= 0) throw new BadRequestException('Quantity must be greater than zero');

        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) throw new NotFoundException('Cart not found');

        const cartItem = await this.prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        if (!cartItem) throw new NotFoundException('Cart item not found');

        await this.prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity } });

        const updatedCart = await this._getOrCreateCart(userId);
        return this._mapToDto(updatedCart);
    }

    async removeItem(userId: string, productId: string): Promise<CartDto> {
        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) throw new NotFoundException('Cart not found');

        const cartItem = await this.prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        if (!cartItem) throw new NotFoundException('Cart item not found');

        await this.prisma.cartItem.delete({ where: { id: cartItem.id } });

        const updatedCart = await this._getOrCreateCart(userId);
        return this._mapToDto(updatedCart);
    }

    async clearCart(userId: string): Promise<CartDto> {
        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) throw new NotFoundException('Cart not found');

        await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

        return { userId, items: [] };
    }
}
