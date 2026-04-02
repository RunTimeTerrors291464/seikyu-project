import { ApiProperty } from '@nestjs/swagger';

export class ProductNameSnapshotDto {

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: 'Product Name in Vietnamese' })
    name: string;

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    createdAt: Date;

}
