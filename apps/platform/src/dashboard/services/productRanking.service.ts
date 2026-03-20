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
import { GetPriceTrendRequestDto } from '@app/common/dtos/platform/dashboard/priceTrendRequest.dto';
import { GetPriceTrendResponseDto, PriceTrendColumnDto } from '@app/common/dtos/platform/dashboard/priceTrendResponse.dto';

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
            case 'monthly':
                response = await this.productRankingRepository.getListOfProductRankingMonthly(dto);
                break;
            case 'yearly':
                response = await this.productRankingRepository.getListOfProductRankingYearly(dto);
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

                response = await this.productRankingRepository.getListOfProductRankingCustom(dto);
                break;

            default:
                response = await this.productRankingRepository.getListOfProductRankingDaily(dto);
        }

        return response;
    }


    // Get price trend data for the line chart (up to 12 columns).
    @HandleServiceError(ErrorCode.GET_PRICE_TREND_SERVICE)
    async getPriceTrend(dto: GetPriceTrendRequestDto): Promise<GetPriceTrendResponseDto> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const startDateOnly = new Date(dto.startDate);
        startDateOnly.setHours(0, 0, 0, 0);

        if (startDateOnly > today) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DATE_CAN_NOT_BE_IN_FUTURE, 'Start date cannot be in the future. Maximum allowed date is today.');

        const endDateOnly = dto.endDate
            ? (() => { const d = new Date(dto.endDate); d.setHours(0, 0, 0, 0); return d; })()
            : new Date(today);

        if (endDateOnly < startDateOnly) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.END_DATE_BEFORE_START_DATE, 'End date cannot be before start date.');
        if (endDateOnly > today) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DATE_CAN_NOT_BE_IN_FUTURE, 'End date cannot be in the future. Maximum allowed date is today.');

        // Build up to 12 time buckets.
        const MAX_COLUMNS = 12;
        const totalDays = Math.floor((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const numColumns = Math.min(totalDays, MAX_COLUMNS);
        const baseDaysPerBucket = Math.floor(totalDays / numColumns);
        const extraBuckets = totalDays % numColumns;

        const buckets: { start: Date; end: Date }[] = [];
        const cursor = new Date(startDateOnly);
        for (let i = 0; i < numColumns; i++) {
            const size = i < extraBuckets ? baseDaysPerBucket + 1 : baseDaysPerBucket;
            const bucketStart = new Date(cursor);
            const bucketEnd = new Date(cursor);
            bucketEnd.setDate(bucketEnd.getDate() + size - 1);
            buckets.push({ start: bucketStart, end: bucketEnd });
            cursor.setDate(cursor.getDate() + size);
        }

        // Query the daily table and aggregate per (day, month, year, invoiceType).
        const rawRows = await this.productRankingRepository.getPriceTrendRawData(startDateOnly, endDateOnly);

        // Index raw data by "year-month-day" key for O(1) lookup.
        const dataIndex = new Map<string, Map<string, number>>();
        for (const row of rawRows) {
            const key = `${row.year}-${row.month}-${row.day}`;
            if (!dataIndex.has(key)) dataIndex.set(key, new Map());
            dataIndex.get(key)!.set(row.invoiceType, row.totalPrice);
        }

        const pad = (n: number) => n.toString().padStart(2, '0');

        const columns: PriceTrendColumnDto[] = buckets.map((bucket) => {
            const totals = { import: 0, returnImport: 0, selling: 0, returnSelling: 0, stockAdjustment: 0 };

            const day = new Date(bucket.start);
            while (day <= bucket.end) {
                const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
                const dayMap = dataIndex.get(key);
                if (dayMap) {
                    for (const [type, price] of dayMap) {
                        if (type in totals) (totals as Record<string, number>)[type] += price;
                    }
                }
                day.setDate(day.getDate() + 1);
            }

            const sDay = pad(bucket.start.getDate());
            const sMon = pad(bucket.start.getMonth() + 1);
            const eDay = pad(bucket.end.getDate());
            const eMon = pad(bucket.end.getMonth() + 1);
            const label = bucket.start.getTime() === bucket.end.getTime()
                ? `${sDay}/${sMon}`
                : `${sDay}/${sMon} - ${eDay}/${eMon}`;

            return {
                label,
                startDate: bucket.start.toISOString().split('T')[0],
                endDate: bucket.end.toISOString().split('T')[0],
                ...totals,
            };
        });

        return { columns };
    }
}
