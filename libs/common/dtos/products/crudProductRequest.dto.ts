import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsArray, IsUUID, Min, IsNumber, IsBoolean, ValidateIf, IsIn, ValidateNested, IsEnum, Max, ArrayMaxSize, ArrayUnique } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Import invoice type enum
import { StockStatus } from '@libs/common/enums/stockStatus.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';

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
        description: 'Array of product names (The first one ALWAYS the main name)',
        example: ['Product Name 1', 'Product Name 2'],
        isArray: true,
        type: [String],
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(8, { message: 'productNames must contain at most 8 items' })
    @IsString({ each: true })
    @MaxLength(255, { each: true, message: 'Each productName must be less than 255 characters.' })
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
        maxLength: 2048,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'productDescription must be less than 2048 characters.' })
    productDescription?: string;

    @ApiProperty({
        description: 'Import price of the product',
        example: 100.50,
        minimum: 0,
        maximum: 2147483647,
    })
    @IsNotEmpty()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(2147483647)
    @Type(() => Number)
    importPrice: number;

    @ApiProperty({
        description: 'Selling price of the product',
        example: 150.75,
        minimum: 0,
        maximum: 2147483647,
    })
    @IsNotEmpty()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(2147483647)
    @Type(() => Number)
    sellingPrice: number;

    @ApiPropertyOptional({
        description: 'Reorder threshold of the product',
        example: 10,
        minimum: 0,
        maximum: 2147483647,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(2147483647)
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
        description: 'Array of product names (The first one ALWAYS the main name)',
        example: ['Product Name English', 'Product Name Vietnamese'],
        isArray: true,
        type: [String],
        maxLength: 255,
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(8, { message: 'productNames must contain at most 8 items' })
    @IsString({ each: true })
    @MaxLength(255, { each: true, message: 'Each productName must be less than 255 characters.' })
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
        maxLength: 2048,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'productDescription must be less than 2048 characters.' })
    productDescription?: string;

    @ApiPropertyOptional({
        description: 'Import price of the product',
        example: 100.50,
        minimum: 0,
        maximum: 2147483647,
        required: false,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(2147483647)
    @Type(() => Number)
    importPrice?: number;

    @ApiPropertyOptional({
        description: 'Selling price of the product',
        example: 150.75,
        minimum: 0,
        maximum: 2147483647,
        required: false,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(2147483647)
    @Type(() => Number)
    sellingPrice?: number;

    @ApiPropertyOptional({
        description: 'Reorder threshold of the product',
        example: 10,
        minimum: 0,
        maximum: 2147483647,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(2147483647)
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
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query',
        example: 'Product',
        maxLength: 255,
    })
    @IsString()
    @MaxLength(255, { message: 'search must be less than 255 characters.' })
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The search by which field',
        example: 'sku',
        enum: ['sku', 'productName'],
    })
    @IsIn(['sku', 'productName'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'sku' | 'productName';

    @ApiPropertyOptional({
        description: 'Sort by which field',
        example: 'sku',
        enum: ['sku', 'productName', 'productUnitName', 'importPrice', 'sellingPrice', 'stockStatus', 'inventoryStock', 'createdAt', 'updatedAt',],
    })
    @IsIn(['sku', 'productName', 'productUnitName', 'importPrice', 'sellingPrice', 'stockStatus', 'inventoryStock', 'createdAt', 'updatedAt'])
    @IsOptional()
    sortBy?: 'sku' | 'productName' | 'productUnitName' | 'importPrice' | 'sellingPrice' | 'stockStatus' | 'inventoryStock' | 'createdAt' | 'updatedAt';

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
        example: StockStatus.IN_STOCK,
        enum: StockStatus,
    })
    @IsOptional()
    @Type(() => Number)
    @IsIn([StockStatus.IN_STOCK, StockStatus.REORDER_THRESHOLD_REACHED, StockStatus.OUT_OF_STOCK])
    stockStatus?: StockStatus;

}

// Get a list of product with specific product unit id.
export class GetListOfProductByProductUnitIdRequestDto {
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
    limit?: number = 10;

    @ApiProperty({
        description: 'The unique identifier of the product unit',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productUnitId: string;
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
        maximum: 2147483647,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(2147483647)
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
        description: 'List of products to update inventory (each product id must appear at most once)',
        type: [UpdateProductInventoryRequestDto],
        maxItems: 100,
        example: [
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                quantity: 10,
                action: StockActionType.ADD,
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(100, { message: 'products must contain at most 100 items.' })
    @ArrayUnique((item: UpdateProductInventoryRequestDto) => item.id, { message: 'Each product id must appear only once in the list.' })
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
