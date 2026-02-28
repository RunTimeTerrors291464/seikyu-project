import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '../../../enums/invoiceStatus.enum';
import { StockActionType, StockActionReason } from '../../../enums/stockActionType.enum';

export class StockAdjustmentInvoiceProductResponseDto {

    @ApiProperty({
        description: 'Product invoice item ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Product ID',
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
        description: 'Action type: add or subtract stock',
        example: StockActionType.SUBTRACT,
        enum: StockActionType,
    })
    action: StockActionType;

    @ApiProperty({
        description: 'Quantity adjusted',
        example: 5,
    })
    quantity: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Damaged during storage',
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
        description: 'Stock adjustment invoice ID (format: SAYYY-XXXXX). Only assigned when confirmed',
        example: 'SA26-00001',
        nullable: true,
    })
    invoiceId: string | null;

    @ApiProperty({
        description: 'List of products in this stock adjustment invoice',
        type: [StockAdjustmentInvoiceProductResponseDto],
    })
    products: StockAdjustmentInvoiceProductResponseDto[];

    @ApiProperty({
        description: 'Total number of different products',
        example: 3,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products adjusted',
        example: 15,
    })
    totalQuantity: number;

    @ApiProperty({
        description: 'Reason for stock adjustment',
        example: StockActionReason.DAMAGED_GOODS,
        enum: StockActionReason,
    })
    actionReason: StockActionReason;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Periodic inventory check - Q1 2026',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the stock adjustment invoice',
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
        description: 'Stock adjustment invoice ID (format: SAYYY-XXXXX). Only assigned when confirmed',
        example: 'SA26-00001',
        nullable: true,
    })
    invoiceId: string | null;

    @ApiProperty({
        description: 'Total number of different products',
        example: 3,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products adjusted',
        example: 15,
    })
    totalQuantity: number;

    @ApiProperty({
        description: 'Reason for stock adjustment',
        example: StockActionReason.DAMAGED_GOODS,
        enum: StockActionReason,
    })
    actionReason: StockActionReason;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Periodic inventory check - Q1 2026',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the stock adjustment invoice',
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
