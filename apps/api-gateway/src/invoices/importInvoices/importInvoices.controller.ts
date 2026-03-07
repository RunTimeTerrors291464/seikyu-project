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
    CreateImportInvoiceRequestDto,
    EditImportInvoiceRequestDto,
    GetListOfImportInvoiceRequestDto,
} from '@app/common/dtos/invoices/importInvoices/crudImportInvoicesRequest.dto';
import {
    ImportInvoiceResponseDto,
    GetListOfImportInvoicesResponseDto
} from '@app/common/dtos/invoices/importInvoices/crudImportInvoicesResponse.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Invoices] Import Invoices: These APIs are for import invoices management.')
@Controller({
    path: 'api/v1/invoices/import',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ImportInvoicesController {
    constructor(
        @Inject('INVOICES_SERVICE') private readonly invoicesService: ClientProxy,
        private readonly logsService: LogsService,
    ) { }

    // Create a draft import invoice.
    // POST /api/v1/invoices/import/draft
    @Post('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new draft import invoice' })
    @ApiBody({ type: CreateImportInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A draft import invoice has been created successfully.', type: ImportInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftImportInvoice(@Body() dto: CreateImportInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ImportInvoiceResponseDto> {
        try {
            const result: ImportInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'import-invoices.createDraft' }, { dto, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.CREATE_DRAFT_IMPORT_INVOICE,
                referenceType: ReferenceType.IMPORT_INVOICE,
                referenceId: result.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Edit a draft import invoice.
    // PATCH /api/v1/invoices/import/draft
    @Patch('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft import invoice' })
    @ApiBody({ type: EditImportInvoiceRequestDto })
    @ApiResponse({ status: 200, description: 'A draft import invoice has been edited successfully.', type: ImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftImportInvoice(@Body() dto: EditImportInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ImportInvoiceResponseDto> {
        try {
            const result: ImportInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'import-invoices.editDraft' }, { dto, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.EDIT_DRAFT_IMPORT_INVOICE,
                referenceType: ReferenceType.IMPORT_INVOICE,
                referenceId: result.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Delete draft import invoices.
    // DELETE /api/v1/invoices/import/draft
    @Delete('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft import invoices' })
    @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } })
    @ApiResponse({ status: 204, description: 'Draft import invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteDraftImportInvoice(@Body() body: { ids: string[] }, @CurrentUser() user: AccessTokenPayload): Promise<boolean> {
        try {
            await firstValueFrom(
                this.invoicesService.send({ cmd: 'import-invoices.deleteDraft' }, { ids: body.ids, user }),
                { defaultValue: null }
            );

            // Log the result.
            await Promise.all(
                body.ids.map((id) =>
                    this.logsService.createLog({
                        role: Role.MANAGER,
                        actionUserId: user.id,
                        action: LogCode.DELETE_DRAFT_IMPORT_INVOICES,
                        referenceType: ReferenceType.IMPORT_INVOICE,
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

    // Confirm an import invoice.
    // PATCH /api/v1/invoices/import/:id/confirm
    @Patch(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm an import invoice' })
    @ApiParam({ name: 'id', description: 'The ID of the import invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'An import invoice has been confirmed successfully.', type: ImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmImportInvoice(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<ImportInvoiceResponseDto> {
        try {
            const result: ImportInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'import-invoices.confirm' }, { id, user })
            );

            // Log the result.
            await this.logsService.createLog({
                role: Role.MANAGER,
                actionUserId: user.id,
                action: LogCode.CONFIRM_IMPORT_INVOICE,
                referenceType: ReferenceType.IMPORT_INVOICE,
                referenceId: result.id,
            });

            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get an import invoice by ID.
    // GET /api/v1/invoices/import/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get an import invoice by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the import invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'An import invoice has been retrieved successfully.', type: ImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getImportInvoiceById(@Param('id') id: string): Promise<ImportInvoiceResponseDto> {
        try {
            const result: ImportInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'import-invoices.getById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of import invoices.
    // GET /api/v1/invoices/import
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of import invoices' })
    @ApiResponse({ status: 200, description: 'A list of import invoices has been retrieved successfully.', type: GetListOfImportInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfImportInvoices(@Query() dto: GetListOfImportInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<GetListOfImportInvoicesResponseDto> {
        try {
            const result: GetListOfImportInvoicesResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'import-invoices.getList' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}
