import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, ValidateIf, IsIn, IsDateString, IsUUID, IsEnum, Max, ArrayUnique, Validate, MaxLength, MinLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

// Import validators.
import { InvoiceDateRangeConstraint } from '@libs/common/validators/invoiceDateRange.constraint';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { StockAdjustmentReason } from '@libs/common/enums/returnReasons.enum';

export class StockAdjustmentInvoiceProductRequestDto {

    @ApiProperty({
        description: 'Product UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Product SKU',
        example: '1234567890123',
        minLength: 13,
        maxLength: 13,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(13, { message: 'productSku must be exactly 13 characters.' })
    @MaxLength(13, { message: 'productSku must be exactly 13 characters.' })
    productSku: string;

    @ApiProperty({
        description: 'Product name',
        example: 'Coca Cola 330ml',
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255, { message: 'productName must be less than 255 characters.' })
    productName: string;

    @ApiProperty({
        description: 'Product unit',
        example: 'PCS',
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255, { message: 'productUnit must be less than 255 characters.' })
    productUnit: string;

    @ApiProperty({
        description: 'Stock action for this line',
        example: StockActionType.ADD,
        enum: StockActionType,
    })
    @IsNotEmpty()
    @IsEnum(StockActionType)
    action: StockActionType;

    @ApiProperty({
        description: 'Quantity to add or subtract',
        example: 10,
        minimum: 1,
        maximum: 2147483647,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'quantity must be at least 1' })
    @Max(2147483647)
    quantity: number;

    @ApiProperty({
        description: 'Reason category for this adjustment line',
        example: StockAdjustmentReason.DAMAGE,
        enum: StockAdjustmentReason,
    })
    @IsNotEmpty()
    @IsEnum(StockAdjustmentReason)
    reasonCategory: StockAdjustmentReason;

    @ApiPropertyOptional({
        description: 'Free-text notes for the reason (line level)',
        example: 'Crushed cases in aisle 3',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'reasonNotes must be less than 2048 characters.' })
    reasonNotes?: string;

    @ApiPropertyOptional({
        description: 'Additional notes for this product line',
        example: 'Counted during cycle count',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'notes must be less than 2048 characters.' })
    notes?: string;
}

export class CreateStockAdjustmentInvoiceRequestDto {

    @ApiProperty({
        description: 'List of products to adjust. Each productId must appear at most once.',
        type: [StockAdjustmentInvoiceProductRequestDto],
        maxItems: 9999,
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                action: StockActionType.SUBTRACT,
                quantity: 5,
                reasonCategory: StockAdjustmentReason.DAMAGE,
                reasonNotes: 'Damaged during storage',
                notes: 'Warehouse B',
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(9999, { message: 'products must contain at most 9999 items.' })
    @ValidateNested({ each: true })
    @Type(() => StockAdjustmentInvoiceProductRequestDto)
    @ArrayUnique((item: StockAdjustmentInvoiceProductRequestDto) => item.productId, { message: 'Each productId must appear only once in the list.' })
    products: StockAdjustmentInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this stock adjustment invoice (header)',
        example: 'Periodic inventory check - Q1 2026',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'notes must be less than 2048 characters.' })
    notes?: string;
}

export class EditStockAdjustmentInvoiceRequestDto {

    @ApiProperty({
        description: 'Stock adjustment invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'List of products to adjust (replace existing lines). Each productId must appear at most once.',
        type: [StockAdjustmentInvoiceProductRequestDto],
        maxItems: 9999,
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                action: StockActionType.SUBTRACT,
                quantity: 3,
                reasonCategory: StockAdjustmentReason.CYCLE_COUNT_VARIANCE,
                reasonNotes: 'Recount variance',
                notes: 'Updated after recount',
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(9999, { message: 'products must contain at most 9999 items.' })
    @ValidateNested({ each: true })
    @Type(() => StockAdjustmentInvoiceProductRequestDto)
    @ArrayUnique((item: StockAdjustmentInvoiceProductRequestDto) => item.productId, { message: 'Each productId must appear only once in the list.' })
    products: StockAdjustmentInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this stock adjustment invoice (header)',
        example: 'Updated notes after recount',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'notes must be less than 2048 characters.' })
    notes?: string;
}

export class GetListOfStockAdjustmentInvoiceRequestDto {

    @ApiPropertyOptional({
        description: 'The page number',
        example: 1,
        minimum: 1,
        maximum: 2147483647,
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
        minimum: 1,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query',
        example: 'SA26-0000001',
        maxLength: 255,
    })
    @IsString()
    @MaxLength(255, { message: 'search must be less than 255 characters.' })
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The field to search by. productId accepts a product UUID or product SKU.',
        example: 'invoiceId',
        enum: ['invoiceId', 'userId', 'productId'],
    })
    @IsIn(['invoiceId', 'userId', 'productId'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'invoiceId' | 'userId' | 'productId';

    @ApiPropertyOptional({
        description: 'Sort by field (matches stock_adjustment_invoice columns)',
        example: 'invoiceId',
        enum: ['invoiceId', 'totalProducts', 'totalQuantity', 'status', 'draftAt', 'confirmedAt', 'createdAt'],
    })
    @IsIn(['invoiceId', 'totalProducts', 'totalQuantity', 'status', 'draftAt', 'confirmedAt', 'createdAt'])
    @IsOptional()
    sortBy?: 'invoiceId' | 'totalProducts' | 'totalQuantity' | 'status' | 'draftAt' | 'confirmedAt' | 'createdAt';

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
        example: StockAdjustmentInvoiceStatus.CONFIRMED,
        enum: StockAdjustmentInvoiceStatus,
    })
    @IsOptional()
    @IsEnum(StockAdjustmentInvoiceStatus)
    status?: StockAdjustmentInvoiceStatus;

    @ApiProperty({
        description:
            'Filter by stock adjustment invoice createdAt from this instant (ISO 8601). Together with toDate, the range must not exceed 180 calendar days.',
        example: '2025-11-01T00:00:00.000Z',
        required: true,
    })
    @IsNotEmpty()
    @IsDateString()
    fromDate: string;

    @ApiProperty({
        description:
            'Filter by stock adjustment invoice createdAt to this instant (ISO 8601). Together with fromDate, the range must not exceed 180 calendar days.',
        example: '2025-11-15T23:59:59.999Z',
        required: true,
    })
    @IsNotEmpty()
    @IsDateString()
    @Validate(InvoiceDateRangeConstraint, [180])
    toDate: string;
}

export class DeleteDraftStockAdjustmentInvoicesRequestDto {
    @ApiProperty({
        description: 'Draft stock adjustment invoice UUIDs to delete',
        type: [String],
        maxItems: 100,
        example: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(100, { message: 'ids must contain at most 100 items.' })
    @IsUUID('4', { each: true })
    ids: string[];
}
