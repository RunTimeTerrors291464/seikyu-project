import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Imports Redis.
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

// Import entities.
import { ProductRankingDailyEntity } from '../entities/productRankingDaily.entity';
import { ProductRankingMonthlyEntity } from '../entities/productRankingMonthly.entity';
import { ProductRankingYearlyEntity } from '../entities/productRankingYearly.entity';

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
        @InjectRepository(ProductRankingMonthlyEntity) private readonly productRankingMonthlyRepository: Repository<ProductRankingMonthlyEntity>,
        @InjectRepository(ProductRankingYearlyEntity) private readonly productRankingYearlyRepository: Repository<ProductRankingYearlyEntity>,
        @InjectRedis() private readonly redisClient: Redis,
        private readonly productRankingMapper: ProductRankingMapper,
    ) { }

    // --- Private helper variables ---
    private readonly ProductRankingDailyPrefix: string = 'PRD:';
    private readonly ProductRankingMonthlyPrefix: string = 'PRM:';
    private readonly ProductRankingYearlyPrefix: string = 'PRY:';
    private readonly PriceTrendPrefix: string = 'PT:';

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

    // Set the prefix for product ranking cache in Redis.
    private getProductRankingDailyCacheKey(invoiceType: InvoiceType, startDate: Date, endDate: Date): string {
        return `${this.ProductRankingDailyPrefix}${invoiceType}:${startDate.getTime()}-${endDate.getTime()}`;
    }

    // Set the cache key for product ranking monthly in Redis.
    private getProductRankingMonthlyCacheKey(invoiceType: InvoiceType, month: number, year: number): string {
        return `${this.ProductRankingMonthlyPrefix}${invoiceType}:${month}-${year}`;
    }

    // Set the cache key for product ranking yearly in Redis.
    private getProductRankingYearlyCacheKey(invoiceType: InvoiceType, year: number): string {
        return `${this.ProductRankingYearlyPrefix}${invoiceType}:${year}`;
    }

    // Set the per-day cache key for price trend in Redis.
    private getPriceTrendDayCacheKey(year: number, month: number, day: number): string {
        return `${this.PriceTrendPrefix}day:${year}-${month}-${day}`;
    }

    // Cache top 100 products ranking daily.
    async cacheTop100ProductsDaily(invoiceType: InvoiceType, day: number, month: number, year: number): Promise<boolean> {

        // Get the cache key for this invoice type and date.
        const cacheKey = this.getProductRankingDailyCacheKey(invoiceType, new Date(year, month - 1, day), new Date(year, month - 1, day));

        // Get top 100 products for the given invoice type and date.
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

        // Remove the existing cache for this key if exists.
        if (await this.redisClient.exists(cacheKey)) await this.redisClient.del(cacheKey);

        // Cache the top 100 products in Redis for 30 minutes.
        await this.redisClient.setex(cacheKey, 30 * 60, JSON.stringify(response));

        return true;
    }

    // Cache top 100 products ranking monthly.
    async cacheTop100ProductsMonthly(invoiceType: InvoiceType, month: number, year: number): Promise<boolean> {

        // Get the cache key for this invoice type and month.
        const cacheKey = this.getProductRankingMonthlyCacheKey(invoiceType, month, year);

        const queryBuilder = this.productRankingMonthlyRepository
            .createQueryBuilder('ranking')
            .leftJoinAndSelect('ranking.product', 'product')
            .leftJoinAndSelect('product.productNames', 'productName')
            .andWhere('ranking.invoiceType = :invoiceType', { invoiceType })
            .andWhere('ranking.month = :month AND ranking.year = :year', { month, year })
            .orderBy('ranking.quantity', 'DESC')
            .take(100);

        const products = await queryBuilder.getMany();
        const data: ProductRankingItemResponseDto[] = products.map((item) => ({
            id: item.id,
            product: {
                id: item.product?.id,
                sku: item.product?.sku,
                name: item.product?.productNames && item.product.productNames.length > 0
                    ? item.product.productNames[0].name
                    : 'N/A',
            },
            quantity: item.quantity,
            totalPrice: Number(item.totalPrice),
            invoiceType: item.invoiceType,
            day: 1,
            month: item.month,
            year: item.year,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));

        const response: GetListOfProductRankingResponseDto = {
            total: data.length,
            page: 1,
            limit: 100,
            data,
        };

        // Remove the existing cache for this key if exists.
        if (await this.redisClient.exists(cacheKey)) await this.redisClient.del(cacheKey);

        // Cache monthly top 100 for 24 hours.
        await this.redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(response));

        return true;
    }

    // Cache top 100 products ranking yearly.
    async cacheTop100ProductsYearly(invoiceType: InvoiceType, year: number): Promise<boolean> {

        // Get the cache key for this invoice type and year.
        const cacheKey = this.getProductRankingYearlyCacheKey(invoiceType, year);

        const queryBuilder = this.productRankingYearlyRepository
            .createQueryBuilder('ranking')
            .leftJoinAndSelect('ranking.product', 'product')
            .leftJoinAndSelect('product.productNames', 'productName')
            .andWhere('ranking.invoiceType = :invoiceType', { invoiceType })
            .andWhere('ranking.year = :year', { year })
            .orderBy('ranking.quantity', 'DESC')
            .take(100);

        const products = await queryBuilder.getMany();
        const data: ProductRankingItemResponseDto[] = products.map((item) => ({
            id: item.id,
            product: {
                id: item.product?.id,
                sku: item.product?.sku,
                name: item.product?.productNames && item.product.productNames.length > 0
                    ? item.product.productNames[0].name
                    : 'N/A',
            },
            quantity: item.quantity,
            totalPrice: Number(item.totalPrice),
            invoiceType: item.invoiceType,
            day: 1,
            month: 1,
            year: item.year,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));

        const response: GetListOfProductRankingResponseDto = {
            total: data.length,
            page: 1,
            limit: 100,
            data,
        };

        // Remove the existing cache for this key if exists.
        if (await this.redisClient.exists(cacheKey)) await this.redisClient.del(cacheKey);

        // Cache yearly top 100 for 24 hours.
        await this.redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(response));

        return true;
    }

    // --- API methods ---

    // --- Product ranking methods ---
    // Store the product ranking daily data.
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

    // Store the product ranking monthly data using the daily data.
    async storeProductRankingMonthly(invoiceType: InvoiceType, day: number, month: number, year: number): Promise<void> {
        await this.productRankingDailyRepository.manager.transaction(async (transactionalManager) => {

            // Get all daily product rankings for the given invoice type and date.
            const dailyProducts = await transactionalManager.find(ProductRankingDailyEntity, {
                where: { invoiceType, day, month, year },
                relations: ['product'],
            });
            if (dailyProducts.length === 0) return;

            // For each daily product ranking, update or insert the monthly ranking.
            for (const dailyProduct of dailyProducts) {

                const existingMonthlyRecord = await transactionalManager.findOne(ProductRankingMonthlyEntity, {
                    where: {
                        product: { id: dailyProduct.product.id },
                        invoiceType,
                        month,
                        year,
                    },
                });

                let newMonthlyRecord: ProductRankingMonthlyEntity;

                if (existingMonthlyRecord) {
                    existingMonthlyRecord.quantity += dailyProduct.quantity;
                    existingMonthlyRecord.totalPrice = Number(existingMonthlyRecord.totalPrice) + Number(dailyProduct.totalPrice);
                    await transactionalManager.save(ProductRankingMonthlyEntity, existingMonthlyRecord);
                    continue;
                } 
                else {
                    newMonthlyRecord = this.productRankingMonthlyRepository.create({
                        product: { id: dailyProduct.product.id },
                        quantity: dailyProduct.quantity,
                        totalPrice: Number(dailyProduct.totalPrice),
                        invoiceType,
                        month,
                        year,
                    });
                }

                await transactionalManager.save(ProductRankingMonthlyEntity, newMonthlyRecord);
            }
        });

        // Refresh monthly cache after storing is completed.
        await this.cacheTop100ProductsMonthly(invoiceType, month, year);
    }

    // Store the product ranking yearly data using the monthly data.
    async storeProductRankingYearly(invoiceType: InvoiceType, month: number, year: number): Promise<void> {
        await this.productRankingMonthlyRepository.manager.transaction(async (transactionalManager) => {

            // Get all monthly product rankings for the given invoice type and month.
            const monthlyProducts = await transactionalManager.find(ProductRankingMonthlyEntity, {
                where: { invoiceType, month, year },
                relations: ['product'],
            });
            if (monthlyProducts.length === 0) return;

            // For each monthly product ranking, update or insert the yearly ranking.
            for (const monthlyProduct of monthlyProducts) {

                const existingYearlyRecord = await transactionalManager.findOne(ProductRankingYearlyEntity, {
                    where: {
                        product: { id: monthlyProduct.product.id },
                        invoiceType,
                        year,
                    },
                });

                let newYearlyRecord: ProductRankingYearlyEntity;

                if (existingYearlyRecord) {
                    existingYearlyRecord.quantity += monthlyProduct.quantity;
                    existingYearlyRecord.totalPrice = Number(existingYearlyRecord.totalPrice) + Number(monthlyProduct.totalPrice);
                    await transactionalManager.save(ProductRankingYearlyEntity, existingYearlyRecord);
                    continue;
                }
                else {
                    newYearlyRecord = this.productRankingYearlyRepository.create({
                        product: { id: monthlyProduct.product.id },
                        quantity: monthlyProduct.quantity,
                        totalPrice: Number(monthlyProduct.totalPrice),
                        invoiceType,
                        year,
                    });
                }

                await transactionalManager.save(ProductRankingYearlyEntity, newYearlyRecord);
            }
        });

        // Refresh yearly cache after storing is completed.
        await this.cacheTop100ProductsYearly(invoiceType, year);
    }

    // Get a list of product ranking daily.
    async getListOfProductRankingDaily(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate } = dto;
        const cacheKey = this.getProductRankingDailyCacheKey(invoiceType, new Date(startDate), new Date(startDate));
        let allProducts: ProductRankingItemResponseDto[];

        // Get cached result if exists. 
        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
            const cachedResponse: GetListOfProductRankingResponseDto = JSON.parse(cachedResult);
            allProducts = cachedResponse.data;

            // If cached result, apply search filter in memory.
            if (search) {
                allProducts = allProducts.filter(product => product.product?.name.toLowerCase().includes(search.toLowerCase()));
            }

            // Apply sort order if different from cached order.
            if (sortOrder === 'asc') allProducts = allProducts.reverse();
        }

        // If there is no cached, query the database.
        else {
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

        // Apply pagination on products.
        const total = allProducts.length;
        const startIndex = (page - 1) * limit;
        const data = allProducts.slice(startIndex, startIndex + limit);

        return { total, page, limit, data };
    }

    // Get a list of product ranking monthly.
    async getListOfProductRankingMonthly(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate } = dto;

        const start = new Date(startDate);
        const month = start.getMonth() + 1;
        const year = start.getFullYear();
        const cacheKey = this.getProductRankingMonthlyCacheKey(invoiceType, month, year);

        let allProducts: ProductRankingItemResponseDto[];

        // Get cached result if exists.
        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
            const cachedResponse: GetListOfProductRankingResponseDto = JSON.parse(cachedResult);
            allProducts = cachedResponse.data;

            if (search) {
                allProducts = allProducts.filter(product => product.product?.name.toLowerCase().includes(search.toLowerCase()));
            }

            if (sortOrder === 'asc') allProducts = allProducts.reverse();
        } 

        // If there is no cached, query the database.
        else {
            const queryBuilder = this.productRankingMonthlyRepository
                .createQueryBuilder('ranking')
                .leftJoinAndSelect('ranking.product', 'product')
                .leftJoinAndSelect('product.productNames', 'productName')
                .andWhere('ranking.month = :month AND ranking.year = :year', { month, year });

            if (search) {
                queryBuilder.andWhere('productName.name ILIKE :search', { search: `%${search}%` });
            }

            if (invoiceType) {
                queryBuilder.andWhere('ranking.invoiceType = :invoiceType', { invoiceType });
            }

            queryBuilder.orderBy('ranking.quantity', sortOrder.toUpperCase() as 'ASC' | 'DESC');
            queryBuilder.take(100);

            const products = await queryBuilder.getMany();
            allProducts = products.map((item) => ({
                id: item.id,
                product: {
                    id: item.product?.id,
                    sku: item.product?.sku,
                    name: item.product?.productNames && item.product.productNames.length > 0
                        ? item.product.productNames[0].name
                        : 'N/A',
                },
                quantity: item.quantity,
                totalPrice: Number(item.totalPrice),
                invoiceType: item.invoiceType,
                day: 1,
                month: item.month,
                year: item.year,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            }));
        }

        const total = allProducts.length;
        const startIndex = (page - 1) * limit;
        const data = allProducts.slice(startIndex, startIndex + limit);

        return { total, page, limit, data };
    }

    // Get a list of product ranking yearly.
    async getListOfProductRankingYearly(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate } = dto;

        const start = new Date(startDate);
        const year = start.getFullYear();
        const cacheKey = this.getProductRankingYearlyCacheKey(invoiceType, year);

        let allProducts: ProductRankingItemResponseDto[];

        // Get cached result if exists.
        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
            const cachedResponse: GetListOfProductRankingResponseDto = JSON.parse(cachedResult);
            allProducts = cachedResponse.data;

            if (search) {
                allProducts = allProducts.filter(product => product.product?.name.toLowerCase().includes(search.toLowerCase()));
            }

            if (sortOrder === 'asc') allProducts = allProducts.reverse();
        }

        // If there is no cached, query the database.
        else {
            const queryBuilder = this.productRankingYearlyRepository
                .createQueryBuilder('ranking')
                .leftJoinAndSelect('ranking.product', 'product')
                .leftJoinAndSelect('product.productNames', 'productName')
                .andWhere('ranking.year = :year', { year });

            if (search) {
                queryBuilder.andWhere('productName.name ILIKE :search', { search: `%${search}%` });
            }

            if (invoiceType) {
                queryBuilder.andWhere('ranking.invoiceType = :invoiceType', { invoiceType });
            }

            queryBuilder.orderBy('ranking.quantity', sortOrder.toUpperCase() as 'ASC' | 'DESC');
            queryBuilder.take(100);

            const products = await queryBuilder.getMany();
            allProducts = products.map((item) => ({
                id: item.id,
                product: {
                    id: item.product?.id,
                    sku: item.product?.sku,
                    name: item.product?.productNames && item.product.productNames.length > 0
                        ? item.product.productNames[0].name
                        : 'N/A',
                },
                quantity: item.quantity,
                totalPrice: Number(item.totalPrice),
                invoiceType: item.invoiceType,
                day: 1,
                month: 1,
                year: item.year,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            }));
        }

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
    async removeNonTop100ProductRankingDaily(invoiceType: InvoiceType, day: number, month: number, year: number): Promise<number> {
        return await this.productRankingDailyRepository.manager.transaction(async (transactionalManager) => {
            const subQuery = transactionalManager
                .createQueryBuilder(ProductRankingDailyEntity, 'ranking')
                .select('ranking.id')
                .where('ranking.invoiceType = :invoiceType', { invoiceType })
                .andWhere('ranking.day = :day AND ranking.month = :month AND ranking.year = :year', { day, month, year })
                .orderBy('ranking.quantity', 'DESC')
                .limit(100);

            const result = await transactionalManager
                .createQueryBuilder()
                .delete()
                .from(ProductRankingDailyEntity)
                .where('invoiceType = :invoiceType', { invoiceType })
                .andWhere('day = :day AND month = :month AND year = :year', { day, month, year })
                .andWhere('id NOT IN (' + subQuery.getQuery() + ')', subQuery.getParameters())
                .execute();

            if (result.affected === undefined || result.affected === null) return 0;
            return result.affected;
        });
    }

    // Remove all product ranking monthly data if it is not in the top 100.
    async removeNonTop100ProductRankingMonthly(invoiceType: InvoiceType, month: number, year: number): Promise<number> {
        return await this.productRankingMonthlyRepository.manager.transaction(async (transactionalManager) => {
            const subQuery = transactionalManager
                .createQueryBuilder(ProductRankingMonthlyEntity, 'ranking')
                .select('ranking.id')
                .where('ranking.invoiceType = :invoiceType', { invoiceType })
                .andWhere('ranking.month = :month AND ranking.year = :year', { month, year })
                .orderBy('ranking.quantity', 'DESC')
                .limit(100);

            const result = await transactionalManager
                .createQueryBuilder()
                .delete()
                .from(ProductRankingMonthlyEntity)
                .where('invoiceType = :invoiceType', { invoiceType })
                .andWhere('month = :month AND year = :year', { month, year })
                .andWhere('id NOT IN (' + subQuery.getQuery() + ')', subQuery.getParameters())
                .execute();

            if (result.affected === undefined || result.affected === null) return 0;
            return result.affected;
        });
    }

    // Remove all product ranking yearly data if it is not in the top 100.
    async removeNonTop100ProductRankingYearly(invoiceType: InvoiceType, year: number): Promise<number> {
        return await this.productRankingYearlyRepository.manager.transaction(async (transactionalManager) => {
            const subQuery = transactionalManager
                .createQueryBuilder(ProductRankingYearlyEntity, 'ranking')
                .select('ranking.id')
                .where('ranking.invoiceType = :invoiceType', { invoiceType })
                .andWhere('ranking.year = :year', { year })
                .orderBy('ranking.quantity', 'DESC')
                .limit(100);

            const result = await transactionalManager
                .createQueryBuilder()
                .delete()
                .from(ProductRankingYearlyEntity)
                .where('invoiceType = :invoiceType', { invoiceType })
                .andWhere('year = :year', { year })
                .andWhere('id NOT IN (' + subQuery.getQuery() + ')', subQuery.getParameters())
                .execute();

            if (result.affected === undefined || result.affected === null) return 0;
            return result.affected;
        });
    }

    // Remove all product ranking data older than 10 years from all 3 tables.
    async removeProductRankingOlderThan10Years(): Promise<{ daily: number; monthly: number; yearly: number }> {
        const { year } = await this.getCurrentDate();
        const cutoffYear = year - 10;

        const [daily, monthly, yearly] = await Promise.all([
            this.productRankingDailyRepository
                .createQueryBuilder()
                .delete()
                .from(ProductRankingDailyEntity)
                .where('year < :cutoffYear', { cutoffYear })
                .execute(),

            this.productRankingMonthlyRepository
                .createQueryBuilder()
                .delete()
                .from(ProductRankingMonthlyEntity)
                .where('year < :cutoffYear', { cutoffYear })
                .execute(),

            this.productRankingYearlyRepository
                .createQueryBuilder()
                .delete()
                .from(ProductRankingYearlyEntity)
                .where('year < :cutoffYear', { cutoffYear })
                .execute(),
        ]);

        return {
            daily: daily.affected ?? 0,
            monthly: monthly.affected ?? 0,
            yearly: yearly.affected ?? 0,
        };
    }

    // --- Price trend methods ---
    // Pre-compute and cache today's aggregated price data (called by Cron every 30 minutes).
    async cacheTodayPriceTrendData(): Promise<void> {
        const now   = new Date();
        const day   = now.getDate();
        const month = now.getMonth() + 1;
        const year  = now.getFullYear();

        const row = await this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .select('ranking.day',   'day')
            .addSelect('ranking.month', 'month')
            .addSelect('ranking.year',  'year')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'import'          THEN ranking.total_price ELSE 0 END)`, 'import')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'returnImport'    THEN ranking.total_price ELSE 0 END)`, 'returnImport')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'selling'         THEN ranking.total_price ELSE 0 END)`, 'selling')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'returnSelling'   THEN ranking.total_price ELSE 0 END)`, 'returnSelling')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'stockAdjustment' THEN ranking.total_price ELSE 0 END)`, 'stockAdjustment')
            .where('ranking.year = :year AND ranking.month = :month AND ranking.day = :day', { year, month, day })
            .groupBy('ranking.year')
            .addGroupBy('ranking.month')
            .addGroupBy('ranking.day')
            .getRawOne();

        // Always write even if no invoices today so cache entry exists and avoids a DB hit.
        const value = {
            day, month, year,
            import:          row ? Number(row.import)          : 0,
            returnImport:    row ? Number(row.returnImport)    : 0,
            selling:         row ? Number(row.selling)         : 0,
            returnSelling:   row ? Number(row.returnSelling)   : 0,
            stockAdjustment: row ? Number(row.stockAdjustment) : 0,
        };

        // TTL matches the Cron interval so data never goes stale.
        await this.redisClient.setex(this.getPriceTrendDayCacheKey(year, month, day), 30 * 60, JSON.stringify(value));
    }

    // Get raw daily price data for a date range, pivoting all 5 invoice types into a single row per day.
    async getPriceTrendRawData(
        startDate: Date,
        endDate: Date,
    ): Promise<{ day: number; month: number; year: number; import: number; returnImport: number; selling: number; returnSelling: number; stockAdjustment: number }[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Build the full list of dates and their Redis keys for the range.
        const dates: Date[]     = [];
        const cacheKeys: string[] = [];
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            dates.push(new Date(cursor));
            cacheKeys.push(this.getPriceTrendDayCacheKey(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()));
            cursor.setDate(cursor.getDate() + 1);
        }

        // Batch-fetch all days from Redis in a single round-trip.
        const cachedValues = await this.redisClient.mget(...cacheKeys);

        type DayRow = { day: number; month: number; year: number; import: number; returnImport: number; selling: number; returnSelling: number; stockAdjustment: number };
        const result: DayRow[]       = [];
        const uncachedDates: Date[]  = [];

        for (let i = 0; i < dates.length; i++) {
            if (cachedValues[i]) {
                result.push(JSON.parse(cachedValues[i] as string));
            } else {
                uncachedDates.push(dates[i]);
            }
        }

        // All days were cached — skip DB query entirely.
        if (uncachedDates.length === 0) return result;

        // Query DB for all uncached days in a single query.
        const minDate = uncachedDates[0];
        const maxDate = uncachedDates[uncachedDates.length - 1];

        const rawRows = await this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .select('ranking.day',   'day')
            .addSelect('ranking.month', 'month')
            .addSelect('ranking.year',  'year')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'import'          THEN ranking.total_price ELSE 0 END)`, 'import')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'returnImport'    THEN ranking.total_price ELSE 0 END)`, 'returnImport')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'selling'         THEN ranking.total_price ELSE 0 END)`, 'selling')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'returnSelling'   THEN ranking.total_price ELSE 0 END)`, 'returnSelling')
            .addSelect(`SUM(CASE WHEN ranking.invoice_type = 'stockAdjustment' THEN ranking.total_price ELSE 0 END)`, 'stockAdjustment')
            .where(
                `(
                    ranking.year > :startYear OR
                    (ranking.year = :startYear AND ranking.month > :startMonth) OR
                    (ranking.year = :startYear AND ranking.month = :startMonth AND ranking.day >= :startDay)
                )`,
                { startYear: minDate.getFullYear(), startMonth: minDate.getMonth() + 1, startDay: minDate.getDate() },
            )
            .andWhere(
                `(
                    ranking.year < :endYear OR
                    (ranking.year = :endYear AND ranking.month < :endMonth) OR
                    (ranking.year = :endYear AND ranking.month = :endMonth AND ranking.day <= :endDay)
                )`,
                { endYear: maxDate.getFullYear(), endMonth: maxDate.getMonth() + 1, endDay: maxDate.getDate() },
            )
            .groupBy('ranking.year')
            .addGroupBy('ranking.month')
            .addGroupBy('ranking.day')
            .getRawMany();

        // Index DB results by "year-month-day" for O(1) lookup.
        const dbMap = new Map<string, DayRow>();
        for (const row of rawRows) {
            dbMap.set(`${Number(row.year)}-${Number(row.month)}-${Number(row.day)}`, {
                day: Number(row.day), month: Number(row.month), year: Number(row.year),
                import:          Number(row.import),
                returnImport:    Number(row.returnImport),
                selling:         Number(row.selling),
                returnSelling:   Number(row.returnSelling),
                stockAdjustment: Number(row.stockAdjustment),
            });
        }

        // Cache each uncached day via a Redis pipeline (one round-trip) and append to result.
        const pipeline = this.redisClient.pipeline();
        for (const d of uncachedDates) {
            const key     = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            const dayData = dbMap.get(key) ?? {
                day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear(),
                import: 0, returnImport: 0, selling: 0, returnSelling: 0, stockAdjustment: 0,
            };
            // Historical days are immutable → 365-day TTL. Today is managed by Cron → 30-min TTL.
            const isToday = d.getTime() === today.getTime();
            const ttl     = isToday ? 30 * 60 : 365 * 24 * 60 * 60;
            pipeline.setex(this.getPriceTrendDayCacheKey(d.getFullYear(), d.getMonth() + 1, d.getDate()), ttl, JSON.stringify(dayData));
            result.push(dayData);
        }
        await pipeline.exec();

        return result;
    }

}