import { IsNotEmpty, IsNumber, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class GetProductUnitHistoryListRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product unit',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    productUnitId: string;
}

export class GetProductUnitHistoryByVersionRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product unit',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    productUnitId: string;

    @ApiProperty({
        description: 'The version number to retrieve',
        example: 1,
        minimum: 1,
        maximum: 2147483647,
    })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(2147483647)
    version: number;
}
