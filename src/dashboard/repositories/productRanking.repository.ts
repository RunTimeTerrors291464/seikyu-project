import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Import entities.
import { ProductsEntity } from '@src/products/entities/products.entity';
import { ProductRankingDailyEntity } from '../entities/productRankingDaily.entity';
import { ProductRankingMonthlyEntity } from '../entities/productRankingMonthly.entity';
import { ProductRankingYearlyEntity } from '../entities/productRankingYearly.entity';

// Import enums.
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';

// Import DTOs.
import { GetListOfProductRankingRequestDto } from '@libs/common/dtos/dashboard/crudProductRankingRequest.dto';
import { GetListOfProductRankingResponseDto, ProductRankingItemResponseDto } from '@libs/common/dtos/dashboard/crudProductRankingResponse.dto';

// Import mappers.
import { ProductRankingMapper } from '@libs/common/mappers/dashboard/productRanking.mapper';

@Injectable()
export class ProductRankingRepository {
    constructor(
        @InjectRepository(ProductRankingDailyEntity) private readonly productRankingDailyRepository: Repository<ProductRankingDailyEntity>,
        @InjectRepository(ProductRankingMonthlyEntity) private readonly productRankingMonthlyRepository: Repository<ProductRankingMonthlyEntity>,
        @InjectRepository(ProductRankingYearlyEntity) private readonly productRankingYearlyRepository: Repository<ProductRankingYearlyEntity>,
        @InjectRedis() private readonly redisClient: Redis,
        private readonly productRankingMapper: ProductRankingMapper,
    ) { }

    // --- Private variables ---
    // Redis key prefix: daily top-100 list per invoice type and calendar day.
    private readonly ProductRankingDailyPrefix: string = 'PRD:';
    // Redis key prefix: monthly top-100 list per invoice type and month.
    private readonly ProductRankingMonthlyPrefix: string = 'PRM:';
    // Redis key prefix: yearly top-100 list per invoice type and year.
    private readonly ProductRankingYearlyPrefix: string = 'PRY:';
    // Redis key prefix: per-day aggregates for the price-trend chart.
    private readonly PriceTrendPrefix: string = 'PT:';

    // --- Private methods ---
    // Build Redis cache key for daily product ranking (PRD:{invoiceType}:{startMs}-{endMs}).
    private getProductRankingDailyCacheKey(invoiceType: InvoiceType, startDate: Date, endDate: Date): string {
        return `${this.ProductRankingDailyPrefix}${invoiceType}:${startDate.getTime()}-${endDate.getTime()}`;
    }

    // Build Redis cache key for monthly product ranking (PRM:{invoiceType}:{month}-{year}).
    private getProductRankingMonthlyCacheKey(invoiceType: InvoiceType, month: number, year: number): string {
        return `${this.ProductRankingMonthlyPrefix}${invoiceType}:${month}-${year}`;
    }

    // Build Redis cache key for yearly product ranking (PRY:{invoiceType}:{year}).
    private getProductRankingYearlyCacheKey(invoiceType: InvoiceType, year: number): string {
        return `${this.ProductRankingYearlyPrefix}${invoiceType}:${year}`;
    }

    // Build Redis cache key for one calendar day's price-trend bucket (PT:day:{y-m-d}).
    private getPriceTrendDayCacheKey(year: number, month: number, day: number): string {
        return `${this.PriceTrendPrefix}day:${year}-${month}-${day}`;
    }

    // --- Public methods ---
    // Get the current calendar day, month, and year (server local time).
    async getCurrentDate(): Promise<{ day: number, month: number, year: number }> {
        const now = new Date();
        return Promise.resolve({
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
        });
    }

    // Cache top-100 products for daily ranking in Redis (TTL 30 minutes).
    async cacheTop100ProductsDaily(invoiceType: InvoiceType, day: number, month: number, year: number): Promise<boolean> {

        const cacheKey = this.getProductRankingDailyCacheKey(invoiceType, new Date(year, month - 1, day), new Date(year, month - 1, day));

        const queryBuilder = this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .leftJoinAndSelect('ranking.product', 'product')
            .leftJoinAndSelect('product.productNames', 'productName')
            .andWhere('ranking.invoiceType = :invoiceType', { invoiceType })
            .andWhere('ranking.day = :day AND ranking.month = :month AND ranking.year = :year', { day, month, year })
            .orderBy('ranking.quantity', 'DESC')
            .take(100);

        const products = await queryBuilder.getMany();

        const data = this.productRankingMapper.toProductRankingItemResponseDtoArray(products);
        const response: GetListOfProductRankingResponseDto = {
            total: data.length,
            page: 1,
            limit: 100,
            data,
        };

        if (await this.redisClient.exists(cacheKey)) await this.redisClient.del(cacheKey);

        await this.redisClient.setex(cacheKey, 30 * 60, JSON.stringify(response));

        return true;
    }

    // Cache top-100 products for monthly ranking in Redis (TTL 24 hours).
    async cacheTop100ProductsMonthly(invoiceType: InvoiceType, month: number, year: number): Promise<boolean> {

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

        if (await this.redisClient.exists(cacheKey)) await this.redisClient.del(cacheKey);

        await this.redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(response));

        return true;
    }

    // Cache top-100 products for yearly ranking in Redis (TTL 24 hours).
    async cacheTop100ProductsYearly(invoiceType: InvoiceType, year: number): Promise<boolean> {

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

        if (await this.redisClient.exists(cacheKey)) await this.redisClient.del(cacheKey);

        await this.redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(response));

        return true;
    }

    // Upsert one daily product ranking row (called inside stock update transactions) - ProductRankingDailyEntity.
    async storeProductRankingDaily(transactionManager: any, productId: string, invoiceType: InvoiceType, quantity: number, totalPrice: number) {

        const { day, month, year } = await this.getCurrentDate();

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

    // Roll one calendar day's daily rankings into monthly aggregates - ProductRankingMonthlyEntity.
    async storeProductRankingMonthly(invoiceType: InvoiceType, day: number, month: number, year: number): Promise<void> {
        await this.productRankingDailyRepository.manager.transaction(async (transactionalManager) => {

            const dailyProducts = await transactionalManager.find(ProductRankingDailyEntity, {
                where: { invoiceType, day, month, year },
                relations: ['product'],
            });
            if (dailyProducts.length === 0) return;

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

        await this.cacheTop100ProductsMonthly(invoiceType, month, year);
    }

    // Roll one month's monthly rankings into yearly aggregates - ProductRankingYearlyEntity.
    async storeProductRankingYearly(invoiceType: InvoiceType, month: number, year: number): Promise<void> {
        await this.productRankingMonthlyRepository.manager.transaction(async (transactionalManager) => {

            const monthlyProducts = await transactionalManager.find(ProductRankingMonthlyEntity, {
                where: { invoiceType, month, year },
                relations: ['product'],
            });
            if (monthlyProducts.length === 0) return;

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

        await this.cacheTop100ProductsYearly(invoiceType, year);
    }

    // List product ranking for a single calendar day (cache-first, then DB top 100).
    async getListOfProductRankingDaily(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate } = dto;
        const cacheKey = this.getProductRankingDailyCacheKey(invoiceType, new Date(startDate), new Date(startDate));
        let allProducts: ProductRankingItemResponseDto[];

        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
            const cachedResponse: GetListOfProductRankingResponseDto = JSON.parse(cachedResult);
            allProducts = cachedResponse.data;

            if (search) {
                allProducts = allProducts.filter((product) => product.product?.name.toLowerCase().includes(search.toLowerCase()));
            }

            if (sortOrder === 'asc') allProducts = allProducts.reverse();
        }

        else {
            const queryBuilder = this.productRankingDailyRepository
                .createQueryBuilder('ranking')
                .leftJoinAndSelect('ranking.product', 'product')
                .leftJoinAndSelect('product.productNames', 'productName');

            if (search) {
                queryBuilder.andWhere('productName.name ILIKE :search', { search: `%${search}%` });
            }

            if (invoiceType) {
                queryBuilder.andWhere('ranking.invoiceType = :invoiceType', { invoiceType });
            }

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

            queryBuilder.orderBy('ranking.quantity', sortOrder.toUpperCase() as 'ASC' | 'DESC');
            queryBuilder.take(100);

            const products = await queryBuilder.getMany();
            allProducts = this.productRankingMapper.toProductRankingItemResponseDtoArray(products);
        }

        const total = allProducts.length;
        const startIndex = (page - 1) * limit;
        const data = allProducts.slice(startIndex, startIndex + limit);

        return { total, page, limit, data };
    }

    // List product ranking for a calendar month (cache-first, then DB top 100).
    async getListOfProductRankingMonthly(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate } = dto;

        const start = new Date(startDate);
        const month = start.getMonth() + 1;
        const year = start.getFullYear();
        const cacheKey = this.getProductRankingMonthlyCacheKey(invoiceType, month, year);

        let allProducts: ProductRankingItemResponseDto[];

        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
            const cachedResponse: GetListOfProductRankingResponseDto = JSON.parse(cachedResult);
            allProducts = cachedResponse.data;

            if (search) {
                allProducts = allProducts.filter((product) => product.product?.name.toLowerCase().includes(search.toLowerCase()));
            }

            if (sortOrder === 'asc') allProducts = allProducts.reverse();
        }

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

    // List product ranking for a calendar year (cache-first, then DB top 100).
    async getListOfProductRankingYearly(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate } = dto;

        const start = new Date(startDate);
        const year = start.getFullYear();
        const cacheKey = this.getProductRankingYearlyCacheKey(invoiceType, year);

        let allProducts: ProductRankingItemResponseDto[];

        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
            const cachedResponse: GetListOfProductRankingResponseDto = JSON.parse(cachedResult);
            allProducts = cachedResponse.data;

            if (search) {
                allProducts = allProducts.filter((product) => product.product?.name.toLowerCase().includes(search.toLowerCase()));
            }

            if (sortOrder === 'asc') allProducts = allProducts.reverse();
        }

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

    // List product ranking aggregated over a custom date range (max 90 days; enforced in service).
    async getListOfProductRankingCustom(dto: GetListOfProductRankingRequestDto): Promise<GetListOfProductRankingResponseDto> {
        const { page = 1, limit = 10, search, sortOrder = 'desc', invoiceType, startDate, endDate } = dto;

        const queryBuilder = this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .innerJoin('ranking.product', 'product');

        if (invoiceType) queryBuilder.andWhere('ranking.invoiceType = :invoiceType', { invoiceType });

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
            queryBuilder.andWhere(
                `EXISTS (SELECT 1 FROM product_names pn WHERE pn.product_id = product.id AND pn.name ILIKE :search)`,
                { search: `%${search}%` },
            );
        }

        queryBuilder
            .select('product.id', 'product_id')
            .addSelect('SUM(ranking.quantity)', 'total_quantity')
            .addSelect('SUM(ranking.total_price)', 'total_price')
            .groupBy('product.id')
            .orderBy('total_quantity', sortOrder.toUpperCase() as 'ASC' | 'DESC')
            .limit(100);

        const rawRows = await queryBuilder.getRawMany();

        const productIds = rawRows.map((r) => r.product_id as string);
        if (productIds.length === 0) {
            return { total: 0, page, limit, data: [] };
        }

        const products = await this.productRankingDailyRepository.manager.find(ProductsEntity, {
            where: { id: In(productIds) },
            relations: ['productNames'],
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        const rangeStart = new Date(startDate);
        const day = rangeStart.getDate();
        const month = rangeStart.getMonth() + 1;
        const year = rangeStart.getFullYear();
        const stamp = new Date();

        const allProducts: ProductRankingItemResponseDto[] = rawRows.map((row) => {
            const pid = row.product_id as string;
            const p = productMap.get(pid);
            return {
                id: pid,
                product: {
                    id: pid,
                    sku: p?.sku ?? '',
                    name: p?.productNames && p.productNames.length > 0 ? p.productNames[0].name : 'N/A',
                },
                quantity: Number(row.total_quantity),
                totalPrice: Number(row.total_price),
                invoiceType: invoiceType,
                day,
                month,
                year,
                createdAt: stamp,
                updatedAt: stamp,
            };
        });

        const total = allProducts.length;
        const startIndex = (page - 1) * limit;
        const data = allProducts.slice(startIndex, startIndex + limit);

        return { total, page, limit, data };
    }

    // Delete daily rows outside top 100 by quantity for one day and invoice type.
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

    // Delete monthly rows outside top 100 by quantity for one month and invoice type.
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

    // Delete yearly rows outside top 100 by quantity for one year and invoice type.
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

    // Purge ranking rows older than 10 calendar years in all three tables.
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

    // Pre-compute today's per-invoice-type totals from ProductRankingDailyEntity and store in Redis (cron / chart warm-up).
    async cacheTodayPriceTrendData(): Promise<void> {
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const row = await this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .select('ranking.day', 'day')
            .addSelect('ranking.month', 'month')
            .addSelect('ranking.year', 'year')
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

        const value = {
            day, month, year,
            import: row ? Number(row.import) : 0,
            returnImport: row ? Number(row.returnImport) : 0,
            selling: row ? Number(row.selling) : 0,
            returnSelling: row ? Number(row.returnSelling) : 0,
            stockAdjustment: row ? Number(row.stockAdjustment) : 0,
        };

        await this.redisClient.setex(this.getPriceTrendDayCacheKey(year, month, day), 30 * 60, JSON.stringify(value));
    }

    // Load per-day price totals for a date range (Redis mget + DB fill + pipeline backfill).
    async getPriceTrendRawData(
        startDate: Date,
        endDate: Date,
    ): Promise<{ day: number; month: number; year: number; import: number; returnImport: number; selling: number; returnSelling: number; stockAdjustment: number }[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dates: Date[] = [];
        const cacheKeys: string[] = [];
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            dates.push(new Date(cursor));
            cacheKeys.push(this.getPriceTrendDayCacheKey(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()));
            cursor.setDate(cursor.getDate() + 1);
        }

        const cachedValues = await this.redisClient.mget(...cacheKeys);

        type DayRow = { day: number; month: number; year: number; import: number; returnImport: number; selling: number; returnSelling: number; stockAdjustment: number };
        const result: DayRow[] = [];
        const uncachedDates: Date[] = [];

        for (let i = 0; i < dates.length; i++) {
            if (cachedValues[i]) {
                result.push(JSON.parse(cachedValues[i] as string));
            } else {
                uncachedDates.push(dates[i]);
            }
        }

        if (uncachedDates.length === 0) return result;

        const minDate = uncachedDates[0];
        const maxDate = uncachedDates[uncachedDates.length - 1];

        const rawRows = await this.productRankingDailyRepository
            .createQueryBuilder('ranking')
            .select('ranking.day', 'day')
            .addSelect('ranking.month', 'month')
            .addSelect('ranking.year', 'year')
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

        const dbMap = new Map<string, DayRow>();
        for (const row of rawRows) {
            dbMap.set(`${Number(row.year)}-${Number(row.month)}-${Number(row.day)}`, {
                day: Number(row.day), month: Number(row.month), year: Number(row.year),
                import: Number(row.import),
                returnImport: Number(row.returnImport),
                selling: Number(row.selling),
                returnSelling: Number(row.returnSelling),
                stockAdjustment: Number(row.stockAdjustment),
            });
        }

        const pipeline = this.redisClient.pipeline();
        for (const d of uncachedDates) {
            const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            const dayData = dbMap.get(key) ?? {
                day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear(),
                import: 0, returnImport: 0, selling: 0, returnSelling: 0, stockAdjustment: 0,
            };
            const isToday = d.getTime() === today.getTime();
            const ttl = isToday ? 30 * 60 : 365 * 24 * 60 * 60;
            pipeline.setex(this.getPriceTrendDayCacheKey(d.getFullYear(), d.getMonth() + 1, d.getDate()), ttl, JSON.stringify(dayData));
            result.push(dayData);
        }
        await pipeline.exec();

        return result;
    }

}
