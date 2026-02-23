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
    CreateReturnImportInvoiceRequestDto,
    EditReturnImportInvoiceRequestDto,
    GetListOfReturnImportInvoiceRequestDto,
} from '@app/common/dtos/invoices/returnImportInvoices/crudReturnImportInvoicesRequest.dto';
import {
    ReturnImportInvoiceResponseDto,
    GetListOfReturnImportInvoicesResponseDto
} from '@app/common/dtos/invoices/returnImportInvoices/crudReturnImportInvoicesResponse.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Invoices] Return Import Invoices: These APIs are for return import invoices management.')
@Controller({
    path: 'api/v1/invoices/return-import',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReturnImportInvoicesController {
    constructor(
        @Inject('INVOICES_SERVICE') private readonly invoicesService: ClientProxy,
    ) { }

    // Create a draft return import invoice.
    // POST /api/v1/invoices/return-import/draft
    @Post('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new draft return import invoice' })
    @ApiBody({ type: CreateReturnImportInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A draft return import invoice has been created successfully.', type: ReturnImportInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftReturnImportInvoice(@Body() dto: CreateReturnImportInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {
        try {
            const result: ReturnImportInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-import-invoices.createDraft' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Edit a draft return import invoice.
    // PATCH /api/v1/invoices/return-import/draft
    @Patch('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft return import invoice' })
    @ApiBody({ type: EditReturnImportInvoiceRequestDto })
    @ApiResponse({ status: 200, description: 'A draft return import invoice has been edited successfully.', type: ReturnImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftReturnImportInvoice(@Body() dto: EditReturnImportInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {
        try {
            const result: ReturnImportInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-import-invoices.editDraft' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Delete draft return import invoices.
    // DELETE /api/v1/invoices/return-import/draft
    @Delete('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft return import invoices' })
    @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } })
    @ApiResponse({ status: 204, description: 'Draft return import invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteDraftReturnImportInvoice(@Body() body: { ids: string[] }, @CurrentUser() user: AccessTokenPayload): Promise<boolean> {
        try {
            await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-import-invoices.deleteDraft' }, { ids: body.ids, user }),
                { defaultValue: null }
            );
            return true;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Confirm a return import invoice.
    // PATCH /api/v1/invoices/return-import/:id/confirm
    @Patch(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm a return import invoice' })
    @ApiParam({ name: 'id', description: 'The ID of the return import invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A return import invoice has been confirmed successfully.', type: ReturnImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmReturnImportInvoice(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {
        try {
            const result: ReturnImportInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-import-invoices.confirm' }, { id, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a return import invoice by ID.
    // GET /api/v1/invoices/return-import/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a return import invoice by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the return import invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A return import invoice has been retrieved successfully.', type: ReturnImportInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getReturnImportInvoiceById(@Param('id') id: string): Promise<ReturnImportInvoiceResponseDto> {
        try {
            const result: ReturnImportInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-import-invoices.getById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of return import invoices.
    // GET /api/v1/invoices/return-import
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER] Get a list of return import invoices' })
    @ApiResponse({ status: 200, description: 'A list of return import invoices has been retrieved successfully.', type: GetListOfReturnImportInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfReturnImportInvoices(@Query() dto: GetListOfReturnImportInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<GetListOfReturnImportInvoicesResponseDto> {
        try {
            const result: GetListOfReturnImportInvoicesResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-import-invoices.getList' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}
