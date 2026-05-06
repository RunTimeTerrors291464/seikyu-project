import { Controller, Post, Get, Patch, Delete, Body, Param, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard } from '@src/auth/guards/jwt.guard';
import { RolesGuard } from '@src/auth/guards/roles.guard';
import { RateLimitGuard } from '@src/auth/guards/rateLimit.guard';

// Import decorators.
import { Roles } from '@src/auth/decorators/roles.decorator';
import { CurrentUser } from '@libs/common/decorators/getUserInformation.decorator';

// Import enums.
import { Role } from '@libs/common/enums/role.enum';

// Import services.
import { StockAdjustmentInvoiceService } from '../services/stockAdjustmentInvoice.service';

// Import DTOs.
import {
    CreateStockAdjustmentInvoiceRequestDto,
    EditStockAdjustmentInvoiceRequestDto,
    GetListOfStockAdjustmentInvoiceRequestDto,
    DeleteDraftStockAdjustmentInvoicesRequestDto,
} from '@libs/common/dtos/invoices/stockAdjustmentInvoice/crudStockAdjustmentInvoicesRequest.dto';
import {
    StockAdjustmentInvoiceResponseDto,
    GetListOfStockAdjustmentInvoicesResponseDto,
} from '@libs/common/dtos/invoices/stockAdjustmentInvoice/crudStockAdjustmentInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Stock Adjustment Invoices] These APIs are for stock adjustment invoices management.')
@Controller({
    path: 'api/v2/stock-adjustment-invoices',
    version: '2',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class StockAdjustmentInvoiceController {
    constructor(private readonly stockAdjustmentInvoiceService: StockAdjustmentInvoiceService) { }

    // Create a draft stock adjustment invoice.
    // POST /api/v2/stock-adjustment-invoices
    @Post()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a draft stock adjustment invoice' })
    @ApiBody({ type: CreateStockAdjustmentInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A draft stock adjustment invoice has been created successfully.', type: StockAdjustmentInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftStockAdjustmentInvoice(
        @Body() dto: CreateStockAdjustmentInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<StockAdjustmentInvoiceResponseDto> {
        return await this.stockAdjustmentInvoiceService.createDraftStockAdjustmentInvoice(dto, user);
    }

    // Edit a draft stock adjustment invoice.
    // PATCH /api/v2/stock-adjustment-invoices
    @Patch()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft stock adjustment invoice' })
    @ApiBody({ type: EditStockAdjustmentInvoiceRequestDto })
    @ApiResponse({ status: 200, description: 'The draft stock adjustment invoice has been edited successfully.', type: StockAdjustmentInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftStockAdjustmentInvoice(
        @Body() dto: EditStockAdjustmentInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<StockAdjustmentInvoiceResponseDto> {
        return await this.stockAdjustmentInvoiceService.editDraftStockAdjustmentInvoice(dto, user);
    }

    // Delete draft stock adjustment invoices.
    // DELETE /api/v2/stock-adjustment-invoices
    @Delete()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft stock adjustment invoices' })
    @ApiBody({ type: DeleteDraftStockAdjustmentInvoicesRequestDto })
    @ApiResponse({ status: 200, description: 'The draft stock adjustment invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.OK)
    async deleteDraftStockAdjustmentInvoice(
        @Body() body: DeleteDraftStockAdjustmentInvoicesRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<boolean> {
        await this.stockAdjustmentInvoiceService.deleteDraftStockAdjustmentInvoice(body.ids, user);
        return true;
    }

    // Confirm a draft stock adjustment invoice.
    // POST /api/v2/stock-adjustment-invoices/:id/confirm
    @Post(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm a draft stock adjustment invoice' })
    @ApiParam({ name: 'id', description: 'The UUID of the stock adjustment invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'The stock adjustment invoice has been confirmed successfully.', type: StockAdjustmentInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmStockAdjustmentInvoice(
        @Param('id') id: string,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<StockAdjustmentInvoiceResponseDto> {
        return await this.stockAdjustmentInvoiceService.confirmStockAdjustmentInvoice(id, user);
    }

    // Get a list of stock adjustment invoices.
    // GET /api/v2/stock-adjustment-invoices
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of stock adjustment invoices' })
    @ApiResponse({ status: 200, description: 'A list of stock adjustment invoices has been retrieved successfully.', type: GetListOfStockAdjustmentInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfStockAdjustmentInvoices(@Query() dto: GetListOfStockAdjustmentInvoiceRequestDto): Promise<GetListOfStockAdjustmentInvoicesResponseDto> {
        return await this.stockAdjustmentInvoiceService.getListOfStockAdjustmentInvoices(dto);
    }

    // Get a stock adjustment invoice by ID.
    // GET /api/v2/stock-adjustment-invoices/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a stock adjustment invoice by ID' })
    @ApiParam({ name: 'id', description: 'The UUID of the stock adjustment invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'A stock adjustment invoice has been retrieved successfully.', type: StockAdjustmentInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getStockAdjustmentInvoiceById(@Param('id') id: string): Promise<StockAdjustmentInvoiceResponseDto> {
        return await this.stockAdjustmentInvoiceService.getStockAdjustmentInvoiceById(id);
    }
}
