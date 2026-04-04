import { Injectable } from '@nestjs/common';

// Import entities.
import { SellingInvoiceEntity } from '@src/invoices/sellingInvoices/entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '@src/invoices/sellingInvoices/entities/sellingInvoiceProducts.entity';
import { ReturnSellingInvoiceEntity } from '@src/invoices/sellingInvoices/entities/returnSellingInvoices.entity';
import { ReturnSellingInvoiceProductsEntity } from '@src/invoices/sellingInvoices/entities/returnSellingInvoiceProducts.entity';

// Import DTOs.
import {
    SellingInvoiceProductResponseDto,
    SellingInvoiceResponseDto,
    SellingInvoiceWithoutProductsDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudSellingInvoicesResponse.dto';
import {
    ReturnSellingInvoiceProductResponseDto,
    ReturnSellingInvoiceResponseDto,
    ReturnSellingInvoiceWithoutProductsDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudReturnSellingInvoicesResponse.dto';

// Import enums.
import { ReturnSellingInvoiceStatus, SellingInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

@Injectable()
export class SellingInvoicesMapper {

    // --- Private methods ---
    // Confirmed username (selling invoices have no draft user).
    private confirmedUsername(entity: SellingInvoiceEntity): string | null {
        return entity.confirmedBy != null ? (entity.confirmedByUser?.username ?? null) : null;
    }

    // FROM: SellingInvoiceProductsEntity
    // TO: SellingInvoiceProductResponseDto.
    toSellingInvoiceProductResponseDto(entity: SellingInvoiceProductsEntity): SellingInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            quantity: entity.quantity,
            returnQuantity: entity.returnQuantity,
            sellingPrice: Number(entity.sellingPrice),
            productDiscount: Number(entity.productDiscount),
            totalSellingPrice: Number(entity.totalSellingPrice),
            notes: entity.notes,
        };
    }

    // FROM: SellingInvoiceEntity
    // TO: SellingInvoiceResponseDto.
    toSellingInvoiceResponseDto(entity: SellingInvoiceEntity): SellingInvoiceResponseDto {
        const confirmedByUsername = this.confirmedUsername(entity);
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            products: entity.sellingInvoiceProducts?.map((line) => this.toSellingInvoiceProductResponseDto(line)) ?? [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            invoiceDiscount: Number(entity.invoiceDiscount),
            totalSellingPrice: Number(entity.totalSellingPrice),
            notes: entity.notes,
            status: entity.status as SellingInvoiceStatus,
            returnCount: entity.returnCount,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
            createdAt: entity.createdAt,
        };
    }

    // FROM: SellingInvoiceEntity
    // TO: SellingInvoiceWithoutProductsDto.
    toSellingInvoiceWithoutProductsDto(entity: SellingInvoiceEntity): SellingInvoiceWithoutProductsDto {
        const confirmedByUsername = this.confirmedUsername(entity);
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            invoiceDiscount: Number(entity.invoiceDiscount),
            totalSellingPrice: Number(entity.totalSellingPrice),
            notes: entity.notes,
            status: entity.status as SellingInvoiceStatus,
            returnCount: entity.returnCount,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
            createdAt: entity.createdAt,
        };
    }

    // --- Return selling invoices ---
    private draftConfirmedUsernamesReturn(entity: ReturnSellingInvoiceEntity): {
        draftByUsername: string | null;
        confirmedByUsername: string | null;
    } {
        return {
            draftByUsername: entity.draftBy != null ? (entity.draftByUser?.username ?? null) : null,
            confirmedByUsername: entity.confirmedBy != null ? (entity.confirmedByUser?.username ?? null) : null,
        };
    }

    // FROM: ReturnSellingInvoiceProductsEntity
    // TO: ReturnSellingInvoiceProductResponseDto.
    toReturnSellingInvoiceProductResponseDto(entity: ReturnSellingInvoiceProductsEntity): ReturnSellingInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            returnQuantity: entity.returnQuantity,
            sellingPrice: Number(entity.sellingPrice),
            totalReturnPrice: Number(entity.totalReturnPrice),
            reasonCategory: entity.reasonCategory,
            reasonNotes: entity.reasonNotes,
        };
    }

    // FROM: ReturnSellingInvoiceEntity
    // TO: ReturnSellingInvoiceResponseDto.
    toReturnSellingInvoiceResponseDto(entity: ReturnSellingInvoiceEntity): ReturnSellingInvoiceResponseDto {
        const { draftByUsername, confirmedByUsername } = this.draftConfirmedUsernamesReturn(entity);
        return {
            id: entity.id,
            returnInvoiceId: entity.returnInvoiceId,
            sellingInvoiceId: entity.sellingInvoiceId,
            products: entity.returnSellingInvoiceProducts?.map((p) => this.toReturnSellingInvoiceProductResponseDto(p)) ?? [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalReturnPrice: Number(entity.totalReturnPrice),
            notes: entity.notes,
            status: entity.status as ReturnSellingInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
            createdAt: entity.createdAt,
        };
    }

    // FROM: ReturnSellingInvoiceEntity
    // TO: ReturnSellingInvoiceWithoutProductsDto.
    toReturnSellingInvoiceWithoutProductsDto(entity: ReturnSellingInvoiceEntity): ReturnSellingInvoiceWithoutProductsDto {
        const { draftByUsername, confirmedByUsername } = this.draftConfirmedUsernamesReturn(entity);
        return {
            id: entity.id,
            returnInvoiceId: entity.returnInvoiceId,
            sellingInvoiceId: entity.sellingInvoiceId,
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalReturnPrice: Number(entity.totalReturnPrice),
            notes: entity.notes,
            status: entity.status as ReturnSellingInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
            createdAt: entity.createdAt,
        };
    }
}
