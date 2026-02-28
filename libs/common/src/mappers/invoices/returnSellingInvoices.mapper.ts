import { Injectable } from '@nestjs/common';

// Import entities.
import { ReturnSellingInvoiceEntity } from 'apps/invoices/src/returnSellingInvoices/entities/returnSellingInvoices.entity';
import { ReturnSellingInvoiceProductsEntity } from 'apps/invoices/src/returnSellingInvoices/entities/returnSellingInvoiceProducts.entity';

// Import DTOs.
import {
    ReturnSellingInvoiceResponseDto,
    ReturnSellingInvoiceWithoutProductsDto,
    ReturnSellingInvoiceProductResponseDto,
} from '@app/common/dtos/invoices/returnSellingInvoices/crudReturnSellingInvoicesResponse.dto';

// Import enums.
import { ReturnSellingInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Injectable()
export class ReturnSellingInvoicesMapper {

    // FROM: ReturnSellingInvoiceProductsEntity 
    // TO: ReturnSellingInvoiceProductResponseDto.
    toReturnSellingInvoiceProductResponseDto(
        entity: ReturnSellingInvoiceProductsEntity,
    ): ReturnSellingInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            returnQuantity: entity.returnQuantity,
            sellingPrice: entity.sellingPrice,
            totalReturnPrice: entity.totalReturnPrice,
            notes: entity.notes
        };
    }

    // FROM: ReturnSellingInvoiceEntity 
    // TO: ReturnSellingInvoiceResponseDto.
    toReturnSellingInvoiceResponseDto(
        entity: ReturnSellingInvoiceEntity,
        draftByUsername?: string,
        confirmedByUsername?: string,
    ): ReturnSellingInvoiceResponseDto {
        return {
            id: entity.id,
            returnInvoiceId: entity.returnInvoiceId,
            sellingInvoiceId: entity.sellingInvoice?.id || '',
            products: entity.returnSellingInvoiceProducts?.map(product =>
                this.toReturnSellingInvoiceProductResponseDto(product)
            ) || [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalReturnPrice: entity.totalReturnPrice,
            notes: entity.notes,
            status: entity.status as ReturnSellingInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt
        };
    }

    // FROM: ReturnSellingInvoiceEntity 
    // TO: ReturnSellingInvoiceWithoutProductsDto.
    toReturnSellingInvoiceWithoutProductsDto(
        entity: ReturnSellingInvoiceEntity,
        draftByUsername?: string,
        confirmedByUsername?: string
    ): ReturnSellingInvoiceWithoutProductsDto {
        return {
            id: entity.id,
            returnInvoiceId: entity.returnInvoiceId,
            sellingInvoiceId: entity.sellingInvoice?.id || '',
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalReturnPrice: entity.totalReturnPrice,
            notes: entity.notes,
            status: entity.status as ReturnSellingInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername: draftByUsername ?? null,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt
        };
    }
}
