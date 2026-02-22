import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { ImportInvoiceStatus } from '../../../enums/invoiceStatus.enum';

export class ImportInvoiceProductResponseDto {

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
        example: 'Can',
    })
    productUnit: string;

    @ApiProperty({
        description: 'Quantity imported',
        example: 100,
    })
    quantity: number;

    @ApiProperty({
        description: 'Quantity returned',
        example: 0,
    })
    returnedQuantity: number;

    @ApiProperty({
        description: 'Import price per unit',
        example: 5000,
    })
    importPrice: number;

    @ApiProperty({
        description: 'Total price for this product (quantity * importPrice)',
        example: 500000,
    })
    totalImportPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Import from supplier ABC',
        nullable: true,
    })
    notes: string | null;
}

export class ImportInvoiceResponseDto {

    @ApiProperty({
        description: 'Import invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Import invoice ID (format: IYY-XXXXX). Only assigned when confirmed',
        example: 'I25-00001',
        nullable: true,
    })
    invoiceId: string | null;

    @ApiProperty({
        description: 'List of products in this import invoice',
        type: [ImportInvoiceProductResponseDto],
    })
    products: ImportInvoiceProductResponseDto[];

    @ApiProperty({
        description: 'Total number of different products',
        example: 5,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products',
        example: 250,
    })
    totalQuantity: number;

    @ApiProperty({
        description: 'Total import price for entire invoice',
        example: 1250000,
    })
    totalImportPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Import from supplier ABC',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the import invoice',
        example: ImportInvoiceStatus.DRAFT,
        enum: ImportInvoiceStatus,
    })
    status: ImportInvoiceStatus;

    @ApiProperty({
        description: 'Return count',
        example: 0,
    })
    returnCount: number;

    @ApiPropertyOptional({
        description: 'User who drafted the import invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    draftBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who drafted the import invoice',
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
        description: 'User who confirmed the import invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the import invoice',
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

export class ImportInvoiceWithoutProductsDto {

    @ApiProperty({
        description: 'Import invoice UUID.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Import invoice ID (format: IYY-XXXXX). Only assigned when confirmed',
        example: 'I25-00001',
        nullable: true,
    })
    invoiceId: string | null;

    @ApiProperty({
        description: 'Total number of different products',
        example: 5,
    })
    totalProducts: number;

    @ApiProperty({
        description: 'Total quantity of all products',
        example: 250,
    })
    totalQuantity: number;

    @ApiProperty({
        description: 'Total import price for entire invoice',
        example: 1250000,
    })
    totalImportPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Import from supplier ABC',
        nullable: true,
    })
    notes: string | null;

    @ApiProperty({
        description: 'Status of the import invoice',
        example: ImportInvoiceStatus.DRAFT,
        enum: ImportInvoiceStatus,
    })
    status: ImportInvoiceStatus;

    @ApiProperty({
        description: 'Return count',
        example: 0,
    })
    returnCount: number;

    @ApiPropertyOptional({
        description: 'User who drafted the import invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    draftBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who drafted the import invoice',
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
        description: 'User who confirmed the import invoice',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    confirmedBy: string | null;

    @ApiPropertyOptional({
        description: 'Username of the user who confirmed the import invoice',
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

export class GetListOfImportInvoicesResponseDto {
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
        description: 'Total number of import invoices',
        example: 50,
    })
    total: number;

    @ApiProperty({
        description: 'List of import invoices',
        type: [ImportInvoiceWithoutProductsDto],
    })
    invoices: ImportInvoiceWithoutProductsDto[];
}