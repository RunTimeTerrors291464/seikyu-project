import { Injectable } from '@nestjs/common';

// Import product unit entities.
import { ProductUnitsEntity } from 'apps/platform/src/products/entities/productUnits.entity';

// Import DTOs.
import { ProductUnitResponseDto } from '@app/common/dtos/platform/products/crudProductunitResponse.dto';
import { ProductUnitSnapshotDto } from '@app/common/dtos/platform/products/history/productUnitSnapshot.dto';

@Injectable()
export class ProductUnitMapper {

    // FROM: ProductUnitsEntity
    // TO: ProductUnitResponseDto
    toProductUnitResponseDto(productUnitEntity: ProductUnitsEntity): ProductUnitResponseDto {
        return {
            id: productUnitEntity.id,
            unitName: productUnitEntity.unitName,
            unitDescription: productUnitEntity.unitDescription,
            active: productUnitEntity.active,
            createdAt: productUnitEntity.createdAt,
            updatedAt: productUnitEntity.updatedAt,
        };
    }

    // FROM: ProductUnitsEntity[]
    // TO: ProductUnitResponseDto[]
    toProductUnitResponseDtoArray(productUnitEntities: ProductUnitsEntity[]): ProductUnitResponseDto[] {
        return productUnitEntities.map(entity => this.toProductUnitResponseDto(entity));
    }

    // FROM: ProductUnitsEntity
    // TO: ProductUnitSnapshotDto
    toProductUnitSnapshotDto(productUnitEntity: ProductUnitsEntity): ProductUnitSnapshotDto {
        return {
            id: productUnitEntity.id,
            unitName: productUnitEntity.unitName,
            unitDescription: productUnitEntity.unitDescription,
            active: productUnitEntity.active,
            createdAt: productUnitEntity.createdAt,
            updatedAt: productUnitEntity.updatedAt,
        };
    }

}
