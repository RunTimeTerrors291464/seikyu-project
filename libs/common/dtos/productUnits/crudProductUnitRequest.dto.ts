import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductUnitRequestDto {
    @ApiProperty({
        description: 'The name of the product unit',
        example: 'kg',
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255, { message: 'unitName must be less than 255 characters.' })
    unitName: string;

    @ApiPropertyOptional({
        description: 'The description of the product unit',
        example: 'Kilogram',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'unitDescription must be less than 2048 characters.' })
    unitDescription?: string;
}

export class EditProductUnitRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product unit',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiPropertyOptional({
        description: 'The name of the product unit',
        example: 'kg',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'unitName must be less than 255 characters.' })
    unitName?: string;


    @ApiPropertyOptional({
        description: 'The description of the product unit',
        example: 'Kilogram',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'unitDescription must be less than 2048 characters.' })
    unitDescription?: string;
}

export class GetListOfProductUnitRequestDto {
    @ApiPropertyOptional({
        description: 'The page number',
        example: 1,
        minimum: 1,
        maximum: 2147483647,
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
        minimum: 1,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    limit?: number = 10;

    // Only search by unit name.
    @ApiPropertyOptional({
        description: 'The search query for unit name only',
        example: 'kg',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'search must be less than 255 characters.' })
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status: "true", "false", or "all"',
        example: 'all',
        enum: ['true', 'false', 'all'],
    })
    @IsOptional()
    @IsIn(['true', 'false', 'all'])
    isActive?: 'true' | 'false' | 'all' = 'all';

    @ApiPropertyOptional({
        description: 'Sort by field: "unitName", "createdAt", or "updatedAt"',
        example: 'unitName',
        enum: ['unitName', 'createdAt', 'updatedAt'],
    })
    @IsOptional()
    @IsIn(['unitName', 'createdAt', 'updatedAt'])
    sortBy?: 'unitName' | 'createdAt' | 'updatedAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'asc',
        enum: ['asc', 'desc'],
    })
    @IsIn(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'asc';
}
