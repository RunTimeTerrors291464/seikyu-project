import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Import snapshots.
import { ProductSnapshotDto, ProductChangeEventDto } from './snapshot/productSnapshot.dto';

export class GetProductHistoryListRequestDto {
    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;
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
    version: number;
}

export class ProductHistoryItemResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the history record',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'The version number',
        example: 1,
    })
    version: number;

    @ApiProperty({
        description: 'The user ID who created this version',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    createdBy: string;

    @ApiProperty({
        description: 'The username who created this version',
        example: 'admin',
    })
    createdByUsername: string;

    @ApiProperty({
        description: 'The date and time when this version was created',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Quick-access list of changed field names',
        example: ['selling_price', 'product_names'],
        type: [String],
    })
    eventSummary: string[];
}


export class GetProductHistoryByVersionResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the history record',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'The version number',
        example: 1,
    })
    version: number;

    @ApiProperty({
        description: 'The user ID who created this version',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    createdBy: string;

    @ApiProperty({
        description: 'The username who created this version',
        example: 'admin',
    })
    createdByUsername: string;

    @ApiProperty({
        description: 'The date and time when this version was created',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'List of change events recording what fields were changed and their old/new values',
        type: [ProductChangeEventDto],
    })
    events: ProductChangeEventDto[];

    @ApiProperty({
        description: 'Quick-access list of changed field names',
        example: ['selling_price', 'product_names'],
        type: [String],
    })
    eventSummary: string[];

    @ApiProperty({
        description: 'Whether this version stores a full product snapshot (every 5 versions)',
        example: false,
    })
    isSnapshot: boolean;

    @ApiProperty({
        description: 'Full product snapshot — only present when isSnapshot is true',
        type: ProductSnapshotDto,
        nullable: true,
    })
    data: ProductSnapshotDto | null;
}
