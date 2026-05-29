import { IsNotEmpty, IsOptional, IsISO8601, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetPriceTrendRequestDto {
    @ApiProperty({
        description: 'Start date for the price trend range (ISO 8601 format)',
        example: '2026-03-09',
        maxLength: 32,
    })
    @IsISO8601()
    @IsNotEmpty()
    @MaxLength(32, { message: 'startDate must be less than 32 characters.' })
    startDate: string;

    @ApiPropertyOptional({
        description: 'End date for the price trend range (ISO 8601 format). Defaults to today if not provided.',
        example: '2026-03-20',
        maxLength: 32,
    })
    @IsISO8601()
    @IsOptional()
    @MaxLength(32, { message: 'endDate must be less than 32 characters.' })
    endDate?: string;
}
