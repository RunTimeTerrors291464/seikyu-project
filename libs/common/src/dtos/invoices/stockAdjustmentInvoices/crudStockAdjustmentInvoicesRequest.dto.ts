import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, ValidateIf, IsIn, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';
import { StockActionType, StockActionReason } from '@app/common/enums/stockActionType.enum';

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
    })
    @IsNotEmpty()
    @IsString()
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
        description: 'Action type: add or subtract stock',
        example: StockActionType.ADD,
        enum: StockActionType,
    })
    @IsNotEmpty()
    @IsEnum(StockActionType)
    action: StockActionType;

    @ApiProperty({
        description: 'Quantity to adjust',
        example: 10,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'quantity must be at least 1' })
    quantity: number;

    @ApiPropertyOptional({
        description: 'Additional notes for this product adjustment',
        example: 'Damaged during storage',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateStockAdjustmentInvoiceRequestDto {

    @ApiProperty({
        description: 'List of products to adjust',
        type: [StockAdjustmentInvoiceProductRequestDto],
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                action: StockActionType.SUBTRACT,
                quantity: 5,
                notes: 'Damaged during storage',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StockAdjustmentInvoiceProductRequestDto)
    products: StockAdjustmentInvoiceProductRequestDto[];

    @ApiProperty({
        description: 'Reason for stock adjustment',
        example: StockActionReason.DAMAGED_GOODS,
        enum: StockActionReason,
    })
    @IsNotEmpty()
    @IsEnum(StockActionReason)
    actionReason: StockActionReason;

    @ApiPropertyOptional({
        description: 'Additional notes for this stock adjustment invoice',
        example: 'Periodic inventory check - Q1 2026',
    })
    @IsOptional()
    @IsString()
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
        description: 'List of products to adjust (replace existing ones)',
        type: [StockAdjustmentInvoiceProductRequestDto],
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                action: StockActionType.SUBTRACT,
                quantity: 3,
                notes: 'Updated quantity after recount',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StockAdjustmentInvoiceProductRequestDto)
    products: StockAdjustmentInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Reason for stock adjustment',
        example: StockActionReason.PERIODIC_INVENTORY_CHECK,
        enum: StockActionReason,
    })
    @IsOptional()
    @IsEnum(StockActionReason)
    actionReason?: StockActionReason;

    @ApiPropertyOptional({
        description: 'Additional notes for this stock adjustment invoice',
        example: 'Updated notes after recount',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class GetListOfStockAdjustmentInvoiceRequestDto {

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
        example: 'SA25-00001',
    })
    @IsString()
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The field to search by. invoiceId: Search by invoice ID. userId: Search by user ID.',
        example: 'invoiceId',
        enum: ['invoiceId', 'userId', 'productId'],
    })
    @IsIn(['invoiceId', 'userId', 'productId'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'invoiceId' | 'userId' | 'productId';

    @ApiPropertyOptional({
        description: 'Sort by which field',
        example: 'invoiceId',
        enum: ['invoiceId', 'totalQuantity', 'createdAt'],
    })
    @IsIn(['invoiceId', 'totalQuantity', 'createdAt'])
    @IsOptional()
    sortBy?: 'invoiceId' | 'totalQuantity' | 'createdAt';

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

    @ApiPropertyOptional({
        description: 'Filter by action reason',
        example: StockActionReason.DAMAGED_GOODS,
        enum: StockActionReason,
    })
    @IsOptional()
    @IsEnum(StockActionReason)
    actionReason?: StockActionReason;

    @ApiPropertyOptional({
        description: 'Filter stock adjustment invoices from this date (ISO 8601 format)',
        example: '2026-01-01T00:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({
        description: 'Filter stock adjustment invoices to this date (ISO 8601 format)',
        example: '2026-01-31T23:59:59.999Z',
    })
    @IsOptional()
    @IsDateString()
    toDate?: string;
}
