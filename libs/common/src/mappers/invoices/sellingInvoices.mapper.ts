import { Injectable } from '@nestjs/common';

// Import entities.
import { SellingInvoiceEntity } from 'apps/invoices/src/sellingInvoices/entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from 'apps/invoices/src/sellingInvoices/entities/sellingInvoiceProducts.entity';

// Import DTOs.
import {
    SellingInvoiceResponseDto,
    SellingInvoiceWithoutProductsDto,
    SellingInvoiceProductResponseDto,
} from '@app/common/dtos/invoices/sellingInvoices/crudSellingInvoicesResponse.dto';

// Import enums.
import { SellingInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Injectable()
export class SellingInvoicesMapper {

    // FROM: SellingInvoiceProductsEntity
    // TO: SellingInvoiceProductResponseDto.
    toSellingInvoiceProductResponseDto(
        entity: SellingInvoiceProductsEntity,
    ): SellingInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            quantity: entity.quantity,
            sellingPrice: entity.sellingPrice,
            productDiscount: entity.productDiscount,
            totalSellingPrice: entity.totalSellingPrice,
            notes: entity.notes,
        };
    }

    // FROM: SellingInvoiceEntity
    // TO: SellingInvoiceResponseDto.
    toSellingInvoiceResponseDto(
        entity: SellingInvoiceEntity,
        confirmedByUsername?: string,
    ): SellingInvoiceResponseDto {
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            products: entity.sellingInvoiceProducts?.map(product =>
                this.toSellingInvoiceProductResponseDto(product)
            ) || [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            invoiceDiscount: entity.invoiceDiscount,
            totalSellingPrice: entity.totalSellingPrice,
            notes: entity.notes,
            status: entity.status as SellingInvoiceStatus,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt,
        };
    }

    // FROM: SellingInvoiceEntity
    // TO: SellingInvoiceWithoutProductsDto.
    toSellingInvoiceWithoutProductsDto(
        entity: SellingInvoiceEntity,
        confirmedByUsername?: string,
    ): SellingInvoiceWithoutProductsDto {
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            invoiceDiscount: entity.invoiceDiscount,
            totalSellingPrice: entity.totalSellingPrice,
            notes: entity.notes,
            status: entity.status as SellingInvoiceStatus,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername: confirmedByUsername ?? null,
            confirmedAt: entity.confirmedAt,
        };
    }
}
