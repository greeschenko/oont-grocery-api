import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartsModule } from './carts/carts.module';
import { OrdersModule } from './orders/orders.module';

@Module({
    imports: [
        ProductsModule,
        CategoriesModule,
        CartsModule,
        OrdersModule,
    ],
})
export class AppModule { }
