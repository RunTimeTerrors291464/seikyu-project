import { Controller, Get, Inject, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/guards';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import microservices client proxy.
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Import DTOs.
import { GetListOfProductRankingRequestDto } from '@app/common/dtos/platform/dashboard/crudProductRankingRequest.dto';
import { GetListOfProductRankingResponseDto } from '@app/common/dtos/platform/dashboard/crudProductRankingResponse.dto';
import { GetPriceTrendRequestDto } from '@app/common/dtos/platform/dashboard/crudPriceTrendRequest.dto';
import { GetPriceTrendResponseDto } from '@app/common/dtos/platform/dashboard/crudPriceTrendResponse.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';


@ApiTags('[Platform] Dashboard: These APIs are for dashboard data.')
@Controller({
    path: 'api/v1/dashboard',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductRankingController {
    constructor(
        @Inject('PLATFORM_SERVICE') private readonly platformService: ClientProxy,
    ) { }

    // Get a list of product ranking.
    // GET /api/v1/dashboard/product-ranking
    @Get('product-ranking')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Get a list of product ranking' })
    @ApiResponse({ status: 200, description: 'A list of product ranking has been retrieved successfully.', type: GetListOfProductRankingResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfProductRanking(@Query() dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        try {
            const result: GetListOfProductRankingResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'dashboard.getListOfProductRanking' }, dto)
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get price trend data for the line chart.
    // GET /api/v1/dashboard/price-trend
    @Get('price-trend')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Get price trend line chart data.' })
    @ApiResponse({ status: 200, description: 'Price trend data has been retrieved successfully.', type: GetPriceTrendResponseDto })
    @HttpCode(HttpStatus.OK)
    async getPriceTrend(@Query() dto: GetPriceTrendRequestDto): Promise<GetPriceTrendResponseDto> {
        try {
            const result: GetPriceTrendResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'dashboard.getPriceTrend' }, dto)
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}
