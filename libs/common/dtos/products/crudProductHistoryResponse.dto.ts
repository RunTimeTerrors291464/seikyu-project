import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Import snapshots.
import { ProductSnapshotDto, ProductChangeEventDto } from '@libs/common/dtos/products/productSnapshot.dto';

// Import enums.
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';

export class ProductHistoryItemResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the history record',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'The version number',
        example: 1,
    })
    version: number;

    @ApiProperty({
        description: 'The user ID who created this version',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    createdBy: string;

    @ApiProperty({
        description: 'The username who created this version',
        example: 'admin',
    })
    createdByUsername: string;

    @ApiProperty({
        description: 'The date and time when this version was created',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Quick-access list of changed field names',
        example: ['sellingPrice', 'productNames'],
        type: [String],
    })
    eventSummary: string[];
}

export class GetListOfProductHistoryResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    limit: number;

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ type: [ProductHistoryItemResponseDto] })
    history: ProductHistoryItemResponseDto[];
}


export class GetProductHistoryByVersionResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the history record',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'The version number',
        example: 1,
    })
    version: number;

    @ApiProperty({
        description: 'The user ID who created this version',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    createdBy: string;

    @ApiProperty({
        description: 'The username who created this version',
        example: 'admin',
    })
    createdByUsername: string;

    @ApiProperty({
        description: 'The date and time when this version was created',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'List of change events recording what fields were changed and their old/new values',
        type: [ProductChangeEventDto],
    })
    events: ProductChangeEventDto[];

    @ApiProperty({
        description: 'Quick-access list of changed field names',
        example: ['sellingPrice', 'productNames'],
        type: [String],
    })
    eventSummary: string[];

    @ApiProperty({
        description: 'Whether this version stores a full product snapshot (every 5 versions)',
        example: false,
    })
    isSnapshot: boolean;

    @ApiProperty({
        description: 'Full product snapshot — only present when isSnapshot is true',
        type: ProductSnapshotDto,
        nullable: true,
    })
    data: ProductSnapshotDto | null;
}

export class ProductStockHistoryResponseDto {
    @ApiProperty({ description: 'Stock history record id' })
    id: string;

    @ApiProperty({ description: 'Product id' })
    productId: string;

    @ApiProperty({ enum: StockActionType })
    quantityType: StockActionType;

    @ApiProperty({ description: 'Quantity delta for this movement' })
    quantity: number;

    @ApiProperty({ enum: InvoiceType })
    referenceType: InvoiceType;

    @ApiProperty({ description: 'Related invoice id' })
    referenceId: string;

    @ApiProperty({ description: 'Inventory stock before the change' })
    beforeInventoryStock: number;

    @ApiProperty({ description: 'Inventory stock after the change' })
    afterInventoryStock: number;

    @ApiProperty()
    createdAt: Date;
}

export class GetListOfProductStockHistoryResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    limit: number;

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ type: [ProductStockHistoryResponseDto] })
    stockHistory: ProductStockHistoryResponseDto[];
}

export class ProductOverviewResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    totalProducts: number;

    @ApiProperty()
    inStock: number;

    @ApiProperty()
    lowStock: number;

    @ApiProperty()
    outOfStock: number;

    @ApiProperty()
    inventoryValue: number;

    @ApiProperty()
    updatedAt: Date;
}
