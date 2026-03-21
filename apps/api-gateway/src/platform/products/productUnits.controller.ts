import { Controller, Post, Put, Get, Patch, Body, Param, Inject, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/guards';
import { CurrentUser } from '../../auth/guards/decorators/current-user.decorator';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import enums.
import { Role } from '@app/common/enums/role.enum';
import { LogCode, ReferenceType } from '@app/common/enums/logEnums.enum';

// Import services.
import { LogsService } from '../../logs/services/logs.service';

// Import microservices client proxy.
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Import DTOs.
import {
    CreateProductUnitRequestDto,
    EditProductUnitRequestDto,
    GetListOfProductUnitRequestDto,
} from '@app/common/dtos/platform/products/crudProductUnitRequest.dto';
import {
    ProductUnitResponseDto,
    ProductUnitResponseDtoWithHistory,
    GetListOfProductUnitResponseDto,
} from '@app/common/dtos/platform/products/crudProductunitResponse.dto';
import {
    ProductUnitHistoryItemResponseDto,
    GetProductUnitHistoryByVersionResponseDto,
} from '@app/common/dtos/platform/products/history/crudProductUnit.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Platform] Product Units: These APIs are for product units management.')
@Controller({
    path: 'api/v1/product-units',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductUnitsController {
    constructor(
        @Inject('PLATFORM_SERVICE') private readonly platformService: ClientProxy,
        private readonly logsService: LogsService,
    ) { }

    // Create a new product unit.
    // POST /api/v1/product-units
    @Post()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new product unit' })
    @ApiBody({ type: CreateProductUnitRequestDto })
    @ApiResponse({ status: 201, description: 'A product unit has been created successfully.', type: ProductUnitResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createNewProductUnit(@Body() dto: CreateProductUnitRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ProductUnitResponseDto> {
        try {
            const result: ProductUnitResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.createProductUnit' }, { dto, user })
            );

             // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.CREATE_NEW_PRODUCT_UNIT,
                referenceType: ReferenceType.PRODUCT_UNIT,
                referenceId: result.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
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
        try {
            const result: ProductUnitResponseDtoWithHistory = await firstValueFrom(
                this.platformService.send({ cmd: 'products.editProductUnit' }, { dto, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.EDIT_PRODUCT_UNIT,
                referenceType: ReferenceType.PRODUCT_UNIT,
                referenceId: result.productUnit.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
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
        try {
            const result: ProductUnitResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductUnitById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of product units.
    // GET /api/v1/product-units
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a list of product units' })
    @ApiResponse({ status: 200, description: 'A list of product units has been retrieved successfully.', type: GetListOfProductUnitResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfProductUnits(@Query() dto: GetListOfProductUnitRequestDto): Promise<GetListOfProductUnitResponseDto> {
        try {
            const result: GetListOfProductUnitResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getListOfProductUnits' }, dto)
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Deactivate a product unit.
    // PATCH /api/v1/product-units/:id/deactivate
    @Patch(':id/deactivate')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Deactivate a product unit' })
    @ApiParam({ name: 'id', description: 'The unique identifier of the product unit', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A product unit has been deactivated successfully.', type: ProductUnitResponseDtoWithHistory })
    @HttpCode(HttpStatus.OK)
    async deactivateProductUnit(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<ProductUnitResponseDtoWithHistory> {
        try {
            const result: ProductUnitResponseDtoWithHistory = await firstValueFrom(
                this.platformService.send({ cmd: 'products.deactivateProductUnit' }, { id, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.DEACTIVATE_PRODUCT_UNIT,
                referenceType: ReferenceType.PRODUCT_UNIT,
                referenceId: result.productUnit.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Activate a product unit.
    // PATCH /api/v1/product-units/:id/activate
    @Patch(':id/activate')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Activate a product unit' })
    @ApiParam({ name: 'id', description: 'The unique identifier of the product unit', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A product unit has been activated successfully.', type: ProductUnitResponseDtoWithHistory })
    @HttpCode(HttpStatus.OK)
    async activateProductUnit(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<ProductUnitResponseDtoWithHistory> {
        try {
            const result: ProductUnitResponseDtoWithHistory = await firstValueFrom(
                this.platformService.send({ cmd: 'products.activateProductUnit' }, { id, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.ACTIVATE_PRODUCT_UNIT,
                referenceType: ReferenceType.PRODUCT_UNIT,
                referenceId: result.productUnit.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // --- History APIs ---
    // Get history list of a product unit.
    // GET /api/v1/product-units/history/:id
    @Get('history/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get history list of a product unit' })
    @ApiParam({ name: 'id', description: 'The unique identifier of the product unit', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A history list of the product unit has been retrieved successfully.', type: [ProductUnitHistoryItemResponseDto] })
    @HttpCode(HttpStatus.OK)
    async getProductUnitHistoryList(@Param('id') id: string): Promise<ProductUnitHistoryItemResponseDto[]> {
        try {
            const result: ProductUnitHistoryItemResponseDto[] = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductUnitHistoryList' }, { productUnitId: id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a specific history version of a product unit.
    // GET /api/v1/product-units/:id/history/:version
    @Get('history/:id/:version')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get a specific history version of a product unit' })
    @ApiParam({ name: 'id', description: 'The unique identifier of the product unit', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiParam({ name: 'version', description: 'The version number', example: 1 })
    @ApiResponse({ status: 200, description: 'A specific history version of the product unit has been retrieved successfully.', type: GetProductUnitHistoryByVersionResponseDto })
    @HttpCode(HttpStatus.OK)
    async getProductUnitHistoryByVersion(@Param('id') id: string, @Param('version') version: string): Promise<GetProductUnitHistoryByVersionResponseDto> {
        try {
            const result: GetProductUnitHistoryByVersionResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'products.getProductUnitHistoryByVersion' }, { productUnitId: id, version: parseInt(version, 10) })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

}