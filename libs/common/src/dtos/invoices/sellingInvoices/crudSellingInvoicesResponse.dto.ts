import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { InvoiceStatus } from '../../../enums/invoiceStatus.enum';

export class SellingInvoiceProductResponseDto {

    @ApiProperty({
        description: 'Product invoice item ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Product ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
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
        description: 'Quantity sold',
        example: 10,
    })
    quantity: number;

    @ApiProperty({
        description: 'Selling price per unit',
        example: 10000,
    })
    sellingPrice: number;

    @ApiProperty({
        description: 'Discount percentage for a product',
        example: 0,
    })
    discount: number;

    @ApiProperty({
        description: 'Total selling price for this product (quantity * sellingPrice - discount)',
        example: 100000,
    })
    totalSellingPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Product note',
        nullable: true,
    })
    notes: string | null;
}

export class SellingInvoiceResponseDto {

    @ApiProperty({
        description: 'Selling invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Selling invoice ID (format: SYY-XXXXX)',
        example: 'S25-00001',
    })
    invoiceId: string;

    @ApiProperty({
        description: 'List of products in this selling invoice',
        type: [SellingInvoiceProductResponseDto],
    })
    products: SellingInvoiceProductResponseDto[];

    @ApiProperty({
        description: 'Total number of different products',
        example: 5,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products',
        example: 50,
    })
    totalQuantity: number;

    @ApiProperty({
        description: 'Invoice discount percentage',
        example: 0,
    })
    invoiceDiscount: number;

    @ApiProperty({
        description: 'Total selling price for entire invoice',
        example: 500000,
    })
    totalSellingPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Customer notes',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Tax enabled',
        example: true,
    })
    taxEnabled: boolean;

    @ApiProperty({
        description: 'Status of the selling invoice',
        example: InvoiceStatus.CONFIRMED,
        enum: InvoiceStatus,
    })
    status: InvoiceStatus;

    @ApiProperty({
        description: 'Stock adjustment number',
        example: 0,
    })
    stockAdjustmentNumber: number;

    @ApiPropertyOptional({
        description: 'User who confirmed the selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null | undefined;

    @ApiPropertyOptional({
        description: 'User who cancelled the selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    cancelledBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who cancelled the selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    cancelledByUsername: string | null | undefined;

    @ApiPropertyOptional({
        description: 'Confirmed timestamp',
        example: '2025-12-18T10:30:00.000Z',
        nullable: true,
    })
    confirmedAt: Date | null;

    @ApiPropertyOptional({
        description: 'Cancelled timestamp',
        example: '2025-12-18T10:30:00.000Z',
        nullable: true,
    })
    cancelledAt: Date | null;
}

export class SellingInvoiceWithoutProductsDto {

    @ApiProperty({
        description: 'Selling invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Selling invoice ID (format: SYY-XXXXX)',
        example: 'S25-00001',
    })
    invoiceId: string;

    @ApiProperty({
        description: 'Total number of different products',
        example: 5,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products',
        example: 50,
    })
    totalQuantity: number;

    @ApiProperty({
        description: 'Invoice discount percentage',
        example: 0,
    })
    invoiceDiscount: number;

    @ApiProperty({
        description: 'Total selling price for entire invoice',
        example: 500000,
    })
    totalSellingPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Customer notes',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Tax enabled',
        example: true,
    })
    taxEnabled: boolean;

    @ApiProperty({
        description: 'Status of the selling invoice',
        example: InvoiceStatus.CONFIRMED,
        enum: InvoiceStatus,
    })
    status: InvoiceStatus;

    @ApiProperty({
        description: 'Stock adjustment number',
        example: 0,
    })
    stockAdjustmentNumber: number;

    @ApiPropertyOptional({
        description: 'User who confirmed the selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null | undefined;

    @ApiPropertyOptional({
        description: 'User who cancelled the selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    cancelledBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who cancelled the selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    cancelledByUsername: string | null | undefined;

    @ApiPropertyOptional({
        description: 'Confirmed timestamp',
        example: '2025-12-18T10:30:00.000Z',
        nullable: true,
    })
    confirmedAt: Date | null;

    @ApiPropertyOptional({
        description: 'Cancelled timestamp',
        example: '2025-12-18T10:30:00.000Z',
        nullable: true,
    })
    cancelledAt: Date | null;
}

export class GetListOfSellingInvoicesResponseDto {
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
        description: 'Total number of selling invoices',
        example: 50,
    })
    total: number;

    @ApiProperty({
        description: 'List of selling invoices',
        type: [SellingInvoiceWithoutProductsDto],
    })
    invoices: SellingInvoiceWithoutProductsDto[];
}
