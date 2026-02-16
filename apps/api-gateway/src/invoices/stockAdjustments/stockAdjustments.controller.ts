import { Controller, Post, Patch, Delete, Get, Body, Param, Inject, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

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
    CreateStockAdjustmentRequestDto,
    EditStockAdjustmentRequestDto,
    GetListOfStockAdjustmentRequestDto,
} from '@app/common/dtos/invoices/stockAdjustments/crudStockAdjustmentRequest.dto';
import {
    StockAdjustmentResponseDto,
    GetListOfStockAdjustmentsResponseDto
} from '@app/common/dtos/invoices/stockAdjustments/crudStockAdjustmentResponse.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Invoices] Stock Adjustments: These APIs are for stock adjustments management.')
@Controller({
    path: 'api/v1/invoices/stock-adjustments',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StockAdjustmentsController {
    constructor(
        @Inject('INVOICES_SERVICE') private readonly invoicesService: ClientProxy,
    ) { }

    // Create a draft stock adjustment.
    // POST /api/v1/invoices/stock-adjustments/draft
    @Post('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new draft stock adjustment' })
    @ApiBody({ type: CreateStockAdjustmentRequestDto })
    @ApiResponse({ status: 201, description: 'A draft stock adjustment has been created successfully.', type: StockAdjustmentResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftStockAdjustment(@Body() dto: CreateStockAdjustmentRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<StockAdjustmentResponseDto> {
        try {
            const result: StockAdjustmentResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'invoices.stockAdjustments.createDraft' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Edit a draft stock adjustment.
    // PATCH /api/v1/invoices/stock-adjustments/draft
    @Patch('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft stock adjustment' })
    @ApiBody({ type: EditStockAdjustmentRequestDto })
    @ApiResponse({ status: 200, description: 'A draft stock adjustment has been edited successfully.', type: StockAdjustmentResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftStockAdjustment(@Body() dto: EditStockAdjustmentRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<StockAdjustmentResponseDto> {
        try {
            const result: StockAdjustmentResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'invoices.stockAdjustments.editDraft' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Delete draft stock adjustments.
    // DELETE /api/v1/invoices/stock-adjustments/draft
    @Delete('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft stock adjustments' })
    @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } })
    @ApiResponse({ status: 204, description: 'Draft stock adjustments have been deleted successfully.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteDraftStockAdjustment(@Body() body: { ids: string[] }, @CurrentUser() user: AccessTokenPayload): Promise<boolean> {
        try {
            await firstValueFrom(
                this.invoicesService.send({ cmd: 'invoices.stockAdjustments.deleteDraft' }, { ids: body.ids, user }),
                { defaultValue: null }
            );
            return true;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Confirm a stock adjustment.
    // PATCH /api/v1/invoices/stock-adjustments/:id/confirm
    @Patch(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm a stock adjustment' })
    @ApiParam({ name: 'id', description: 'The ID of the stock adjustment', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A stock adjustment has been confirmed successfully.', type: StockAdjustmentResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmStockAdjustment(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<StockAdjustmentResponseDto> {
        try {
            const result: StockAdjustmentResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'invoices.stockAdjustments.confirm' }, { id, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a stock adjustment by ID.
    // GET /api/v1/invoices/stock-adjustments/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a stock adjustment by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the stock adjustment', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A stock adjustment has been retrieved successfully.', type: StockAdjustmentResponseDto })
    @HttpCode(HttpStatus.OK)
    async getStockAdjustmentById(@Param('id') id: string): Promise<StockAdjustmentResponseDto> {
        try {
            const result: StockAdjustmentResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'invoices.stockAdjustments.getById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of stock adjustments.
    // GET /api/v1/invoices/stock-adjustments
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a list of stock adjustments' })
    @ApiResponse({ status: 200, description: 'A list of stock adjustments has been retrieved successfully.', type: GetListOfStockAdjustmentsResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfStockAdjustments(@Query() dto: GetListOfStockAdjustmentRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<GetListOfStockAdjustmentsResponseDto> {
        try {
            const result: GetListOfStockAdjustmentsResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'invoices.stockAdjustments.getList' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}
