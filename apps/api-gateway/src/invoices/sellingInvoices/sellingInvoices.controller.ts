import { Controller, Post, Get, Body, Param, Inject, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

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
    CreateSellingInvoiceRequestDto,
    GetListOfSellingInvoiceRequestDto,
} from '@app/common/dtos/invoices/sellingInvoices/crudSellingInvoicesRequest.dto';
import {
    SellingInvoiceResponseDto,
    GetListOfSellingInvoicesResponseDto,
} from '@app/common/dtos/invoices/sellingInvoices/crudSellingInvoicesResponse.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Invoices] Selling Invoices: These APIs are for selling invoices management.')
@Controller({
    path: 'api/v1/invoices/selling',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SellingInvoicesController {
    constructor(
        @Inject('INVOICES_SERVICE') private readonly invoicesService: ClientProxy,
    ) { }

    // Create a new selling invoice.
    // POST /api/v1/invoices/selling
    @Post()
    @Roles(Role.CASHIER)
    @ApiOperation({ summary: '[CASHIER] Create a new selling invoice' })
    @ApiBody({ type: CreateSellingInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A selling invoice has been created successfully.', type: SellingInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createSellingInvoice(@Body() dto: CreateSellingInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<SellingInvoiceResponseDto> {
        try {
            const result: SellingInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'selling-invoices.create' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a selling invoice by ID.
    // GET /api/v1/invoices/selling/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.CASHIER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, CASHIER, ADMIN] Get a selling invoice by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the selling invoice', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'A selling invoice has been retrieved successfully.', type: SellingInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getSellingInvoiceById(@Param('id') id: string): Promise<SellingInvoiceResponseDto> {
        try {
            const result: SellingInvoiceResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'selling-invoices.getById' }, { id })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of selling invoices.
    // GET /api/v1/invoices/selling
    @Get()
    @Roles(Role.MANAGER, Role.CASHIER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, CASHIER, ADMIN] Get a list of selling invoices' })
    @ApiResponse({ status: 200, description: 'A list of selling invoices has been retrieved successfully.', type: GetListOfSellingInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfSellingInvoices(@Query() dto: GetListOfSellingInvoiceRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<GetListOfSellingInvoicesResponseDto> {
        try {
            const result: GetListOfSellingInvoicesResponseDto = await firstValueFrom(
                this.invoicesService.send({ cmd: 'selling-invoices.getList' }, { dto, user })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}
