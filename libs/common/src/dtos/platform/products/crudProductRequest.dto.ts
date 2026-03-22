import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsArray, IsUUID, Min, IsNumber, IsBoolean, ValidateIf, IsIn, ValidateNested, IsEnum, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Import invoice type enum
import { InvoiceType } from '@app/common/enums/invoiceType.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

export class CreateProductRequestDto {
    @ApiProperty({
        description: 'The SKU of the product',
        example: '1234567890123',
        minLength: 13,
        maxLength: 13,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(13, { message: 'sku must be exactly 13 characters.' })
    @MaxLength(13, { message: 'sku must be exactly 13 characters.' })
    sku: string;

    @ApiProperty({
        description: 'Array of product names',
        example: ['Product Name 1', 'Product Name 2'],
        isArray: true,
        type: [String],
    })
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    productNames: string[];

    @ApiProperty({
        description: 'The unique identifier of the product unit',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productUnitId: string;

    @ApiPropertyOptional({
        description: 'Product description',
        example: 'Detailed description of the product',
        required: false,
    })
    @IsOptional()
    @IsString()
    productDescription?: string;

    @ApiProperty({
        description: 'Import price of the product',
        example: 100.50,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    importPrice: number;

    @ApiProperty({
        description: 'Selling price of the product',
        example: 150.75,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    sellingPrice: number;

    @ApiPropertyOptional({
        description: 'Reorder threshold of the product',
        example: 10,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    reorderThreshold?: number;
}

export class EditProductRequestDto {

    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiPropertyOptional({
        description: 'The SKU of the product.',
        example: '1234567890123',
        minLength: 13,
        maxLength: 13,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(13, { message: 'sku must be exactly 13 characters.' })
    @MaxLength(13, { message: 'sku must be exactly 13 characters.' })
    sku?: string;

    @ApiPropertyOptional({
        description: 'Product names (supports multiple languages)',
        example: ['Product Name English', 'Product Name Vietnamese'],
        isArray: true,
        type: [String],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    productNames?: string[];

    @ApiPropertyOptional({
        description: 'The unique identifier of the product unit',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    productUnitId?: string;

    @ApiPropertyOptional({
        description: 'Product description',
        example: 'Detailed description of the product',
        required: false,
    })
    @IsOptional()
    @IsString()
    productDescription?: string;

    @ApiPropertyOptional({
        description: 'Import price of the product',
        example: 100.50,
        minimum: 0,
        required: false,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    importPrice?: number;

    @ApiPropertyOptional({
        description: 'Selling price of the product',
        example: 150.75,
        minimum: 0,
        required: false,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    sellingPrice?: number;

    @ApiPropertyOptional({
        description: 'Reorder threshold of the product',
        example: 10,
        minimum: 0,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    reorderThreshold?: number;
}

export class GetListOfProductRequestDto {
    @ApiPropertyOptional({
        description: 'The page number',
        example: 1,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(2147483647)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'The page size',
        example: 10,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query',
        example: 'Product',
    })
    @IsString()
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The search by which field',
        example: 'sku',
        enum: ['sku', 'productName', 'importPrice', 'sellingPrice'],
    })
    @IsIn(['sku', 'productName', 'importPrice', 'sellingPrice'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'sku' | 'productName' | 'importPrice' | 'sellingPrice';

    @ApiPropertyOptional({
        description: 'Sort by which field',
        example: 'sku',
        enum: ['sku', 'productName', 'unit', 'importPrice', 'sellingPrice', 'createdAt', 'updatedAt', 'stockStatus'],
    })
    @IsIn(['sku', 'productName', 'unit', 'importPrice', 'sellingPrice', 'createdAt', 'updatedAt', 'stockStatus'])
    @IsOptional()
    sortBy?: 'sku' | 'productName' | 'unit' | 'importPrice' | 'sellingPrice' | 'createdAt' | 'updatedAt' | 'stockStatus';

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'asc',
        enum: ['asc', 'desc'],
    })
    @IsIn(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({
        description: 'Filter by active status',
        example: "true",
        enum: ["true", "false", "all"],
    })
    @IsIn(["true", "false", "all"])
    @IsOptional()
    isActive?: "true" | "false" | "all";

    @ApiPropertyOptional({
        description: 'Filter by stock status',
        example: "0",
        enum: ["0", "1", "2", "all"],
    })
    @IsIn(["0", "1", "2", "all"])
    @IsOptional()
    stockStatus?: "0" | "1" | "2" | "all";

}

export class UpdateProductInventoryRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'Quantity to add or subtract',
        example: 10,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    quantity: number;

    @ApiProperty({
        description: 'Action to perform: add or subtract',
        example: StockActionType.ADD,
        enum: StockActionType,
    })
    @IsNotEmpty()
    @IsEnum(StockActionType)
    action: StockActionType;

}

export class UpdateProductInventoryBulkRequestDto {
    @ApiProperty({
        description: 'List of products to update inventory',
        type: [UpdateProductInventoryRequestDto],
        example: [
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                quantity: 10,
                action: 'add',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateProductInventoryRequestDto)
    products: UpdateProductInventoryRequestDto[];

    @ApiProperty({
        description: 'Invoice type',
        example: InvoiceType.IMPORT,
        enum: InvoiceType
    })
    @IsNotEmpty()
    @IsIn(Object.values(InvoiceType))
    invoiceType: InvoiceType;

    @ApiProperty({
        description: 'Invoice id',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsNotEmpty()
    @IsUUID()
    invoiceId: string;
}




