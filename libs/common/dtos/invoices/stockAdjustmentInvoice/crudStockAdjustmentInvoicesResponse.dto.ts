import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { StockAdjustmentReason } from '@libs/common/enums/returnReasons.enum';

export class StockAdjustmentInvoiceProductResponseDto {

    @ApiProperty({
        description: 'Stock adjustment invoice line UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Product UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    productId: string;

    @ApiProperty({
        description: 'Product SKU',
        example: '1234567890123',
    })
    productSku: string;

    @ApiProperty({
        description: 'Product name',
        example: 'Coca Cola 330ml',
    })
    productName: string;

    @ApiProperty({
        description: 'Product unit',
        example: 'PCS',
    })
    productUnit: string;

    @ApiProperty({
        description: 'Stock action for this line',
        example: StockActionType.SUBTRACT,
        enum: StockActionType,
    })
    action: StockActionType;

    @ApiProperty({
        description: 'Quantity adjusted',
        example: 5,
    })
    quantity: number;

    @ApiProperty({
        description: 'Reason category for this line',
        example: StockAdjustmentReason.DAMAGE,
        enum: StockAdjustmentReason,
    })
    reasonCategory: StockAdjustmentReason;

    @ApiPropertyOptional({
        description: 'Free-text notes for the reason',
        example: 'Damaged during storage',
        nullable: true,
    })
    reasonNotes: string | null;

    @ApiPropertyOptional({
        description: 'Additional notes for this line',
        example: 'Warehouse B',
        nullable: true,
    })
    notes: string | null;
}

export class StockAdjustmentInvoiceResponseDto {

    @ApiProperty({
        description: 'Stock adjustment invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Stock adjustment invoice ID (format: SAYY-XXXXXXX). Assigned when confirmed',
        example: 'SA26-0000001',
        nullable: true,
    })
    invoiceId: string | null;

    @ApiProperty({
        description: 'Lines on this stock adjustment invoice',
        type: [StockAdjustmentInvoiceProductResponseDto],
    })
    products: StockAdjustmentInvoiceProductResponseDto[];

    @ApiProperty({
        description: 'Number of distinct products',
        example: 3,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Sum of line quantities',
        example: 15,
    })
    totalQuantity: number;

    @ApiPropertyOptional({
        description: 'Header notes',
        example: 'Periodic inventory check - Q1 2026',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Invoice status',
        example: StockAdjustmentInvoiceStatus.DRAFT,
        enum: StockAdjustmentInvoiceStatus,
    })
    status: StockAdjustmentInvoiceStatus;

    @ApiPropertyOptional({
        description: 'User who drafted the invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    draftBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who drafted the invoice',
        example: 'johndoe',
        nullable: true,
    })
    draftByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Draft timestamp',
        example: '2026-01-15T10:30:00.000Z',
        nullable: true,
    })
    draftAt: Date | null;

    @ApiPropertyOptional({
        description: 'User who confirmed the invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Confirmed timestamp',
        example: '2026-01-15T11:00:00.000Z',
        nullable: true,
    })
    confirmedAt: Date | null;
}

export class StockAdjustmentInvoiceWithoutProductsDto {

    @ApiProperty({
        description: 'Stock adjustment invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Stock adjustment invoice ID (format: SAYY-XXXXXXX)',
        example: 'SA26-0000001',
        nullable: true,
    })
    invoiceId: string | null;

    @ApiProperty({
        description: 'Number of distinct products',
        example: 3,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Sum of line quantities',
        example: 15,
    })
    totalQuantity: number;

    @ApiPropertyOptional({
        description: 'Header notes',
        example: 'Periodic inventory check - Q1 2026',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Invoice status',
        example: StockAdjustmentInvoiceStatus.DRAFT,
        enum: StockAdjustmentInvoiceStatus,
    })
    status: StockAdjustmentInvoiceStatus;

    @ApiPropertyOptional({
        description: 'User who drafted the invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    draftBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who drafted the invoice',
        example: 'johndoe',
        nullable: true,
    })
    draftByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Draft timestamp',
        example: '2026-01-15T10:30:00.000Z',
        nullable: true,
    })
    draftAt: Date | null;

    @ApiPropertyOptional({
        description: 'User who confirmed the invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Confirmed timestamp',
        example: '2026-01-15T11:00:00.000Z',
        nullable: true,
    })
    confirmedAt: Date | null;
}

export class GetListOfStockAdjustmentInvoicesResponseDto {

    @ApiProperty({
        description: 'Current page number',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'Items per page',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'Total number of stock adjustment invoices',
        example: 20,
    })
    total: number;

    @ApiProperty({
        description: 'List of stock adjustment invoices',
        type: [StockAdjustmentInvoiceWithoutProductsDto],
    })
    invoices: StockAdjustmentInvoiceWithoutProductsDto[];
}
