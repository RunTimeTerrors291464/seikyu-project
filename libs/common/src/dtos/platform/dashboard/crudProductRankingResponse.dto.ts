import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsArray, IsUUID, Min, IsNumber, IsBoolean, ValidateIf, IsIn, ValidateNested, IsEnum, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Import invoice type enum
import { InvoiceType } from '@app/common/enums/invoiceType.enum';

export class ProductRankingProductInfoDto {
    @ApiProperty({ description: 'Product ID' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'Product SKU' })
    @IsString()
    sku: string;

    @ApiProperty({ description: 'Product name' })
    @IsString()
    name: string;
}

export class ProductRankingItemResponseDto {
    @ApiProperty({ description: 'Ranking ID' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'Product information', type: ProductRankingProductInfoDto })
    @Type(() => ProductRankingProductInfoDto)
    @ValidateNested()
    product: ProductRankingProductInfoDto;

    @ApiProperty({ description: 'Quantity sold/imported' })
    @IsNumber()
    quantity: number;

    @ApiProperty({ description: 'Total price' })
    @IsNumber()
    totalPrice: number;

    @ApiProperty({ description: 'Invoice type', enum: InvoiceType })
    @IsEnum(InvoiceType)
    invoiceType: InvoiceType;

    @ApiProperty({ description: 'Day of month', minimum: 1, maximum: 31 })
    @IsNumber()
    @Min(1)
    @Max(31)
    day: number;

    @ApiProperty({ description: 'Month', minimum: 1, maximum: 12 })
    @IsNumber()
    @Min(1)
    @Max(12)
    month: number;

    @ApiProperty({ description: 'Year' })
    @IsNumber()
    year: number;

    @ApiProperty({ description: 'Created timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated timestamp' })
    updatedAt: Date;
}

export class GetListOfProductRankingResponseDto {

    @ApiPropertyOptional({ description: 'Total count' })
    @IsOptional()
    @IsNumber()
    total?: number;

    @ApiPropertyOptional({ description: 'Page number' })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page' })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiProperty({ description: 'List of product rankings', type: [ProductRankingItemResponseDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductRankingItemResponseDto)
    data: ProductRankingItemResponseDto[];
}

