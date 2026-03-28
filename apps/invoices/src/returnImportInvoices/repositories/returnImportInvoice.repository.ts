import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets } from 'typeorm';

// Import enums.
import { Role } from '@app/common/enums/role.enum';
import { ReturnImportInvoiceStatus, ImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@app/common/enums/invoiceType.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

// Import entities.
import { ReturnImportInvoiceEntity } from '../entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from '../entities/returnImportInvoiceProducts.entity';
import { ImportInvoiceEntity } from '../../importInvoices/entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from '../../importInvoices/entities/importInvocieProducts.entity';

// Import types.
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import DTOs.
import { GetListOfReturnImportInvoiceRequestDto } from '@app/common/dtos/invoices/returnImportInvoices/crudReturnImportInvoicesRequest.dto';
import { UpdateProductInventoryBulkRequestDto } from '@app/common/dtos/platform/products/crudProductRequest.dto';

// Import helper services.
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Interface for resolved products from service.
export interface ResolvedReturnProductData {
    importInvoiceProduct: ImportInvoiceProductsEntity;
    returnQuantity: number;
    notes: string | null;
}

@Injectable()
export class ReturnImportInvoiceRepository {
    constructor(
        @InjectRepository(ReturnImportInvoiceEntity) private returnImportInvoiceRepository: Repository<ReturnImportInvoiceEntity>,
        @InjectRepository(ReturnImportInvoiceProductsEntity) private returnImportInvoiceProductsRepository: Repository<ReturnImportInvoiceProductsEntity>,
        private invoiceHelperService: InvoiceHelperService,
    ) { }

    // Generate a new return import invoice ID.
    // The format is RIYY-XXXXXXX (RI26-0000001).
    private async generateReturnInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const yearPrefix = `RI${year}`;

        const latestInvoice = await manager
            .createQueryBuilder(ReturnImportInvoiceEntity, 'invoice')
            .where('invoice.returnInvoiceId LIKE :prefix', { prefix: `${yearPrefix}-%` })
            .orderBy('LENGTH(invoice.returnInvoiceId)', 'DESC')
            .addOrderBy('invoice.returnInvoiceId', 'DESC')
            .getOne();

        let sequence = 1;
        if (latestInvoice && latestInvoice.returnInvoiceId) {
            const lastSequence = parseInt(latestInvoice.returnInvoiceId.split('-')[1]);
            sequence = lastSequence + 1;
        }
        return `${yearPrefix}-${sequence.toString().padStart(7, '0')}`;
    }

    // Create a new draft return import invoice.
    async createDraftReturnImportInvoice(
        importInvoice: ImportInvoiceEntity,
        resolvedProducts: ResolvedReturnProductData[],
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalReturnPrice: number },
        notes: string | null,
        user: AccessTokenPayload
    ): Promise<ReturnImportInvoiceEntity> {
        return await this.returnImportInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Create return import invoice. 
            // It is a draft invoice, so it doesn't have a return invoice ID yet.
            const returnImportInvoice = this.returnImportInvoiceRepository.create({
                importInvoice: importInvoice,
                totalProducts: calculatedTotals.totalProducts,
                totalQuantity: calculatedTotals.totalQuantity,
                totalReturnPrice: calculatedTotals.totalReturnPrice,
                notes: notes,
                status: ReturnImportInvoiceStatus.DRAFT,
                draftBy: user.id,
                draftAt: new Date(),
            });

            const savedInvoice = await transactionalManager.save(ReturnImportInvoiceEntity, returnImportInvoice);

            // Create return import invoice products.
            const products = resolvedProducts.map(item => {
                return this.returnImportInvoiceProductsRepository.create({
                    returnImportInvoice: savedInvoice,
                    importInvoiceProduct: item.importInvoiceProduct,
                    productId: item.importInvoiceProduct.productId,
                    productSku: item.importInvoiceProduct.productSku,
                    productName: item.importInvoiceProduct.productName,
                    productUnit: item.importInvoiceProduct.productUnit,
                    returnQuantity: item.returnQuantity,
                    importPrice: item.importInvoiceProduct.importPrice,
                    totalReturnPrice: item.returnQuantity * item.importInvoiceProduct.importPrice,
                    notes: item.notes,
                });
            });

            await transactionalManager.save(ReturnImportInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ReturnImportInvoiceEntity, {
                where: { id: savedInvoice.id },
                relations: ['importInvoice', 'returnImportInvoiceProducts'],
            });

            return invoiceWithRelations || savedInvoice;
        });
    }

    // Edit the draft return import invoice.
    async editDraftReturnImportInvoice(
        returnImportInvoice: ReturnImportInvoiceEntity,
        resolvedProducts: ResolvedReturnProductData[],
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalReturnPrice: number },
        notes: string | null,
        user: AccessTokenPayload
    ): Promise<ReturnImportInvoiceEntity> {
        return await this.returnImportInvoiceRepository.manager.transaction(async (transactionalManager) => {
            // Update return import invoice.
            returnImportInvoice.totalProducts = calculatedTotals.totalProducts;
            returnImportInvoice.totalQuantity = calculatedTotals.totalQuantity;
            returnImportInvoice.totalReturnPrice = calculatedTotals.totalReturnPrice;
            returnImportInvoice.notes = notes;
            returnImportInvoice.draftBy = user.id;
            returnImportInvoice.draftAt = new Date();

            const savedInvoice = await transactionalManager.save(ReturnImportInvoiceEntity, returnImportInvoice);

            // Delete old return import invoice products.
            await transactionalManager.delete(ReturnImportInvoiceProductsEntity, {
                returnImportInvoice: { id: savedInvoice.id }
            });

            // Update return import invoice products.
            const products = resolvedProducts.map(item => {
                return this.returnImportInvoiceProductsRepository.create({
                    returnImportInvoice: savedInvoice,
                    importInvoiceProduct: item.importInvoiceProduct,
                    productId: item.importInvoiceProduct.productId,
                    productSku: item.importInvoiceProduct.productSku,
                    productName: item.importInvoiceProduct.productName,
                    productUnit: item.importInvoiceProduct.productUnit,
                    returnQuantity: item.returnQuantity,
                    importPrice: item.importInvoiceProduct.importPrice,
                    totalReturnPrice: item.returnQuantity * item.importInvoiceProduct.importPrice,
                    notes: item.notes,
                });
            });

            await transactionalManager.save(ReturnImportInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ReturnImportInvoiceEntity, {
                where: { id: savedInvoice.id },
                relations: ['importInvoice', 'returnImportInvoiceProducts'],
            });

            return invoiceWithRelations || savedInvoice;
        });
    }

    // Delete draft return import invoices.
    async deleteDraftReturnImportInvoice(ids: string[]): Promise<boolean> {
        return await this.returnImportInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Delete return import invoice products.
            await transactionalManager.delete(ReturnImportInvoiceProductsEntity, {
                returnImportInvoice: { id: In(ids) }
            });

            // Delete return import invoice.
            await transactionalManager.delete(ReturnImportInvoiceEntity, { id: In(ids) });

            return true;
        });
    }

    // Confirm a return import invoice.
    async confirmReturnImportInvoice(
        returnImportInvoice: ReturnImportInvoiceEntity,
        originalImportInvoice: ImportInvoiceEntity,
        user: AccessTokenPayload
    ): Promise<ReturnImportInvoiceEntity | null> {

        // Snapshot values before changes for compensation if TCP fails.
        const previousOriginalStatus = originalImportInvoice.status;
        const previousReturnCount = originalImportInvoice.returnCount;

        // Step 1: Local transaction - confirm the return import invoice in the database.
        const result = await this.returnImportInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Generate a new return import invoice ID.
            const returnInvoiceId = await this.generateReturnInvoiceId(transactionalManager);

            // Load return import invoice products.
            if (!returnImportInvoice.returnImportInvoiceProducts) {
                const loadedReturnInvoice = await transactionalManager.findOne(ReturnImportInvoiceEntity, {
                    where: { id: returnImportInvoice.id },
                    relations: ['returnImportInvoiceProducts'],
                });
                if (loadedReturnInvoice) returnImportInvoice.returnImportInvoiceProducts = loadedReturnInvoice.returnImportInvoiceProducts;
            }

            if (!originalImportInvoice.importInvoiceProducts) {
                const loadedImportInvoice = await transactionalManager.findOne(ImportInvoiceEntity, {
                    where: { id: originalImportInvoice.id },
                    relations: ['importInvoiceProducts'],
                });
                if (loadedImportInvoice) originalImportInvoice.importInvoiceProducts = loadedImportInvoice.importInvoiceProducts;
            }

            // Update return import invoice.
            returnImportInvoice.returnInvoiceId = returnInvoiceId;
            returnImportInvoice.status = ReturnImportInvoiceStatus.CONFIRMED;
            returnImportInvoice.confirmedBy = user.id;
            returnImportInvoice.confirmedAt = new Date();

            // Save return import invoice.
            const savedReturnInvoice = await transactionalManager.save(ReturnImportInvoiceEntity, returnImportInvoice);

            // Create a map of return quantities.
            const returnQuantityMap = new Map<string, number>();
            for (const rp of returnImportInvoice.returnImportInvoiceProducts || []) {
                returnQuantityMap.set(rp.productId, rp.returnQuantity);
            }

            // Check if the import invoice is fully returned.
            let isFullyReturned = true;

            // Create a list of products to update.
            const productsToUpdate: ImportInvoiceProductsEntity[] = [];
            for (const originalProduct of originalImportInvoice.importInvoiceProducts || []) {
                const currentReturnQty = returnQuantityMap.get(originalProduct.productId) || 0;
                if (currentReturnQty > 0) {
                    originalProduct.returnedQuantity += currentReturnQty;
                    productsToUpdate.push(originalProduct);
                }
                if (originalProduct.returnedQuantity < originalProduct.quantity) {
                    isFullyReturned = false;
                }
            }

            // Update the import invoice products.
            if (productsToUpdate.length > 0) {
                await transactionalManager.save(ImportInvoiceProductsEntity, productsToUpdate);
            }

            // Update the import invoice status and return count.
            originalImportInvoice.status = isFullyReturned ? ImportInvoiceStatus.RETURNED : ImportInvoiceStatus.PARTIALLY_RETURNED;
            originalImportInvoice.returnCount += 1;
            await transactionalManager.save(ImportInvoiceEntity, originalImportInvoice);

            // Load return import invoice with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ReturnImportInvoiceEntity, {
                where: { id: savedReturnInvoice.id },
                relations: ['importInvoice', 'returnImportInvoiceProducts'],
            });

            // Create a stock update DTO.
            const stockUpdateDto: UpdateProductInventoryBulkRequestDto = {
                invoiceType: InvoiceType.RETURN_IMPORT,
                invoiceId: returnImportInvoice.id,
                products: (returnImportInvoice.returnImportInvoiceProducts || []).map(p => ({
                    id: p.productId,
                    quantity: p.returnQuantity,
                    action: StockActionType.SUBTRACT,
                })),
            };

            return { invoice: invoiceWithRelations || savedReturnInvoice, stockUpdateDto, returnQuantityMap };
        });

        if (!result) return null;

        // Step 2: TCP call for updating product inventory stock.
        try {
            await this.invoiceHelperService.updateProductInventoryStockBulk(result.stockUpdateDto);
        } catch (error) {
            // Step 3: In case of error, rollback the local transaction.
            await this.returnImportInvoiceRepository.manager.transaction(async (transactionalManager) => {
                await transactionalManager.update(ReturnImportInvoiceEntity, { id: returnImportInvoice.id }, {
                    returnInvoiceId: null as any,
                    status: ReturnImportInvoiceStatus.DRAFT,
                    confirmedBy: null as any,
                    confirmedAt: null as any,
                });

                // Revert original import invoice products' returnedQuantity.
                for (const originalProduct of originalImportInvoice.importInvoiceProducts || []) {
                    const returnQty = result.returnQuantityMap.get(originalProduct.productId) || 0;
                    if (returnQty > 0) {
                        originalProduct.returnedQuantity -= returnQty;
                        await transactionalManager.save(ImportInvoiceProductsEntity, originalProduct);
                    }
                }

                // Revert original import invoice status and return count.
                await transactionalManager.update(ImportInvoiceEntity, { id: originalImportInvoice.id }, {
                    status: previousOriginalStatus,
                    returnCount: previousReturnCount,
                });
            });
            throw error;
        }

        return result.invoice;
    }

    // Get return import invoice by ID.
    async getReturnImportInvoiceById(id: string): Promise<ReturnImportInvoiceEntity | null> {
        return await this.returnImportInvoiceRepository.findOne({
            where: { id },
            relations: ['returnImportInvoiceProducts', 'importInvoice'],
        });
    }

    // Get a list of return import invoices.
    async getListOfReturnImportInvoices(dto: GetListOfReturnImportInvoiceRequestDto, user: AccessTokenPayload): Promise<{ data: ReturnImportInvoiceEntity[], total: number }> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const queryBuilder = this.returnImportInvoiceRepository.createQueryBuilder('invoice');
        queryBuilder.leftJoinAndSelect('invoice.returnImportInvoiceProducts', 'products');
        queryBuilder.leftJoinAndSelect('invoice.importInvoice', 'importInvoice');

        // Apply search filters.
        if (search) {
            if (searchBy === 'returnInvoiceId') {
                queryBuilder.andWhere('invoice.returnInvoiceId ILIKE :search', { search: `${search}%` });
            } else if (searchBy === 'importInvoiceId') {
                queryBuilder.andWhere('importInvoice.invoiceId ILIKE :search', { search: `${search}%` });
            } else if (searchBy === 'userId') {
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('invoice.draftBy = :search', { search })
                        .orWhere('invoice.confirmedBy = :search', { search });
                }));
            } else if (searchBy === 'productId') {
                queryBuilder.andWhere('products.productId = :search', { search });
            } else {
                queryBuilder.andWhere('invoice.returnInvoiceId ILIKE :search', { search: `${search}%` });
            }
        }

        // Apply status filter.
        if (status !== undefined) {
            queryBuilder.andWhere('invoice.status = :status', { status });
        }

        // Apply role-based for ADMIN to filter by userId.
        const isAdmin = user.roles.some(role => role === Role.ADMIN);
        if (!isAdmin) {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where('invoice.status != :draftStatus', { draftStatus: ReturnImportInvoiceStatus.DRAFT })
                    .orWhere('invoice.draftBy = :userId', { userId: user.id });
            }));
        }

        // Apply date range filters.
        if (fromDate) {
            switch (status) {
                case ReturnImportInvoiceStatus.DRAFT:
                    queryBuilder.andWhere('invoice.draftAt >= :fromDate', { fromDate });
                    break;
                case ReturnImportInvoiceStatus.CONFIRMED:
                    queryBuilder.andWhere('invoice.confirmedAt >= :fromDate', { fromDate });
                    break;
                default:
                    queryBuilder.andWhere('invoice.confirmedAt >= :fromDate', { fromDate });
                    break;
            }
        }

        if (toDate) {
            switch (status) {
                case ReturnImportInvoiceStatus.DRAFT:
                    queryBuilder.andWhere('invoice.draftAt <= :toDate', { toDate });
                    break;
                case ReturnImportInvoiceStatus.CONFIRMED:
                    queryBuilder.andWhere('invoice.confirmedAt <= :toDate', { toDate });
                    break;
                default:
                    queryBuilder.andWhere('invoice.confirmedAt <= :toDate', { toDate });
                    break;
            }
        }

        // Apply sorting.
        let sortField = 'invoice.draftAt';
        if (sortBy === 'returnInvoiceId') sortField = 'invoice.returnInvoiceId';
        else if (sortBy === 'totalReturnPrice') sortField = 'invoice.totalReturnPrice';
        else if (sortBy === 'createdAt') {
            if (status === ReturnImportInvoiceStatus.DRAFT) sortField = 'invoice.draftAt';
            else sortField = 'invoice.confirmedAt';
        }

        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }
}
