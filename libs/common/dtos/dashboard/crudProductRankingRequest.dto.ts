import { IsNotEmpty, IsOptional, IsString, MinLength, IsNumber, IsIn, IsEnum, Max, Min, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { InvoiceType } from '@libs/common/enums/invoiceType.enum';

export class GetListOfProductRankingRequestDto {
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
        description: 'Search query by product name',
        example: 'iPhone',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'desc',
        enum: ['asc', 'desc'],
    })
    @IsIn(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'desc';

    @ApiProperty({
        description: 'Filter by invoice type',
        example: InvoiceType.SELLING,
        enum: InvoiceType,
    })
    @IsEnum(InvoiceType)
    @IsNotEmpty()
    invoiceType: InvoiceType;

    @ApiProperty({
        description: 'Product ranking date type',
        example: 'daily',
        enum: ['daily', 'monthly', 'yearly', 'custom'],
    })
    @IsIn(['daily', 'monthly', 'yearly', 'custom'])
    @IsNotEmpty()
    dateType: 'daily' | 'monthly' | 'yearly' | 'custom';

    @ApiProperty({
        description: 'Start date for filtering (ISO 8601 format)',
        example: '2024-01-01',
    })
    @IsISO8601()
    @IsNotEmpty()
    startDate: string;

    @ApiPropertyOptional({
        description: 'End date for filtering (ISO 8601 format)',
        example: '2024-12-31',
    })
    @IsISO8601()
    @IsOptional()
    endDate?: string;
}
