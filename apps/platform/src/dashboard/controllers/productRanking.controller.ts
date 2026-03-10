import { Controller } from '@nestjs/common';

// Import TCP message pattern.
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { ProductRankingService } from '../services/productRanking.service';

// Import DTOs.
import { GetListOfProductRankingRequestDto } from '@app/common/dtos/platform/dashboard/crudProductRankingRequest.dto';
import { GetListOfProductRankingResponseDto } from '@app/common/dtos/platform/dashboard/crudProductRankingResponse.dto';

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
}
