import { Injectable } from '@nestjs/common';

// Import entities.
import { ImportInvoiceEntity } from '@src/invoices/importInvoices/entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from '@src/invoices/importInvoices/entities/importInvocieProducts.entity';
import { ReturnImportInvoiceEntity } from '@src/invoices/importInvoices/entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from '@src/invoices/importInvoices/entities/returnImportInvoiceProducts.entity';

// Import DTOs.
import {
    ImportInvoiceResponseDto,
    ImportInvoiceWithoutProductsDto,
    ImportInvoiceProductResponseDto,
} from '@libs/common/dtos/invoices/importInvoices/crudImportInvoicesResponse.dto';
import {
    ReturnImportInvoiceResponseDto,
    ReturnImportInvoiceWithoutProductsDto,
    ReturnImportInvoiceProductResponseDto,
} from '@libs/common/dtos/invoices/importInvoices/crudReturnImportInvoicesResponse.dto';

// Import enums.
import { ImportInvoiceStatus, ReturnImportInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

@Injectable()
export class ImportInvoicesMapper {

    // --- Private methods ---
    // Get draft and confirmed usernames.
    private draftConfirmedUsernames(entity: ImportInvoiceEntity): {
        draftByUsername: string | null;
        confirmedByUsername: string | null;
    } {
        return {
            draftByUsername: entity.draftBy != null ? (entity.draftByUser?.username ?? null) : null,
            confirmedByUsername: entity.confirmedBy != null ? (entity.confirmedByUser?.username ?? null) : null,
        };
    }

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
            returnedQuantity: entity.returnedQuantity,
            importPrice: entity.importPrice,
            totalImportPrice: entity.totalImportPrice,
            notes: entity.notes
        };
    }

    // FROM: ImportInvoiceEntity
    // TO: ImportInvoiceResponseDto.
    toImportInvoiceResponseDto(entity: ImportInvoiceEntity): ImportInvoiceResponseDto {
        const { draftByUsername, confirmedByUsername } = this.draftConfirmedUsernames(entity);
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            products: entity.importInvoiceProducts?.map((product) => this.toImportInvoiceProductResponseDto(product)) || [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalImportPrice: entity.totalImportPrice,
            notes: entity.notes,
            status: entity.status as ImportInvoiceStatus,
            returnCount: entity.returnCount,
            draftBy: entity.draftBy,
            draftByUsername,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
            createdAt: entity.createdAt,
        };
    }

    // FROM: ImportInvoiceEntity 
    // TO: ImportInvoiceWithoutProductsDto.
    toImportInvoiceWithoutProductsDto(entity: ImportInvoiceEntity): ImportInvoiceWithoutProductsDto {
        const { draftByUsername, confirmedByUsername } = this.draftConfirmedUsernames(entity);
        return {
            id: entity.id,
            invoiceId: entity.invoiceId,
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalImportPrice: entity.totalImportPrice,
            notes: entity.notes,
            status: entity.status as ImportInvoiceStatus,
            returnCount: entity.returnCount,
            draftBy: entity.draftBy,
            draftByUsername,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
            createdAt: entity.createdAt,
        };
    }

    // --- Return import invoices ---
    private draftConfirmedUsernamesReturn(entity: ReturnImportInvoiceEntity): {
        draftByUsername: string | null;
        confirmedByUsername: string | null;
    } {
        return {
            draftByUsername: entity.draftBy != null ? (entity.draftByUser?.username ?? null) : null,
            confirmedByUsername: entity.confirmedBy != null ? (entity.confirmedByUser?.username ?? null) : null,
        };
    }

    // FROM: ReturnImportInvoiceProductsEntity
    // TO: ReturnImportInvoiceProductResponseDto.
    toReturnImportInvoiceProductResponseDto(entity: ReturnImportInvoiceProductsEntity): ReturnImportInvoiceProductResponseDto {
        return {
            id: entity.id,
            productId: entity.productId,
            productSku: entity.productSku,
            productName: entity.productName,
            productUnit: entity.productUnit,
            returnQuantity: entity.returnQuantity,
            importPrice: Number(entity.importPrice),
            totalReturnPrice: Number(entity.totalReturnPrice),
            reasonCategory: entity.reasonCategory,
            reasonNotes: entity.reasonNotes,
        };
    }

    // FROM: ReturnImportInvoiceEntity
    // TO: ReturnImportInvoiceResponseDto.
    toReturnImportInvoiceResponseDto(entity: ReturnImportInvoiceEntity): ReturnImportInvoiceResponseDto {
        const { draftByUsername, confirmedByUsername } = this.draftConfirmedUsernamesReturn(entity);
        return {
            id: entity.id,
            returnInvoiceId: entity.returnInvoiceId,
            importInvoiceId: entity.importInvoiceId,
            products: entity.returnImportInvoiceProducts?.map((p) => this.toReturnImportInvoiceProductResponseDto(p)) ?? [],
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalReturnPrice: Number(entity.totalReturnPrice),
            notes: entity.notes,
            status: entity.status as ReturnImportInvoiceStatus,
            draftBy: entity.draftBy,
            draftByUsername,
            draftAt: entity.draftAt,
            confirmedBy: entity.confirmedBy,
            confirmedByUsername,
            confirmedAt: entity.confirmedAt,
            createdAt: entity.createdAt,
        };
    }

    // FROM: ReturnImportInvoiceEntity
    // TO: ReturnImportInvoiceWithoutProductsDto.
    toReturnImportInvoiceWithoutProductsDto(entity: ReturnImportInvoiceEntity): ReturnImportInvoiceWithoutProductsDto {
        const { draftByUsername, confirmedByUsername } = this.draftConfirmedUsernamesReturn(entity);
        return {
            id: entity.id,
            returnInvoiceId: entity.returnInvoiceId,
            importInvoiceId: entity.importInvoiceId,
            totalProducts: entity.totalProducts,
            totalQuantity: entity.totalQuantity,
            totalReturnPrice: Number(entity.totalReturnPrice),
            notes: entity.notes,
            status: entity.status as ReturnImportInvoiceStatus,
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
