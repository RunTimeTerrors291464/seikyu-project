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
import { ReturnSellingInvoiceService } from '../services/returnSellingInvoice.service';

// Import DTOs.
import {
    CreateReturnSellingInvoiceRequestDto,
    EditReturnSellingInvoiceRequestDto,
    GetListOfReturnSellingInvoiceRequestDto,
    DeleteDraftReturnSellingInvoicesRequestDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudReturnSellingInvoicesRequest.dto';
import {
    ReturnSellingInvoiceResponseDto,
    GetListOfReturnSellingInvoicesResponseDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudReturnSellingInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Return Selling Invoices] These APIs are for return selling invoices management.')
@Controller({
    path: 'api/v2/invoices/return-selling',
    version: '2',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class ReturnSellingInvoiceController {
    constructor(private readonly returnSellingInvoiceService: ReturnSellingInvoiceService) { }

    // Create a draft return selling invoice.
    // POST /api/v2/invoices/return-selling
    @Post()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Create a draft return selling invoice' })
    @ApiBody({ type: CreateReturnSellingInvoiceRequestDto })
    @ApiResponse({ status: 201, description: 'A draft return selling invoice has been created successfully.', type: ReturnSellingInvoiceResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createDraftReturnSellingInvoice(
        @Body() dto: CreateReturnSellingInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ReturnSellingInvoiceResponseDto> {
        return await this.returnSellingInvoiceService.createDraftReturnSellingInvoice(dto, user);
    }

    // Edit a draft return selling invoice.
    // PATCH /api/v2/invoices/return-selling
    @Patch()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Edit a draft return selling invoice' })
    @ApiBody({ type: EditReturnSellingInvoiceRequestDto })
    @ApiResponse({ status: 200, description: 'The draft return selling invoice has been edited successfully.', type: ReturnSellingInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async editDraftReturnSellingInvoice(
        @Body() dto: EditReturnSellingInvoiceRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ReturnSellingInvoiceResponseDto> {
        return await this.returnSellingInvoiceService.editDraftReturnSellingInvoice(dto, user);
    }

    // Delete draft return selling invoices.
    // DELETE /api/v2/invoices/return-selling
    @Delete()
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Delete draft return selling invoices' })
    @ApiBody({ type: DeleteDraftReturnSellingInvoicesRequestDto })
    @ApiResponse({ status: 200, description: 'The draft return selling invoices have been deleted successfully.' })
    @HttpCode(HttpStatus.OK)
    async deleteDraftReturnSellingInvoice(
        @Body() body: DeleteDraftReturnSellingInvoicesRequestDto,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<boolean> {
        await this.returnSellingInvoiceService.deleteDraftReturnSellingInvoice(body.ids, user);
        return true;
    }

    // Confirm a draft return selling invoice.
    // POST /api/v2/invoices/return-selling/:id/confirm
    @Post(':id/confirm')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Confirm a draft return selling invoice' })
    @ApiParam({ name: 'id', description: 'The UUID of the return selling invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'The return selling invoice has been confirmed successfully.', type: ReturnSellingInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async confirmReturnSellingInvoice(
        @Param('id') id: string,
        @CurrentUser() user: AccessTokenPayload,
    ): Promise<ReturnSellingInvoiceResponseDto> {
        return await this.returnSellingInvoiceService.confirmReturnSellingInvoice(id, user);
    }

    // Get a list of return selling invoices.
    // GET /api/v2/invoices/return-selling
    @Get()
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a list of return selling invoices' })
    @ApiResponse({ status: 200, description: 'A list of return selling invoices has been retrieved successfully.', type: GetListOfReturnSellingInvoicesResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfReturnSellingInvoices(@Query() dto: GetListOfReturnSellingInvoiceRequestDto): Promise<GetListOfReturnSellingInvoicesResponseDto> {
        return await this.returnSellingInvoiceService.getListOfReturnSellingInvoices(dto);
    }

    // Get a return selling invoice by ID.
    // GET /api/v2/invoices/return-selling/:id
    @Get(':id')
    @Roles(Role.MANAGER, Role.ADMIN)
    @ApiOperation({ summary: '[MANAGER, ADMIN] Get a return selling invoice by ID' })
    @ApiParam({ name: 'id', description: 'The UUID of the return selling invoice', example: '550e8400-e29b-41d4-a716-446655440000' })
    @ApiResponse({ status: 200, description: 'A return selling invoice has been retrieved successfully.', type: ReturnSellingInvoiceResponseDto })
    @HttpCode(HttpStatus.OK)
    async getReturnSellingInvoiceById(@Param('id') id: string): Promise<ReturnSellingInvoiceResponseDto> {
        return await this.returnSellingInvoiceService.getReturnSellingInvoiceById(id);
    }
}
