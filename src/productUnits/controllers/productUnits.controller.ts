import { Controller, Post, Get, Patch, Body, Param, HttpCode, HttpStatus, Query, UseGuards, ParseIntPipe } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

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
import { ProductUnitsService } from '../services/productUnits.service';

// Import DTOs.
import {
    CreateProductUnitRequestDto,
    EditProductUnitRequestDto,
    GetListOfProductUnitRequestDto,
} from '@libs/common/dtos/productUnits/crudProductUnitRequest.dto';
import {
    GetListOfProductUnitResponseDto,
    ProductUnitResponseDto,
    ProductUnitResponseDtoWithHistory,
} from '@libs/common/dtos/productUnits/crudProductUnitResponse.dto';
import {
    ProductUnitHistoryItemResponseDto,
    GetProductUnitHistoryByVersionResponseDto,
} from '@libs/common/dtos/productUnits/crudProductUnitHistoryResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Product Units] These APIs are for product units management.')
@Controller({
    path: 'api/v1/product-units',
    version: '1',
})
    @UseGuards(JwtAuthGuard, RolesGuard, RateLimitGuard)
@ApiBearerAuth()
export class ProductUnitsController {
    constructor(private readonly productUnitsService: ProductUnitsService) { }

    // Create a new product unit.
    // POST /api/v1/product-units
    @Post()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new product unit' })
    @ApiBody({ type: CreateProductUnitRequestDto })
    @ApiResponse({ status: 201, description: 'A product unit has been created successfully.', type: ProductUnitResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createNewProductUnit(@Body() dto: CreateProductUnitRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ProductUnitResponseDto> {
        return await this.productUnitsService.createNewProductUnit(dto, user);
    }

    // Edit a product unit.
    // PATCH /api/v1/product-units
    @Patch()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a product unit' })
    @ApiBody({ type: EditProductUnitRequestDto })
    @ApiResponse({ status: 200, description: 'A product unit has been edited successfully.', type: ProductUnitResponseDtoWithHistory })
    @HttpCode(HttpStatus.OK)
    async editProductUnit(@Body() dto: EditProductUnitRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ProductUnitResponseDtoWithHistory> {
        return await this.productUnitsService.editProductUnit(dto, user);
    }

    // PATCH /api/v1/product-units/activation/:id/:action
    @Patch('activation/:id/:action')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Activate or deactivate a product unit' })
    @ApiParam({ name: 'id', type: String, description: 'The unique identifier of the product unit', example: '123e4567-e89b-12d3-a456-426614174000', required: true })
    @ApiParam({ name: 'action', type: String, description: 'Action to perform', example: 'activate', enum: ['activate', 'deactivate'], required: true })
    @ApiResponse({ status: 200, description: 'The product unit has been activated or deactivated successfully.', type: ProductUnitResponseDtoWithHistory })
    @HttpCode(HttpStatus.OK)
    async activateOrDeactivateProductUnit(
        @Param('id') id: string,
        @Param('action') action: 'activate' | 'deactivate',
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ProductUnitResponseDtoWithHistory> {
        return await this.productUnitsService.deactivateOrActivateProductUnit(id, user, action === 'activate');
    }

    // Get a list of product units.
    // GET /api/v1/product-units
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a list of product units' })
    @ApiResponse({ status: 200, description: 'A list of product units has been retrieved successfully.', type: GetListOfProductUnitResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfProductUnits(@Query() dto: GetListOfProductUnitRequestDto): Promise<GetListOfProductUnitResponseDto> {
        return await this.productUnitsService.getListOfProductUnits(dto);
    }

    // Get a product unit by id.
    // GET /api/v1/product-units/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a product unit by id' })
    @ApiParam({ name: 'id', description: 'The unique identifier of the product unit', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A product unit has been retrieved successfully.', type: ProductUnitResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductUnitById(@Param('id') id: string): Promise<ProductUnitResponseDto> {
        return await this.productUnitsService.getProductUnitByIdResponseDto(id);
    }

    // --- History APIs (ADMIN) ---
    // Get a specific history version of a product unit.
    // GET /api/v1/product-units/history/:id/:version
    @Get('history/:id/:version')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get a specific history version of a product unit' })
    @ApiParam({ name: 'id', description: 'The unique identifier of the product unit', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiParam({ name: 'version', description: 'The version number', example: 1 })
    @ApiResponse({ status: 200, description: 'A specific history version of the product unit has been retrieved successfully.', type: GetProductUnitHistoryByVersionResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductUnitHistoryByVersion(
        @Param('id') productUnitId: string,
        @Param('version', ParseIntPipe) version: number,
    ): Promise<GetProductUnitHistoryByVersionResponseDto> {
        return await this.productUnitsService.getProductUnitHistoryByVersion({ productUnitId, version });
    }

    // Get history list of a product unit.
    // GET /api/v1/product-units/history/:id
    @Get('history/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get history list of a product unit' })
    @ApiParam({ name: 'id', description: 'The unique identifier of the product unit', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A history list of the product unit has been retrieved successfully.', type: ProductUnitHistoryItemResponseDto, isArray: true })
    @HttpCode(HttpStatus.OK)
    async getProductUnitHistoryList(@Param('id') productUnitId: string): Promise<ProductUnitHistoryItemResponseDto[]> {
        return await this.productUnitsService.getProductUnitHistoryList({ productUnitId });
    }
}
