import { Injectable } from '@nestjs/common';

import { ProductRankingDailyEntity } from '@src/dashboard/entities/productRankingDaily.entity';
import {
    ProductRankingItemResponseDto,
    ProductRankingProductInfoDto,
} from '@libs/common/dtos/dashboard/crudProductRankingResponse.dto';

@Injectable()
export class ProductRankingMapper {

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

    private toProductRankingProductInfoDto(product: {
        id: string;
        sku: string;
        productNames?: { name: string }[];
    }): ProductRankingProductInfoDto {
        return {
            id: product.id,
            sku: product.sku,
            name: product.productNames && product.productNames.length > 0
                ? product.productNames[0].name
                : 'N/A',
        };
    }

    toProductRankingItemResponseDtoArray(entities: ProductRankingDailyEntity[]): ProductRankingItemResponseDto[] {
        return entities.map((entity) => this.toProductRankingItemResponseDto(entity));
    }
}
