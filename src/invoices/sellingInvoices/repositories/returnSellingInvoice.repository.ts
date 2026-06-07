import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets, SelectQueryBuilder } from 'typeorm';

// Import enums.
import { ReturnSellingInvoiceStatus, SellingInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { ReturnReason } from '@libs/common/enums/returnReasons.enum';

// Import entities.
import { ProductsEntity } from '@src/products/entities/products.entity';
import { ReturnSellingInvoiceEntity } from '../entities/returnSellingInvoices.entity';
import { ReturnSellingInvoiceProductsEntity } from '../entities/returnSellingInvoiceProducts.entity';
import { SellingInvoiceEntity } from '../entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '../entities/sellingInvoiceProducts.entity';

// Import repositories.
import { ProductsRepository } from '@src/products/repositories/products.repository';

// Import DTOs.
import { GetListOfReturnSellingInvoiceRequestDto } from '@libs/common/dtos/invoices/sellingInvoices/crudReturnSellingInvoicesRequest.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

import { buildWildcardIlikePattern, WILDCARD_ILIKE_ESCAPE_SQL } from '@libs/common/utils/wildcardIlikeSearch.util';
import { isUuid } from '@libs/common/utils/uuid.util';

// Interface definition for resolved return product data.
export interface ResolvedReturnSellingProductData {
    sellingInvoiceProduct: SellingInvoiceProductsEntity;
    returnQuantity: number;
    reasonCategory: ReturnReason;
    reasonNotes: string | null;
}

@Injectable()
export class ReturnSellingInvoiceRepository {

    constructor(
        @InjectRepository(ReturnSellingInvoiceEntity) private returnSellingInvoiceRepository: Repository<ReturnSellingInvoiceEntity>,
        @InjectRepository(ReturnSellingInvoiceProductsEntity) private returnSellingInvoiceProductsRepository: Repository<ReturnSellingInvoiceProductsEntity>,
        private readonly productsRepository: ProductsRepository,
    ) { }

    // --- Private variables ---
    private static readonly _advisoryLockKeyReturnSelling = 582_913_474;

    // --- Private methods ---
    // Join draft/confirm users only when the FK is set.
    private appendDraftAndConfirmedUserJoins(
        queryBuilder: SelectQueryBuilder<ReturnSellingInvoiceEntity>,
    ): SelectQueryBuilder<ReturnSellingInvoiceEntity> {
        return queryBuilder
            .leftJoin('invoice.draftByUser', 'draftByUser', 'invoice.draftBy IS NOT NULL')
            .addSelect(['draftByUser.id', 'draftByUser.username'])
            .leftJoin('invoice.confirmedByUser', 'confirmedByUser', 'invoice.confirmedBy IS NOT NULL')
            .addSelect(['confirmedByUser.id', 'confirmedByUser.username']);
    }

    // Find one return selling invoice with products, parent selling invoice, and usernames.
    private async findOneReturnSellingInvoiceWithProductsAndUsernames(
        id: string,
        manager?: EntityManager,
    ): Promise<ReturnSellingInvoiceEntity | null> {
        const repo = manager?.getRepository(ReturnSellingInvoiceEntity) ?? this.returnSellingInvoiceRepository;
        const queryBuilder = repo
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.returnSellingInvoiceProducts', 'products')
            .leftJoinAndSelect('products.sellingInvoiceProduct', 'sellingInvoiceProduct')
            .leftJoinAndSelect('invoice.sellingInvoice', 'sellingInvoice')
            .where('invoice.id = :id', { id });
        this.appendDraftAndConfirmedUserJoins(queryBuilder);
        return queryBuilder.getOne();
    }

    // Append list invoice usernames select.
    private appendListReturnSellingInvoiceUsernamesSelect(
        queryBuilder: SelectQueryBuilder<ReturnSellingInvoiceEntity>,
    ): SelectQueryBuilder<ReturnSellingInvoiceEntity> {
        return this.appendDraftAndConfirmedUserJoins(queryBuilder);
    }

    // Generate a new return selling invoice ID.
    // The format is RSYY-XXXXXXX (RS26-0000001).
    private async generateReturnInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const calendarYear = now.getFullYear();
        const year = calendarYear.toString().slice(-2);
        const yearPrefix = `RS${year}`;

        await manager.query(
            'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
            [ReturnSellingInvoiceRepository._advisoryLockKeyReturnSelling, calendarYear],
        );

        const latestInvoice = await manager
            .createQueryBuilder(ReturnSellingInvoiceEntity, 'invoice')
            .where('invoice.returnInvoiceId LIKE :prefix', { prefix: `${yearPrefix}-%` })
            .orderBy('LENGTH(invoice.returnInvoiceId)', 'DESC')
            .addOrderBy('invoice.returnInvoiceId', 'DESC')
            .getOne();

        let sequence = 1;
        if (latestInvoice?.returnInvoiceId) {
            const lastSequence = parseInt(latestInvoice.returnInvoiceId.split('-')[1], 10);
            sequence = lastSequence + 1;
        }
        return `${yearPrefix}-${sequence.toString().padStart(7, '0')}`;
    }

    // --- Public methods ---
    // Create a new draft return selling invoice.
    async createDraftReturnSellingInvoice(
        sellingInvoice: SellingInvoiceEntity,
        resolvedProducts: ResolvedReturnSellingProductData[],
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalReturnPrice: number },
        notes: string | null,
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<ReturnSellingInvoiceEntity> {

        // Create return selling invoice - ReturnSellingInvoiceEntity.
        const returnSellingInvoice: ReturnSellingInvoiceEntity = this.returnSellingInvoiceRepository.create({
            sellingInvoice,
            totalProducts: calculatedTotals.totalProducts,
            totalQuantity: calculatedTotals.totalQuantity,
            totalReturnPrice: calculatedTotals.totalReturnPrice,
            notes,
            status: ReturnSellingInvoiceStatus.DRAFT,
            draftBy: user.id,
            draftAt: new Date(),
        });
        const savedInvoice = await manager.save(ReturnSellingInvoiceEntity, returnSellingInvoice);

        // Count draft return invoices on the original selling invoice immediately.
        await manager.increment(SellingInvoiceEntity, { id: sellingInvoice.id }, 'returnCount', 1);

        // Create return selling invoice products - ReturnSellingInvoiceProductsEntity.
        const products: ReturnSellingInvoiceProductsEntity[] = resolvedProducts.map((item) =>
            this.returnSellingInvoiceProductsRepository.create({
                returnSellingInvoice: savedInvoice,
                sellingInvoiceProduct: item.sellingInvoiceProduct,
                productId: item.sellingInvoiceProduct.productId,
                productSku: item.sellingInvoiceProduct.productSku,
                productName: item.sellingInvoiceProduct.productName,
                productUnit: item.sellingInvoiceProduct.productUnit,
                returnQuantity: item.returnQuantity,
                sellingPrice: item.sellingInvoiceProduct.sellingPrice,
                totalReturnPrice: item.returnQuantity * Number(item.sellingInvoiceProduct.sellingPrice),
                reasonCategory: item.reasonCategory,
                reasonNotes: item.reasonNotes,
            }),
        );

        await manager.save(ReturnSellingInvoiceProductsEntity, products);

        const invoiceWithRelations = await this.findOneReturnSellingInvoiceWithProductsAndUsernames(savedInvoice.id, manager);
        return invoiceWithRelations || savedInvoice;
    }

    // Edit a draft return selling invoice.
    async editDraftReturnSellingInvoice(
        returnSellingInvoice: ReturnSellingInvoiceEntity,
        resolvedProducts: ResolvedReturnSellingProductData[],
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalReturnPrice: number },
        notes: string | null,
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<ReturnSellingInvoiceEntity> {

        // Update return selling invoice - ReturnSellingInvoiceEntity.
        returnSellingInvoice.totalProducts = calculatedTotals.totalProducts;
        returnSellingInvoice.totalQuantity = calculatedTotals.totalQuantity;
        returnSellingInvoice.totalReturnPrice = calculatedTotals.totalReturnPrice;
        returnSellingInvoice.notes = notes;
        returnSellingInvoice.draftBy = user.id;
        returnSellingInvoice.draftAt = new Date();

        const savedInvoice = await manager.save(ReturnSellingInvoiceEntity, returnSellingInvoice);

        // Update return selling invoice products - ReturnSellingInvoiceProductsEntity.
        if (resolvedProducts.length > 0) {
            await manager.delete(ReturnSellingInvoiceProductsEntity, { returnSellingInvoice: { id: savedInvoice.id } });

            const products: ReturnSellingInvoiceProductsEntity[] = resolvedProducts.map((item) =>
                this.returnSellingInvoiceProductsRepository.create({
                    returnSellingInvoice: savedInvoice,
                    sellingInvoiceProduct: item.sellingInvoiceProduct,
                    productId: item.sellingInvoiceProduct.productId,
                    productSku: item.sellingInvoiceProduct.productSku,
                    productName: item.sellingInvoiceProduct.productName,
                    productUnit: item.sellingInvoiceProduct.productUnit,
                    returnQuantity: item.returnQuantity,
                    sellingPrice: item.sellingInvoiceProduct.sellingPrice,
                    totalReturnPrice: item.returnQuantity * Number(item.sellingInvoiceProduct.sellingPrice),
                    reasonCategory: item.reasonCategory,
                    reasonNotes: item.reasonNotes,
                }),
            );

            await manager.save(ReturnSellingInvoiceProductsEntity, products);
        }

        const invoiceWithRelations = await this.findOneReturnSellingInvoiceWithProductsAndUsernames(savedInvoice.id, manager);
        return invoiceWithRelations || savedInvoice;
    }

    // Delete draft return selling invoices.
    async deleteDraftReturnSellingInvoice(ids: string[], manager: EntityManager): Promise<boolean> {
        if (ids.length === 0) return true;

        const draftInvoices = await manager
            .createQueryBuilder(ReturnSellingInvoiceEntity, 'invoice')
            .where('invoice.id IN (:...ids)', { ids })
            .andWhere('invoice.status = :status', { status: ReturnSellingInvoiceStatus.DRAFT })
            .setLock('pessimistic_write')
            .getMany();

        if (draftInvoices.length === 0) return true;

        const decrementBySellingInvoiceId = new Map<string, number>();
        const draftInvoiceIds = draftInvoices.map((invoice) => invoice.id);
        for (const invoice of draftInvoices) {
            decrementBySellingInvoiceId.set(
                invoice.sellingInvoiceId,
                (decrementBySellingInvoiceId.get(invoice.sellingInvoiceId) ?? 0) + 1,
            );
        }

        await manager.delete(ReturnSellingInvoiceProductsEntity, { returnSellingInvoice: { id: In(draftInvoiceIds) } });
        await manager.delete(ReturnSellingInvoiceEntity, { id: In(draftInvoiceIds) });

        for (const [sellingInvoiceId, decrementBy] of decrementBySellingInvoiceId) {
            await manager
                .createQueryBuilder()
                .update(SellingInvoiceEntity)
                .set({ returnCount: () => `GREATEST(return_count - ${decrementBy}, 0)` })
                .where('id = :id', { id: sellingInvoiceId })
                .execute();
        }

        return true;
    }

    // Confirm a draft return selling invoice.
    async confirmReturnSellingInvoice(
        returnSellingInvoice: ReturnSellingInvoiceEntity,
        originalSellingInvoice: SellingInvoiceEntity,
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<ReturnSellingInvoiceEntity | null> {

        // Get the return selling invoice - ReturnSellingInvoiceEntity.
        const lockedReturn: ReturnSellingInvoiceEntity = await manager
            .createQueryBuilder(ReturnSellingInvoiceEntity, 'invoice')
            .where('invoice.id = :id', { id: returnSellingInvoice.id })
            .setLock('pessimistic_write')
            .getOneOrFail();

        // Check if the return selling invoice is in draft status.
        if (lockedReturn.status !== ReturnSellingInvoiceStatus.DRAFT) return null;

        // Get the original selling invoice - SellingInvoiceEntity.
        const lockedSelling: SellingInvoiceEntity = await manager
            .createQueryBuilder(SellingInvoiceEntity, 'inv')
            .where('inv.id = :id', { id: originalSellingInvoice.id })
            .setLock('pessimistic_write')
            .getOneOrFail();

        // Ensure the return belongs to this selling invoice.
        if (lockedReturn.sellingInvoiceId !== lockedSelling.id) return null;

        // Load return lines with selling invoice product FK - ReturnSellingInvoiceProductsEntity.
        let lines = lockedReturn.returnSellingInvoiceProducts;
        const mustLoadLines = !lines?.length || !lines[0].sellingInvoiceProduct;
        if (mustLoadLines) {
            lines = await manager.find(ReturnSellingInvoiceProductsEntity, {
                where: { returnSellingInvoice: { id: lockedReturn.id } },
                relations: ['sellingInvoiceProduct'],
            });
        }

        if (lines.length === 0) return null;

        // Load all product lines on the original selling invoice - SellingInvoiceProductsEntity.
        const originalProducts: SellingInvoiceProductsEntity[] = await manager.find(SellingInvoiceProductsEntity, {
            where: { sellingInvoiceId: lockedSelling.id },
        });

        // Map return quantity per selling invoice product line id (not productId); sum if duplicated.
        const returnQtyBySellingLineId = new Map<string, number>();
        for (const rp of lines) {
            const lineId = rp.sellingInvoiceProduct?.id;
            if (!lineId) return null;
            const prev = returnQtyBySellingLineId.get(lineId) ?? 0;
            returnQtyBySellingLineId.set(lineId, prev + rp.returnQuantity);
        }

        // Apply returnQuantity increments and compute full-return in one pass - SellingInvoiceProductsEntity.
        const productsToUpdate: SellingInvoiceProductsEntity[] = [];
        let isFullyReturned = true;
        for (const originalProduct of originalProducts) {
            const returnQty = returnQtyBySellingLineId.get(originalProduct.id) ?? 0;
            if (returnQty > 0) {
                if (originalProduct.returnQuantity + returnQty > originalProduct.quantity) return null;
                originalProduct.returnQuantity += returnQty;
                productsToUpdate.push(originalProduct);
            }
            if (originalProduct.returnQuantity < originalProduct.quantity) {
                isFullyReturned = false;
            }
        }

        // Generate a new return invoice ID.
        const returnInvoiceId = await this.generateReturnInvoiceId(manager);

        // Confirm the return selling invoice - ReturnSellingInvoiceEntity.
        lockedReturn.returnInvoiceId = returnInvoiceId;
        lockedReturn.status = ReturnSellingInvoiceStatus.CONFIRMED;
        lockedReturn.confirmedBy = user.id;
        lockedReturn.confirmedAt = new Date();
        await manager.save(ReturnSellingInvoiceEntity, lockedReturn);

        // Persist updated returnQuantity on selling lines - SellingInvoiceProductsEntity.
        if (productsToUpdate.length > 0) {
            await manager.save(SellingInvoiceProductsEntity, productsToUpdate);
        }

        // Update selling invoice status - SellingInvoiceEntity.
        lockedSelling.status = isFullyReturned ? SellingInvoiceStatus.RETURNED : SellingInvoiceStatus.PARTIALLY_RETURNED;
        await manager.save(SellingInvoiceEntity, lockedSelling);

        // Add inventory for each returned line - ProductsEntity.
        for (const rp of lines) {
            await this.productsRepository.updateInventoryStock(
                { id: rp.productId } as ProductsEntity,
                rp.returnQuantity,
                StockActionType.ADD,
                InvoiceType.RETURN_SELLING,
                lockedReturn.id,
                manager,
                Number(rp.totalReturnPrice),
            );
        }

        const invoiceWithRelations = await this.findOneReturnSellingInvoiceWithProductsAndUsernames(lockedReturn.id, manager);
        return invoiceWithRelations || lockedReturn;
    }

    // Get return selling invoice by id.
    async getReturnSellingInvoiceById(id: string): Promise<ReturnSellingInvoiceEntity | null> {
        return this.findOneReturnSellingInvoiceWithProductsAndUsernames(id);
    }

    // Get a list of return selling invoices.
    async getListOfReturnSellingInvoices(dto: GetListOfReturnSellingInvoiceRequestDto): Promise<{ data: ReturnSellingInvoiceEntity[]; total: number }> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const offset = (page - 1) * limit;
        const sortDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

        const qb = this.returnSellingInvoiceRepository.createQueryBuilder('invoice');
        qb.leftJoin('invoice.sellingInvoice', 'sellInv');

        // --- 1. FILTER ---
        if (status !== undefined) {
            qb.andWhere('invoice.status = :status', { status });
        }

        // --- 2. SEARCH (both search + searchBy when used) ---
        if (search && searchBy) {
            if (searchBy === 'returnInvoiceId') {
                qb.andWhere(`invoice.returnInvoiceId ILIKE :search${WILDCARD_ILIKE_ESCAPE_SQL}`, {
                    search: buildWildcardIlikePattern(search),
                });
            } else if (searchBy === 'sellingInvoiceId') {
                qb.andWhere(`sellInv.invoiceId ILIKE :search${WILDCARD_ILIKE_ESCAPE_SQL}`, {
                    search: buildWildcardIlikePattern(search),
                });
            } else if (searchBy === 'userId') {
                qb.andWhere(new Brackets((b) => {
                    b.where('invoice.draftBy = :search', { search })
                        .orWhere('invoice.confirmedBy = :search', { search });
                }));
            } else if (searchBy === 'productId') {
                const productSearchConditions = [`rsip.product_sku ILIKE :productSkuSearch${WILDCARD_ILIKE_ESCAPE_SQL}`];
                const productSearchParams: Record<string, string> = {
                    productSkuSearch: buildWildcardIlikePattern(search),
                };

                if (isUuid(search)) {
                    productSearchConditions.unshift('rsip.product_id = :productIdSearch');
                    productSearchParams.productIdSearch = search;
                }

                qb.andWhere(
                    `EXISTS (
                        SELECT 1
                        FROM return_selling_invoice_products rsip
                        WHERE rsip.return_selling_invoice_id = invoice.id
                          AND (${productSearchConditions.join(' OR ')})
                    )`,
                    productSearchParams,
                );
            }
        }

        // --- 3. DATE RANGE (createdAt, matches list DTO) ---
        qb.andWhere('invoice.createdAt >= :fromDate', { fromDate });
        qb.andWhere('invoice.createdAt <= :toDate', { toDate });

        // --- 4. SORT & COUNT ---
        const countQb = qb.clone();

        const applySort = (builder: SelectQueryBuilder<ReturnSellingInvoiceEntity>) => {
            if (sortBy === 'returnInvoiceId') {
                if (sortDirection === 'ASC') {
                    builder
                        .orderBy('CASE WHEN invoice.returnInvoiceId IS NULL THEN 1 ELSE 0 END', 'ASC')
                        .addOrderBy('invoice.returnInvoiceId', 'ASC', 'NULLS LAST')
                        .addOrderBy('invoice.createdAt', 'ASC', 'NULLS LAST');
                } else {
                    builder
                        .orderBy('CASE WHEN invoice.returnInvoiceId IS NULL THEN 0 ELSE 1 END', 'ASC')
                        .addOrderBy('CASE WHEN invoice.returnInvoiceId IS NULL THEN invoice.createdAt END', 'DESC', 'NULLS LAST')
                        .addOrderBy('CASE WHEN invoice.returnInvoiceId IS NOT NULL THEN invoice.returnInvoiceId END', 'DESC', 'NULLS LAST');
                }
            } else if (sortBy === 'sellingInvoiceId') {
                if (sortDirection === 'ASC') {
                    builder
                        .orderBy('CASE WHEN sellInv.invoiceId IS NULL THEN 1 ELSE 0 END', 'ASC')
                        .addOrderBy('sellInv.invoiceId', 'ASC', 'NULLS LAST')
                        .addOrderBy('invoice.createdAt', 'ASC', 'NULLS LAST');
                } else {
                    builder
                        .orderBy('CASE WHEN sellInv.invoiceId IS NULL THEN 0 ELSE 1 END', 'ASC')
                        .addOrderBy('CASE WHEN sellInv.invoiceId IS NULL THEN invoice.createdAt END', 'DESC', 'NULLS LAST')
                        .addOrderBy('CASE WHEN sellInv.invoiceId IS NOT NULL THEN sellInv.invoiceId END', 'DESC', 'NULLS LAST');
                }
            } else if (sortBy === 'createdAt') {
                builder.orderBy('invoice.createdAt', sortDirection);
            } else {
                const sortMap: Record<string, string> = {
                    totalProducts: 'invoice.totalProducts',
                    totalQuantity: 'invoice.totalQuantity',
                    totalReturnPrice: 'invoice.totalReturnPrice',
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

        const outerQb = this.appendListReturnSellingInvoiceUsernamesSelect(
            this.returnSellingInvoiceRepository.createQueryBuilder('invoice'),
        )
            .leftJoin('invoice.sellingInvoice', 'sellInv')
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
