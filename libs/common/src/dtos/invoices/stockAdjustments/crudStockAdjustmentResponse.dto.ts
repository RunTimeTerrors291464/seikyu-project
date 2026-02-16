import { ApiProperty } from '@nestjs/swagger';

// Import enums.
import { StockActionType } from '@app/common/enums/stockActionType.enum';
import { StockAdjustmentType } from '@app/common/enums/stockAdjustmentType.enum';

export class StockAdjustmentProductResponseDto {
    @ApiProperty({ description: 'ID of the stock adjustment product' })
    id: string;

    @ApiProperty({ description: 'Product UUID' })
    productId: string;

    @ApiProperty({ description: 'SKU of the product' })
    productSku: string;

    @ApiProperty({ description: 'Name of the product' })
    productName: string;

    @ApiProperty({ description: 'Unit of the product' })
    productUnit: string;

    @ApiProperty({ description: 'Quantity adjusted' })
    quantity: number;

    @ApiProperty({
        description: 'Type of adjustment: add or subtract',
        enum: StockActionType,
    })
    type: StockActionType;

    @ApiProperty({ description: 'Notes for the product adjustment' })
    notes: string | null;
}

export class StockAdjustmentResponseDto {
    @ApiProperty({ description: 'ID of the stock adjustment' })
    id: string;

    @ApiProperty({ description: 'Stock Adjustment ID (SA-YY-XXXXX)' })
    adjustmentId: string | null;

    @ApiProperty({ description: 'Stock adjustment type', enum: StockAdjustmentType })
    stockAdjustmentType: StockAdjustmentType;

    @ApiProperty({ description: 'Reference ID (e.g., Invoice ID)' })
    referenceId: string | null;

    @ApiProperty({ description: 'Total number of products in the adjustment' })
    totalProducts: number;

    @ApiProperty({ description: 'Total quantity increased' })
    totalIncrease: number;

    @ApiProperty({ description: 'Total quantity decreased' })
    totalDecrease: number;

    @ApiProperty({ description: 'Notes for the stock adjustment' })
    notes: string | null;

    @ApiProperty({ description: 'Status of the adjustment (0: Draft, 1: Confirmed, 2: Cancelled)' })
    status: 0 | 1 | 2;

    @ApiProperty({ description: 'Username of the user who drafted the adjustment' })
    draftBy: string | null;

    @ApiProperty({ description: 'Username of the user who drafted the adjustment' })
    draftByUsername: string | null;

    @ApiProperty({ description: 'Drafted timestamp' })
    draftAt: Date | null;

    @ApiProperty({ description: 'Username of the user who confirmed the adjustment' })
    confirmedBy: string | null;

    @ApiProperty({ description: 'Username of the user who confirmed the adjustment' })
    confirmedByUsername: string | null;

    @ApiProperty({ description: 'Confirmed timestamp' })
    confirmedAt: Date | null;

    @ApiProperty({ description: 'List of products in the adjustment', type: [StockAdjustmentProductResponseDto] })
    stockAdjustmentProducts: StockAdjustmentProductResponseDto[];
}

export class StockAdjustmentWithoutProductsDto {
    @ApiProperty({ description: 'ID of the stock adjustment' })
    id: string;

    @ApiProperty({ description: 'Stock Adjustment ID (SA-YY-XXXXX)' })
    adjustmentId: string | null;

    @ApiProperty({ description: 'Stock adjustment type', enum: StockAdjustmentType })
    stockAdjustmentType: StockAdjustmentType;

    @ApiProperty({ description: 'Reference ID (e.g., Invoice ID)' })
    referenceId: string | null;

    @ApiProperty({ description: 'Total number of products in the adjustment' })
    totalProducts: number;

    @ApiProperty({ description: 'Total quantity increased' })
    totalIncrease: number;

    @ApiProperty({ description: 'Total quantity decreased' })
    totalDecrease: number;

    @ApiProperty({ description: 'Notes for the stock adjustment' })
    notes: string | null;

    @ApiProperty({ description: 'Status of the adjustment (0: Draft, 1: Confirmed, 2: Cancelled)' })
    status: 0 | 1 | 2;

    @ApiProperty({ description: 'Username of the user who drafted the adjustment' })
    draftBy: string | null;

    @ApiProperty({ description: 'Username of the user who drafted the adjustment' })
    draftByUsername: string | null;

    @ApiProperty({ description: 'Drafted timestamp' })
    draftAt: Date | null;

    @ApiProperty({ description: 'Username of the user who confirmed the adjustment' })
    confirmedBy: string | null;

    @ApiProperty({ description: 'Username of the user who confirmed the adjustment' })
    confirmedByUsername: string | null;

    @ApiProperty({ description: 'Confirmed timestamp' })
    confirmedAt: Date | null;
}

export class GetListOfStockAdjustmentsResponseDto {
    @ApiProperty({ description: 'Current page number' })
    page: number;

    @ApiProperty({ description: 'Items per page' })
    limit: number;

    @ApiProperty({ description: 'Total number of items' })
    total: number;

    @ApiProperty({ description: 'List of stock adjustments', type: [StockAdjustmentWithoutProductsDto] })
    stockAdjustments: StockAdjustmentWithoutProductsDto[];
}
