import { Injectable } from '@nestjs/common';

// Import entities.
import { ReturnImportInvoiceEntity } from 'apps/invoices/src/returnImportInvoices/entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from 'apps/invoices/src/returnImportInvoices/entities/returnImportInvoiceProducts.entity';

// Import DTOs.
import {
    ReturnImportInvoiceResponseDto,
    ReturnImportInvoiceWithoutProductsDto,
    ReturnImportInvoiceProductResponseDto,
} from '@app/common/dtos/invoices/returnImportInvoices/crudReturnImportInvoicesResponse.dto';

// Import enums.
import { ReturnImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Injectable()
export class ReturnImportInvoicesMapper {

    // FROM: ReturnImportInvoiceProductsEntity 
    // TO: ReturnImportInvoiceProductResponseDto.
    toReturnImportInvoiceProductResponseDto(
        entity: ReturnImportInvoiceProductsEntity,
    ): ReturnImportInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            returnQuantity: entity.returnQuantity,
            importPrice: entity.importPrice,
            totalReturnPrice: entity.totalReturnPrice,
            notes: entity.notes
        };
    }

    // FROM: ReturnImportInvoiceEntity 
    // TO: ReturnImportInvoiceResponseDto.
    toReturnImportInvoiceResponseDto(
        entity: ReturnImportInvoiceEntity,
        draftByUsername?: string,
        confirmedByUsername?: string,
    ): ReturnImportInvoiceResponseDto {
        return {
            id: entity.id,
            returnInvoiceId: entity.returnInvoiceId,
            importInvoiceId: entity.importInvoice?.id || '',
            products: entity.returnImportInvoiceProducts?.map(product =>
                this.toReturnImportInvoiceProductResponseDto(product)
            ) || [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalReturnPrice: entity.totalReturnPrice,
            notes: entity.notes,
            status: entity.status as ReturnImportInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt
        };
    }

    // FROM: ReturnImportInvoiceEntity 
    // TO: ReturnImportInvoiceWithoutProductsDto.
    toReturnImportInvoiceWithoutProductsDto(
        entity: ReturnImportInvoiceEntity,
        draftByUsername?: string,
        confirmedByUsername?: string
    ): ReturnImportInvoiceWithoutProductsDto {
        return {
            id: entity.id,
            returnInvoiceId: entity.returnInvoiceId,
            importInvoiceId: entity.importInvoice?.id || '',
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalReturnPrice: entity.totalReturnPrice,
            notes: entity.notes,
            status: entity.status as ReturnImportInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt
        };
    }
}
