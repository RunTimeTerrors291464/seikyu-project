import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets, SelectQueryBuilder } from 'typeorm';

// Import enums.
import { ReturnImportInvoiceStatus, ImportInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { ReturnReason } from '@libs/common/enums/returnReasons.enum';

// Import entities.
import { ProductsEntity } from '@src/products/entities/products.entity';
import { ReturnImportInvoiceEntity } from '../entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from '../entities/returnImportInvoiceProducts.entity';
import { ImportInvoiceEntity } from '../entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from '../entities/importInvocieProducts.entity';

// Import repositories.
import { ProductsRepository } from '@src/products/repositories/products.repository';

// Import DTOs.
import { GetListOfReturnImportInvoiceRequestDto } from '@libs/common/dtos/invoices/importInvoices/crudReturnImportInvoicesRequest.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

import { buildWildcardIlikePattern, WILDCARD_ILIKE_ESCAPE_SQL } from '@libs/common/utils/wildcardIlikeSearch.util';
import { isUuid } from '@libs/common/utils/uuid.util';


// Interface definition for resolved return product data.
export interface ResolvedReturnProductData {
    importInvoiceProduct: ImportInvoiceProductsEntity;
    returnQuantity: number;
    reasonCategory: ReturnReason;
    reasonNotes: string | null;
}

@Injectable()
export class ReturnImportInvoiceRepository {

    constructor(
        @InjectRepository(ReturnImportInvoiceEntity) private returnImportInvoiceRepository: Repository<ReturnImportInvoiceEntity>,
        @InjectRepository(ReturnImportInvoiceProductsEntity) private returnImportInvoiceProductsRepository: Repository<ReturnImportInvoiceProductsEntity>,
        private readonly productsRepository: ProductsRepository,
    ) { }

    // --- Private variables ---
    private static readonly _advisoryLockKeyReturnImport = 582_913_472;

    // --- Private methods ---
    // Join draft/confirm users only when the FK is set.
    private appendDraftAndConfirmedUserJoins(
        queryBuilder: SelectQueryBuilder<ReturnImportInvoiceEntity>,
    ): SelectQueryBuilder<ReturnImportInvoiceEntity> {
        return queryBuilder
            .leftJoin('invoice.draftByUser', 'draftByUser', 'invoice.draftBy IS NOT NULL')
            .addSelect(['draftByUser.id', 'draftByUser.username'])
            .leftJoin('invoice.confirmedByUser', 'confirmedByUser', 'invoice.confirmedBy IS NOT NULL')
            .addSelect(['confirmedByUser.id', 'confirmedByUser.username']);
    }

    // Find one invoice with products and usernames.
    private async findOneReturnImportInvoiceWithProductsAndUsernames(
        id: string,
        manager?: EntityManager,
    ): Promise<ReturnImportInvoiceEntity | null> {
        const repo = manager?.getRepository(ReturnImportInvoiceEntity) ?? this.returnImportInvoiceRepository;
        const queryBuilder = repo
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.returnImportInvoiceProducts', 'products')
            .leftJoinAndSelect('products.importInvoiceProduct', 'importInvoiceProduct')
            .leftJoinAndSelect('invoice.importInvoice', 'importInvoice')
            .where('invoice.id = :id', { id });
        this.appendDraftAndConfirmedUserJoins(queryBuilder);
        return queryBuilder.getOne();
    }

    // Append list invoice usernames select.
    private appendListReturnInvoiceUsernamesSelect(queryBuilder: SelectQueryBuilder<ReturnImportInvoiceEntity>): SelectQueryBuilder<ReturnImportInvoiceEntity> {
        return this.appendDraftAndConfirmedUserJoins(queryBuilder);
    }

    // Generate a new return import invoice ID.
    // The format is RIYY-XXXXXXX (RI26-0000001).
    private async generateReturnInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const calendarYear = now.getFullYear();
        const year = calendarYear.toString().slice(-2);
        const yearPrefix = `RI${year}`;

        await manager.query(
            'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
            [ReturnImportInvoiceRepository._advisoryLockKeyReturnImport, calendarYear],
        );

        const latestInvoice = await manager
            .createQueryBuilder(ReturnImportInvoiceEntity, 'invoice')
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
    // Create a new draft return import invoice.
    async createDraftReturnImportInvoice(
        importInvoice: ImportInvoiceEntity,
        resolvedProducts: ResolvedReturnProductData[],
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalReturnPrice: number },
        notes: string | null,
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<ReturnImportInvoiceEntity> {

        // Create return import invoice.
        const returnImportInvoice: ReturnImportInvoiceEntity = this.returnImportInvoiceRepository.create({
            importInvoice,
            totalProducts: calculatedTotals.totalProducts,
            totalQuantity: calculatedTotals.totalQuantity,
            totalReturnPrice: calculatedTotals.totalReturnPrice,
            notes,
            status: ReturnImportInvoiceStatus.DRAFT,
            draftBy: user.id,
            draftAt: new Date(),
        });
        const savedInvoice = await manager.save(ReturnImportInvoiceEntity, returnImportInvoice);

        // Count draft return invoices on the original import invoice immediately.
        await manager.increment(ImportInvoiceEntity, { id: importInvoice.id }, 'returnCount', 1);

        // Create return import invoice products - ReturnImportInvoiceProductsEntity.
        const products: ReturnImportInvoiceProductsEntity[] = resolvedProducts.map((item) =>
            this.returnImportInvoiceProductsRepository.create({
                returnImportInvoice: savedInvoice,
                importInvoiceProduct: item.importInvoiceProduct,
                productId: item.importInvoiceProduct.productId,
                productSku: item.importInvoiceProduct.productSku,
                productName: item.importInvoiceProduct.productName,
                productUnit: item.importInvoiceProduct.productUnit,
                returnQuantity: item.returnQuantity,
                importPrice: item.importInvoiceProduct.importPrice,
                totalReturnPrice: item.returnQuantity * Number(item.importInvoiceProduct.importPrice),
                reasonCategory: item.reasonCategory,
                reasonNotes: item.reasonNotes,
            }),
        );

        await manager.save(ReturnImportInvoiceProductsEntity, products);

        const invoiceWithRelations = await this.findOneReturnImportInvoiceWithProductsAndUsernames(savedInvoice.id, manager);
        return invoiceWithRelations || savedInvoice;
    }

    // Edit a draft return import invoice.
    async editDraftReturnImportInvoice(
        returnImportInvoice: ReturnImportInvoiceEntity,
        resolvedProducts: ResolvedReturnProductData[],
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalReturnPrice: number },
        notes: string | null,
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<ReturnImportInvoiceEntity> {

        // Update return import invoice - ReturnImportInvoiceEntity.
        returnImportInvoice.totalProducts = calculatedTotals.totalProducts;
        returnImportInvoice.totalQuantity = calculatedTotals.totalQuantity;
        returnImportInvoice.totalReturnPrice = calculatedTotals.totalReturnPrice;
        returnImportInvoice.notes = notes;
        returnImportInvoice.draftBy = user.id;
        returnImportInvoice.draftAt = new Date();

        const savedInvoice = await manager.save(ReturnImportInvoiceEntity, returnImportInvoice);

        // Update return import invoice products - ReturnImportInvoiceProductsEntity.
        if (resolvedProducts.length > 0) {
            await manager.delete(ReturnImportInvoiceProductsEntity, { returnImportInvoice: { id: savedInvoice.id } });

            const products: ReturnImportInvoiceProductsEntity[] = resolvedProducts.map((item) =>
                this.returnImportInvoiceProductsRepository.create({
                    returnImportInvoice: savedInvoice,
                    importInvoiceProduct: item.importInvoiceProduct,
                    productId: item.importInvoiceProduct.productId,
                    productSku: item.importInvoiceProduct.productSku,
                    productName: item.importInvoiceProduct.productName,
                    productUnit: item.importInvoiceProduct.productUnit,
                    returnQuantity: item.returnQuantity,
                    importPrice: item.importInvoiceProduct.importPrice,
                    totalReturnPrice: item.returnQuantity * Number(item.importInvoiceProduct.importPrice),
                    reasonCategory: item.reasonCategory,
                    reasonNotes: item.reasonNotes,
                }),
            );

            await manager.save(ReturnImportInvoiceProductsEntity, products);
        }

        const invoiceWithRelations = await this.findOneReturnImportInvoiceWithProductsAndUsernames(savedInvoice.id, manager);
        return invoiceWithRelations || savedInvoice;
    }

    // Delete draft return import invoices.
    async deleteDraftReturnImportInvoice(ids: string[], manager: EntityManager): Promise<boolean> {
        if (ids.length === 0) return true;

        const draftInvoices = await manager
            .createQueryBuilder(ReturnImportInvoiceEntity, 'invoice')
            .where('invoice.id IN (:...ids)', { ids })
            .andWhere('invoice.status = :status', { status: ReturnImportInvoiceStatus.DRAFT })
            .setLock('pessimistic_write')
            .getMany();

        if (draftInvoices.length === 0) return true;

        const decrementByImportInvoiceId = new Map<string, number>();
        const draftInvoiceIds = draftInvoices.map((invoice) => invoice.id);
        for (const invoice of draftInvoices) {
            decrementByImportInvoiceId.set(
                invoice.importInvoiceId,
                (decrementByImportInvoiceId.get(invoice.importInvoiceId) ?? 0) + 1,
            );
        }

        await manager.delete(ReturnImportInvoiceProductsEntity, { returnImportInvoice: { id: In(draftInvoiceIds) } });
        await manager.delete(ReturnImportInvoiceEntity, { id: In(draftInvoiceIds) });

        for (const [importInvoiceId, decrementBy] of decrementByImportInvoiceId) {
            await manager
                .createQueryBuilder()
                .update(ImportInvoiceEntity)
                .set({ returnCount: () => `GREATEST(return_count - ${decrementBy}, 0)` })
                .where('id = :id', { id: importInvoiceId })
                .execute();
        }

        return true;
    }

    // Confirm a draft return import invoice.
    async confirmReturnImportInvoice(
        returnImportInvoice: ReturnImportInvoiceEntity,
        originalImportInvoice: ImportInvoiceEntity,
        user: AccessTokenPayload,
        manager: EntityManager,
    ): Promise<ReturnImportInvoiceEntity | null> {

        // Get the return import invoice - ReturnImportInvoiceEntity.
        const lockedReturn: ReturnImportInvoiceEntity = await manager
            .createQueryBuilder(ReturnImportInvoiceEntity, 'invoice')
            .where('invoice.id = :id', { id: returnImportInvoice.id })
            .setLock('pessimistic_write')
            .getOneOrFail();

        // Check if the return import invoice is in draft status.
        if (lockedReturn.status !== ReturnImportInvoiceStatus.DRAFT) return null;

        // Get the original import invoice - ImportInvoiceEntity.
        const lockedImport: ImportInvoiceEntity = await manager
            .createQueryBuilder(ImportInvoiceEntity, 'inv')
            .where('inv.id = :id', { id: originalImportInvoice.id })
            .setLock('pessimistic_write')
            .getOneOrFail();

        // Ensure the return belongs to this import invoice.
        if (lockedReturn.importInvoiceId !== lockedImport.id) return null;

        // Load return lines with import product FK - ReturnImportInvoiceProductsEntity.
        let lines = lockedReturn.returnImportInvoiceProducts;
        const mustLoadLines = !lines?.length || !lines[0].importInvoiceProduct;
        if (mustLoadLines) {
            lines = await manager.find(ReturnImportInvoiceProductsEntity, {
                where: { returnImportInvoice: { id: lockedReturn.id } },
                relations: ['importInvoiceProduct'],
            });
        }

        if (lines.length === 0) return null;

        // Load all product lines on the original import invoice - ImportInvoiceProductsEntity.
        const originalProducts: ImportInvoiceProductsEntity[] = await manager.find(ImportInvoiceProductsEntity, {
            where: { importInvoiceId: lockedImport.id },
        });

        // Map return quantity per import invoice product line id (not productId); sum if duplicated.
        const returnQtyByImportLineId = new Map<string, number>();
        for (const rp of lines) {
            const lineId = rp.importInvoiceProduct?.id;
            if (!lineId) return null;
            const prev = returnQtyByImportLineId.get(lineId) ?? 0;
            returnQtyByImportLineId.set(lineId, prev + rp.returnQuantity);
        }

        // Apply returnedQuantity increments and compute full-return in one pass - ImportInvoiceProductsEntity.
        const productsToUpdate: ImportInvoiceProductsEntity[] = [];
        let isFullyReturned = true;
        for (const originalProduct of originalProducts) {
            const returnQty = returnQtyByImportLineId.get(originalProduct.id) ?? 0;
            if (returnQty > 0) {
                if (originalProduct.returnedQuantity + returnQty > originalProduct.quantity) return null;
                originalProduct.returnedQuantity += returnQty;
                productsToUpdate.push(originalProduct);
            }
            if (originalProduct.returnedQuantity < originalProduct.quantity) {
                isFullyReturned = false;
            }
        }

        // Generate a new return invoice ID.
        const returnInvoiceId = await this.generateReturnInvoiceId(manager);

        // Confirm the return import invoice - ReturnImportInvoiceEntity.
        lockedReturn.returnInvoiceId = returnInvoiceId;
        lockedReturn.status = ReturnImportInvoiceStatus.CONFIRMED;
        lockedReturn.confirmedBy = user.id;
        lockedReturn.confirmedAt = new Date();
        await manager.save(ReturnImportInvoiceEntity, lockedReturn);

        // Persist updated returnedQuantity on import lines - ImportInvoiceProductsEntity.
        if (productsToUpdate.length > 0) {
            await manager.save(ImportInvoiceProductsEntity, productsToUpdate);
        }

        // Update import invoice status - ImportInvoiceEntity.
        lockedImport.status = isFullyReturned ? ImportInvoiceStatus.RETURNED : ImportInvoiceStatus.PARTIALLY_RETURNED;
        await manager.save(ImportInvoiceEntity, lockedImport);

        // Subtract inventory for each returned line - ProductsEntity.
        for (const rp of lines) {
            await this.productsRepository.updateInventoryStock(
                { id: rp.productId } as ProductsEntity,
                rp.returnQuantity,
                StockActionType.SUBTRACT,
                InvoiceType.RETURN_IMPORT,
                lockedReturn.id,
                manager,
                Number(rp.totalReturnPrice),
            );
        }

        // Reload the return import invoice with products and usernames.
        const invoiceWithRelations = await this.findOneReturnImportInvoiceWithProductsAndUsernames(lockedReturn.id, manager);
        return invoiceWithRelations || lockedReturn;
    }

    // Get return import invoice by id.
    async getReturnImportInvoiceById(id: string): Promise<ReturnImportInvoiceEntity | null> {
        return this.findOneReturnImportInvoiceWithProductsAndUsernames(id);
    }

    // Get a list of return import invoices.
    async getListOfReturnImportInvoices(dto: GetListOfReturnImportInvoiceRequestDto): Promise<{ data: ReturnImportInvoiceEntity[]; total: number }> {
        const { page = 1, limit = 25, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const offset = (page - 1) * limit;
        const sortDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

        const qb = this.returnImportInvoiceRepository.createQueryBuilder('invoice');
        qb.leftJoin('invoice.importInvoice', 'importInv');

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
            } else if (searchBy === 'importInvoiceId') {
                qb.andWhere(`importInv.invoiceId ILIKE :search${WILDCARD_ILIKE_ESCAPE_SQL}`, {
                    search: buildWildcardIlikePattern(search),
                });
            } else if (searchBy === 'userId') {
                qb.andWhere(new Brackets((b) => {
                    b.where('invoice.draftBy = :search', { search })
                        .orWhere('invoice.confirmedBy = :search', { search });
                }));
            } else if (searchBy === 'productId') {
                // Exact SKU match: zero-pad the search term to the 13-digit SKU length
                // so searching "12" matches "0000000000012" but not "1200000000012".
                const productSearchConditions = [`riip.product_sku = :productSkuSearch`];
                const productSearchParams: Record<string, string> = {
                    productSkuSearch: search.padStart(13, '0'),
                };

                if (isUuid(search)) {
                    productSearchConditions.unshift('riip.product_id = :productIdSearch');
                    productSearchParams.productIdSearch = search;
                }

                qb.andWhere(
                    `EXISTS (
                        SELECT 1
                        FROM return_import_invoice_products riip
                        WHERE riip.return_import_invoice_id = invoice.id
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

        const applySort = (builder: SelectQueryBuilder<ReturnImportInvoiceEntity>) => {
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
            } else if (sortBy === 'importInvoiceId') {
                if (sortDirection === 'ASC') {
                    builder
                        .orderBy('CASE WHEN importInv.invoiceId IS NULL THEN 1 ELSE 0 END', 'ASC')
                        .addOrderBy('importInv.invoiceId', 'ASC', 'NULLS LAST')
                        .addOrderBy('invoice.createdAt', 'ASC', 'NULLS LAST');
                } else {
                    builder
                        .orderBy('CASE WHEN importInv.invoiceId IS NULL THEN 0 ELSE 1 END', 'ASC')
                        .addOrderBy('CASE WHEN importInv.invoiceId IS NULL THEN invoice.createdAt END', 'DESC', 'NULLS LAST')
                        .addOrderBy('CASE WHEN importInv.invoiceId IS NOT NULL THEN importInv.invoiceId END', 'DESC', 'NULLS LAST');
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

        const outerQb = this.appendListReturnInvoiceUsernamesSelect(
            this.returnImportInvoiceRepository.createQueryBuilder('invoice'),
        )
            .leftJoin('invoice.importInvoice', 'importInv')
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
