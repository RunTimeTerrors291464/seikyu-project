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
import { ReturnImportInvoiceService } from '../services/returnImportInvoice.service';

// Import DTOs.
import {
    CreateReturnImportInvoiceRequestDto,
    EditReturnImportInvoiceRequestDto,
    GetListOfReturnImportInvoiceRequestDto,
    DeleteDraftReturnImportInvoicesRequestDto,
} from '@libs/common/dtos/invoices/importInvoices/crudReturnImportInvoicesRequest.dto';
import {
    ReturnImportInvoiceResponseDto,
    GetListOfReturnImportInvoicesResponseDto,
} from '@libs/common/dtos/invoices/importInvoices/crudReturnImportInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Return Import Invoices] These APIs are for return import invoices management.')
@Controller({
    path: 'api/v1/return-import-invoices',
    version: '1',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class ReturnImportInvoiceController {
    constructor(private readonly returnImportInvoiceService: ReturnImportInvoiceService) { }

    // Create a draft return import invoice.
    // POST /api/v1/return-import-invoices
    @Post()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a draft return import invoice' })
    @ApiBody({ type: CreateReturnImportInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A draft return import invoice has been created successfully.', type: ReturnImportInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftReturnImportInvoice(
        @Body() dto: CreateReturnImportInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ReturnImportInvoiceResponseDto> {
        return await this.returnImportInvoiceService.createDraftReturnImportInvoice(dto, user);
    }

    // Edit a draft return import invoice.
    // PATCH /api/v1/return-import-invoices
    @Patch()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft return import invoice' })
    @ApiBody({ type: EditReturnImportInvoiceRequestDto })
    @ApiResponse({ status: 200, description: 'The draft return import invoice has been edited successfully.', type: ReturnImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftReturnImportInvoice(
        @Body() dto: EditReturnImportInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ReturnImportInvoiceResponseDto> {
        return await this.returnImportInvoiceService.editDraftReturnImportInvoice(dto, user);
    }

    // Delete draft return import invoices.
    // DELETE /api/v1/return-import-invoices
    @Delete()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft return import invoices' })
    @ApiBody({ type: DeleteDraftReturnImportInvoicesRequestDto })
    @ApiResponse({ status: 200, description: 'The draft return import invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.OK)
    async deleteDraftReturnImportInvoice(
        @Body() body: DeleteDraftReturnImportInvoicesRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<boolean> {
        await this.returnImportInvoiceService.deleteDraftReturnImportInvoice(body.ids, user);
        return true;
    }

    // Confirm a draft return import invoice.
    // POST /api/v1/return-import-invoices/:id/confirm
    @Post(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm a draft return import invoice' })
    @ApiParam({ name: 'id', description: 'The UUID of the return import invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'The return import invoice has been confirmed successfully.', type: ReturnImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmReturnImportInvoice(
        @Param('id') id: string,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ReturnImportInvoiceResponseDto> {
        return await this.returnImportInvoiceService.confirmReturnImportInvoice(id, user);
    }

    // Get a list of return import invoices.
    // GET /api/v1/return-import-invoices
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of return import invoices' })
    @ApiResponse({ status: 200, description: 'A list of return import invoices has been retrieved successfully.', type: GetListOfReturnImportInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfReturnImportInvoices(@Query() dto: GetListOfReturnImportInvoiceRequestDto): Promise<GetListOfReturnImportInvoicesResponseDto> {
        return await this.returnImportInvoiceService.getListOfReturnImportInvoices(dto);
    }

    // Get a return import invoice by ID.
    // GET /api/v1/return-import-invoices/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a return import invoice by ID' })
    @ApiParam({ name: 'id', description: 'The UUID of the return import invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'A return import invoice has been retrieved successfully.', type: ReturnImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getReturnImportInvoiceById(@Param('id') id: string): Promise<ReturnImportInvoiceResponseDto> {
        return await this.returnImportInvoiceService.getReturnImportInvoiceById(id);
    }
}
