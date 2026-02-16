import { Controller, Post, Put, Get, Patch, Body, Param, Inject, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/guards';
import { CurrentUser } from '../../auth/guards/decorators/current-user.decorator';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import microservices client proxy.
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
    UpdateProductInventoryRequestDto,
} from '@app/common/dtos/platform/products/crudProductRequest.dto';
import {
    ProductResponseDto,
    GetListOfProductResponseDto,
    ProductCashierResponseDto,
} from '@app/common/dtos/platform/products/crudProductResponse.dto';
import {
    ProductHistoryItemResponseDto,
    GetProductHistoryByVersionResponseDto,
} from '@app/common/dtos/platform/products/history/crudProduct.dto';
import {
    GetListOfProductStockHistoryResponseDto,
    ProductStockHistoryResponseDto,
} from '@app/common/dtos/platform/products/history/crudProductStock.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Platform] Products: These APIs are for products management.')
@Controller({
    path: 'api/v1/products',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
    constructor(
        @Inject('PLATFORM_SERVICE') private readonly platformService: ClientProxy,
    ) { }

    // Create a new product.
    // POST /api/v1/products
    @Post()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new product' })
    @ApiBody({ type: CreateProductRequestDto })
    @ApiResponse({ status: 201, description: 'A product has been created successfully.', type: ProductResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createProduct(@Body() dto: CreateProductRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ProductResponseDto> {
        try {
            const result: ProductResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.createProduct' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Edit a product.
    // PATCH /api/v1/products
    @Patch()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a product' })
    @ApiBody({ type: EditProductRequestDto })
    @ApiResponse({ status: 200, description: 'A product has been edited successfully.', type: ProductResponseDto })
    @HttpCode(HttpStatus.OK)
    async editProduct(@Body() dto: EditProductRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ProductResponseDto> {
        try {
            const result: ProductResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.editProduct' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a product by ID.
    // GET /api/v1/products/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a product by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A product has been retrieved successfully.', type: ProductResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductById(@Param('id') id: string): Promise<ProductResponseDto> {
        try {
            const result: ProductResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a product by SKU.
    // GET /api/v1/products/sku/:sku
    @Get('sku/:sku')
    @Roles(Role.MANAGER, Role.CASHIER)
    @ApiOperation({ summary: '[MANAGER, CASHIER] Get a product by SKU' })
    @ApiParam({ name: 'sku', description: 'The SKU of the product', example: '1234567890123' })
    @ApiResponse({ status: 200, description: 'A product has been retrieved successfully.' })
    @HttpCode(HttpStatus.OK)
    async getProductCashierBySku(@Param('sku') sku: string, @CurrentUser() user: AccessTokenPayload): Promise<ProductCashierResponseDto | ProductResponseDto> {
        try {
            if (user.roles.includes(Role.MANAGER)) {
                const result: ProductResponseDto = await firstValueFrom(
                    this.platformService.send({ cmd: 'products.getProductBySku' }, { sku })
                );
                return result;
            }
            const result: ProductCashierResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductCashierBySku' }, { sku })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of products.
    // GET /api/v1/products
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a list of products' })
    @ApiResponse({ status: 200, description: 'A list of products has been retrieved successfully.', type: GetListOfProductResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfProducts(@Query() dto: GetListOfProductRequestDto): Promise<GetListOfProductResponseDto> {
        try {
            const result = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getListOfProducts' }, dto)
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Deactivate a product.
    // PATCH /api/v1/products/:id/deactivate
    @Patch(':id/deactivate')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Deactivate a product' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A product has been deactivated successfully.', type: ProductResponseDto })
    @HttpCode(HttpStatus.OK)
    async deactivateProduct(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<ProductResponseDto> {
        try {
            const result: ProductResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.deactivateProduct' }, { id, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Activate a product.
    // PATCH /api/v1/products/:id/activate
    @Patch(':id/activate')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Activate a product' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A product has been activated successfully.', type: ProductResponseDto })
    @HttpCode(HttpStatus.OK)
    async activateProduct(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<ProductResponseDto> {
        try {
            const result: ProductResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.activateProduct' }, { id, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // --- History APIs ---
    // Get history list of a product.
    // GET /api/v1/products/history/:id
    @Get('history/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get history list of a product' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A history list of the product has been retrieved successfully.', type: [ProductHistoryItemResponseDto] })
    @HttpCode(HttpStatus.OK)
    async getProductHistoryList(@Param('id') id: string): Promise<ProductHistoryItemResponseDto[]> {
        try {
            const result: ProductHistoryItemResponseDto[] = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductHistoryList' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a specific history version of a product.
    // GET /api/v1/products/history/:id/:version
    @Get('history/:id/:version')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get a specific history version of a product' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiParam({ name: 'version', description: 'The version number', example: 1 })
    @ApiResponse({ status: 200, description: 'A specific history version of the product has been retrieved successfully.', type: GetProductHistoryByVersionResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductHistoryByVersion(@Param('id') id: string, @Param('version') version: string): Promise<GetProductHistoryByVersionResponseDto> {
        try {
            const result: GetProductHistoryByVersionResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductHistoryByVersion' }, { id, version: parseInt(version, 10) })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // --- Product Stock History APIs ---
    // Get stock history list of a product.
    // GET /api/v1/products/stock-history/:id
    @Get('stock-history/:id')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Get stock history list of a product' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A stock history list of the product has been retrieved successfully.', type: GetListOfProductStockHistoryResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductStockHistoryList(@Param('id') id: string): Promise<GetListOfProductStockHistoryResponseDto> {
        try {
            const result: GetListOfProductStockHistoryResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductStockHistoryList' }, { productId: id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a specific stock history by id.
    // GET /api/v1/products/stock-history/detail/:id
    @Get('stock-history/detail/:id')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Get a specific stock history by id' })
    @ApiParam({ name: 'id', description: 'The ID of the stock history record', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A specific stock history record has been retrieved successfully.', type: ProductStockHistoryResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductStockHistoryById(@Param('id') id: string): Promise<ProductStockHistoryResponseDto> {
        try {
            const result: ProductStockHistoryResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductStockHistoryById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

}
