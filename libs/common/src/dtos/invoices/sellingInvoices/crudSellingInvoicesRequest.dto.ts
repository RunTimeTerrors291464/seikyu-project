import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, MaxLength, Min, MinLength, ValidateIf, IsIn, IsDateString, IsEnum, IsBoolean, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { InvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

export class SellingInvoiceProductRequestDto {

    @ApiProperty({
        description: 'Product ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Product SKU',
        example: '1234567890123',
        maxLength: 13,
        minLength: 13,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(13, { message: 'productSku must be 13 characters' })
    @MinLength(13, { message: 'productSku must be 13 characters' })
    productSku: string;

    @ApiProperty({
        description: 'Product name',
        example: 'Coca Cola 330ml',
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255, { message: 'productName must be 255 characters or less' })
    productName: string;

    @ApiProperty({
        description: 'Product unit',
        example: 'PCS',
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255, { message: 'productUnit must be 255 characters or less' })
    productUnit: string;

    @ApiProperty({
        description: 'Quantity to sell',
        example: 1,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'quantity must be at least 1' })
    quantity: number;

    @ApiProperty({
        description: 'Selling price per unit',
        example: 10000,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: 'sellingPrice must be at least 0' })
    sellingPrice: number;

    @ApiProperty({
        description: 'Discount percentage for a product',
        example: 0,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: 'discount must be at least 0' })
    @Max(100, { message: 'discount must be at most 100' })
    discount: number;

    @ApiPropertyOptional({
        description: 'Additional notes for this selling invoice product',
        example: 'Product notes',
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
                productId: '123e4567-e89b-12d3-a456-426614174000',
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                quantity: 1,
                sellingPrice: 10000,
                discount: 0,
                notes: 'Product note',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SellingInvoiceProductRequestDto)
    products: SellingInvoiceProductRequestDto[];

    @ApiProperty({
        description: 'Invoice discount percentage',
        example: 0,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: 'invoiceDiscount must be at least 0' })
    @Max(100, { message: 'invoiceDiscount must be at most 100' })
    invoiceDiscount: number;

    @ApiProperty({
        description: 'Tax enabled',
        example: true,
    })
    @IsNotEmpty()
    @IsBoolean()
    taxEnabled: boolean;

    @ApiPropertyOptional({
        description: 'Additional notes for this selling invoice',
        example: 'Customer notes',
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
        example: 'INV-',
    })
    @IsString()
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The search by which field',
        example: 'invoiceId',
        enum: ['invoiceId', 'userId', 'productId'],
    })
    @IsIn(['invoiceId', 'userId', 'productId'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'invoiceId' | 'userId' | 'productId';

    @ApiPropertyOptional({
        description: 'Sort by which field',
        example: 'invoiceId',
        enum: ['invoiceId', 'createdAt', 'updatedAt'],
    })
    @IsIn(['invoiceId', 'createdAt', 'updatedAt'])
    @IsOptional()
    sortBy?: 'invoiceId' | 'createdAt' | 'updatedAt';

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
        example: 1,
        enum: InvoiceStatus,
    })
    @IsOptional()
    @IsEnum(InvoiceStatus)
    @Type(() => Number)
    status?: InvoiceStatus;

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