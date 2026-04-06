import { Injectable } from '@nestjs/common';

// Import entities.
import { StockAdjustmentInvoiceEntity } from '@src/invoices/stockAdjustmentInvoice/entities/stockAdjustmentInvoices.entity';
import { StockAdjustmentInvoiceProductsEntity } from '@src/invoices/stockAdjustmentInvoice/entities/stockAdjustmentInvoiceProducts.entity';

// Import DTOs.
import {
    StockAdjustmentInvoiceProductResponseDto,
    StockAdjustmentInvoiceResponseDto,
    StockAdjustmentInvoiceWithoutProductsDto,
} from '@libs/common/dtos/invoices/stockAdjustmentInvoice/crudStockAdjustmentInvoicesResponse.dto';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

@Injectable()
export class StockAdjustmentInvoicesMapper {

    // --- Private helpers ---
    private draftConfirmedUsernames(entity: StockAdjustmentInvoiceEntity): {
        draftByUsername: string | null;
        confirmedByUsername: string | null;
    } {
        return {
            draftByUsername: entity.draftBy != null ? (entity.draftByUser?.username ?? null) : null,
            confirmedByUsername: entity.confirmedBy != null ? (entity.confirmedByUser?.username ?? null) : null,
        };
    }

    // FROM: StockAdjustmentInvoiceProductsEntity
    // TO: StockAdjustmentInvoiceProductResponseDto.
    toStockAdjustmentInvoiceProductResponseDto(entity: StockAdjustmentInvoiceProductsEntity): StockAdjustmentInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            action: entity.action,
            quantity: entity.quantity,
            reasonCategory: entity.reasonCategory,
            reasonNotes: entity.reasonNotes,
            notes: entity.notes,
        };
    }

    // FROM: StockAdjustmentInvoiceEntity
    // TO: StockAdjustmentInvoiceResponseDto.
    toStockAdjustmentInvoiceResponseDto(entity: StockAdjustmentInvoiceEntity): StockAdjustmentInvoiceResponseDto {
        const { draftByUsername, confirmedByUsername } = this.draftConfirmedUsernames(entity);
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            products: entity.stockAdjustmentInvoiceProducts?.map((p) => this.toStockAdjustmentInvoiceProductResponseDto(p)) ?? [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            notes: entity.notes,
            status: entity.status as StockAdjustmentInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
        };
    }

    // FROM: StockAdjustmentInvoiceEntity
    // TO: StockAdjustmentInvoiceWithoutProductsDto.
    toStockAdjustmentInvoiceWithoutProductsDto(entity: StockAdjustmentInvoiceEntity): StockAdjustmentInvoiceWithoutProductsDto {
        const { draftByUsername, confirmedByUsername } = this.draftConfirmedUsernames(entity);
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            notes: entity.notes,
            status: entity.status as StockAdjustmentInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
        };
    }
}
