import { Injectable } from '@nestjs/common';

// Import entities.
import { ImportInvoiceEntity } from 'apps/invoices/src/importInvoices/entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from 'apps/invoices/src/importInvoices/entities/importInvocieProducts.entity';

// Import DTOs.
import {
    ImportInvoiceResponseDto,
    ImportInvoiceWithoutProductsDto,
    ImportInvoiceProductResponseDto,
} from '@app/common/dtos/invoices/importInvoices/crudImportInvoicesResponse.dto';

// Import enums.
import { ImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Injectable()
export class ImportInvoicesMapper {

    // FROM: ImportInvoiceProductsEntity 
    // TO: ImportInvoiceProductResponseDto.
    toImportInvoiceProductResponseDto(
        entity: ImportInvoiceProductsEntity,
    ): ImportInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            quantity: entity.quantity,
            importPrice: entity.importPrice,
            totalImportPrice: entity.totalImportPrice,
            notes: entity.notes
        };
    }

    // FROM: ImportInvoiceEntity 
    // TO: ImportInvoiceResponseDto.
    toImportInvoiceResponseDto(
        entity: ImportInvoiceEntity,
        draftByUsername?: string,
        confirmedByUsername?: string,
    ): ImportInvoiceResponseDto {
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            products: entity.importInvoiceProducts?.map(product =>
                this.toImportInvoiceProductResponseDto(product)
            ) || [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalImportPrice: entity.totalImportPrice,
            notes: entity.notes,
            status: entity.status as ImportInvoiceStatus,
            stockAdjustmentNumber: entity.stockAdjustmentNumber,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt
        };
    }

    // FROM: ImportInvoiceEntity 
    // TO: ImportInvoiceWithoutProductsDto.
    toImportInvoiceWithoutProductsDto(
        entity: ImportInvoiceEntity,
        draftByUsername?: string,
        confirmedByUsername?: string
    ): ImportInvoiceWithoutProductsDto {
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalImportPrice: entity.totalImportPrice,
            notes: entity.notes,
            status: entity.status as ImportInvoiceStatus,
            stockAdjustmentNumber: entity.stockAdjustmentNumber,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt
        };
    }
}
