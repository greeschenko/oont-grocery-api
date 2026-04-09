import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartDto } from './dto/cart-item.dto';

@ApiTags('cart')
@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get current cart by user id' })
  @ApiParam({ name: 'userId', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Cart returned successfully', type: CartDto })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async getCart(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.cartsService.getCartByUserId(userId);
  }

  @Post(':userId/items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiParam({ name: 'userId', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully', type: CartDto })
  @ApiResponse({ status: 400, description: 'Invalid quantity or product does not exist' })
  async addItem(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartsService.addItem(userId, dto.productId, dto.quantity);
  }

  @Put(':userId/items/:productId')
  @ApiOperation({ summary: 'Update item quantity in cart' })
  @ApiParam({ name: 'userId', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({ name: 'productId', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully', type: CartDto })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateItem(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(userId, productId, dto.quantity);
  }

  @Delete(':userId/items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'userId', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({ name: 'productId', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Cart item removed successfully', type: CartDto })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeItem(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.cartsService.removeItem(userId, productId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiParam({ name: 'userId', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully', type: CartDto })
  async clearCart(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.cartsService.clearCart(userId);
  }
}
