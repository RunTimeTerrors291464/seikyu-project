import { ApiProperty } from '@nestjs/swagger';

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

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ 
        example: 0, 
        enum: [0, 1, 2],
        description: '0: In stock, 1: Reorder threshold reached, 2: Out of stock' 
    })
    stockStatus: 0 | 1 | 2;

    @ApiProperty({ type: ProductUnitSnapshotDto })
    productUnit: ProductUnitSnapshotDto;

    @ApiProperty({ type: [ProductNameSnapshotDto] })
    productNames: ProductNameSnapshotDto[];

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    createdAt: Date;

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    updatedAt: Date;

}
