import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, SelectQueryBuilder } from 'typeorm';

// Import enums.
import { SellingInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';

// Import entities.
import { ProductsEntity } from '@src/products/entities/products.entity';
import { SellingInvoiceEntity } from '../entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '../entities/sellingInvoiceProducts.entity';

// Import repositories.
import { ProductsRepository } from '@src/products/repositories/products.repository';

// Import DTOs.
import {
    CreateSellingInvoiceRequestDto,
    GetListOfSellingInvoiceRequestDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudSellingInvoicesRequest.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import search helpers.
import { buildWildcardIlikePattern, WILDCARD_ILIKE_ESCAPE_SQL } from '@libs/common/utils/wildcardIlikeSearch.util';
import { isUuid } from '@libs/common/utils/uuid.util';

// Interface for resolved products from service.
export interface ResolvedSellingProductData {
    productId: string;
    productSku: string;
    productName: string;
    productUnit: string;
    quantity: number;
    sellingPrice: number;
    appliedDiscount: number;
    totalProductPrice: number;
    notes: string | null;
}

@Injectable()
export class SellingInvoiceRepository {

    constructor(
        @InjectRepository(SellingInvoiceEntity) private sellingInvoiceRepository: Repository<SellingInvoiceEntity>,
        @InjectRepository(SellingInvoiceProductsEntity) private sellingInvoiceProductsRepository: Repository<SellingInvoiceProductsEntity>,
        private readonly productsRepository: ProductsRepository,
    ) { }

    // --- Private variables ---
    private static readonly _advisoryLockKeySelling = 582_913_473;

    // --- Private methods ---
    // Join confirmed user only when the FK is set.
    private appendConfirmedUserJoins(
        queryBuilder: SelectQueryBuilder<SellingInvoiceEntity>,
    ): SelectQueryBuilder<SellingInvoiceEntity> {
        return queryBuilder
            .leftJoin('invoice.confirmedByUser', 'confirmedByUser', 'invoice.confirmedBy IS NOT NULL')
            .addSelect(['confirmedByUser.id', 'confirmedByUser.username']);
    }

    // Find one selling invoice with products and confirmed username.
    private async findOneSellingInvoiceWithProductsAndUsernames(
        id: string,
        manager?: EntityManager,
    ): Promise<SellingInvoiceEntity | null> {
        const repo = manager?.getRepository(SellingInvoiceEntity) ?? this.sellingInvoiceRepository;
        const queryBuilder = repo
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.sellingInvoiceProducts', 'products')
            .where('invoice.id = :id', { id });
        this.appendConfirmedUserJoins(queryBuilder);
        return queryBuilder.getOne();
    }

    // Append list invoice username select (confirmed only).
    private appendListSellingInvoiceUsernamesSelect(
        queryBuilder: SelectQueryBuilder<SellingInvoiceEntity>,
    ): SelectQueryBuilder<SellingInvoiceEntity> {
        return this.appendConfirmedUserJoins(queryBuilder);
    }

    // Generate a new selling invoice ID.
    // The format is SYY-XXXXXXX (S26-0000001).
    private async generateInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const calendarYear = now.getFullYear();
        const year = calendarYear.toString().slice(-2);
        const yearPrefix = `S${year}`;

        await manager.query(
            'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
            [SellingInvoiceRepository._advisoryLockKeySelling, calendarYear],
        );

        const latestInvoice = await manager
            .createQueryBuilder(SellingInvoiceEntity, 'invoice')
            .where('invoice.invoiceId LIKE :prefix', { prefix: `${yearPrefix}-%` })
            .orderBy('LENGTH(invoice.invoiceId)', 'DESC')
            .addOrderBy('invoice.invoiceId', 'DESC')
            .getOne();

        let sequence = 1;
        if (latestInvoice?.invoiceId) {
            const lastSequence = parseInt(latestInvoice.invoiceId.split('-')[1], 10);
            sequence = lastSequence + 1;
        }
        return `${yearPrefix}-${sequence.toString().padStart(7, '0')}`;
    }

    // --- Public methods ---
    // Create a selling invoice.
    async createSellingInvoice(
        dto: CreateSellingInvoiceRequestDto,
        user: AccessTokenPayload,
        calculatedTotals: {
            totalProducts: number;
            totalQuantity: number;
            totalSellingPrice: number;
            invoiceDiscount: number;
            resolvedProducts: ResolvedSellingProductData[];
        },
        manager: EntityManager,
    ): Promise<SellingInvoiceEntity> {

        const invoiceId = await this.generateInvoiceId(manager);

        // Create selling invoice - SellingInvoiceEntity.
        const sellingInvoice = this.sellingInvoiceRepository.create({
            invoiceId,
            totalProducts: calculatedTotals.totalProducts,
            totalQuantity: calculatedTotals.totalQuantity,
            invoiceDiscount: calculatedTotals.invoiceDiscount,
            totalSellingPrice: calculatedTotals.totalSellingPrice,
            notes: dto.notes ?? null,
            status: SellingInvoiceStatus.CONFIRMED,
            returnCount: 0,
            taxFocus: dto.taxFocus,
            confirmedBy: user.id,
            confirmedAt: new Date(),
        });
        const savedInvoice = await manager.save(SellingInvoiceEntity, sellingInvoice);

        // Create selling invoice products - SellingInvoiceProductsEntity.
        const products: SellingInvoiceProductsEntity[] = calculatedTotals.resolvedProducts.map((item) =>
            this.sellingInvoiceProductsRepository.create({
                sellingInvoice: savedInvoice,
                productId: item.productId,
                productSku: item.productSku,
                productName: item.productName,
                productUnit: item.productUnit,
                quantity: item.quantity,
                returnQuantity: 0,
                sellingPrice: item.sellingPrice,
                productDiscount: item.appliedDiscount,
                totalSellingPrice: item.totalProductPrice,
                notes: item.notes,
            }),
        );
        await manager.save(SellingInvoiceProductsEntity, products);

        // Subtract inventory per line - ProductsEntity.
        for (const item of calculatedTotals.resolvedProducts) {
            await this.productsRepository.updateInventoryStock(
                { id: item.productId } as ProductsEntity,
                item.quantity,
                StockActionType.SUBTRACT,
                InvoiceType.SELLING,
                savedInvoice.id,
                manager,
            );
        }

        const invoiceWithRelations = await this.findOneSellingInvoiceWithProductsAndUsernames(savedInvoice.id, manager);

        return invoiceWithRelations || savedInvoice;
    }

    // Get selling invoice by id.
    async getSellingInvoiceById(id: string): Promise<SellingInvoiceEntity | null> {
        return this.findOneSellingInvoiceWithProductsAndUsernames(id);
    }

    // Get selling invoices by ids.
    async getSellingInvoicesByIds(ids: string[]): Promise<SellingInvoiceEntity[]> {
        return await this.sellingInvoiceRepository.find({
            where: { id: In(ids) },
        });
    }

    // Get a list of selling invoices.
    async getListOfSellingInvoices(dto: GetListOfSellingInvoiceRequestDto): Promise<{ data: SellingInvoiceEntity[]; total: number }> {
        const { page = 1, limit = 25, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status, taxFocus } = dto;

        const offset = (page - 1) * limit;
        const sortDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

        const qb = this.sellingInvoiceRepository.createQueryBuilder('invoice');

        // --- 1. FILTER ---
        if (status !== undefined) {
            qb.andWhere('invoice.status = :status', { status });
        }

        if (taxFocus !== undefined) {
            qb.andWhere('invoice.taxFocus = :taxFocus', { taxFocus: taxFocus === 'true' });
        }

        // --- 2. SEARCH (requires both search + searchBy per DTO validation) ---
        if (search && searchBy) {
            if (searchBy === 'invoiceId') {
                qb.andWhere(`invoice.invoiceId ILIKE :search${WILDCARD_ILIKE_ESCAPE_SQL}`, {
                    search: buildWildcardIlikePattern(search),
                });
            } else if (searchBy === 'userId') {
                qb.andWhere('invoice.confirmedBy = :search', { search });
            } else if (searchBy === 'productId') {
                const productSearchConditions = [`sip.product_sku ILIKE :productSkuSearch${WILDCARD_ILIKE_ESCAPE_SQL}`];
                const productSearchParams: Record<string, string> = {
                    productSkuSearch: buildWildcardIlikePattern(search),
                };

                if (isUuid(search)) {
                    productSearchConditions.unshift('sip.product_id = :productIdSearch');
                    productSearchParams.productIdSearch = search;
                }

                qb.andWhere(
                    `EXISTS (
                        SELECT 1
                        FROM selling_invoice_products sip
                        WHERE sip.selling_invoice_id = invoice.id
                          AND (${productSearchConditions.join(' OR ')})
                    )`,
                    productSearchParams,
                );
            }
        }

        // --- 3. DATE RANGE ---
        qb.andWhere('invoice.createdAt >= :fromDate', { fromDate });
        qb.andWhere('invoice.createdAt <= :toDate', { toDate });

        // --- 4. SORT & COUNT ---
        const countQb = qb.clone();

        const applySort = (builder: SelectQueryBuilder<SellingInvoiceEntity>) => {
            if (sortBy === 'invoiceId') {
                if (sortDirection === 'ASC') {
                    builder
                        .orderBy('CASE WHEN invoice.invoiceId IS NULL THEN 1 ELSE 0 END', 'ASC')
                        .addOrderBy('invoice.invoiceId', 'ASC', 'NULLS LAST')
                        .addOrderBy('invoice.createdAt', 'ASC', 'NULLS LAST');
                } else {
                    builder
                        .orderBy('CASE WHEN invoice.invoiceId IS NULL THEN 0 ELSE 1 END', 'ASC')
                        .addOrderBy('CASE WHEN invoice.invoiceId IS NULL THEN invoice.createdAt END', 'DESC', 'NULLS LAST')
                        .addOrderBy('CASE WHEN invoice.invoiceId IS NOT NULL THEN invoice.invoiceId END', 'DESC', 'NULLS LAST');
                }
            } else if (sortBy === 'createdAt') {
                builder.orderBy('invoice.createdAt', sortDirection);
            } else {
                const sortMap: Record<string, string> = {
                    totalProducts: 'invoice.totalProducts',
                    totalQuantity: 'invoice.totalQuantity',
                    totalSellingPrice: 'invoice.totalSellingPrice',
                    status: 'invoice.status',
                    returnCount: 'invoice.returnCount',
                    confirmedAt: 'invoice.confirmedAt',
                };
                const sortColumn = (sortBy ? sortMap[sortBy] : null) ?? 'invoice.createdAt';
                builder.orderBy(sortColumn, sortDirection);
            }
            builder.addOrderBy('invoice.id', 'ASC');
        };

        applySort(qb);

        // --- 5. PAGE ROWS + USERNAME (confirmed only); line products not loaded on list ---
        const idSubQuery = qb.clone()
            .select('invoice.id')
            .offset(offset)
            .limit(limit)
            .getQuery();

        const outerQb = this.appendListSellingInvoiceUsernamesSelect(
            this.sellingInvoiceRepository.createQueryBuilder('invoice'),
        )
            .where(`invoice.id IN (${idSubQuery})`)
            .setParameters(qb.getParameters());

        applySort(outerQb);

        const [data, total] = await Promise.all([
            outerQb.getMany(),
            countQb.getCount(),
        ]);

        return { data, total };
    }
}
