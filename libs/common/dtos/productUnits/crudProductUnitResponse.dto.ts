import { ApiProperty } from '@nestjs/swagger';

// Import DTOs.
import { ProductUnitHistoryItemResponseDto } from './crudProductUnitHistoryResponse.dto';

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

export class ProductUnitResponseDtoWithHistory {
    @ApiProperty({
        description: 'The product unit data',
        type: ProductUnitResponseDto,
        example: {
            id: 'ade95cfd-1121-474c-a19f-fd6ae10a6e4f',
            unitName: 'kg',
            unitDescription: 'Kilogram',
            isActive: true,
            createdAt: '2026-03-21T13:39:48.396Z',
            updatedAt: '2026-03-21T13:40:22.818Z',
        },
    })
    productUnit: ProductUnitResponseDto;

    @ApiProperty({
        description: 'The history record of the changes',
        type: ProductUnitHistoryItemResponseDto,
        example: {
            id: '838bb56a-e445-4357-a804-54431c616762',
            version: 2,
            createdBy: '5efa7fdb-fdda-465c-9dcd-ee0d7d16a3f9',
            createdByUsername: 'johndoe',
            createdAt: '2026-03-21T13:40:22.818Z',
            eventSummary: ['unitName'],
        },
    })
    history: ProductUnitHistoryItemResponseDto;
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