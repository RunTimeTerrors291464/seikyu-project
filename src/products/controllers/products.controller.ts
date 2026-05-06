import { Controller, Post, Get, Patch, Body, Param, HttpCode, HttpStatus, Query, UseGuards, ParseIntPipe } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RateLimitGuard } from '@src/auth/guards/rateLimit.guard';

// Import decorators.
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '@libs/common/decorators/getUserInformation.decorator';

// Import enums.
import { Role } from '@libs/common/enums/role.enum';

// Import services.
import { ProductsService } from '../services/products.service';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
    GetListOfProductByProductUnitIdRequestDto,
    UpdateProductInventoryBulkRequestDto,
} from '@libs/common/dtos/products/crudProductRequest.dto';
import {
    ProductResponseDto,
    GetListOfProductResponseDto,
    ProductCashierResponseDto,
    ProductResponseDtoWithHistory,
    ProductInventoryStockItemResponseDto,
} from '@libs/common/dtos/products/crudProductResponse.dto';
import {
    GetProductHistoryListRequestDto,
    GetProductStockHistoryListRequestDto,
} from '@libs/common/dtos/products/crudProductHistoryRequest.dto';
import {
    GetListOfProductHistoryResponseDto,
    GetProductHistoryByVersionResponseDto,
    GetListOfProductStockHistoryResponseDto,
    ProductOverviewResponseDto,
} from '@libs/common/dtos/products/crudProductHistoryResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Products] These APIs are for products management.')
@Controller({
    path: 'api/v2/products',
    version: '2',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // Create a new product.
    // POST /api/v2/products
    @Post()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new product' })
    @ApiBody({ type: CreateProductRequestDto })
    @ApiResponse({ status: 201, description: 'A product has been created successfully.', type: ProductResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createNewProduct(@Body() dto: CreateProductRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ProductResponseDto> {
        return await this.productsService.createNewProduct(dto, user);
    }

    // Edit a product.
    // PATCH /api/v2/products
    @Patch()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a product' })
    @ApiBody({ type: EditProductRequestDto })
    @ApiResponse({ status: 200, description: 'A product has been edited successfully.', type: ProductResponseDtoWithHistory })
    @HttpCode(HttpStatus.OK)
    async editProduct(@Body() dto: EditProductRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ProductResponseDtoWithHistory> {
        return await this.productsService.editProduct(dto, user);
    }

    // Get the product overview.
    // GET /api/v2/products/overview
    @Get('overview')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Get the product overview' })
    @ApiResponse({ status: 200, description: 'The product overview has been retrieved successfully.', type: ProductOverviewResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductOverview(): Promise<ProductOverviewResponseDto> {
        return await this.productsService.getProductOverview();
    }

    // Get bulk product inventory stock by product id.
    // GET /api/v2/products/inventory-stock
    @Get('inventory-stock')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Get bulk product inventory stock by product id' })
    @ApiQuery({ name: 'productIds', required: false, isArray: true, description: 'Product UUIDs.', example: ['550e8400-e29b-41d4-a716-446655440000'] })
    @ApiResponse({ status: 200, description: 'Inventory stock per product id has been retrieved successfully.', type: ProductInventoryStockItemResponseDto, isArray: true })
    @HttpCode(HttpStatus.OK)
    async getBulkProductInventoryStock(
        @Query('productIds') productIds?: string | string[],
    ): Promise<ProductInventoryStockItemResponseDto[]> {
        const ids: string[] = productIds == null ? [] : Array.isArray(productIds) ? productIds : [productIds];
        return await this.productsService.getBulkProductInventoryStock(ids);
    }

    // Get a product by ID.
    // GET /api/v2/products/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a product by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A product has been retrieved successfully.', type: ProductResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductById(@Param('id') id: string): Promise<ProductResponseDto> {
        return await this.productsService.getProductByIdResponseDto(id);
    }

    // Get a product by SKU.
    // GET /api/v2/products/sku/:sku
    @Get('sku/:sku')
    @Roles(Role.MANAGER, Role.CASHIER)
    @ApiOperation({ summary: '[MANAGER, CASHIER] Get a product by SKU' })
    @ApiParam({ name: 'sku', description: 'The SKU of the product', example: '1234567890123' })
    @ApiResponse({ status: 200, description: 'A product has been retrieved successfully.' })
    @HttpCode(HttpStatus.OK)
    async getProductBySku(
        @Param('sku') sku: string,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ProductResponseDto | ProductCashierResponseDto> {
        if (user.roles.includes(Role.MANAGER)) return await this.productsService.getProductBySkuResponseDto(sku);
        return await this.productsService.getProductCashierBySkuResponseDto(sku);
    }

    // Get a list of products by product unit id.
    // GET /api/v2/products/by-unit/:productUnitId
    @Get('by-unit/:productUnitId')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of products by product unit ID' })
    @ApiParam({ name: 'productUnitId', description: 'The ID of the product unit', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiQuery({ name: 'page', description: 'The page number', example: 1, required: false })
    @ApiQuery({ name: 'limit', description: 'The page limit', example: 10, required: false })
    @ApiResponse({ status: 200, description: 'A list of products has been retrieved successfully.', type: GetListOfProductResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfProductByProductUnitId(
        @Param('productUnitId') productUnitId: string,
        @Query() query: { page?: number; limit?: number },
    ): Promise<GetListOfProductResponseDto> {
        const dto: GetListOfProductByProductUnitIdRequestDto = { productUnitId, page: query.page, limit: query.limit };
        return await this.productsService.getListOfProductByProductUnitId(dto);
    }

    // Get a list of products.
    // GET /api/v2/products
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of products' })
    @ApiResponse({ status: 200, description: 'A list of products has been retrieved successfully.', type: GetListOfProductResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfProducts(@Query() dto: GetListOfProductRequestDto): Promise<GetListOfProductResponseDto> {
        return await this.productsService.getListOfProducts(dto);
    }

    // --- History APIs (ADMIN) ---
    // Get a specific history version of a product.
    // GET /api/v2/products/history/:id/:version
    @Get('history/:id/:version')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get a specific history version of a product' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiParam({ name: 'version', description: 'The version number', example: 1 })
    @ApiResponse({ status: 200, description: 'A specific history version of the product has been retrieved successfully.', type: GetProductHistoryByVersionResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductHistoryByVersion(
        @Param('id') id: string,
        @Param('version', ParseIntPipe) version: number,
    ): Promise<GetProductHistoryByVersionResponseDto> {
        return await this.productsService.getProductHistoryByVersion({ id, version });
    }

    // Get history list of a product.
    // GET /api/v2/products/history/:id
    @Get('history/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get history list of a product' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiQuery({ name: 'page', description: 'Page number', example: 1, required: false })
    @ApiQuery({ name: 'limit', description: 'Page size', example: 10, required: false })
    @ApiResponse({ status: 200, description: 'A history list of the product has been retrieved successfully.', type: GetListOfProductHistoryResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductHistoryList(
        @Param('id') id: string,
        @Query() query: Pick<GetProductHistoryListRequestDto, 'page' | 'limit'>,
    ): Promise<GetListOfProductHistoryResponseDto> {
        const dto: GetProductHistoryListRequestDto = { id, page: query.page, limit: query.limit };
        return await this.productsService.getProductHistoryList(dto);
    }

    // --- Product stock history ---
    // GET /api/v2/products/stock-history/:id
    @Get('stock-history/:id')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Get stock history list of a product' })
    @ApiParam({ name: 'id', description: 'The ID of the product', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiQuery({ name: 'page', description: 'Page number', example: 1, required: false })
    @ApiQuery({ name: 'limit', description: 'Page size', example: 10, required: false })
    @ApiResponse({ status: 200, description: 'A stock history list of the product has been retrieved successfully.', type: GetListOfProductStockHistoryResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductStockHistoryList(
        @Param('id') id: string,
        @Query() query: Pick<GetProductStockHistoryListRequestDto, 'page' | 'limit'>,
    ): Promise<GetListOfProductStockHistoryResponseDto> {
        const dto: GetProductStockHistoryListRequestDto = { id, page: query.page, limit: query.limit };
        return await this.productsService.getProductStockHistoryList(dto);
    }

    // Activate or deactivate a product.
    // PATCH /api/v2/products/activation/:id/:action
    @Patch('activation/:id/:action')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Activate or deactivate a product' })
    @ApiParam({ name: 'id', type: String, description: 'The unique identifier of the product', example: '123e4567-e89b-12d3-a456-426614174000', required: true })
    @ApiParam({ name: 'action', type: String, description: 'Action to perform', example: 'activate', enum: ['activate', 'deactivate'], required: true })
    @ApiResponse({ status: 200, description: 'The product has been activated or deactivated successfully.', type: ProductResponseDtoWithHistory })
    @HttpCode(HttpStatus.OK)
    async activateOrDeactivateProduct(
        @Param('id') id: string,
        @Param('action') action: 'activate' | 'deactivate',
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ProductResponseDtoWithHistory> {
        return await this.productsService.deactivateOrActivateProduct(id, user, action === 'activate');
    }
}
