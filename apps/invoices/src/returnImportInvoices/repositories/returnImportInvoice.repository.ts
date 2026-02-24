import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';

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

// Import helper services.
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Interface for resolved products from service
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
    async generateReturnInvoiceId(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const yearPrefix = `RI${year}`;

        // Find the latest invoice with the same year prefix.
        const latestInvoice = await this.returnImportInvoiceRepository
            .createQueryBuilder('invoice')
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
        notes: string | null,
        user: AccessTokenPayload
    ): Promise<ReturnImportInvoiceEntity> {
        return await this.returnImportInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Calculate totals for the return import invoice.
            let totalProducts = resolvedProducts.length;
            let totalQuantity = 0;
            let totalReturnPrice = 0;

            resolvedProducts.forEach(item => {
                totalQuantity += item.returnQuantity;
                const productTotal = item.returnQuantity * item.importInvoiceProduct.importPrice;
                totalReturnPrice += productTotal;
            });

            // Create return import invoice. 
            // It is a draft invoice, so it doesn't have a return invoice ID yet.
            const returnImportInvoice = this.returnImportInvoiceRepository.create({
                importInvoice: importInvoice,
                totalProducts,
                totalQuantity,
                totalReturnPrice,
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
                relations: ['returnImportInvoiceProducts'],
            });

            return invoiceWithRelations || savedInvoice;
        });
    }

    // Edit the draft return import invoice.
    async editDraftReturnImportInvoice(
        returnImportInvoice: ReturnImportInvoiceEntity,
        resolvedProducts: ResolvedReturnProductData[],
        notes: string | null,
        user: AccessTokenPayload
    ): Promise<ReturnImportInvoiceEntity> {
        return await this.returnImportInvoiceRepository.manager.transaction(async (transactionalManager) => {
            // Calculate totals for the return import invoice.
            let totalProducts = resolvedProducts.length;
            let totalQuantity = 0;
            let totalReturnPrice = 0;

            resolvedProducts.forEach(item => {
                totalQuantity += item.returnQuantity;
                const productTotal = item.returnQuantity * item.importInvoiceProduct.importPrice;
                totalReturnPrice += productTotal;
            });

            // Update return import invoice.
            returnImportInvoice.totalProducts = totalProducts;
            returnImportInvoice.totalQuantity = totalQuantity;
            returnImportInvoice.totalReturnPrice = totalReturnPrice;
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
                relations: ['returnImportInvoiceProducts'],
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
        return await this.returnImportInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Generate return invoice ID.
            const returnInvoiceId = await this.generateReturnInvoiceId();

            // Load products if relations are missing.
            if (!returnImportInvoice.returnImportInvoiceProducts) {
                const loadedReturnInvoice = await transactionalManager.findOne(ReturnImportInvoiceEntity, {
                    where: { id: returnImportInvoice.id },
                    relations: ['returnImportInvoiceProducts'],
                });
                if (loadedReturnInvoice) {
                    returnImportInvoice.returnImportInvoiceProducts = loadedReturnInvoice.returnImportInvoiceProducts;
                }
            }

            if (!originalImportInvoice.importInvoiceProducts) {
                const loadedImportInvoice = await transactionalManager.findOne(ImportInvoiceEntity, {
                    where: { id: originalImportInvoice.id },
                    relations: ['importInvoiceProducts'],
                });
                if (loadedImportInvoice) {
                    originalImportInvoice.importInvoiceProducts = loadedImportInvoice.importInvoiceProducts;
                }
            }

            // Update inventory stock.
            const stockUpdateDto = {
                invoiceType: InvoiceType.RETURN_IMPORT,
                invoiceId: returnImportInvoice.id,
                products: (returnImportInvoice.returnImportInvoiceProducts || []).map(p => ({
                    id: p.productId,
                    quantity: p.returnQuantity,
                    action: StockActionType.SUBTRACT,
                })),
            };
            await this.invoiceHelperService.updateProductInventoryStockBulk(stockUpdateDto);

            // Update return import invoice details.
            returnImportInvoice.returnInvoiceId = returnInvoiceId;
            returnImportInvoice.status = ReturnImportInvoiceStatus.CONFIRMED;
            returnImportInvoice.confirmedBy = user.id;
            returnImportInvoice.confirmedAt = new Date();

            const savedReturnInvoice = await transactionalManager.save(ReturnImportInvoiceEntity, returnImportInvoice);

            // Create a map to look up return quantity fast.
            const returnQuantityMap = new Map<string, number>();
            for (const rp of returnImportInvoice.returnImportInvoiceProducts || []) {
                returnQuantityMap.set(rp.productId, rp.returnQuantity);
            }

            // Determine if the original invoice is fully or partially returned.
            let isFullyReturned = true;

            const productsToUpdate: ImportInvoiceProductsEntity[] = [];
            for (const originalProduct of originalImportInvoice.importInvoiceProducts || []) {
                const currentReturnQty = returnQuantityMap.get(originalProduct.productId) || 0;

                if (currentReturnQty > 0) {
                    originalProduct.returnedQuantity += currentReturnQty;
                    productsToUpdate.push(originalProduct);
                }

                const totalReturnedSoFar = originalProduct.returnedQuantity;

                // If any product has not been fully returned yet.
                if (totalReturnedSoFar < originalProduct.quantity) {
                    isFullyReturned = false;
                }
            }

            // Update original import invoice products.
            if (productsToUpdate.length > 0) {
                await transactionalManager.save(ImportInvoiceProductsEntity, productsToUpdate);
            }

            // Update the original import invoice status and return count.
            originalImportInvoice.status = isFullyReturned
                ? ImportInvoiceStatus.RETURNED
                : ImportInvoiceStatus.PARTIALLY_RETURNED;
            originalImportInvoice.returnCount += 1;

            await transactionalManager.save(ImportInvoiceEntity, originalImportInvoice);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ReturnImportInvoiceEntity, {
                where: { id: savedReturnInvoice.id },
                relations: ['returnImportInvoiceProducts'],
            });

            return invoiceWithRelations || savedReturnInvoice;
        });
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
