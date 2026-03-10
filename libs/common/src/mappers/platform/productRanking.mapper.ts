import { Injectable } from '@nestjs/common';

// Import entities.
import { ProductRankingDailyEntity } from 'apps/platform/src/dashboard/entities/productRankingDaily.entity';

// Import DTOs.
import {
    ProductRankingItemResponseDto,
    ProductRankingProductInfoDto,
} from '@app/common/dtos/platform/dashboard/crudProductRankingResponse.dto';

@Injectable()
export class ProductRankingMapper {
    
    // FROM: ProductRankingDailyEntity
    // TO: ProductRankingItemResponseDto
    toProductRankingItemResponseDto(entity: ProductRankingDailyEntity): ProductRankingItemResponseDto {
        return {
            id: entity.id,
            product: this.toProductRankingProductInfoDto(entity.product),
            quantity: entity.quantity,
            totalPrice: Number(entity.totalPrice),
            invoiceType: entity.invoiceType,
            day: entity.day,
            month: entity.month,
            year: entity.year,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    // FROM: ProductsEntity
    // TO: ProductRankingProductInfoDto
    private toProductRankingProductInfoDto(product: any): ProductRankingProductInfoDto {
        return {
            id: product.id,
            sku: product.sku,
            name: product.productNames && product.productNames.length > 0
                ? product.productNames[0].name
                : 'N/A',
        };
    }

    // FROM: ProductRankingDailyEntity[]
    // TO: ProductRankingItemResponseDto[]
    toProductRankingItemResponseDtoArray(entities: ProductRankingDailyEntity[]): ProductRankingItemResponseDto[] {
        return entities.map(entity => this.toProductRankingItemResponseDto(entity));
    }

    // FROM: Aggregated ranking data (raw query result)
    // TO: Formatted aggregated response
    toAggregatedRankingResponseDto(data: Array<{
        productId: string;
        sku: string;
        productNames: string[];
        totalQuantity: number;
        totalRevenue: number;
    }>): Array<{
        productId: string;
        sku: string;
        productNames: string[];
        totalQuantity: number;
        totalRevenue: number;
    }> {
        return data.map(item => ({
            productId: item.productId,
            sku: item.sku,
            productNames: item.productNames,
            totalQuantity: item.totalQuantity,
            totalRevenue: Number(item.totalRevenue),
        }));
    }
}
