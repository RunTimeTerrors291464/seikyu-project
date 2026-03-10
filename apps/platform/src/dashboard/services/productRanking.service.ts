import { HttpStatus, Injectable } from '@nestjs/common';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import repositories.
import { ProductRankingRepository } from '../repositories/productRanking.repository';

// Import DTOs.
import { GetListOfProductRankingRequestDto } from '@app/common/dtos/platform/dashboard/crudProductRankingRequest.dto';
import { GetListOfProductRankingResponseDto } from '@app/common/dtos/platform/dashboard/crudProductRankingResponse.dto';

@Injectable()
export class ProductRankingService {
    constructor(
        private readonly productRankingRepository: ProductRankingRepository,
    ) { }

    // --- APIs ---
    // Get a list of product ranking daily for a specific date.
    @HandleServiceError(ErrorCode.GET_LIST_PRODUCT_RANKING_SERVICE)
    async getListOfProductRankingDaily(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {

        // Get current date and validate startDate is not in the future.
        const { day: currentDay, month: currentMonth, year: currentYear } = await this.productRankingRepository.getCurrentDate();
        const startDate = new Date(dto.startDate);

        const currentDateOnly = new Date(currentYear, currentMonth - 1, currentDay);
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

        if (startDateOnly > currentDateOnly) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DATE_CAN_NOT_BE_IN_FUTURE, 'Start date cannot be in the future. Maximum allowed date is today.');

        // Check the dateType is provided in the request.
        let response: GetListOfProductRankingResponseDto;
        switch(dto.dateType) {
            case 'daily':
                response = await this.productRankingRepository.getListOfProductRankingDaily(dto);
                break;
            case 'custom':
                // Check if the endDate is provided and not in the future.
                if (!dto.endDate) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.END_DATE_MUST_BE_PROVIDED, 'End date is required for custom date range.');
                const endDate = new Date(dto.endDate);
                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                if (endDateOnly > currentDateOnly) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DATE_CAN_NOT_BE_IN_FUTURE, 'End date cannot be in the future. Maximum allowed date is today.');
            
                // Only allow the time range of maximum 90 days for custom date range to prevent performance issues.
                const daysDifference = Math.ceil((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDifference > 90) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DATE_RANGE_TOO_LARGE, 'The date range for custom date type cannot exceed 90 days.');

            default:
                response = await this.productRankingRepository.getListOfProductRankingDaily(dto);
        }

        return response;
    }

    
}
