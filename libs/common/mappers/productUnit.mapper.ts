import { Injectable } from '@nestjs/common';

// Import product unit entities.
import { ProductUnitsEntity } from '@src/productUnits/entities/productUnits.entity';
import { ProductUnitsHistoryEntity } from '@src/productUnits/entities/productUnitsHistory.entity';

// Import DTOs.
import {
    ProductUnitResponseDto,
    ProductUnitResponseDtoWithHistory,
} from '@libs/common/dtos/productUnits/crudProductUnitResponse.dto';
import { ProductUnitSnapshotDto, ProductUnitChangeEventDto, ProductUnitChangedField } from '@libs/common/dtos/productUnits/productUnitSnapshot.dto';

@Injectable()
export class ProductUnitMapper {

    // FROM: ProductUnitsEntity
    // TO: ProductUnitResponseDto
    toProductUnitResponseDto(productUnitEntity: ProductUnitsEntity): ProductUnitResponseDto {
        return {
            id: productUnitEntity.id,
            unitName: productUnitEntity.unitName,
            unitDescription: productUnitEntity.unitDescription,
            isActive: productUnitEntity.isActive,
            createdAt: productUnitEntity.createdAt,
            updatedAt: productUnitEntity.updatedAt,
        };
    }

    // FROM: ProductUnitsEntity + ProductUnitsHistoryEntity
    // TO: ProductUnitResponseDtoWithHistory
    toProductUnitResponseDtoWithHistory(
        productUnitEntity: ProductUnitsEntity,
        history: ProductUnitsHistoryEntity,
        createdByUsername: string,
    ): ProductUnitResponseDtoWithHistory {
        return {
            productUnit: this.toProductUnitResponseDto(productUnitEntity),
            history: {
                id: history.id,
                version: history.version,
                createdBy: history.createdBy,
                createdByUsername,
                createdAt: history.createdAt,
                eventSummary: history.eventSummary,
            },
        };
    }

    // FROM: ProductUnitsEntity[]
    // TO: ProductUnitResponseDto[]
    toProductUnitResponseDtoArray(productUnitEntities: ProductUnitsEntity[]): ProductUnitResponseDto[] {
        return productUnitEntities.map(entity => this.toProductUnitResponseDto(entity));
    }

    // FROM: 2 ProductUnitSnapshotDto (previous vs current)
    // TO: ProductUnitChangeEventDto[]
    toProductUnitChangeEventDtos(
        previous: ProductUnitSnapshotDto | null,
        current: ProductUnitSnapshotDto,
    ): ProductUnitChangeEventDto[] {
        const events: ProductUnitChangeEventDto[] = [];

        if (!previous) {
            events.push({ fieldName: ProductUnitChangedField.NEW_PRODUCT_UNIT, previousValue: null, newValue: null });
            return events;
        }

        const primitiveFields: Array<{ key: keyof ProductUnitSnapshotDto; fieldName: ProductUnitChangedField }> = [
            { key: 'unitName', fieldName: ProductUnitChangedField.UNIT_NAME },
            { key: 'unitDescription', fieldName: ProductUnitChangedField.UNIT_DESCRIPTION },
        ];

        for (const { key, fieldName } of primitiveFields) {
            const prev = previous[key] ?? null;
            const curr = current[key] ?? null;
            if (prev !== curr) {
                events.push({ fieldName, previousValue: prev as string | null, newValue: curr as string | null });
            }
        }

        return events;
    }

    // FROM: ProductUnitsEntity
    // TO: ProductUnitSnapshotDto
    toProductUnitSnapshotDto(productUnitEntity: ProductUnitsEntity): ProductUnitSnapshotDto {
        return {
            id: productUnitEntity.id,
            unitName: productUnitEntity.unitName,
            unitDescription: productUnitEntity.unitDescription,
            createdAt: productUnitEntity.createdAt,
        };
    }

}
