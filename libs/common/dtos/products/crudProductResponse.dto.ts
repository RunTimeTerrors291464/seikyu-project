import { ApiProperty } from '@nestjs/swagger';

// Import DTOs.
import { ProductHistoryItemResponseDto } from '@libs/common/dtos/products/crudProductHistoryResponse.dto';

export class ProductResponseDto {

    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'The SKU of the product',
        example: '1234567890123',
    })
    sku: string;

    @ApiProperty({
        description: 'Array of product names',
        example: ['Product Name 1', 'Product Name 2'],
        type: [String],
    })
    productNames: string[];

    @ApiProperty({
        description: 'Product unit ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    productUnitId: string;

    @ApiProperty({
        description: 'Product unit name of the product',
        example: 'kg',
    })
    productUnitName: string;

    @ApiProperty({
        description: 'Whether the product unit is active',
        example: true,
    })
    isUnitActive: boolean;

    @ApiProperty({
        description: 'Product description',
        example: 'Detailed description of the product',
        nullable: true,
    })
    productDescription: string | null;

    @ApiProperty({
        description: 'Import price of the product',
        example: 100.50,
    })
    importPrice: number;

    @ApiProperty({
        description: 'Selling price of the product',
        example: 150.00,
    })
    sellingPrice: number;

    @ApiProperty({
        description: 'Reorder threshold of the product',
        example: 10,
        nullable: true,
    })
    reorderThreshold: number | null;

    @ApiProperty({
        description: 'Inventory stock of the product',
        example: 100,
    })
    inventoryStock: number;

    @ApiProperty({
        description: 'Whether the product is active',
        example: true,
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Stock status of the product',
        example: 0,
    })
    stockStatus: 0 | 1 | 2;

    @ApiProperty({
        description: 'Product creation timestamp',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Product last update timestamp',
        example: '2024-01-16T14:45:00Z',
    })
    updatedAt: Date;
}

export class ProductResponseDtoWithHistory {
    @ApiProperty({
        description: 'The product data',
        type: ProductResponseDto,
        example: {
            id: '1f8fe28f-3312-476a-bcc8-de9fefc948a4',
            sku: '1234567890123',
            productNames: ['Product Name 1', 'Product Name 2'],
            productUnitId: 'ade95cfd-1121-474c-a19f-fd6ae10a6e4f',
            productUnitName: 'kg',
            isUnitActive: true,
            productDescription: 'Detailed description of the product',
            importPrice: 100.50,
            sellingPrice: 111.75,
            reorderThreshold: 10,
            inventoryStock: 0,
            isActive: true,
            stockStatus: 2,
            createdAt: '2026-03-21T13:39:48.396Z',
            updatedAt: '2026-03-21T13:40:22.818Z',
        }
    })
    product: ProductResponseDto;

    @ApiProperty({
        description: 'The history record of the changes',
        type: ProductHistoryItemResponseDto,
        example: {
            id: '838bb56a-e445-4357-a804-54431c616762',
            version: 2,
            createdBy: '5efa7fdb-fdda-465c-9dcd-ee0d7d16a3f9',
            createdByUsername: 'johndoe',
            createdAt: '2026-03-21T13:40:22.818Z',
            eventSummary: ['sellingPrice'],
        }
    })
    history: ProductHistoryItemResponseDto;
}

export class ProductCashierResponseDto {

    @ApiProperty({
        description: 'The unique identifier of the product',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'The SKU of the product',
        example: '1234567890123',
    })
    sku: string;

    @ApiProperty({
        description: 'Product names (supports multiple languages)',
        example: ['Product Name EN', 'Tên Sản Phẩm VI'],
        type: [String],
    })
    productNames: string[];

    @ApiProperty({
        description: 'Product unit name',
        example: 'kg',
    })
    unitName: string;

    @ApiProperty({
        description: 'Product description',
        example: 'Detailed description of the product',
        nullable: true,
    })
    productDescription: string | null;

    @ApiProperty({
        description: 'Selling price of the product',
        example: 150.00,
    })
    sellingPrice: number;

    @ApiProperty({
        description: 'Whether the product is active',
        example: true,
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Product creation timestamp',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Product last update timestamp',
        example: '2024-01-16T14:45:00Z',
    })
    updatedAt: Date;
}

export class GetListOfProductResponseDto {
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
        description: 'The total number of products',
        example: 100,
    })
    total: number;

    @ApiProperty({
        description: 'The products list',
        type: [ProductResponseDto],
    })
    products: ProductResponseDto[];
}

export class GetListOfProductCashierResponseDto {

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
        description: 'The total number of products',
        example: 100,
    })
    total: number;

    @ApiProperty({
        description: 'The products list',
        type: [ProductCashierResponseDto],
    })
    products: ProductCashierResponseDto[];
}

