import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { SellingInvoiceStatus } from '../../../enums/invoiceStatus.enum';

export class SellingInvoiceProductResponseDto {

    @ApiProperty({
        description: 'Selling invoice product item UUID',
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
        example: 'Can',
    })
    productUnit: string;

    @ApiProperty({
        description: 'Quantity sold',
        example: 10,
    })
    quantity: number;

    @ApiProperty({
        description: 'Selling price per unit at the time of the invoice',
        example: 15000,
    })
    sellingPrice: number;

    @ApiProperty({
        description: 'Discount applied to this product (in absolute value)',
        example: 5000,
    })
    productDiscount: number;

    @ApiProperty({
        description: 'Total selling price for this product line ((sellingPrice * quantity) - productDiscount)',
        example: 145000,
    })
    totalSellingPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes for this product line',
        example: 'Gift-wrapped',
        nullable: true,
    })
    notes: string | null;
}

export class SellingInvoiceResponseDto {

    @ApiProperty({
        description: 'Selling invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Selling invoice ID (format: SYY-XXXXXXX). Assigned upon confirmation',
        example: 'S26-0000001',
        nullable: true,
    })
    invoiceId: string | null;

    @ApiProperty({
        description: 'List of products in this selling invoice',
        type: [SellingInvoiceProductResponseDto],
    })
    products: SellingInvoiceProductResponseDto[];

    @ApiProperty({
        description: 'Total number of distinct products',
        example: 3,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products',
        example: 30,
    })
    totalQuantity: number;

    @ApiPropertyOptional({
        description: 'Invoice-level discount (in absolute value)',
        example: 10000,
    })
    invoiceDiscount: number;

    @ApiProperty({
        description: 'Total selling price for the entire invoice after all discounts',
        example: 440000,
    })
    totalSellingPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes for this selling invoice',
        example: 'Customer: Nguyen Van A',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the selling invoice',
        example: SellingInvoiceStatus.CONFIRMED,
        enum: SellingInvoiceStatus,
    })
    status: SellingInvoiceStatus;

    @ApiPropertyOptional({
        description: 'UUID of the user who confirmed (created) the selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Timestamp when the invoice was confirmed',
        example: '2026-01-15T10:30:00.000Z',
        nullable: true,
    })
    confirmedAt: Date | null;
}

export class SellingInvoiceWithoutProductsDto {

    @ApiProperty({
        description: 'Selling invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Selling invoice ID (format: SYY-XXXXXXX)',
        example: 'SS26-0000001',
        nullable: true,
    })
    invoiceId: string | null;

    @ApiProperty({
        description: 'Total number of distinct products',
        example: 3,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products',
        example: 30,
    })
    totalQuantity: number;

    @ApiPropertyOptional({
        description: 'Invoice-level discount (in absolute value)',
        example: 10000,
    })
    invoiceDiscount: number;

    @ApiProperty({
        description: 'Total selling price for the entire invoice after all discounts',
        example: 440000,
    })
    totalSellingPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Customer: Nguyen Van A',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the selling invoice',
        example: SellingInvoiceStatus.CONFIRMED,
        enum: SellingInvoiceStatus,
    })
    status: SellingInvoiceStatus;

    @ApiPropertyOptional({
        description: 'UUID of the user who confirmed (created) the selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Timestamp when the invoice was confirmed',
        example: '2026-01-15T10:30:00.000Z',
        nullable: true,
    })
    confirmedAt: Date | null;
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
        example: 25,
    })
    total: number;

    @ApiProperty({
        description: 'List of selling invoices',
        type: [SellingInvoiceWithoutProductsDto],
    })
    invoices: SellingInvoiceWithoutProductsDto[];
}
