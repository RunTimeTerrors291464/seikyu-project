import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { ReturnImportInvoiceService } from '../services/returnImportInvoice.service';

// Import DTOs.
import {
    CreateReturnImportInvoiceRequestDto,
    EditReturnImportInvoiceRequestDto,
    GetListOfReturnImportInvoiceRequestDto,
} from '@app/common/dtos/invoices/returnImportInvoices/crudReturnImportInvoicesRequest.dto';
import { ReturnImportInvoiceResponseDto, GetListOfReturnImportInvoicesResponseDto } from '@app/common/dtos/invoices/returnImportInvoices/crudReturnImportInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

@Controller()
export class ReturnImportInvoiceController {
    constructor(private readonly returnImportInvoiceService: ReturnImportInvoiceService) { }

    @MessagePattern({ cmd: 'return-import-invoices.createDraft' })
    async createDraftReturnImportInvoice(@Payload() payload: { dto: CreateReturnImportInvoiceRequestDto, user: AccessTokenPayload }): Promise<ReturnImportInvoiceResponseDto> {
        return await this.returnImportInvoiceService.createDraftReturnImportInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'return-import-invoices.editDraft' })
    async editDraftReturnImportInvoice(@Payload() payload: { dto: EditReturnImportInvoiceRequestDto, user: AccessTokenPayload }): Promise<ReturnImportInvoiceResponseDto> {
        return await this.returnImportInvoiceService.editDraftReturnImportInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'return-import-invoices.deleteDraft' })
    async deleteDraftReturnImportInvoice(@Payload() payload: { ids: string[], user: AccessTokenPayload }): Promise<boolean> {
        return await this.returnImportInvoiceService.deleteDraftReturnImportInvoice(payload.ids, payload.user);
    }

    @MessagePattern({ cmd: 'return-import-invoices.confirm' })
    async confirmReturnImportInvoice(@Payload() payload: { id: string, user: AccessTokenPayload }): Promise<ReturnImportInvoiceResponseDto> {
        return await this.returnImportInvoiceService.confirmReturnImportInvoice(payload.id, payload.user);
    }

    @MessagePattern({ cmd: 'return-import-invoices.getById' })
    async getReturnImportInvoiceById(@Payload() payload: { id: string }): Promise<ReturnImportInvoiceResponseDto> {
        return await this.returnImportInvoiceService.getReturnImportInvoiceById(payload.id);
    }

    @MessagePattern({ cmd: 'return-import-invoices.getList' })
    async getListOfReturnImportInvoices(@Payload() payload: { dto: GetListOfReturnImportInvoiceRequestDto, user: AccessTokenPayload }): Promise<GetListOfReturnImportInvoicesResponseDto> {
        return await this.returnImportInvoiceService.getListOfReturnImportInvoices(payload.dto, payload.user);
    }
}
