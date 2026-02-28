import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { StockAdjustmentInvoiceService } from '../services/stockAdjustmentInvoice.service';

// Import DTOs.
import {
    CreateStockAdjustmentInvoiceRequestDto,
    EditStockAdjustmentInvoiceRequestDto,
    GetListOfStockAdjustmentInvoiceRequestDto,
} from '@app/common/dtos/invoices/stockAdjustmentInvoices/crudStockAdjustmentInvoicesRequest.dto';
import {
    StockAdjustmentInvoiceResponseDto,
    GetListOfStockAdjustmentInvoicesResponseDto,
} from '@app/common/dtos/invoices/stockAdjustmentInvoices/crudStockAdjustmentInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

@Controller()
export class StockAdjustmentInvoiceController {
    constructor(private readonly stockAdjustmentInvoiceService: StockAdjustmentInvoiceService) { }

    @MessagePattern({ cmd: 'stock-adjustment-invoices.createDraft' })
    async createDraftStockAdjustmentInvoice(@Payload() payload: { dto: CreateStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload }): Promise<StockAdjustmentInvoiceResponseDto> {
        return await this.stockAdjustmentInvoiceService.createDraftStockAdjustmentInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'stock-adjustment-invoices.editDraft' })
    async editDraftStockAdjustmentInvoice(@Payload() payload: { dto: EditStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload }): Promise<StockAdjustmentInvoiceResponseDto> {
        return await this.stockAdjustmentInvoiceService.editDraftStockAdjustmentInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'stock-adjustment-invoices.deleteDraft' })
    async deleteDraftStockAdjustmentInvoice(@Payload() payload: { ids: string[], user: AccessTokenPayload }): Promise<boolean> {
        return await this.stockAdjustmentInvoiceService.deleteDraftStockAdjustmentInvoice(payload.ids, payload.user);
    }

    @MessagePattern({ cmd: 'stock-adjustment-invoices.confirm' })
    async confirmStockAdjustmentInvoice(@Payload() payload: { id: string, user: AccessTokenPayload }): Promise<StockAdjustmentInvoiceResponseDto> {
        return await this.stockAdjustmentInvoiceService.confirmStockAdjustmentInvoice(payload.id, payload.user);
    }

    @MessagePattern({ cmd: 'stock-adjustment-invoices.getById' })
    async getStockAdjustmentInvoiceById(@Payload() payload: { id: string }): Promise<StockAdjustmentInvoiceResponseDto> {
        return await this.stockAdjustmentInvoiceService.getStockAdjustmentInvoiceById(payload.id);
    }

    @MessagePattern({ cmd: 'stock-adjustment-invoices.getList' })
    async getListOfStockAdjustmentInvoices(@Payload() payload: { dto: GetListOfStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload }): Promise<GetListOfStockAdjustmentInvoicesResponseDto> {
        return await this.stockAdjustmentInvoiceService.getListOfStockAdjustmentInvoices(payload.dto, payload.user);
    }
}
