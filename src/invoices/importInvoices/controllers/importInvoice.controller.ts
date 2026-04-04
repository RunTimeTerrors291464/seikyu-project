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
import { ImportInvoiceService } from '../services/importInvoice.service';

// Import DTOs.
import {
    CreateImportInvoiceRequestDto,
    EditImportInvoiceRequestDto,
    GetListOfImportInvoiceRequestDto,
    DeleteDraftImportInvoicesRequestDto,
} from '@libs/common/dtos/invoices/importInvoices/crudImportInvoicesRequest.dto';
import {
    ImportInvoiceResponseDto,
    GetListOfImportInvoicesResponseDto,
} from '@libs/common/dtos/invoices/importInvoices/crudImportInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Import Invoices] These APIs are for import invoices management.')
@Controller({
    path: 'api/v1/import-invoices',
    version: '1',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class ImportInvoiceController {
    constructor(private readonly importInvoiceService: ImportInvoiceService) { }

    // Create a draft import invoice.
    // POST /api/v1/import-invoices
    @Post()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a draft import invoice' })
    @ApiBody({ type: CreateImportInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A draft import invoice has been created successfully.', type: ImportInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftImportInvoice(
        @Body() dto: CreateImportInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ImportInvoiceResponseDto> {
        return await this.importInvoiceService.createDraftImportInvoice(dto, user);
    }

    // Edit a draft import invoice.
    // PATCH /api/v1/import-invoices
    @Patch()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft import invoice' })
    @ApiBody({ type: EditImportInvoiceRequestDto })
    @ApiResponse({ status: 200, description: 'The draft import invoice has been edited successfully.', type: ImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftImportInvoice(
        @Body() dto: EditImportInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ImportInvoiceResponseDto> {
        return await this.importInvoiceService.editDraftImportInvoice(dto, user);
    }

    // Delete draft import invoices.
    // DELETE /api/v1/import-invoices
    @Delete()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft import invoices' })
    @ApiBody({ type: DeleteDraftImportInvoicesRequestDto })
    @ApiResponse({ status: 200, description: 'The draft import invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.OK)
    async deleteDraftImportInvoice(
        @Body() body: DeleteDraftImportInvoicesRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<boolean> {
        return await this.importInvoiceService.deleteDraftImportInvoice(body.ids, user);
    }

    // Confirm a draft import invoice.
    // POST /api/v1/import-invoices/:id/confirm
    @Post(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm a draft import invoice' })
    @ApiParam({ name: 'id', description: 'The UUID of the import invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'The import invoice has been confirmed successfully.', type: ImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmImportInvoice(
        @Param('id') id: string,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ImportInvoiceResponseDto> {
        return await this.importInvoiceService.confirmImportInvoice(id, user);
    }

    // Get a list of import invoices.
    // GET /api/v1/import-invoices
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of import invoices' })
    @ApiResponse({ status: 200, description: 'A list of import invoices has been retrieved successfully.', type: GetListOfImportInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfImportInvoices(@Query() dto: GetListOfImportInvoiceRequestDto): Promise<GetListOfImportInvoicesResponseDto> {
        return await this.importInvoiceService.getListOfImportInvoices(dto);
    }

    // Get an import invoice by ID.
    // GET /api/v1/import-invoices/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get an import invoice by ID' })
    @ApiParam({ name: 'id', description: 'The UUID of the import invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'An import invoice has been retrieved successfully.', type: ImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getImportInvoiceById(@Param('id') id: string): Promise<ImportInvoiceResponseDto> {
        return await this.importInvoiceService.getImportInvoiceById(id);
    }
}
