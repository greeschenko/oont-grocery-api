import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    HttpCode,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDto } from './dto/order.dto';
import { CancelOrderResponseDto } from './dto/cancel-order-response.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Create order from user cart' })
    @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderDto })
    @ApiResponse({ status: 400, description: 'Cart is empty or invalid user id' })
    async create(@Body() dto: CreateOrderDto) {
        return this.ordersService.createFromCart(dto.userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by id' })
    @ApiResponse({ status: 200, description: 'Order returned successfully', type: OrderDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Post(':id/cancel')
    @HttpCode(200)
    @ApiOperation({ summary: 'Cancel order' })
    @ApiResponse({ status: 200, description: 'Order cancelled successfully', type: CancelOrderResponseDto })
    @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async cancel(@Param('id') id: string) {
        return this.ordersService.cancel(id);
    }
}
