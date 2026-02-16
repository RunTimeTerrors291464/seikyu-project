import { IsNotEmpty, IsString, IsUUID, IsIn, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Import enums.
import { InvoiceType } from '@app/common/enums/invoiceType.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

export class CreateProductStockRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Product quantity type',
        enum: StockActionType,
        example: StockActionType.ADD,
    })
    @IsNotEmpty()
    @IsEnum(StockActionType)
    quantityType: StockActionType;

    @ApiProperty({
        description: 'Product quantity',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @ApiProperty({
        description: 'Reference type (source of the stock change)',
        enum: InvoiceType,
        example: InvoiceType.IMPORT,
    })
    @IsNotEmpty()
    @IsEnum(InvoiceType)
    referenceType: InvoiceType;

    @ApiProperty({
        description: 'Reference ID (e.g., Invoice ID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    referenceId: string;
}

export class GetProductStockHistoryRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productId: string;
}

export class ProductStockHistoryResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the history record',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    productId: string;

    @ApiProperty({
        description: 'Product quantity type',
        enum: StockActionType,
        example: StockActionType.ADD,
    })
    quantityType: StockActionType;

    @ApiProperty({
        description: 'Product quantity',
        example: 1,
    })
    quantity: number;

    @ApiProperty({
        description: 'Reference type (source of the stock change)',
        enum: InvoiceType,
        example: InvoiceType.IMPORT,
    })
    referenceType: InvoiceType;

    @ApiProperty({
        description: 'Reference ID (e.g., Invoice ID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    referenceId: string;

    @ApiProperty({
        description: 'The date and time when this version was created',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;
}

export class GetListOfProductStockHistoryResponseDto {

    @ApiProperty({
        description: 'The page number',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'The page limit',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'The total number of products',
        example: 100,
    })
    total: number;

    @ApiProperty({
        description: 'The products stock history list',
        type: [ProductStockHistoryResponseDto],
    })
    products: ProductStockHistoryResponseDto[];
}
