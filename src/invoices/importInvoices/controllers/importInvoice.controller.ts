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
    path: 'api/v2/invoices/import',
    version: '2',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class ImportInvoiceController {
    constructor(private readonly importInvoiceService: ImportInvoiceService) { }

    // Create a draft import invoice.
    // POST /api/v2/invoices/import
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
    // PATCH /api/v2/invoices/import
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

    // Delete import invoices (drafts permanently, confirmed ones hidden).
    // DELETE /api/v2/invoices/import
    @Delete()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete import invoices. Drafts are removed permanently; confirmed invoices are hidden together with their return import invoices and cannot be restored.' })
    @ApiBody({ type: DeleteDraftImportInvoicesRequestDto })
    @ApiResponse({ status: 200, description: 'The import invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.OK)
    async deleteImportInvoices(
        @Body() body: DeleteDraftImportInvoicesRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<boolean> {
        return await this.importInvoiceService.deleteImportInvoices(body.ids, user);
    }

    // Confirm a draft import invoice.
    // POST /api/v2/invoices/import/:id/confirm
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
    // GET /api/v2/invoices/import
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of import invoices' })
    @ApiResponse({ status: 200, description: 'A list of import invoices has been retrieved successfully.', type: GetListOfImportInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfImportInvoices(@Query() dto: GetListOfImportInvoiceRequestDto): Promise<GetListOfImportInvoicesResponseDto> {
        return await this.importInvoiceService.getListOfImportInvoices(dto);
    }

    // Get an import invoice by ID.
    // GET /api/v2/invoices/import/:id
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
