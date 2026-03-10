import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Imports Redis.
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

// Import entities.
import { ProductRankingDailyEntity } from '../entities/productRankingDaily.entity';

// Import enum.
import { InvoiceType } from '@app/common/enums/invoiceType.enum';

// Import DTOs.
import { GetListOfProductRankingRequestDto } from '@app/common/dtos/platform/dashboard/crudProductRankingRequest.dto';
import { GetListOfProductRankingResponseDto, ProductRankingItemResponseDto } from '@app/common/dtos/platform/dashboard/crudProductRankingResponse.dto';

// Import mappers.
import { ProductRankingMapper } from '@app/common/mappers/platform/productRanking.mapper';


@Injectable()
export class ProductRankingRepository {
    constructor(
        @InjectRepository(ProductRankingDailyEntity) private readonly productRankingDailyRepository: Repository<ProductRankingDailyEntity>,
        @InjectRedis() private readonly redisClient: Redis,
        private readonly productRankingMapper: ProductRankingMapper,
    ) { }

    // --- Private helper variables ---
     private readonly ProductRankingDailyPrefix: string = 'PRD:';

    // --- Helper methods ---
    // Get the current date.
    async getCurrentDate(): Promise<{ day: number, month: number, year: number }> {
        const now = new Date();
        return Promise.resolve({
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
        });
    }

    // Set the prefix for product ranking cache in Redis (base cache for top 100).
    private getProductRankingCacheKey(invoiceType: InvoiceType, startDate: Date, endDate: Date): string {
        return `${this.ProductRankingDailyPrefix}${invoiceType}:${startDate.getTime()}-${endDate.getTime()}:top100`;
    }

    // Cache top 100 products ranking daily.
    async cacheTop100ProductsDaily(invoiceType: InvoiceType, day: number, month: number, year: number): Promise<boolean> {
        const queryBuilder = this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .leftJoinAndSelect('ranking.product', 'product')
            .leftJoinAndSelect('product.productNames', 'productName')
            .andWhere('ranking.invoiceType = :invoiceType', { invoiceType })
            .andWhere('ranking.day = :day AND ranking.month = :month AND ranking.year = :year', { day, month, year })
            .orderBy('ranking.quantity', 'DESC')
            .take(100);

        const products = await queryBuilder.getMany();

        // Convert to DTO format and create response
        const data = this.productRankingMapper.toProductRankingItemResponseDtoArray(products);
        const response: GetListOfProductRankingResponseDto = {
            total: data.length,
            page: 1,
            limit: 100,
            data,
        };

        // Cache the top 100 products in Redis for 30 minutes.
        const cacheKey = this.getProductRankingCacheKey(invoiceType, new Date(year, month - 1, day), new Date(year, month - 1, day));
        await this.redisClient.setex(cacheKey, 30 * 60, JSON.stringify(response));

        return true;
    }

    // --- API methods ---
    // Store the product rankign daily data.
    async storeProductRankingDaily(transactionManager: any, productId: string, invoiceType: InvoiceType, quantity: number, totalPrice: number) {
        
        // Get the current date.
        const { day, month, year } = await this.getCurrentDate();

        // Find existing record for this product, invoiceType and date.
        const existingRecord = await transactionManager.findOne(ProductRankingDailyEntity, {
            where: {
                product: { id: productId },
                invoiceType,
                day,
                month, 
                year,
            },
        });

        if (existingRecord) {
            existingRecord.quantity += quantity;
            existingRecord.totalPrice = Number(existingRecord.totalPrice) + totalPrice;
            return await transactionManager.save(ProductRankingDailyEntity, existingRecord);
        } else {
            const newRecord = this.productRankingDailyRepository.create({
                product: { id: productId },
                invoiceType,
                quantity,
                totalPrice,
                day,
                month,
                year,
            });
            return await transactionManager.save(ProductRankingDailyEntity, newRecord);
        }
    }

    // Get a list of product ranking daily.
    async getListOfProductRankingDaily(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate } = dto;
        const cacheKey = this.getProductRankingCacheKey(invoiceType, new Date(startDate), new Date(startDate));
        let allProducts: ProductRankingItemResponseDto[];

        // Get cached result if exists. If not, query database.
        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
            const cachedResponse: GetListOfProductRankingResponseDto = JSON.parse(cachedResult);
            allProducts = cachedResponse.data;
        } else {
            // Query database for top 100 products with search and sort.
            const queryBuilder = this.productRankingDailyRepository
                .createQueryBuilder('ranking')
                .leftJoinAndSelect('ranking.product', 'product')
                .leftJoinAndSelect('product.productNames', 'productName');

            // Filter by product name.
            if (search) {
                queryBuilder.andWhere('productName.name ILIKE :search', { search: `%${search}%` });
            }

            // Filter by invoice type.
            if (invoiceType) {
                queryBuilder.andWhere('ranking.invoiceType = :invoiceType', { invoiceType });
            }

            // Filter by specific date.
            if (startDate) {
                const start = new Date(startDate);
                const day = start.getDate();
                const month = start.getMonth() + 1;
                const year = start.getFullYear();
                queryBuilder.andWhere(
                    'ranking.day = :day AND ranking.month = :month AND ranking.year = :year',
                    { day, month, year }
                );
            }

            // Sort by quantity and get top 100.
            queryBuilder.orderBy('ranking.quantity', sortOrder.toUpperCase() as 'ASC' | 'DESC');
            queryBuilder.take(100);

            const products = await queryBuilder.getMany();
            allProducts = this.productRankingMapper.toProductRankingItemResponseDtoArray(products);
        }

        // If cached result, apply search filter in memory.
        if (cachedResult && search) {
            allProducts = allProducts.filter(product =>
                product.product?.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Apply sort order if different from cached order.
        if (cachedResult && sortOrder === 'asc') {
            allProducts = allProducts.reverse();
        }

        // Apply pagination on products.
        const total = allProducts.length;
        const startIndex = (page - 1) * limit;
        const data = allProducts.slice(startIndex, startIndex + limit);

        return { total, page, limit, data };
    }

    // Get a list of product ranking custom date range.
    async getListOfProductRankingCustom(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate, endDate } = dto;
        
        // Query builder for custom date range.
        const queryBuilder = this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .leftJoinAndSelect('ranking.product', 'product')
            .leftJoinAndSelect('product.productNames', 'productName');
        
        // Filter by invoice type.
        if (invoiceType) queryBuilder.andWhere('ranking.invoiceType = :invoiceType', { invoiceType });

        // Filter by date range.
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startYear = start.getFullYear();
            const startMonth = start.getMonth() + 1;
            const startDay = start.getDate();
            const endYear = end.getFullYear();
            const endMonth = end.getMonth() + 1;
            const endDay = end.getDate();

            queryBuilder.andWhere(
                '(ranking.year > :startYear OR (ranking.year = :startYear AND ranking.month > :startMonth) OR (ranking.year = :startYear AND ranking.month = :startMonth AND ranking.day >= :startDay)) AND (ranking.year < :endYear OR (ranking.year = :endYear AND ranking.month < :endMonth) OR (ranking.year = :endYear AND ranking.month = :endMonth AND ranking.day <= :endDay))',
                { startYear, startMonth, startDay, endYear, endMonth, endDay }
            );
        }

        if (search) {
            queryBuilder.andWhere('productName.name ILIKE :search', { search: `%${search}%` });
        }

        // Group by product and sum quantity.
        queryBuilder
            .select('product.id', 'product_id')
            .addSelect('SUM(ranking.quantity)', 'total_quantity')
            .addSelect('SUM(ranking.totalPrice)', 'total_price')
            .groupBy('product.id')
            .orderBy('total_quantity', sortOrder.toUpperCase() as 'ASC' | 'DESC')
            .limit(100);

        const products = await queryBuilder.getRawMany();
        const allProducts = this.productRankingMapper.toProductRankingItemResponseDtoArray(products);

        // Apply pagination.
        const total = allProducts.length;
        const startIndex = (page - 1) * limit;
        const data = allProducts.slice(startIndex, startIndex + limit);

        return { total, page, limit, data };
    }

    // Remove all product ranking daily data if it is not in the top 100.
    async removeNonTop100ProductRankingDaily(day: number, month: number, year: number): Promise<number> {

        const subQuery = this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .select('ranking.id')
            .where('ranking.day = :day AND ranking.month = :month AND ranking.year = :year', { day, month, year })
            .orderBy('ranking.quantity', 'DESC')
            .limit(100);
        
        const result = await this.productRankingDailyRepository
            .createQueryBuilder()
            .delete()
            .where('id NOT IN (' + subQuery.getQuery() + ')', subQuery.getParameters())
            .execute();

        if (result.affected === undefined || result.affected === null) return 0;
        return result.affected; 
    }

}