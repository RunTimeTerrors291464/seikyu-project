import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { ReturnSellingInvoiceStatus } from '../../../enums/invoiceStatus.enum';

export class ReturnSellingInvoiceProductResponseDto {

    @ApiProperty({
        description: 'Return product invoice item ID',
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
        example: 'Can',
    })
    productUnit: string;

    @ApiProperty({
        description: 'Quantity returned',
        example: 10,
    })
    returnQuantity: number;

    @ApiProperty({
        description: 'Selling price per unit',
        example: 15000,
    })
    sellingPrice: number;

    @ApiProperty({
        description: 'Total return price for this product (returnQuantity * sellingPrice)',
        example: 150000,
    })
    totalReturnPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Defective item',
        nullable: true,
    })
    notes: string | null;
}

export class ReturnSellingInvoiceResponseDto {

    @ApiProperty({
        description: 'Return selling invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Return invoice ID (format: RSYY-XXXXXXX). Only assigned when confirmed',
        example: 'RS26-0000001',
        nullable: true,
    })
    returnInvoiceId: string | null;

    @ApiProperty({
        description: 'Original Selling Invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    sellingInvoiceId: string;

    @ApiProperty({
        description: 'List of products in this return selling invoice',
        type: [ReturnSellingInvoiceProductResponseDto],
    })
    products: ReturnSellingInvoiceProductResponseDto[];

    @ApiProperty({
        description: 'Total number of different products',
        example: 2,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products',
        example: 20,
    })
    totalQuantity: number;

    @ApiProperty({
        description: 'Total return price for entire invoice',
        example: 300000,
    })
    totalReturnPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Returning some defective items',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the return selling invoice',
        example: ReturnSellingInvoiceStatus.DRAFT,
        enum: ReturnSellingInvoiceStatus,
    })
    status: ReturnSellingInvoiceStatus;

    @ApiPropertyOptional({
        description: 'User who drafted the return selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    draftBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who drafted the return selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    draftByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Created timestamp',
        example: '2025-12-18T10:30:00.000Z',
    })
    draftAt: Date | null;

    @ApiPropertyOptional({
        description: 'User who confirmed the return selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the return selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Created timestamp',
        example: '2025-12-18T10:30:00.000Z',
    })
    confirmedAt: Date | null;
}

export class ReturnSellingInvoiceWithoutProductsDto {

    @ApiProperty({
        description: 'Return selling invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Return invoice ID (format: RSYY-XXXXXXX). Only assigned when confirmed',
        example: 'RS26-0000001',
        nullable: true,
    })
    returnInvoiceId: string | null;

    @ApiProperty({
        description: 'Original Selling Invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    sellingInvoiceId: string;

    @ApiProperty({
        description: 'Total number of different products',
        example: 2,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products',
        example: 20,
    })
    totalQuantity: number;

    @ApiProperty({
        description: 'Total return price for entire invoice',
        example: 300000,
    })
    totalReturnPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Returning some defective items',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the return selling invoice',
        example: ReturnSellingInvoiceStatus.DRAFT,
        enum: ReturnSellingInvoiceStatus,
    })
    status: ReturnSellingInvoiceStatus;

    @ApiPropertyOptional({
        description: 'User who drafted the return selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    draftBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who drafted the return selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    draftByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Created timestamp',
        example: '2025-12-18T10:30:00.000Z',
    })
    draftAt: Date | null;

    @ApiPropertyOptional({
        description: 'User who confirmed the return selling invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the return selling invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null;

    @ApiPropertyOptional({
        description: 'Created timestamp',
        example: '2025-12-18T10:30:00.000Z',
    })
    confirmedAt: Date | null;
}

export class GetListOfReturnSellingInvoicesResponseDto {
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
        description: 'Total number of return selling invoices',
        example: 5,
    })
    total: number;

    @ApiProperty({
        description: 'List of return selling invoices',
        type: [ReturnSellingInvoiceWithoutProductsDto],
    })
    invoices: ReturnSellingInvoiceWithoutProductsDto[];
}
