import { Controller } from '@nestjs/common';

// Import TCP message pattern.
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { ProductRankingService } from '../services/productRanking.service';

// Import DTOs.
import { GetListOfProductRankingRequestDto } from '@app/common/dtos/platform/dashboard/crudProductRankingRequest.dto';
import { GetListOfProductRankingResponseDto } from '@app/common/dtos/platform/dashboard/crudProductRankingResponse.dto';
import { GetPriceTrendRequestDto } from '@app/common/dtos/platform/dashboard/priceTrendRequest.dto';
import { GetPriceTrendResponseDto } from '@app/common/dtos/platform/dashboard/priceTrendResponse.dto';

@Controller()
export class ProductRankingController {
    constructor(
        private readonly productRankingService: ProductRankingService,
    ) { }

    // Get a list of product ranking.
    @MessagePattern({ cmd: 'dashboard.getListOfProductRanking' })
    async getListOfProductRanking(@Payload() dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        return this.productRankingService.getListOfProductRankingDaily(dto);
    }

    // Get price trend data for the line chart.
    @MessagePattern({ cmd: 'dashboard.getPriceTrend' })
    async getPriceTrend(@Payload() dto: GetPriceTrendRequestDto): Promise<GetPriceTrendResponseDto> {
        return this.productRankingService.getPriceTrend(dto);
    }
}
