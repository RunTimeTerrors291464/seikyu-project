import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PriceTrendColumnDto {
    @ApiProperty({
        description: 'Start date of this bucket (YYYY-MM-DD)',
        example: '2026-03-09',
    })
    @IsString()
    labelStartDate: string;

    @ApiProperty({
        description: 'End date of this bucket (YYYY-MM-DD)',
        example: '2026-03-15',
    })
    @IsString()
    labelEndDate: string;

    @ApiProperty({ description: 'Total import revenue for this bucket', example: 50000 })
    @IsNumber()
    import: number;

    @ApiProperty({ description: 'Total return-import revenue for this bucket', example: 5000 })
    @IsNumber()
    returnImport: number;

    @ApiProperty({ description: 'Total selling revenue for this bucket', example: 120000 })
    @IsNumber()
    selling: number;

    @ApiProperty({ description: 'Total return-selling revenue for this bucket', example: 8000 })
    @IsNumber()
    returnSelling: number;

    @ApiProperty({ description: 'Total stock-adjustment revenue for this bucket', example: 0 })
    @IsNumber()
    stockAdjustment: number;
}

export class GetPriceTrendResponseDto {

    @ApiProperty({
        description: 'Start date of the price trend',
        example: '2026-03-09',
    })
    @IsString()
    startDate: string;

    @ApiProperty({
        description: 'End date of the price trend',
        example: '2026-03-09',
    })
    @IsString()
    endDate: string;

    @ApiProperty({
        description: 'Up to 15 time-bucketed columns for the line chart',
        type: [PriceTrendColumnDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PriceTrendColumnDto)
    columns: PriceTrendColumnDto[];
}
