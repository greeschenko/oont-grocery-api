import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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

@ApiTags('cart')
@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get(':userId')
  @ApiOperation({
    summary: 'Get current cart by user id',
  })
  @ApiParam({
    name: 'userId',
    example: 'user-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart returned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Cart not found',
  })
  async getCart(@Param('userId') userId: string) {
    return this.cartsService.getCartByUserId(userId);
  }

  @Post(':userId/items')
  @ApiOperation({
    summary: 'Add item to cart',
  })
  @ApiParam({
    name: 'userId',
    example: 'user-uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid quantity or product does not exist',
  })
  async addItem(
    @Param('userId') userId: string,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartsService.addItem(
      userId,
      dto.productId,
      dto.quantity,
    );
  }

  @Put(':userId/items/:productId')
  @ApiOperation({
    summary: 'Update item quantity in cart',
  })
  @ApiParam({
    name: 'userId',
    example: 'user-uuid',
  })
  @ApiParam({
    name: 'productId',
    example: 'product-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Cart item not found',
  })
  async updateItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(
      userId,
      productId,
      dto.quantity,
    );
  }

  @Delete(':userId/items/:productId')
  @ApiOperation({
    summary: 'Remove item from cart',
  })
  @ApiParam({
    name: 'userId',
    example: 'user-uuid',
  })
  @ApiParam({
    name: 'productId',
    example: 'product-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Cart item not found',
  })
  async removeItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartsService.removeItem(userId, productId);
  }

  @Delete(':userId')
  @ApiOperation({
    summary: 'Clear entire cart',
  })
  @ApiParam({
    name: 'userId',
    example: 'user-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  async clearCart(@Param('userId') userId: string) {
    return this.cartsService.clearCart(userId);
  }
}
