import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@src/auth/guards/jwt.guard';
import { RolesGuard } from '@src/auth/guards/roles.guard';
import { RateLimitGuard } from '@src/auth/guards/rateLimit.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '@libs/common/enums/role.enum';

import { ProductRankingService } from '../services/productRanking.service';

import { GetListOfProductRankingRequestDto } from '@libs/common/dtos/dashboard/crudProductRankingRequest.dto';
import { GetListOfProductRankingResponseDto } from '@libs/common/dtos/dashboard/crudProductRankingResponse.dto';
import { GetPriceTrendRequestDto } from '@libs/common/dtos/dashboard/crudPriceTrendRequest.dto';
import { GetPriceTrendResponseDto } from '@libs/common/dtos/dashboard/crudPriceTrendResponse.dto';

@ApiTags('[Dashboard] Product ranking and price trend.')
@Controller({
    path: 'api/v1/dashboard',
    version: '1',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class ProductRankingController {
    constructor(private readonly productRankingService: ProductRankingService) { }

    @Get('product-ranking')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Get paginated product ranking (daily, monthly, yearly, or custom range)' })
    @ApiResponse({ status: 200, description: 'Product ranking list', type: GetListOfProductRankingResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfProductRanking(@Query() dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        return this.productRankingService.getListOfProductRankingDaily(dto);
    }

    @Get('price-trend')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: '[MANAGER] Get aggregated price trend buckets for the line chart' })
    @ApiResponse({ status: 200, description: 'Price trend columns', type: GetPriceTrendResponseDto })
    @HttpCode(HttpStatus.OK)
    async getPriceTrend(@Query() dto: GetPriceTrendRequestDto): Promise<GetPriceTrendResponseDto> {
        return this.productRankingService.getPriceTrend(dto);
    }
}
