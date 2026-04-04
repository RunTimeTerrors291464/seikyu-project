import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

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
import { SellingInvoiceService } from '../services/sellingInvoice.service';

// Import DTOs.
import {
    CreateSellingInvoiceRequestDto,
    GetListOfSellingInvoiceRequestDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudSellingInvoicesRequest.dto';
import {
    SellingInvoiceResponseDto,
    GetListOfSellingInvoicesResponseDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudSellingInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Selling Invoices] These APIs are for selling invoices management.')
@Controller({
    path: 'api/v1/invoices/selling',
    version: '1',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class SellingInvoiceController {
    constructor(private readonly sellingInvoiceService: SellingInvoiceService) { }

    // Create a new selling invoice.
    // POST /api/v1/invoices/selling
    @Post()
    @Roles(Role.CASHIER)
    @ApiOperation({ summary: '[CASHIER] Create a new selling invoice' })
    @ApiBody({ type: CreateSellingInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A selling invoice has been created successfully.', type: SellingInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createSellingInvoice(
        @Body() dto: CreateSellingInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<SellingInvoiceResponseDto> {
        return await this.sellingInvoiceService.createSellingInvoice(dto, user);
    }

    // Get a list of selling invoices.
    // GET /api/v1/invoices/selling
    @Get()
    @Roles(Role.MANAGER, Role.CASHIER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, CASHIER, ADMIN] Get a list of selling invoices' })
    @ApiResponse({ status: 200, description: 'A list of selling invoices has been retrieved successfully.', type: GetListOfSellingInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfSellingInvoices(@Query() dto: GetListOfSellingInvoiceRequestDto): Promise<GetListOfSellingInvoicesResponseDto> {
        return await this.sellingInvoiceService.getListOfSellingInvoices(dto);
    }

    // Get a selling invoice by ID.
    // GET /api/v1/invoices/selling/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.CASHIER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, CASHIER, ADMIN] Get a selling invoice by ID' })
    @ApiParam({ name: 'id', description: 'The UUID of the selling invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'A selling invoice has been retrieved successfully.', type: SellingInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getSellingInvoiceById(@Param('id') id: string): Promise<SellingInvoiceResponseDto> {
        return await this.sellingInvoiceService.getSellingInvoiceById(id);
    }
}
