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
    CreateReturnSellingInvoiceRequestDto,
    EditReturnSellingInvoiceRequestDto,
    GetListOfReturnSellingInvoiceRequestDto,
} from '@app/common/dtos/invoices/returnSellingInvoices/crudReturnSellingInvoicesRequest.dto';
import {
    ReturnSellingInvoiceResponseDto,
    GetListOfReturnSellingInvoicesResponseDto
} from '@app/common/dtos/invoices/returnSellingInvoices/crudReturnSellingInvoicesResponse.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Invoices] Return Selling Invoices: These APIs are for return selling invoices management.')
@Controller({
    path: 'api/v1/invoices/return-selling',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReturnSellingInvoicesController {
    constructor(
        @Inject('INVOICES_SERVICE') private readonly invoicesService: ClientProxy,
    ) { }

    // Create a draft return selling invoice.
    // POST /api/v1/invoices/return-selling/draft
    @Post('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a new draft return selling invoice' })
    @ApiBody({ type: CreateReturnSellingInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A draft return selling invoice has been created successfully.', type: ReturnSellingInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftReturnSellingInvoice(@Body() dto: CreateReturnSellingInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {
        try {
            const result: ReturnSellingInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-selling-invoices.createDraft' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Edit a draft return selling invoice.
    // PATCH /api/v1/invoices/return-selling/draft
    @Patch('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft return selling invoice' })
    @ApiBody({ type: EditReturnSellingInvoiceRequestDto })
    @ApiResponse({ status: 200, description: 'A draft return selling invoice has been edited successfully.', type: ReturnSellingInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftReturnSellingInvoice(@Body() dto: EditReturnSellingInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {
        try {
            const result: ReturnSellingInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-selling-invoices.editDraft' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Delete draft return selling invoices.
    // DELETE /api/v1/invoices/return-selling/draft
    @Delete('draft')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft return selling invoices' })
    @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } })
    @ApiResponse({ status: 204, description: 'Draft return selling invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteDraftReturnSellingInvoice(@Body() body: { ids: string[] }, @CurrentUser() user: AccessTokenPayload): Promise<boolean> {
        try {
            await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-selling-invoices.deleteDraft' }, { ids: body.ids, user }),
                { defaultValue: null }
            );
            return true;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Confirm a return selling invoice.
    // PATCH /api/v1/invoices/return-selling/:id/confirm
    @Patch(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm a return selling invoice' })
    @ApiParam({ name: 'id', description: 'The ID of the return selling invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A return selling invoice has been confirmed successfully.', type: ReturnSellingInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmReturnSellingInvoice(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {
        try {
            const result: ReturnSellingInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-selling-invoices.confirm' }, { id, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a return selling invoice by ID.
    // GET /api/v1/invoices/return-selling/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a return selling invoice by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the return selling invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A return selling invoice has been retrieved successfully.', type: ReturnSellingInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getReturnSellingInvoiceById(@Param('id') id: string): Promise<ReturnSellingInvoiceResponseDto> {
        try {
            const result: ReturnSellingInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-selling-invoices.getById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of return selling invoices.
    // GET /api/v1/invoices/return-selling
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of return selling invoices' })
    @ApiResponse({ status: 200, description: 'A list of return selling invoices has been retrieved successfully.', type: GetListOfReturnSellingInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfReturnSellingInvoices(@Query() dto: GetListOfReturnSellingInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<GetListOfReturnSellingInvoicesResponseDto> {
        try {
            const result: GetListOfReturnSellingInvoicesResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'return-selling-invoices.getList' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}
