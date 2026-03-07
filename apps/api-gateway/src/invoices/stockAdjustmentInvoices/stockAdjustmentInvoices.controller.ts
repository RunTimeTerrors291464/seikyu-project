import { Controller, Post, Patch, Delete, Get, Body, Param, Inject, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

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
    CreateStockAdjustmentInvoiceRequestDto,
    EditStockAdjustmentInvoiceRequestDto,
    GetListOfStockAdjustmentInvoiceRequestDto,
} from '@app/common/dtos/invoices/stockAdjustmentInvoices/crudStockAdjustmentInvoicesRequest.dto';
import {
    StockAdjustmentInvoiceResponseDto,
    GetListOfStockAdjustmentInvoicesResponseDto,
} from '@app/common/dtos/invoices/stockAdjustmentInvoices/crudStockAdjustmentInvoicesResponse.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Invoices] Stock Adjustment Invoices: These APIs are for stock adjustment invoices management.')
@Controller({
    path: 'api/v1/invoices/stock-adjustment',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StockAdjustmentInvoicesController {
    constructor(
        @Inject('INVOICES_SERVICE') private readonly invoicesService: ClientProxy,
        private readonly logsService: LogsService,
    ) { }

    // Create a draft stock adjustment invoice.
    // POST /api/v1/invoices/stock-adjustment/draft
    @Post('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new draft stock adjustment invoice' })
    @ApiBody({ type: CreateStockAdjustmentInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A draft stock adjustment invoice has been created successfully.', type: StockAdjustmentInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftStockAdjustmentInvoice(@Body() dto: CreateStockAdjustmentInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {
        try {
            const result: StockAdjustmentInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'stock-adjustment-invoices.createDraft' }, { dto, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.CREATE_DRAFT_STOCK_ADJUSTMENT_INVOICE,
                referenceType: ReferenceType.STOCK_ADJUSTMENT_INVOICE,
                referenceId: result.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Edit a draft stock adjustment invoice.
    // PATCH /api/v1/invoices/stock-adjustment/draft
    @Patch('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft stock adjustment invoice' })
    @ApiBody({ type: EditStockAdjustmentInvoiceRequestDto })
    @ApiResponse({ status: 200, description: 'A draft stock adjustment invoice has been edited successfully.', type: StockAdjustmentInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftStockAdjustmentInvoice(@Body() dto: EditStockAdjustmentInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {
        try {
            const result: StockAdjustmentInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'stock-adjustment-invoices.editDraft' }, { dto, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.EDIT_DRAFT_STOCK_ADJUSTMENT_INVOICE,
                referenceType: ReferenceType.STOCK_ADJUSTMENT_INVOICE,
                referenceId: result.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Delete draft stock adjustment invoices.
    // DELETE /api/v1/invoices/stock-adjustment/draft
    @Delete('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft stock adjustment invoices' })
    @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } })
    @ApiResponse({ status: 204, description: 'Draft stock adjustment invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteDraftStockAdjustmentInvoice(@Body() body: { ids: string[] }, @CurrentUser() user: AccessTokenPayload): Promise<boolean> {
        try {
            await firstValueFrom(
                this.invoicesService.send({ cmd: 'stock-adjustment-invoices.deleteDraft' }, { ids: body.ids, user }),
                { defaultValue: null }
            );

            // Log the result.
            await Promise.all(
                body.ids.map((id) =>
                    this.logsService.createLog({
                        role: Role.MANAGER,
                        actionUserId: user.id,
                        action: LogCode.DELETE_DRAFT_STOCK_ADJUSTMENT_INVOICES,
                        referenceType: ReferenceType.STOCK_ADJUSTMENT_INVOICE,
                        referenceId: id,
                    })
                )
            );

            return true;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Confirm a stock adjustment invoice.
    // PATCH /api/v1/invoices/stock-adjustment/:id/confirm
    @Patch(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm a stock adjustment invoice' })
    @ApiParam({ name: 'id', description: 'The UUID of the stock adjustment invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A stock adjustment invoice has been confirmed successfully.', type: StockAdjustmentInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmStockAdjustmentInvoice(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {
        try {
            const result: StockAdjustmentInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'stock-adjustment-invoices.confirm' }, { id, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.CONFIRM_STOCK_ADJUSTMENT_INVOICE,
                referenceType: ReferenceType.STOCK_ADJUSTMENT_INVOICE,
                referenceId: result.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a stock adjustment invoice by ID.
    // GET /api/v1/invoices/stock-adjustment/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a stock adjustment invoice by ID' })
    @ApiParam({ name: 'id', description: 'The UUID of the stock adjustment invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A stock adjustment invoice has been retrieved successfully.', type: StockAdjustmentInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getStockAdjustmentInvoiceById(@Param('id') id: string): Promise<StockAdjustmentInvoiceResponseDto> {
        try {
            const result: StockAdjustmentInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'stock-adjustment-invoices.getById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of stock adjustment invoices.
    // GET /api/v1/invoices/stock-adjustment
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of stock adjustment invoices' })
    @ApiResponse({ status: 200, description: 'A list of stock adjustment invoices has been retrieved successfully.', type: GetListOfStockAdjustmentInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfStockAdjustmentInvoices(@Query() dto: GetListOfStockAdjustmentInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<GetListOfStockAdjustmentInvoicesResponseDto> {
        try {
            const result: GetListOfStockAdjustmentInvoicesResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'stock-adjustment-invoices.getList' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}
