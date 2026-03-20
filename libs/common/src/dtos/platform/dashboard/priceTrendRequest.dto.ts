import { IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetPriceTrendRequestDto {
    @ApiProperty({
        description: 'Start date for the price trend range (ISO 8601 format)',
        example: '2026-03-09',
    })
    @IsISO8601()
    @IsNotEmpty()
    startDate: string;

    @ApiPropertyOptional({
        description: 'End date for the price trend range (ISO 8601 format). Defaults to today if not provided.',
        example: '2026-03-20',
    })
    @IsISO8601()
    @IsOptional()
    endDate?: string;
}
