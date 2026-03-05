import { ApiProperty } from '@nestjs/swagger';

// Import enum
import { StockStatus } from '@app/common/enums/stockStatus.enum';

// Import snapshots.
import { ProductUnitSnapshotDto } from './productUnitSnapshot.dto';
import { ProductNameSnapshotDto } from './productNameSnapshot.dto';

export class ProductSnapshotDto {

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'SKU123456789' })
    sku: string;

    @ApiProperty({ example: 'Premium Product Description', required: false })
    productDescription?: string;

    @ApiProperty({ example: 10000, description: 'Import price in decimal' })
    importPrice: number;

    @ApiProperty({ example: 15000, description: 'Selling price in decimal' })
    sellingPrice: number;

    @ApiProperty({ example: 50, required: false, description: 'Stock reorder threshold' })
    reorderThreshold?: number;

    @ApiProperty({ type: ProductUnitSnapshotDto })
    productUnit: ProductUnitSnapshotDto;

    @ApiProperty({ type: [ProductNameSnapshotDto] })
    productNames: ProductNameSnapshotDto[];

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    createdAt: Date;
}

export enum ProductChangedField {
    NEW_PRODUCT = 'new_product',
    SKU = 'sku',
    PRODUCT_DESCRIPTION = 'product_description',
    IMPORT_PRICE = 'import_price',
    SELLING_PRICE = 'selling_price',
    REORDER_THRESHOLD = 'reorder_threshold',
    PRODUCT_UNIT = 'product_unit',
    PRODUCT_NAMES = 'product_names',
    ACTIVE = 'active',
}

export class ProductChangeEventDto {

    @ApiProperty({
        example: 'sellingPrice',
        description: 'The field name that was changed',
        enum: ProductChangedField,
    })
    fieldName: ProductChangedField;

    @ApiProperty({
        description: 'The previous value before the change. Primitive for scalar fields, object for productUnit, array for productNames.',
        oneOf: [
            { type: 'number', example: 15000 },
            { type: 'string', example: 'Old description' },
            { type: 'array', items: { $ref: '#/components/schemas/ProductNameSnapshotDto' } },
            { $ref: '#/components/schemas/ProductUnitSnapshotDto' },
        ],
        nullable: true,
    })
     previousValue: number | string | ProductNameSnapshotDto[] | ProductUnitSnapshotDto | null;

    @ApiProperty({
        description: 'The new value after the change. Primitive for scalar fields, object for productUnit, array for productNames.',
        oneOf: [
            { type: 'number', example: 18000 },
            { type: 'string', example: 'New description' },
            { type: 'array', items: { $ref: '#/components/schemas/ProductNameSnapshotDto' } },
            { $ref: '#/components/schemas/ProductUnitSnapshotDto' },
        ],
        nullable: true,
    })
    newValue: number | string | ProductNameSnapshotDto[] | ProductUnitSnapshotDto | null;
}