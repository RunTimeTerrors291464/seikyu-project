import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { ReturnImportInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { ReturnReason } from '@libs/common/enums/returnReasons.enum';

export class ReturnImportInvoiceProductResponseDto {

    @ApiProperty({
        description: 'Return import invoice product row UUID',
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
        description: 'Import price per unit (from original import line)',
        example: 5000,
    })
    importPrice: number;

    @ApiProperty({
        description: 'Total return price for this line (returnQuantity * importPrice)',
        example: 50000,
    })
    totalReturnPrice: number;

    @ApiProperty({
        description: 'Reason category for this return line',
        example: ReturnReason.DEFECTIVE,
        enum: ReturnReason,
    })
    reasonCategory: ReturnReason;

    @ApiPropertyOptional({
        description: 'Free-text notes for the return reason',
        example: 'Defective item',
        nullable: true,
    })
    reasonNotes: string | null;
}

export class ReturnImportInvoiceResponseDto {

    @ApiProperty({
        description: 'Return import invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Return invoice ID (format: RIYY-XXXXXXX). Only assigned when confirmed',
        example: 'RI26-0000001',
        nullable: true,
    })
    returnInvoiceId: string | null;

    @ApiProperty({
        description: 'Original Import Invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    importInvoiceId: string;

    @ApiProperty({
        description: 'List of products in this return import invoice',
        type: [ReturnImportInvoiceProductResponseDto],
    })
    products: ReturnImportInvoiceProductResponseDto[];

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
        example: 100000,
    })
    totalReturnPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Returning some defective items',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the return import invoice',
        example: ReturnImportInvoiceStatus.DRAFT,
        enum: ReturnImportInvoiceStatus,
    })
    status: ReturnImportInvoiceStatus;

    @ApiPropertyOptional({
        description: 'User who drafted the return import invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    draftBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who drafted the return import invoice',
        example: 'johndoe',
        nullable: true,
    })
    draftByUsername: string | null;

    @ApiPropertyOptional({
        description: 'When the return import invoice was last saved as draft',
        example: '2025-12-18T10:30:00.000Z',
    })
    draftAt: Date | null;

    @ApiPropertyOptional({
        description: 'User who confirmed the return import invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the return import invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null;

    @ApiPropertyOptional({
        description: 'When the return import invoice was confirmed',
        example: '2025-12-18T10:30:00.000Z',
    })
    confirmedAt: Date | null;

    @ApiProperty({
        description: 'Row creation timestamp',
        example: '2025-12-18T10:30:00.000Z',
    })
    createdAt: Date;
}

export class ReturnImportInvoiceWithoutProductsDto {

    @ApiProperty({
        description: 'Return import invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Return invoice ID (format: RIYY-XXXXXXX). Only assigned when confirmed',
        example: 'RI26-0000001',
        nullable: true,
    })
    returnInvoiceId: string | null;

    @ApiProperty({
        description: 'Original Import Invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    importInvoiceId: string;

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
        example: 100000,
    })
    totalReturnPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Returning some defective items',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the return import invoice',
        example: ReturnImportInvoiceStatus.DRAFT,
        enum: ReturnImportInvoiceStatus,
    })
    status: ReturnImportInvoiceStatus;

    @ApiPropertyOptional({
        description: 'User who drafted the return import invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    draftBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who drafted the return import invoice',
        example: 'johndoe',
        nullable: true,
    })
    draftByUsername: string | null;

    @ApiPropertyOptional({
        description: 'When the return import invoice was last saved as draft',
        example: '2025-12-18T10:30:00.000Z',
    })
    draftAt: Date | null;

    @ApiPropertyOptional({
        description: 'User who confirmed the return import invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the return import invoice',
        example: 'johndoe',
        nullable: true,
    })
    confirmedByUsername: string | null;

    @ApiPropertyOptional({
        description: 'When the return import invoice was confirmed',
        example: '2025-12-18T10:30:00.000Z',
    })
    confirmedAt: Date | null;

    @ApiProperty({
        description: 'Row creation timestamp',
        example: '2025-12-18T10:30:00.000Z',
    })
    createdAt: Date;
}

export class GetListOfReturnImportInvoicesResponseDto {
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
        description: 'Total number of return import invoices',
        example: 5,
    })
    total: number;

    @ApiProperty({
        description: 'List of return import invoices',
        type: [ReturnImportInvoiceWithoutProductsDto],
    })
    invoices: ReturnImportInvoiceWithoutProductsDto[];
}
