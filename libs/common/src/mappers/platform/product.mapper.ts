import { Injectable } from '@nestjs/common';

// Import product entities.
import { ProductsEntity } from 'apps/platform/src/products/entities/products.entity';

// Import DTOs.
import {
    ProductResponseDto,
    ProductCashierResponseDto,
} from '@app/common/dtos/platform/products/crudProductResponse.dto';
import { ProductSnapshotDto } from '@app/common/dtos/platform/products/history/snapshot/productSnapshot.dto';

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
            productDescription: productEntity.productDescription || null,
            importPrice: productEntity.importPrice,
            sellingPrice: productEntity.sellingPrice,
            reorderThreshold: productEntity.reorderThreshold || null,
            inventoryStock: productEntity.inventoryStock,
            active: productEntity.active,
            stockStatus: productEntity.stockStatus,
            createdAt: productEntity.createdAt,
            updatedAt: productEntity.updatedAt,
        };
    }

    // FROM: ProductsEntity
    // TO: ProductCashierResponseDto
    toProductCashierResponseDto(productEntity: ProductsEntity): ProductCashierResponseDto {
        return {
            id: productEntity.id,
            sku: productEntity.sku,
            productName: productEntity.productNames.map(pn => pn.name),
            unitName: productEntity.productUnit.unitName,
            productDescription: productEntity.productDescription || null,
            sellingPrice: productEntity.sellingPrice,
            active: productEntity.active,
            createdAt: productEntity.createdAt,
            updatedAt: productEntity.updatedAt,
        };
    }

    // FROM: ProductsEntity[]
    // TO: ProductResponseDto[]
    toProductResponseDtoArray(productEntities: ProductsEntity[]): ProductResponseDto[] {
        return productEntities.map(entity => this.toProductResponseDto(entity));
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
            stockStatus: productEntity.stockStatus,
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
