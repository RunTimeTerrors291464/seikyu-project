import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets, SelectQueryBuilder } from 'typeorm';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';

// Import entities.
import { ProductsEntity } from '@src/products/entities/products.entity';
import { StockAdjustmentInvoiceEntity } from '../entities/stockAdjustmentInvoices.entity';
import { StockAdjustmentInvoiceProductsEntity } from '../entities/stockAdjustmentInvoiceProducts.entity';

// Import repositories.
import { ProductsRepository } from '@src/products/repositories/products.repository';

// Import DTOs.
import {
    CreateStockAdjustmentInvoiceRequestDto,
    EditStockAdjustmentInvoiceRequestDto,
    GetListOfStockAdjustmentInvoiceRequestDto,
} from '@libs/common/dtos/invoices/stockAdjustmentInvoice/crudStockAdjustmentInvoicesRequest.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

import { buildWildcardIlikePattern, WILDCARD_ILIKE_ESCAPE_SQL } from '@libs/common/utils/wildcardIlikeSearch.util';

@Injectable()
export class StockAdjustmentInvoiceRepository {

    constructor(
        @InjectRepository(StockAdjustmentInvoiceEntity) private stockAdjustmentInvoiceRepository: Repository<StockAdjustmentInvoiceEntity>,
        @InjectRepository(StockAdjustmentInvoiceProductsEntity) private stockAdjustmentInvoiceProductsRepository: Repository<StockAdjustmentInvoiceProductsEntity>,
        private readonly productsRepository: ProductsRepository,
    ) { }

    // --- Private variables ---
    private static readonly _advisoryLockKeyStockAdjustment = 582_913_476;

    // --- Private methods ---
    // Join draft/confirm users only when the FK is set.
    private appendDraftAndConfirmedUserJoins(
        queryBuilder: SelectQueryBuilder<StockAdjustmentInvoiceEntity>,
    ): SelectQueryBuilder<StockAdjustmentInvoiceEntity> {
        return queryBuilder
            .leftJoin('invoice.draftByUser', 'draftByUser', 'invoice.draftBy IS NOT NULL')
            .addSelect(['draftByUser.id', 'draftByUser.username'])
            .leftJoin('invoice.confirmedByUser', 'confirmedByUser', 'invoice.confirmedBy IS NOT NULL')
            .addSelect(['confirmedByUser.id', 'confirmedByUser.username']);
    }

    // Find one stock adjustment invoice with products and usernames.
    private async findOneStockAdjustmentInvoiceWithProductsAndUsernames(
        id: string,
        manager?: EntityManager,
    ): Promise<StockAdjustmentInvoiceEntity | null> {
        const repo = manager?.getRepository(StockAdjustmentInvoiceEntity) ?? this.stockAdjustmentInvoiceRepository;
        const queryBuilder = repo
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.stockAdjustmentInvoiceProducts', 'products')
            .where('invoice.id = :id', { id });
        this.appendDraftAndConfirmedUserJoins(queryBuilder);
        return queryBuilder.getOne();
    }

    // Append list invoice usernames select.
    private appendListStockAdjustmentInvoiceUsernamesSelect(
        queryBuilder: SelectQueryBuilder<StockAdjustmentInvoiceEntity>,
    ): SelectQueryBuilder<StockAdjustmentInvoiceEntity> {
        return this.appendDraftAndConfirmedUserJoins(queryBuilder);
    }

    // Generate a new stock adjustment invoice ID.
    // The format is SAYY-XXXXXXX (SA26-0000001).
    private async generateInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const calendarYear = now.getFullYear();
        const year = calendarYear.toString().slice(-2);
        const yearPrefix = `SA${year}`;

        await manager.query(
            'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
            [StockAdjustmentInvoiceRepository._advisoryLockKeyStockAdjustment, calendarYear],
        );

        const latestInvoice = await manager
            .createQueryBuilder(StockAdjustmentInvoiceEntity, 'invoice')
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

    // Attach product lines to invoices loaded from a list query.
    private async attachProductsToInvoices(invoices: StockAdjustmentInvoiceEntity[]): Promise<void> {
        if (invoices.length === 0) return;
        const ids = invoices.map((i) => i.id);
        const lines = await this.stockAdjustmentInvoiceProductsRepository.find({
            where: { stockAdjustmentInvoice: { id: In(ids) } },
            order: { id: 'ASC' },
        });
        const byInvoiceId = new Map<string, StockAdjustmentInvoiceProductsEntity[]>();
        for (const line of lines) {
            const key = line.stockAdjustmentInvoiceId;
            const list = byInvoiceId.get(key) ?? [];
            list.push(line);
            byInvoiceId.set(key, list);
        }
        for (const inv of invoices) {
            inv.stockAdjustmentInvoiceProducts = byInvoiceId.get(inv.id) ?? [];
        }
    }

    // --- Public methods ---
    // Create a new draft stock adjustment invoice.
    async createDraftStockAdjustmentInvoice(
        dto: CreateStockAdjustmentInvoiceRequestDto,
        calculatedTotals: { totalProducts: number; totalQuantity: number },
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<StockAdjustmentInvoiceEntity> {

        // Create stock adjustment invoice - StockAdjustmentInvoiceEntity.
        const invoice: StockAdjustmentInvoiceEntity = this.stockAdjustmentInvoiceRepository.create({
            totalProducts: calculatedTotals.totalProducts,
            totalQuantity: calculatedTotals.totalQuantity,
            notes: dto.notes ?? null,
            status: StockAdjustmentInvoiceStatus.DRAFT,
            draftBy: user.id,
            draftAt: new Date(),
        });
        const savedInvoice = await manager.save(StockAdjustmentInvoiceEntity, invoice);

        // Create stock adjustment invoice products - StockAdjustmentInvoiceProductsEntity.
        const products: StockAdjustmentInvoiceProductsEntity[] = dto.products.map((product) =>
            this.stockAdjustmentInvoiceProductsRepository.create({
                stockAdjustmentInvoice: savedInvoice,
                productId: product.productId,
                productSku: product.productSku,
                productName: product.productName,
                productUnit: product.productUnit,
                action: product.action,
                quantity: product.quantity,
                reasonCategory: product.reasonCategory,
                reasonNotes: product.reasonNotes ?? null,
                notes: product.notes ?? null,
            }),
        );

        await manager.save(StockAdjustmentInvoiceProductsEntity, products);

        const invoiceWithRelations = await this.findOneStockAdjustmentInvoiceWithProductsAndUsernames(savedInvoice.id, manager);
        return invoiceWithRelations || savedInvoice;
    }

    // Edit a draft stock adjustment invoice.
    async editDraftStockAdjustmentInvoice(
        stockAdjustmentInvoice: StockAdjustmentInvoiceEntity,
        dto: EditStockAdjustmentInvoiceRequestDto,
        calculatedTotals: { totalProducts: number; totalQuantity: number },
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<StockAdjustmentInvoiceEntity> {

        // Update stock adjustment invoice - StockAdjustmentInvoiceEntity.
        stockAdjustmentInvoice.totalProducts = calculatedTotals.totalProducts;
        stockAdjustmentInvoice.totalQuantity = calculatedTotals.totalQuantity;
        stockAdjustmentInvoice.notes = dto.notes ?? null;
        stockAdjustmentInvoice.draftBy = user.id;
        stockAdjustmentInvoice.draftAt = new Date();

        const savedInvoice = await manager.save(StockAdjustmentInvoiceEntity, stockAdjustmentInvoice);

        // Replace stock adjustment invoice products - StockAdjustmentInvoiceProductsEntity.
        if (dto.products.length > 0) {
            await manager.delete(StockAdjustmentInvoiceProductsEntity, { stockAdjustmentInvoice: { id: savedInvoice.id } });

            const products: StockAdjustmentInvoiceProductsEntity[] = dto.products.map((product) =>
                this.stockAdjustmentInvoiceProductsRepository.create({
                    stockAdjustmentInvoice: savedInvoice,
                    productId: product.productId,
                    productSku: product.productSku,
                    productName: product.productName,
                    productUnit: product.productUnit,
                    action: product.action,
                    quantity: product.quantity,
                    reasonCategory: product.reasonCategory,
                    reasonNotes: product.reasonNotes ?? null,
                    notes: product.notes ?? null,
                }),
            );

            await manager.save(StockAdjustmentInvoiceProductsEntity, products);
        }

        const invoiceWithRelations = await this.findOneStockAdjustmentInvoiceWithProductsAndUsernames(savedInvoice.id, manager);
        return invoiceWithRelations || savedInvoice;
    }

    // Delete draft stock adjustment invoices.
    async deleteDraftStockAdjustmentInvoice(ids: string[], manager: EntityManager): Promise<boolean> {
        if (ids.length === 0) return true;

        await manager.delete(StockAdjustmentInvoiceProductsEntity, { stockAdjustmentInvoice: { id: In(ids) } });
        await manager.delete(StockAdjustmentInvoiceEntity, { id: In(ids) });

        return true;
    }

    // Confirm a draft stock adjustment invoice (persist confirmed state and apply inventory per line).
    async confirmStockAdjustmentInvoice(
        stockAdjustmentInvoice: StockAdjustmentInvoiceEntity,
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<StockAdjustmentInvoiceEntity | null> {

        // Get the stock adjustment invoice - StockAdjustmentInvoiceEntity.
        const lockedInvoice: StockAdjustmentInvoiceEntity = await manager
            .createQueryBuilder(StockAdjustmentInvoiceEntity, 'invoice')
            .where('invoice.id = :id', { id: stockAdjustmentInvoice.id })
            .setLock('pessimistic_write')
            .getOneOrFail();

        // Check if the stock adjustment invoice is in draft status.
        if (lockedInvoice.status !== StockAdjustmentInvoiceStatus.DRAFT) return null;

        // Load lines - StockAdjustmentInvoiceProductsEntity.
        let lines = lockedInvoice.stockAdjustmentInvoiceProducts;
        if (!lines?.length) {
            lines = await manager.find(StockAdjustmentInvoiceProductsEntity, {
                where: { stockAdjustmentInvoice: { id: lockedInvoice.id } },
            });
        }

        if (lines.length === 0) return null;

        // Generate a new invoice ID.
        const invoiceId = await this.generateInvoiceId(manager);

        // Confirm the stock adjustment invoice - StockAdjustmentInvoiceEntity.
        lockedInvoice.invoiceId = invoiceId;
        lockedInvoice.status = StockAdjustmentInvoiceStatus.CONFIRMED;
        lockedInvoice.confirmedBy = user.id;
        lockedInvoice.confirmedAt = new Date();
        await manager.save(StockAdjustmentInvoiceEntity, lockedInvoice);

        // Apply inventory for each line - ProductsEntity.
        for (const line of lines) {
            await this.productsRepository.updateInventoryStock(
                { id: line.productId } as ProductsEntity,
                line.quantity,
                line.action,
                InvoiceType.STOCK_ADJUSTMENT,
                lockedInvoice.id,
                manager,
            );
        }

        const invoiceWithRelations = await this.findOneStockAdjustmentInvoiceWithProductsAndUsernames(lockedInvoice.id, manager);
        return invoiceWithRelations || lockedInvoice;
    }

    // Get stock adjustment invoice by id.
    async getStockAdjustmentInvoiceById(id: string): Promise<StockAdjustmentInvoiceEntity | null> {
        return this.findOneStockAdjustmentInvoiceWithProductsAndUsernames(id);
    }

    // Get stock adjustment invoices by ids.
    async getStockAdjustmentInvoicesByIds(ids: string[]): Promise<StockAdjustmentInvoiceEntity[]> {
        if (ids.length === 0) return [];
        return this.stockAdjustmentInvoiceRepository.find({
            where: { id: In(ids) },
        });
    }

    // Get a list of stock adjustment invoices.
    async getListOfStockAdjustmentInvoices(dto: GetListOfStockAdjustmentInvoiceRequestDto): Promise<{ data: StockAdjustmentInvoiceEntity[]; total: number }> {
        const { page = 1, limit = 25, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const offset = (page - 1) * limit;
        const sortDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

        const qb = this.stockAdjustmentInvoiceRepository.createQueryBuilder('invoice');

        // --- 1. FILTER ---
        if (status !== undefined) {
            qb.andWhere('invoice.status = :status', { status });
        }

        // --- 2. SEARCH (both search + searchBy when used) ---
        if (search && searchBy) {
            if (searchBy === 'invoiceId') {
                qb.andWhere(`invoice.invoiceId ILIKE :search${WILDCARD_ILIKE_ESCAPE_SQL}`, {
                    search: buildWildcardIlikePattern(search),
                });
            } else if (searchBy === 'userId') {
                qb.andWhere(new Brackets((b) => {
                    b.where('invoice.draftBy = :search', { search })
                        .orWhere('invoice.confirmedBy = :search', { search });
                }));
            } else if (searchBy === 'productId') {
                qb.andWhere(
                    `EXISTS (SELECT 1 FROM stock_adjustment_invoice_products saip WHERE saip.stock_adjustment_invoice_id = invoice.id AND saip.product_id = :search)`,
                    { search },
                );
            }
        }

        // --- 3. DATE RANGE (createdAt, matches list DTO) ---
        qb.andWhere('invoice.createdAt >= :fromDate', { fromDate });
        qb.andWhere('invoice.createdAt <= :toDate', { toDate });

        // --- 4. SORT & COUNT ---
        const countQb = qb.clone();

        const applySort = (builder: SelectQueryBuilder<StockAdjustmentInvoiceEntity>) => {
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
                    status: 'invoice.status',
                    draftAt: 'invoice.draftAt',
                    confirmedAt: 'invoice.confirmedAt',
                };
                const sortColumn = (sortBy ? sortMap[sortBy] : null) ?? 'invoice.createdAt';
                builder.orderBy(sortColumn, sortDirection);
            }
            builder.addOrderBy('invoice.id', 'ASC');
        };

        applySort(qb);

        const idSubQuery = qb.clone()
            .select('invoice.id')
            .offset(offset)
            .limit(limit)
            .getQuery();

        const outerQb = this.appendListStockAdjustmentInvoiceUsernamesSelect(
            this.stockAdjustmentInvoiceRepository.createQueryBuilder('invoice'),
        )
            .where(`invoice.id IN (${idSubQuery})`)
            .setParameters(qb.getParameters());

        applySort(outerQb);

        const [data, total] = await Promise.all([
            outerQb.getMany(),
            countQb.getCount(),
        ]);

        await this.attachProductsToInvoices(data);

        return { data, total };
    }
}
