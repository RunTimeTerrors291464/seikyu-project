import { ApiProperty } from '@nestjs/swagger';

export enum ProductUnitChangedField {
    NEW_PRODUCT_UNIT = 'newProductUnit',
    UNIT_NAME = 'unitName',
    UNIT_DESCRIPTION = 'unitDescription',
    IS_ACTIVE = 'isActive',
}

export class ProductUnitSnapshotDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: 'kg' })
    unitName: string;

    @ApiProperty({ example: 'Kilogram', required: false })
    unitDescription?: string;

    @ApiProperty({ example: '2026-03-30T10:30:00Z' })
    createdAt: Date;
}

export class ProductUnitChangeEventDto {

    @ApiProperty({
        example: 'unitName',
        description: 'The field name that was changed',
        enum: ProductUnitChangedField,
    })
    fieldName: ProductUnitChangedField;

    @ApiProperty({
        description: 'The previous value before the change.',
        oneOf: [
            { type: 'string', example: 'kg' },
        ],
        nullable: true,
    })
    previousValue: string | null;

    @ApiProperty({
        description: 'The new value after the change.',
        oneOf: [
            { type: 'string', example: 'kilogram' },
        ],
        nullable: true,
    })
    newValue: string | null;
}
