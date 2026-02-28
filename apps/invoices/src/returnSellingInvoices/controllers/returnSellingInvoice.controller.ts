import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { ReturnSellingInvoiceService } from '../services/returnSellingInvoice.service';

// Import DTOs.
import {
    CreateReturnSellingInvoiceRequestDto,
    EditReturnSellingInvoiceRequestDto,
    GetListOfReturnSellingInvoiceRequestDto,
} from '@app/common/dtos/invoices/returnSellingInvoices/crudReturnSellingInvoicesRequest.dto';
import { ReturnSellingInvoiceResponseDto, GetListOfReturnSellingInvoicesResponseDto } from '@app/common/dtos/invoices/returnSellingInvoices/crudReturnSellingInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

@Controller()
export class ReturnSellingInvoiceController {
    constructor(private readonly returnSellingInvoiceService: ReturnSellingInvoiceService) { }

    @MessagePattern({ cmd: 'return-selling-invoices.createDraft' })
    async createDraftReturnSellingInvoice(@Payload() payload: { dto: CreateReturnSellingInvoiceRequestDto, user: AccessTokenPayload }): Promise<ReturnSellingInvoiceResponseDto> {
        return await this.returnSellingInvoiceService.createDraftReturnSellingInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'return-selling-invoices.editDraft' })
    async editDraftReturnSellingInvoice(@Payload() payload: { dto: EditReturnSellingInvoiceRequestDto, user: AccessTokenPayload }): Promise<ReturnSellingInvoiceResponseDto> {
        return await this.returnSellingInvoiceService.editDraftReturnSellingInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'return-selling-invoices.deleteDraft' })
    async deleteDraftReturnSellingInvoice(@Payload() payload: { ids: string[], user: AccessTokenPayload }): Promise<boolean> {
        return await this.returnSellingInvoiceService.deleteDraftReturnSellingInvoice(payload.ids, payload.user);
    }

    @MessagePattern({ cmd: 'return-selling-invoices.confirm' })
    async confirmReturnSellingInvoice(@Payload() payload: { id: string, user: AccessTokenPayload }): Promise<ReturnSellingInvoiceResponseDto> {
        return await this.returnSellingInvoiceService.confirmReturnSellingInvoice(payload.id, payload.user);
    }

    @MessagePattern({ cmd: 'return-selling-invoices.getById' })
    async getReturnSellingInvoiceById(@Payload() payload: { id: string }): Promise<ReturnSellingInvoiceResponseDto> {
        return await this.returnSellingInvoiceService.getReturnSellingInvoiceById(payload.id);
    }

    @MessagePattern({ cmd: 'return-selling-invoices.getList' })
    async getListOfReturnSellingInvoices(@Payload() payload: { dto: GetListOfReturnSellingInvoiceRequestDto, user: AccessTokenPayload }): Promise<GetListOfReturnSellingInvoicesResponseDto> {
        return await this.returnSellingInvoiceService.getListOfReturnSellingInvoices(payload.dto, payload.user);
    }
}
