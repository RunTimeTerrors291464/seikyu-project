import { Injectable } from '@nestjs/common';

// Import product entities.
import { ProductsEntity } from 'apps/platform/src/products/entities/products.entity';
import { ProductsHistoryEntity } from 'apps/platform/src/products/entities/history/productsHistory.entity';

// Import DTOs.
import {
    ProductResponseDto,
    ProductCashierResponseDto,
    ProductResponseDtoWithHistory,
} from '@app/common/dtos/platform/products/crudProductResponse.dto';
import { ProductSnapshotDto, ProductChangeEventDto, ProductChangedField } from '@app/common/dtos/platform/products/history/snapshot/productSnapshot.dto';

@Injectable()
export class ProductMapper {

    // FROM: ProductsEntity
    // TO: ProductResponseDto
    toProductResponseDto(productEntity: ProductsEntity): ProductResponseDto {
        return {
            id: productEntity.id,
            sku: productEntity.sku,
            productNames: productEntity.productNames.map(pn => pn.name),
            productUnitId: productEntity.productUnit.id,
            productUnitName: productEntity.productUnit.unitName,
            isUnitActive: productEntity.productUnit.active,
            productDescription: productEntity.productDescription || null,
            importPrice: productEntity.importPrice,
            sellingPrice: productEntity.sellingPrice,
            reorderThreshold: productEntity.reorderThreshold || null,
            inventoryStock: productEntity.inventoryStock,
            isActive: productEntity.active,
            stockStatus: productEntity.stockStatus,
            createdAt: productEntity.createdAt,
            updatedAt: productEntity.updatedAt,
        };
    }

    // FROM: ProductsEntity + ProductsHistoryEntity
    // TO: ProductResponseDtoWithHistory
    toProductResponseDtoWithHistory(productEntity: ProductsEntity, history: ProductsHistoryEntity, createdByUsername: string): ProductResponseDtoWithHistory {
        return {
            product: this.toProductResponseDto(productEntity),
            history: {
                id: history.id,
                version: history.version,
                createdBy: history.createdBy,
                createdByUsername: createdByUsername,
                createdAt: history.createdAt,
                eventSummary: history.eventSummary,
            },
        };
    }

    // FROM: ProductsEntity
    // TO: ProductCashierResponseDto
    toProductCashierResponseDto(productEntity: ProductsEntity): ProductCashierResponseDto {
        return {
            id: productEntity.id,
            sku: productEntity.sku,
            productNames: productEntity.productNames.map(pn => pn.name),
            unitName: productEntity.productUnit.unitName,
            productDescription: productEntity.productDescription || null,
            sellingPrice: productEntity.sellingPrice,
            isActive: productEntity.active,
            createdAt: productEntity.createdAt,
            updatedAt: productEntity.updatedAt,
        };
    }

    // FROM: ProductsEntity[]
    // TO: ProductResponseDto[]
    toProductResponseDtoArray(productEntities: ProductsEntity[]): ProductResponseDto[] {
        return productEntities.map(entity => this.toProductResponseDto(entity));
    }

    // FROM: 2 ProductSnapshotDto (previous vs current)
    // TO: ProductChangeEventDto[]
    toProductChangeEventDtos(
        previous: ProductSnapshotDto | null,
        current: ProductSnapshotDto,
    ): ProductChangeEventDto[] {
        const events: ProductChangeEventDto[] = [];

        const primitiveFields: Array<{ key: keyof ProductSnapshotDto; fieldName: ProductChangedField }> = [
            { key: 'sku', fieldName: ProductChangedField.SKU },
            { key: 'productDescription', fieldName: ProductChangedField.PRODUCT_DESCRIPTION },
            { key: 'importPrice', fieldName: ProductChangedField.IMPORT_PRICE },
            { key: 'sellingPrice', fieldName: ProductChangedField.SELLING_PRICE },
            { key: 'reorderThreshold', fieldName: ProductChangedField.REORDER_THRESHOLD },
        ];

        for (const { key, fieldName } of primitiveFields) {
            const prev = previous ? (previous[key] ?? null) : null;
            const curr = current[key] ?? null;
            if (prev !== curr) {
                events.push({ fieldName, previousValue: prev as number | string | null, newValue: curr as number | string | null });
            }
        }

        // productUnit: compare by id
        const prevUnitId = previous?.productUnit?.id ?? null;
        const currUnitId = current.productUnit?.id ?? null;
        if (prevUnitId !== currUnitId) {
            events.push({
                fieldName: ProductChangedField.PRODUCT_UNIT,
                previousValue: previous?.productUnit ?? null,
                newValue: current.productUnit,
            });
        }

        // productNames: compare by sorted name strings
        const prevNames = previous?.productNames?.map(n => n.name).sort().join('|') ?? '';
        const currNames = current.productNames?.map(n => n.name).sort().join('|') ?? '';
        if (prevNames !== currNames) {
            events.push({
                fieldName: ProductChangedField.PRODUCT_NAMES,
                previousValue: previous?.productNames ?? null,
                newValue: current.productNames,
            });
        }

        return events;
    }

    // FROM: ProductsEntity
    // TO: ProductSnapshotDto
    toProductSnapshotDto(productEntity: ProductsEntity): ProductSnapshotDto {
        return {
            id: productEntity.id,
            sku: productEntity.sku,
            productDescription: productEntity.productDescription || undefined,
            importPrice: productEntity.importPrice,
            sellingPrice: productEntity.sellingPrice,
            reorderThreshold: productEntity.reorderThreshold || undefined,
            productUnit: {
                id: productEntity.productUnit.id,
                unitName: productEntity.productUnit.unitName,
                unitDescription: productEntity.productUnit.unitDescription || undefined,
                createdAt: productEntity.productUnit.createdAt,
            },
            productNames: productEntity.productNames.map(pn => ({
                id: pn.id,
                name: pn.name,
                createdAt: pn.createdAt
            })),
            createdAt: productEntity.createdAt,
        };
    }
}
