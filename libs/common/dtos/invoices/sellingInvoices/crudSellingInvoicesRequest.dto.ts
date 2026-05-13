import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, MaxLength, Min, MinLength, ValidateIf, IsIn, IsDateString, IsUUID, IsEnum, Max, Validate, ArrayUnique, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { SellingInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

// Import validators.
import { InvoiceDateRangeConstraint } from '@libs/common/validators/invoiceDateRange.constraint';

export class SellingInvoiceProductRequestDto {

    @ApiProperty({
        description: 'Product SKU',
        example: '1234567890123',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(13, { message: 'productSku must be exactly 13 characters.' })
    @MaxLength(13, { message: 'productSku must be exactly 13 characters.' })
    productSku: string;

    @ApiProperty({
        description: 'Product name',
        example: 'Coca Cola 330ml',
    })
    @IsNotEmpty()
    @IsString()
    productName: string;

    @ApiProperty({
        description: 'Product unit',
        example: 'PCS',
    })
    @IsNotEmpty()
    @IsString()
    productUnit: string;

    @ApiProperty({
        description: 'Quantity to sell',
        example: 10,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'quantity must be at least 1' })
    quantity: number;

    @ApiProperty({
        description: 'Selling price per unit',
        example: 15000,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: 'sellingPrice must be at least 0' })
    sellingPrice: number;

    @ApiPropertyOptional({
        description: 'Discount for this product line as a percentage (0–100)',
        example: 10,
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    productDiscount?: number;

    @ApiPropertyOptional({
        description: 'Additional notes for this selling invoice product',
        example: 'Gift-wrapped',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateSellingInvoiceRequestDto {

    @ApiProperty({
        description: 'List of products to sell (cashier). Each productSku must appear at most once.',
        type: [SellingInvoiceProductRequestDto],
        example: [
            {
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                quantity: 10,
                sellingPrice: 15000,
                productDiscount: 10,
                notes: 'Gift-wrapped',
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SellingInvoiceProductRequestDto)
    @ArrayUnique((item: SellingInvoiceProductRequestDto) => item.productSku, { message: 'Each productSku must appear only once in the list.' })
    products: SellingInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Invoice-level discount as a percentage (0–100)',
        example: 5,
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    invoiceDiscount?: number;

    @ApiPropertyOptional({
        description: 'Additional notes for this selling invoice',
        example: '4th of July promotion',
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({
        description: 'Whether this invoice is tax-focused (must be true or false)',
        example: false,
    })
    @IsNotEmpty()
    @IsBoolean()
    taxFocus: boolean;
}

export class EditSellingInvoiceRequestDto {
    @ApiProperty({
        description: 'Selling invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'List of products (replace existing lines). Each productSku must appear at most once.',
        type: [SellingInvoiceProductRequestDto],
        example: [
            {
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                quantity: 10,
                sellingPrice: 15000,
                productDiscount: 10,
                notes: 'Updated line note',
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SellingInvoiceProductRequestDto)
    @ArrayUnique((item: SellingInvoiceProductRequestDto) => item.productSku, { message: 'Each productSku must appear only once in the list.' })
    products: SellingInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this selling invoice',
        example: 'Updated selling invoice notes',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class GetListOfSellingInvoiceRequestDto {

    @ApiPropertyOptional({
        description: 'The page number',
        example: 1,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(2147483647)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'The page size',
        example: 10,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query',
        example: 'S26-0000001',
    })
    @IsString()
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The field to search by',
        example: 'invoiceId',
        enum: ['invoiceId', 'userId', 'productId'],
    })
    @IsIn(['invoiceId', 'userId', 'productId'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'invoiceId' | 'userId' | 'productId';

    @ApiPropertyOptional({
        description: 'Sort by which field',
        example: 'invoiceId',
        enum: ['invoiceId', 'totalProducts', 'totalQuantity', 'totalSellingPrice', 'status', 'returnCount', 'confirmedAt', 'createdAt'],
    })
    @IsIn(['invoiceId', 'totalProducts', 'totalQuantity', 'totalSellingPrice', 'status', 'returnCount', 'confirmedAt', 'createdAt'])
    @IsOptional()
    sortBy?: 'invoiceId' | 'totalProducts' | 'totalQuantity' | 'totalSellingPrice' | 'status' | 'returnCount' | 'confirmedAt' | 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'asc',
        enum: ['asc', 'desc'],
    })
    @IsIn(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'asc';

    @ApiPropertyOptional({
        description: 'Filter by status',
        example: SellingInvoiceStatus.CONFIRMED,
        enum: SellingInvoiceStatus,
    })
    @IsOptional()
    @IsEnum(SellingInvoiceStatus)
    status?: SellingInvoiceStatus;

    @ApiPropertyOptional({
        description: 'Filter by tax focus: true = only invoices with tax focus, false = only without; omit for all',
        example: 'true',
        enum: ['true', 'false'],
    })
    @IsIn(['true', 'false'])
    @IsOptional()
    taxFocus?: 'true' | 'false';

    @ApiProperty({
        description:
            'Filter by invoice.createdAt from this instant (ISO 8601). Together with toDate, the range must not exceed 180 calendar days.',
        example: '2025-11-01T00:00:00.000Z',
        required: true,
    })
    @IsNotEmpty()
    @IsDateString()
    fromDate: string;

    @ApiProperty({
        description:
            'Filter by invoice.createdAt to this instant (ISO 8601). Together with fromDate, the range must not exceed 180 calendar days.',
        example: '2025-11-15T23:59:59.999Z',
        required: true,
    })
    @IsNotEmpty()
    @IsDateString()
    @Validate(InvoiceDateRangeConstraint, [180])
    toDate: string;
}
