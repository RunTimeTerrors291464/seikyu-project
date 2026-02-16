import { ApiProperty } from '@nestjs/swagger';

export class ProductUnitSnapshotDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: 'kg' })
    unitName: string;

    @ApiProperty({ example: 'Kilogram', required: false })
    unitDescription?: string;

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    createdAt: Date;

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    updatedAt: Date;
}
