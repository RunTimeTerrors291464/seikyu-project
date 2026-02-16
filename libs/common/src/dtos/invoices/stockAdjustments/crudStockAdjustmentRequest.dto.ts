import { IsNotEmpty, IsOptional, IsString, IsArray, IsUUID, Min, IsNumber, IsIn, ValidateNested, ValidateIf, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Import enums.
import { StockAdjustmentStatus } from '@app/common/enums/invoiceStatus.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';
import { StockAdjustmentType } from '@app/common/enums/stockAdjustmentType.enum';

export class CreateStockAdjustmentProductDto {
    @ApiProperty({
        description: 'Product UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'The SKU of the product',
        example: '1234567890123',
    })
    @IsNotEmpty()
    @IsString()
    productSku: string;

    @ApiProperty({
        description: 'Product name',
        example: 'Product Name',
    })
    @IsNotEmpty()
    @IsString()
    productName: string;

    @ApiProperty({
        description: 'Product unit',
        example: 'Box',
    })
    @IsNotEmpty()
    @IsString()
    productUnit: string;

    @ApiProperty({
        description: 'Quantity to adjust',
        example: 10,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    quantity: number;

    @ApiProperty({
        description: 'Type of adjustment: add or subtract',
        example: StockActionType.ADD,
        enum: StockActionType,
    })
    @IsNotEmpty()
    @IsEnum(StockActionType)
    type: StockActionType;

    @ApiPropertyOptional({
        description: 'Notes for the product adjustment',
        example: 'Found extra stock during audit',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateStockAdjustmentRequestDto {

    @ApiProperty({
        description: 'Stock adjustment type.',
        example: StockAdjustmentType.IMPORT_INVOICE,
        enum: StockAdjustmentType,
    })
    @IsNotEmpty()
    @IsEnum(StockAdjustmentType)
    stockAdjustmentType: StockAdjustmentType;

    @ApiProperty({
        description: 'Must have the reference id if the stock adjustment type is import_invoice or selling_invoice',
        example: '75cde957-2749-4cd8-87d5-1d33e5de2e4b',
    })
    @ValidateIf(o => o.stockAdjustmentType === StockAdjustmentType.IMPORT_INVOICE || o.stockAdjustmentType === StockAdjustmentType.SELLING_INVOICE)
    @IsNotEmpty()
    @IsString()
    referenceId: string;

    @ApiProperty({
        description: 'List of products to adjust',
        type: [CreateStockAdjustmentProductDto],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateStockAdjustmentProductDto)
    products: CreateStockAdjustmentProductDto[];

    @ApiPropertyOptional({
        description: 'Notes for the stock adjustment',
        example: 'Weekly inventory check',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class EditStockAdjustmentRequestDto {
    @ApiProperty({
        description: 'The ID of the stock adjustment to edit',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'Stock adjustment type.',
        example: StockAdjustmentType.IMPORT_INVOICE,
        enum: StockAdjustmentType,
    })
    @IsNotEmpty()
    @IsEnum(StockAdjustmentType)
    stockAdjustmentType: StockAdjustmentType;

    @ApiProperty({
        description: 'Must have the reference id if the stock adjustment type is import_invoice or selling_invoice',
        example: 'Weekly inventory check',
    })
    @ValidateIf(o => o.stockAdjustmentType === StockAdjustmentType.IMPORT_INVOICE || o.stockAdjustmentType === StockAdjustmentType.SELLING_INVOICE)
    @IsNotEmpty()
    @IsString()
    referenceId?: string;

    @ApiProperty({
        description: 'List of products to adjust',
        type: [CreateStockAdjustmentProductDto],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateStockAdjustmentProductDto)
    products: CreateStockAdjustmentProductDto[];

    @ApiPropertyOptional({
        description: 'Notes for the stock adjustment',
        example: 'Weekly inventory check',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class GetListOfStockAdjustmentRequestDto {
    @ApiPropertyOptional({
        description: 'The page number',
        example: 1,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'The page size',
        example: 10,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query',
        example: 'SA26-',
    })
    @IsString()
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The search by which field',
        example: 'adjustmentId',
        enum: ['adjustmentId', 'userId', 'productId', 'referenceId'],
    })
    @IsIn(['adjustmentId', 'userId', 'productId', 'referenceId'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'adjustmentId' | 'userId' | 'productId' | 'referenceId';

    @ApiPropertyOptional({
        description: 'Sort by which field',
        example: 'adjustmentId',
        enum: ['adjustmentId', 'totalIncrease', 'totalDecrease', 'totalProducts', 'createdAt'],
    })
    @IsIn(['adjustmentId', 'totalIncrease', 'totalDecrease', 'totalProducts', 'createdAt'])
    @IsOptional()
    sortBy?: 'adjustmentId' | 'totalIncrease' | 'totalDecrease' | 'totalProducts' | 'createdAt';

    @ApiPropertyOptional({
        description: 'Stock adjustment type',
        example: StockAdjustmentType.IMPORT_INVOICE,
        enum: StockAdjustmentType,
    })
    @IsEnum(StockAdjustmentType)
    @IsOptional()
    stockAdjustmentType?: StockAdjustmentType;

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'desc',
        enum: ['asc', 'desc'],
    })
    @IsIn(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({
        description: 'Filter by from date',
        example: '2023-01-01',
    })
    @IsOptional()
    fromDate?: Date;

    @ApiPropertyOptional({
        description: 'Filter by to date',
        example: '2023-12-31',
    })
    @IsOptional()
    toDate?: Date;

    @ApiPropertyOptional({
        description: 'Filter by status',
        example: StockAdjustmentStatus.CONFIRMED,
        enum: StockAdjustmentStatus,
    })
    @IsOptional()
    @IsEnum(StockAdjustmentStatus)
    @Type(() => Number)
    status?: StockAdjustmentStatus;
}
