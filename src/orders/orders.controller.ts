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
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({
        summary: 'Create order from user cart',
    })
    @ApiResponse({
        status: 201,
        description: 'Order created successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Cart is empty or invalid user id',
    })
    async create(@Body() dto: CreateOrderDto) {
        return this.ordersService.createFromCart(dto.userId);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get order by id',
    })
    @ApiParam({
        name: 'id',
        example: 'order-uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Order returned successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Post(':id/cancel')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Cancel order',
    })
    @ApiParam({
        name: 'id',
        example: 'order-uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Order cancelled successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Order cannot be cancelled',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async cancel(@Param('id') id: string) {
        return this.ordersService.cancel(id);
    }
}
