import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets, SelectQueryBuilder } from 'typeorm';

// Import enums.
import { ImportInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';

// Import entities.
import { ProductsEntity } from '@src/products/entities/products.entity';
import { ImportInvoiceEntity } from '../entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from '../entities/importInvocieProducts.entity';

// Import repositories.
import { ProductsRepository } from '@src/products/repositories/products.repository';

// Import DTOs.
import {
    CreateImportInvoiceRequestDto,
    EditImportInvoiceRequestDto,
    GetListOfImportInvoiceRequestDto
} from '@libs/common/dtos/invoices/importInvoices/crudImportInvoicesRequest.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

import { buildWildcardIlikePattern, WILDCARD_ILIKE_ESCAPE_SQL } from '@libs/common/utils/wildcardIlikeSearch.util';
import { isUuid } from '@libs/common/utils/uuid.util';

@Injectable()
export class ImportInvoiceRepository {

    constructor(
        @InjectRepository(ImportInvoiceEntity) private importInvoiceRepository: Repository<ImportInvoiceEntity>,
        @InjectRepository(ImportInvoiceProductsEntity) private importInvoiceProductsRepository: Repository<ImportInvoiceProductsEntity>,
        private readonly productsRepository: ProductsRepository,
    ) { }

    // --- Private variables ---
    private static readonly _advisoryLockKey1 = 582_913_471;

    // --- Private methods ---
    // Join draft/confirm users only when the FK is set.
    private appendDraftAndConfirmedUserJoins(
        queryBuilder: SelectQueryBuilder<ImportInvoiceEntity>,
    ): SelectQueryBuilder<ImportInvoiceEntity> {
        return queryBuilder
            .leftJoin('invoice.draftByUser', 'draftByUser', 'invoice.draftBy IS NOT NULL')
            .addSelect(['draftByUser.id', 'draftByUser.username'])
            .leftJoin('invoice.confirmedByUser', 'confirmedByUser', 'invoice.confirmedBy IS NOT NULL')
            .addSelect(['confirmedByUser.id', 'confirmedByUser.username']);
    }

    // Find one invoice with products and usernames.
    private async findOneInvoiceWithProductsAndUsernames(
        id: string,
        manager?: EntityManager,
    ): Promise<ImportInvoiceEntity | null> {
        const repo = manager?.getRepository(ImportInvoiceEntity) ?? this.importInvoiceRepository;
        const queryBuilder = repo
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.importInvoiceProducts', 'products')
            .where('invoice.id = :id', { id });
        this.appendDraftAndConfirmedUserJoins(queryBuilder);
        return queryBuilder.getOne();
    }

    // Append list invoice usernames select.
    private appendListInvoiceUsernamesSelect(
        queryBuilder: SelectQueryBuilder<ImportInvoiceEntity>,
    ): SelectQueryBuilder<ImportInvoiceEntity> {
        return this.appendDraftAndConfirmedUserJoins(queryBuilder);
    }

    // Generate a new import invoice ID.
    // The format is IYY-XXXXXXX (I26-0000001).
    private async generateInvoiceId(manager: EntityManager): Promise<string> {
        
        const now = new Date();
        const calendarYear = now.getFullYear();
        const year = calendarYear.toString().slice(-2);
        const yearPrefix = `I${year}`;

        await manager.query(
            'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
            [ImportInvoiceRepository._advisoryLockKey1, calendarYear],
        );

        const latestInvoice = await manager
            .createQueryBuilder(ImportInvoiceEntity, 'invoice')
            .where('invoice.invoiceId LIKE :prefix', { prefix: `${yearPrefix}-%` })
            .orderBy('LENGTH(invoice.invoiceId)', 'DESC')
            .addOrderBy('invoice.invoiceId', 'DESC')
            .getOne();

        let sequence = 1;
        if (latestInvoice && latestInvoice.invoiceId) {
            const lastSequence = parseInt(latestInvoice.invoiceId.split('-')[1]);
            sequence = lastSequence + 1;
        }
        return `${yearPrefix}-${sequence.toString().padStart(7, '0')}`;
    }

    // --- Public methods ---
    // Create a new import invoice.
    async createDraftImportInvoice(
        dto: CreateImportInvoiceRequestDto,
        user: AccessTokenPayload,
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalImportPrice: number },
        manager: EntityManager,
    ): Promise<ImportInvoiceEntity> {

        // Create import invoice.
        // It is a draft invoice, so it doesn't have an invoice ID yet - ImportInvoiceEntity.
        const importInvoice = this.importInvoiceRepository.create({
            totalProducts: calculatedTotals.totalProducts,
            totalQuantity: calculatedTotals.totalQuantity,
            totalImportPrice: calculatedTotals.totalImportPrice,
            notes: dto.notes ?? null,
            status: ImportInvoiceStatus.DRAFT,
            returnCount: 0,
            draftBy: user.id,
            draftAt: new Date(),
        });
        const savedInvoice: ImportInvoiceEntity = await manager.save(ImportInvoiceEntity, importInvoice);

        // Create import invoice products - ImportInvoiceProductsEntity.
        const products: ImportInvoiceProductsEntity[] = dto.products.map(product => {
            return this.importInvoiceProductsRepository.create({
                importInvoice: savedInvoice,
                productId: product.productId,
                productSku: product.productSku,
                productName: product.productName,
                productUnit: product.productUnit,
                quantity: product.quantity,
                returnedQuantity: 0,
                importPrice: product.importPrice,
                totalImportPrice: product.quantity * product.importPrice,
                notes: product.notes ?? null,
            });
        });

        await manager.save(ImportInvoiceProductsEntity, products);

        const invoiceWithRelations = await this.findOneInvoiceWithProductsAndUsernames(savedInvoice.id, manager);

        return invoiceWithRelations || savedInvoice;
    }

    // Edit a draft import invoice.
    async editDraftImportInvoice(
        dto: EditImportInvoiceRequestDto,
        invoice: ImportInvoiceEntity,
        user: AccessTokenPayload,
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalImportPrice: number },
        manager: EntityManager,
    ): Promise<ImportInvoiceEntity> {

        // Update import invoice - ImportInvoiceEntity.
        invoice.totalProducts = calculatedTotals.totalProducts;
        invoice.totalQuantity = calculatedTotals.totalQuantity;
        invoice.totalImportPrice = calculatedTotals.totalImportPrice;
        invoice.draftBy = user.id;
        invoice.draftAt = new Date();
        invoice.notes = dto.notes ?? null;
        invoice.returnCount = 0;

        await manager.save(ImportInvoiceEntity, invoice);

        // Update import invoice products - ImportInvoiceProductsEntity.
        if (dto.products.length > 0) {
            await manager.delete(ImportInvoiceProductsEntity, { importInvoice: { id: invoice.id } });

            const products: ImportInvoiceProductsEntity[] = dto.products.map(product => {
                return this.importInvoiceProductsRepository.create({
                    importInvoice: invoice,
                    productId: product.productId,
                    productSku: product.productSku,
                    productName: product.productName,
                    productUnit: product.productUnit,
                    quantity: product.quantity,
                    returnedQuantity: 0,
                    importPrice: product.importPrice,
                    totalImportPrice: product.quantity * product.importPrice,
                    notes: product.notes ?? null,
                });
            });

            await manager.save(ImportInvoiceProductsEntity, products);
        }

        const invoiceWithRelations = await this.findOneInvoiceWithProductsAndUsernames(invoice.id, manager);

        return invoiceWithRelations || invoice;
    }

    // Delete draft import invoice.
    async deleteDraftImportInvoice(ids: string[], manager: EntityManager): Promise<boolean> {
        if (ids.length === 0) return true;

        // Delete import invoice products - ImportInvoiceProductsEntity.
        await manager.delete(ImportInvoiceProductsEntity, { importInvoiceId: In(ids) });

        // Delete import invoice - ImportInvoiceEntity.
        await manager.delete(ImportInvoiceEntity, { id: In(ids) });

        return true;
    }

    // Confirm a draft import invoice.
    async confirmImportInvoice(invoice: ImportInvoiceEntity, user: AccessTokenPayload, manager: EntityManager): Promise<ImportInvoiceEntity | null> {

        // Get the import invoice - ImportInvoiceEntity.
        const lockedInvoice: ImportInvoiceEntity = await manager
            .createQueryBuilder(ImportInvoiceEntity, 'invoice')
            .where('invoice.id = :id', { id: invoice.id })
            .setLock('pessimistic_write')
            .getOneOrFail();

        // Check if the invoice is in draft status.
        if (lockedInvoice.status !== ImportInvoiceStatus.DRAFT) return null;

        const products: ImportInvoiceProductsEntity[] = await manager.find(ImportInvoiceProductsEntity, {
            where: { importInvoiceId: lockedInvoice.id },
        });

        // Generate a new invoice ID.
        const invoiceId: string = await this.generateInvoiceId(manager);

        lockedInvoice.invoiceId = invoiceId;
        lockedInvoice.status = ImportInvoiceStatus.CONFIRMED;
        lockedInvoice.confirmedBy = user.id;
        lockedInvoice.confirmedAt = new Date();
        lockedInvoice.returnCount = 0;

        await manager.save(ImportInvoiceEntity, lockedInvoice);

        // Update the inventory stock of the products - ProductsEntity.
        for (const product of products) {
            await this.productsRepository.updateInventoryStock(
                { id: product.productId } as ProductsEntity,
                product.quantity,
                StockActionType.ADD,
                InvoiceType.IMPORT,
                lockedInvoice.id,
                manager,
            );
        }

        const invoiceWithRelations = await this.findOneInvoiceWithProductsAndUsernames(lockedInvoice.id, manager);

        return invoiceWithRelations || lockedInvoice;
    }

    // Get import invoice by id.
    async getImportInvoiceById(id: string): Promise<ImportInvoiceEntity | null> {
        return this.findOneInvoiceWithProductsAndUsernames(id);
    }

    // Get import invoices by ids.
    async getImportInvoicesByIds(ids: string[]): Promise<ImportInvoiceEntity[]> {
        return await this.importInvoiceRepository.find({
            where: { id: In(ids) },
        });
    }

    // Get a list of import invoices.
    async getListOfImportInvoices(dto: GetListOfImportInvoiceRequestDto): Promise<{ data: ImportInvoiceEntity[], total: number }> {
        const { page = 1, limit = 25, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const offset = (page - 1) * limit;
        const sortDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

        const qb = this.importInvoiceRepository.createQueryBuilder('invoice');

        // --- 1. FILTER ---
        if (status !== undefined) {
            qb.andWhere('invoice.status = :status', { status });
        }

        // --- 2. SEARCH (requires both search + searchBy per DTO validation) ---
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
                const productSearchConditions = [`iip.product_sku ILIKE :productSkuSearch${WILDCARD_ILIKE_ESCAPE_SQL}`];
                const productSearchParams: Record<string, string> = {
                    productSkuSearch: buildWildcardIlikePattern(search),
                };

                if (isUuid(search)) {
                    productSearchConditions.unshift('iip.product_id = :productIdSearch');
                    productSearchParams.productIdSearch = search;
                }

                qb.andWhere(
                    `EXISTS (
                        SELECT 1
                        FROM import_invoice_products iip
                        WHERE iip.import_invoice_id = invoice.id
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

        const applySort = (builder: SelectQueryBuilder<ImportInvoiceEntity>) => {
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
                    totalImportPrice: 'invoice.totalImportPrice',
                    status: 'invoice.status',
                    returnCount: 'invoice.returnCount',
                    draftAt: 'invoice.draftAt',
                    confirmedAt: 'invoice.confirmedAt',
                };
                const sortColumn = (sortBy ? sortMap[sortBy] : null) ?? 'invoice.createdAt';
                builder.orderBy(sortColumn, sortDirection);
            }
            builder.addOrderBy('invoice.id', 'ASC');
        };

        applySort(qb);

        // --- 5. PAGE ROWS + USERNAMES ---
        // Subquery returns only ids for this page (offset/limit). Outer query loads full invoice rows and
        // joins draftByUser/confirmedByUser for draftByUsername and confirmedByUsername on that page only,
        // not for every row matching the filters. Import invoice line products are not loaded on this list.
        const idSubQuery = qb.clone()
            .select('invoice.id')
            .offset(offset)
            .limit(limit)
            .getQuery();

        const outerQb = this.appendListInvoiceUsernamesSelect(
            this.importInvoiceRepository.createQueryBuilder('invoice'),
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
