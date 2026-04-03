import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetProductHistoryListRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(2147483647)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Page size', example: 10, minimum: 10, maximum: 100 })
    @IsNumber()
    @IsOptional()
    @Min(10)
    @Max(100)
    @Type(() => Number)
    limit?: number = 10;
}

export class GetProductStockHistoryListRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(2147483647)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Page size', example: 10, minimum: 10, maximum: 64 })
    @IsNumber()
    @IsOptional()
    @Min(10)
    @Max(64)
    @Type(() => Number)
    limit?: number = 10;
}

export class GetProductHistoryByVersionRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'The version number to retrieve',
        example: 1,
    })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    version: number;
}