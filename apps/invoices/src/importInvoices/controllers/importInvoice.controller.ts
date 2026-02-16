import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { ImportInvoiceService } from '../services/importInvoice.service';

// Import DTOs.
import {
    CreateImportInvoiceRequestDto,
    EditImportInvoiceRequestDto,
    GetListOfImportInvoiceRequestDto,
} from '@app/common/dtos/invoices/importInvoices/crudImportInvoicesRequest.dto';
import { ImportInvoiceResponseDto, GetListOfImportInvoicesResponseDto } from '@app/common/dtos/invoices/importInvoices/crudImportInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

@Controller()
export class ImportInvoiceController {
    constructor(private readonly importInvoiceService: ImportInvoiceService) { }

    @MessagePattern({ cmd: 'import-invoices.createDraft' })
    async createDraftImportInvoice(@Payload() payload: { dto: CreateImportInvoiceRequestDto, user: AccessTokenPayload }): Promise<ImportInvoiceResponseDto> {
        return await this.importInvoiceService.createDraftImportInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'import-invoices.editDraft' })
    async editDraftImportInvoice(@Payload() payload: { dto: EditImportInvoiceRequestDto, user: AccessTokenPayload }): Promise<ImportInvoiceResponseDto> {
        return await this.importInvoiceService.editDraftImportInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'import-invoices.deleteDraft' })
    async deleteDraftImportInvoice(@Payload() payload: { ids: string[], user: AccessTokenPayload }): Promise<boolean> {
        return await this.importInvoiceService.deleteDraftImportInvoice(payload.ids, payload.user);
    }

    @MessagePattern({ cmd: 'import-invoices.confirm' })
    async confirmImportInvoice(@Payload() payload: { id: string, user: AccessTokenPayload }): Promise<ImportInvoiceResponseDto> {
        return await this.importInvoiceService.confirmImportInvoice(payload.id, payload.user);
    }

    @MessagePattern({ cmd: 'import-invoices.getById' })
    async getImportInvoiceById(@Payload() payload: { id: string }): Promise<ImportInvoiceResponseDto> {
        return await this.importInvoiceService.getImportInvoiceById(payload.id);
    }

    @MessagePattern({ cmd: 'import-invoices.getList' })
    async getListOfImportInvoices(@Payload() payload: { dto: GetListOfImportInvoiceRequestDto, user: AccessTokenPayload }): Promise<GetListOfImportInvoicesResponseDto> {
        return await this.importInvoiceService.getListOfImportInvoices(payload.dto, payload.user);
    }
}
