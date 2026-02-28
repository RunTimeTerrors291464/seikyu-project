import { Injectable } from '@nestjs/common';

// Import entities.
import { StockAdjustmentInvoiceEntity } from 'apps/invoices/src/stockAdjustmentInvoices/entities/stockAdjustmentInvoices.entity';
import { StockAdjustmentInvoiceProductsEntity } from 'apps/invoices/src/stockAdjustmentInvoices/entities/stockAdjustmentInvoiceProducts.entity';

// Import DTOs.
import {
    StockAdjustmentInvoiceResponseDto,
    StockAdjustmentInvoiceWithoutProductsDto,
    StockAdjustmentInvoiceProductResponseDto,
} from '@app/common/dtos/invoices/stockAdjustmentInvoices/crudStockAdjustmentInvoicesResponse.dto';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

@Injectable()
export class StockAdjustmentInvoicesMapper {

    // FROM: StockAdjustmentInvoiceProductsEntity
    // TO: StockAdjustmentInvoiceProductResponseDto.
    toStockAdjustmentInvoiceProductResponseDto(
        entity: StockAdjustmentInvoiceProductsEntity,
    ): StockAdjustmentInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            action: entity.action as StockActionType,
            quantity: entity.quantity,
            notes: entity.notes,
        };
    }

    // FROM: StockAdjustmentInvoiceEntity
    // TO: StockAdjustmentInvoiceResponseDto.
    toStockAdjustmentInvoiceResponseDto(
        entity: StockAdjustmentInvoiceEntity,
        draftByUsername?: string,
        confirmedByUsername?: string,
    ): StockAdjustmentInvoiceResponseDto {
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            products: entity.stockAdjustmentInvoiceProducts?.map(product =>
                this.toStockAdjustmentInvoiceProductResponseDto(product)
            ) || [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            actionReason: entity.actionReason,
            notes: entity.notes,
            status: entity.status as StockAdjustmentInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt,
        };
    }

    // FROM: StockAdjustmentInvoiceEntity
    // TO: StockAdjustmentInvoiceWithoutProductsDto.
    toStockAdjustmentInvoiceWithoutProductsDto(
        entity: StockAdjustmentInvoiceEntity,
        draftByUsername?: string,
        confirmedByUsername?: string,
    ): StockAdjustmentInvoiceWithoutProductsDto {
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            actionReason: entity.actionReason,
            notes: entity.notes,
            status: entity.status as StockAdjustmentInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt,
        };
    }
}
