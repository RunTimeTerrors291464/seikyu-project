import { ApiProperty } from '@nestjs/swagger';

export class ProductUnitResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the product unit',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'The name of the product unit',
        example: 'kg',
    })
    unitName: string;

    @ApiProperty({
        description: 'The description of the product unit',
        example: 'Kilogram',
        required: false,
    })
    unitDescription?: string;

    @ApiProperty({
        description: 'Whether the product unit is active',
        example: true,
    })
    isActive: boolean;

    @ApiProperty({
        description: 'The creation date of the product unit',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'The last update date of the product unit',
        example: '2024-01-15T10:30:00Z',
    })
    updatedAt: Date;
}

export class GetListOfProductUnitResponseDto {
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
        description: 'The total number of product units',
        example: 100,
    })
    total: number;

    @ApiProperty({
        description: 'The product units list',
        type: [ProductUnitResponseDto],
    })
    productUnits: ProductUnitResponseDto[];
}