import { ApiProperty } from '@nestjs/swagger';

export class ProductOverviewResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the product overview',
    example: '00000000-0000-0000-0000-000000000001',
  })
  id: string;

  @ApiProperty({
    description: 'The total number of products',
    example: 100,
  })
  totalProducts: number;

  @ApiProperty({
    description: 'The number of products in stock',
    example: 80,
  })
  inStock: number;

  @ApiProperty({
    description: 'The number of products with low stock',
    example: 15,
  })
  lowStock: number;

  @ApiProperty({
    description: 'The number of products out of stock',
    example: 5,
  })
  outOfStock: number;

  @ApiProperty({
    description: 'The total inventory value',
    example: 50000.50,
  })
  inventoryValue: number;

  @ApiProperty({
    description: 'The last update date of the product overview',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
