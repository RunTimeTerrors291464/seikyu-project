import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { SellingInvoiceService } from '../services/sellingInvoice.service';

// Import DTOs.
import {
    CreateSellingInvoiceRequestDto,
    GetListOfSellingInvoiceRequestDto,
} from '@app/common/dtos/invoices/sellingInvoices/crudSellingInvoicesRequest.dto';
import {
    SellingInvoiceResponseDto,
    GetListOfSellingInvoicesResponseDto,
} from '@app/common/dtos/invoices/sellingInvoices/crudSellingInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

@Controller()
export class SellingInvoiceController {
    constructor(private readonly sellingInvoiceService: SellingInvoiceService) { }

    @MessagePattern({ cmd: 'selling-invoices.create' })
    async createSellingInvoice(@Payload() payload: { dto: CreateSellingInvoiceRequestDto, user: AccessTokenPayload }): Promise<SellingInvoiceResponseDto> {
        return await this.sellingInvoiceService.createSellingInvoice(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'selling-invoices.getById' })
    async getSellingInvoiceById(@Payload() payload: { id: string }): Promise<SellingInvoiceResponseDto> {
        return await this.sellingInvoiceService.getSellingInvoiceById(payload.id);
    }

    @MessagePattern({ cmd: 'selling-invoices.getList' })
    async getListOfSellingInvoices(@Payload() payload: { dto: GetListOfSellingInvoiceRequestDto, user: AccessTokenPayload }): Promise<GetListOfSellingInvoicesResponseDto> {
        return await this.sellingInvoiceService.getListOfSellingInvoices(payload.dto, payload.user);
    }
}
