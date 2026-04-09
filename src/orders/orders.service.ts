import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) { }

    async findOne(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async createFromCart(userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            if (!cart || cart.items.length === 0) {
                throw new BadRequestException('Cart is empty');
            }

            const productIds = cart.items.map((item) => item.productId);

            await tx.$queryRaw`
        SELECT *
        FROM "Product"
        WHERE id IN (${Prisma.join(productIds)})
        FOR UPDATE
      `;

            const latestProducts = await tx.product.findMany({
                where: {
                    id: {
                        in: productIds,
                    },
                },
            });

            const insufficientStockItems: {
                productId: string;
                productName: string;
                requested: number;
                available: number;
            }[] = [];

            for (const cartItem of cart.items) {
                const product = latestProducts.find(
                    (p) => p.id === cartItem.productId,
                );

                if (!product || product.stock < cartItem.quantity) {
                    insufficientStockItems.push({
                        productId: cartItem.productId,
                        productName: cartItem.product.name,
                        requested: cartItem.quantity,
                        available: product?.stock ?? 0,
                    });
                }
            }

            if (insufficientStockItems.length > 0) {
                throw new BadRequestException({
                    message: 'Insufficient stock',
                    items: insufficientStockItems,
                });
            }

            let totalAmount = 0;

            for (const item of cart.items) {
                totalAmount += Number(item.product.price) * item.quantity;
            }

            const order = await tx.order.create({
                data: {
                    userId,
                    status: OrderStatus.PENDING,
                    totalAmount,
                    items: {
                        create: cart.items.map((item) => ({
                            quantity: item.quantity,
                            productNameSnapshot: item.product.name,
                            priceSnapshot: item.product.price,
                            product: {
                                connect: {
                                    id: item.productId,
                                },
                            },
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            for (const item of cart.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            await tx.cartItem.deleteMany({
                where: {
                    cartId: cart.id,
                },
            });

            return order;
        });
    }

    async cancel(orderId: string) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    items: true,
                },
            });

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            if (order.status === OrderStatus.CANCELLED) {
                throw new BadRequestException('Order is already cancelled');
            }

            const productIds = order.items.map((item) => item.productId);

            await tx.$queryRaw`
        SELECT *
        FROM "Product"
        WHERE id IN (${Prisma.join(productIds)})
        FOR UPDATE
      `;

            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity,
                        },
                    },
                });
            }

            return tx.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.CANCELLED,
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        });
    }
}
