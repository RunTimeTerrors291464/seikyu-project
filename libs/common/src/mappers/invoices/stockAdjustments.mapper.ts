import { Injectable } from '@nestjs/common';

// Import enums.
import { StockActionType } from '@app/common/enums/stockActionType.enum';

// Import entities.
import { StockAdjustmentEntity } from 'apps/invoices/src/stockAdjustments/entities/stockAdjustment.entity';
import { StockAdjustmentProductsEntity } from 'apps/invoices/src/stockAdjustments/entities/stockAdjustmentProducts.entity';

// Import DTOs.
import {
    StockAdjustmentResponseDto,
    StockAdjustmentWithoutProductsDto,
    StockAdjustmentProductResponseDto,
} from '@app/common/dtos/invoices/stockAdjustments/crudStockAdjustmentResponse.dto';

// Import enums.
import { StockAdjustmentStatus } from '@app/common/enums/invoiceStatus.enum';

@Injectable()
export class StockAdjustmentsMapper {

    // FROM: StockAdjustmentProductEntity
    // TO: StockAdjustmentProductResponseDto
    toStockAdjustmentProductResponseDto(entity: StockAdjustmentProductsEntity): StockAdjustmentProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            quantity: entity.quantity,
            type: entity.type as StockActionType,
            notes: entity.notes
        };
    }

    // FROM: StockAdjustmentEntity
    // TO: StockAdjustmentResponseDto
    toStockAdjustmentResponseDto(
        entity: StockAdjustmentEntity,
        draftByUsername?: string,
        confirmedByUsername?: string
    ): StockAdjustmentResponseDto {
        return {
            id: entity.id,
            adjustmentId: entity.adjustmentId,
            stockAdjustmentType: entity.stockAdjustmentType,
            referenceId: entity.referenceId,
            stockAdjustmentProducts: entity.stockAdjustmentProducts?.map(product =>
                this.toStockAdjustmentProductResponseDto(product)
            ) || [],
            totalProducts: entity.totalProducts,
            totalIncrease: entity.totalIncrease,
            totalDecrease: entity.totalDecrease,
            notes: entity.notes,
            status: entity.status as StockAdjustmentStatus,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt,
        };
    }

    // FROM: StockAdjustmentEntity
    // TO: StockAdjustmentWithoutProductsDto
    toStockAdjustmentWithoutProductsDto(
        entity: StockAdjustmentEntity,
        draftByUsername?: string,
        confirmedByUsername?: string
    ): StockAdjustmentWithoutProductsDto {
        return {
            id: entity.id,
            adjustmentId: entity.adjustmentId,
            stockAdjustmentType: entity.stockAdjustmentType,
            referenceId: entity.referenceId,
            totalProducts: entity.totalProducts,
            totalIncrease: entity.totalIncrease,
            totalDecrease: entity.totalDecrease,
            notes: entity.notes,
            status: entity.status as StockAdjustmentStatus,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt,
        };
    }
}
