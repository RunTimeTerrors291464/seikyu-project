import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, ValidateIf, IsIn, IsDateString, IsUUID, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SellingInvoiceProductRequestDto {

    @ApiProperty({
        description: 'Product UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Quantity to sell',
        example: 10,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'quantity must be at least 1' })
    quantity: number;

    @ApiPropertyOptional({
        description: 'Discount applied specifically to this product',
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
        description: 'List of products to sell',
        type: [SellingInvoiceProductRequestDto],
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                quantity: 10,
                productDiscount: 10,
                notes: 'Gift-wrapped',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SellingInvoiceProductRequestDto)
    products: SellingInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Invoice-level discount applied on top of product discounts',
        example: 10,
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
        example: 'Customer: Nguyen Van A',
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
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'The page size',
        example: 10,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query',
        example: 'SI26-0000001',
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
        enum: ['invoiceId', 'totalSellingPrice', 'confirmedAt'],
    })
    @IsIn(['invoiceId', 'totalSellingPrice', 'confirmedAt'])
    @IsOptional()
    sortBy?: 'invoiceId' | 'totalSellingPrice' | 'confirmedAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'asc',
        enum: ['asc', 'desc'],
    })
    @IsIn(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'asc';

    @ApiPropertyOptional({
        description: 'Filter selling invoices from this date (ISO 8601 format)',
        example: '2025-11-01T00:00:00.000Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({
        description: 'Filter selling invoices to this date (ISO 8601 format)',
        example: '2025-11-15T23:59:59.999Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    toDate?: string;
}
