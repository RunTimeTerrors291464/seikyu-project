import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { StockAdjustmentService } from '../services/stockAdjustment.service';

// Import DTOs.
import {
    CreateStockAdjustmentRequestDto,
    EditStockAdjustmentRequestDto,
    GetListOfStockAdjustmentRequestDto
} from '@app/common/dtos/invoices/stockAdjustments/crudStockAdjustmentRequest.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

@Controller()
export class StockAdjustmentController {
    constructor(
        private readonly stockAdjustmentService: StockAdjustmentService,
    ) { }

    @MessagePattern({ cmd: 'invoices.stockAdjustments.createDraft' })
    async createDraftStockAdjustment(@Payload() payload: { dto: CreateStockAdjustmentRequestDto, user: AccessTokenPayload }) {
        return await this.stockAdjustmentService.createDraftStockAdjustment(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'invoices.stockAdjustments.editDraft' })
    async editDraftStockAdjustment(@Payload() payload: { dto: EditStockAdjustmentRequestDto, user: AccessTokenPayload }) {
        return await this.stockAdjustmentService.editDraftStockAdjustment(payload.dto, payload.user);
    }

    @MessagePattern({ cmd: 'invoices.stockAdjustments.deleteDraft' })
    async deleteDraftStockAdjustment(@Payload() payload: { ids: string[], user: AccessTokenPayload }) {
        return await this.stockAdjustmentService.deleteDraftStockAdjustment(payload.ids, payload.user);
    }

    @MessagePattern({ cmd: 'invoices.stockAdjustments.confirm' })
    async confirmStockAdjustment(@Payload() payload: { id: string, user: AccessTokenPayload }) {
        return await this.stockAdjustmentService.confirmStockAdjustment(payload.id, payload.user);
    }

    @MessagePattern({ cmd: 'invoices.stockAdjustments.getById' })
    async getStockAdjustmentById(@Payload() payload: { id: string }) {
        return await this.stockAdjustmentService.getStockAdjustmentById(payload.id);
    }

    @MessagePattern({ cmd: 'invoices.stockAdjustments.getList' })
    async getListOfStockAdjustments(@Payload() payload: { dto: GetListOfStockAdjustmentRequestDto, user: AccessTokenPayload }) {
        return await this.stockAdjustmentService.getListOfStockAdjustments(payload.dto, payload.user);
    }
}
