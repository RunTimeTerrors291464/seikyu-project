import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets } from 'typeorm';

// Import enums.
import { Role } from '@app/common/enums/role.enum';
import { ReturnSellingInvoiceStatus, SellingInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@app/common/enums/invoiceType.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

// Import entities.
import { ReturnSellingInvoiceEntity } from '../entities/returnSellingInvoices.entity';
import { ReturnSellingInvoiceProductsEntity } from '../entities/returnSellingInvoiceProducts.entity';
import { SellingInvoiceEntity } from '../../sellingInvoices/entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '../../sellingInvoices/entities/sellingInvoiceProducts.entity';

// Import types.
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import DTOs.
import { GetListOfReturnSellingInvoiceRequestDto } from '@app/common/dtos/invoices/returnSellingInvoices/crudReturnSellingInvoicesRequest.dto';
import { UpdateProductInventoryBulkRequestDto } from '@app/common/dtos/platform/products/crudProductRequest.dto';

// Import helper services.
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Interface for resolved products from service.
export interface ResolvedReturnSellingProductData {
    sellingInvoiceProduct: SellingInvoiceProductsEntity;
    returnQuantity: number;
    notes: string | null;
}

@Injectable()
export class ReturnSellingInvoiceRepository {
    constructor(
        @InjectRepository(ReturnSellingInvoiceEntity) private returnSellingInvoiceRepository: Repository<ReturnSellingInvoiceEntity>,
        @InjectRepository(ReturnSellingInvoiceProductsEntity) private returnSellingInvoiceProductsRepository: Repository<ReturnSellingInvoiceProductsEntity>,
        private invoiceHelperService: InvoiceHelperService,
    ) { }

    // Generate a new return selling invoice ID.
    // The format is RSYY-XXXXXXX (RS26-0000001).
    private async generateReturnInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const yearPrefix = `RS${year}`;

        const latestInvoice = await manager
            .createQueryBuilder(ReturnSellingInvoiceEntity, 'invoice')
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

    // Create a new draft return selling invoice.
    async createDraftReturnSellingInvoice(
        sellingInvoice: SellingInvoiceEntity,
        resolvedProducts: ResolvedReturnSellingProductData[],
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalReturnPrice: number },
        notes: string | null,
        user: AccessTokenPayload
    ): Promise<ReturnSellingInvoiceEntity> {
        return await this.returnSellingInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Create return selling invoice.
            // It is a draft invoice, so it doesn't have a return invoice ID yet.
            const returnSellingInvoice = this.returnSellingInvoiceRepository.create({
                sellingInvoice: sellingInvoice,
                totalProducts: calculatedTotals.totalProducts,
                totalQuantity: calculatedTotals.totalQuantity,
                totalReturnPrice: calculatedTotals.totalReturnPrice,
                notes: notes,
                status: ReturnSellingInvoiceStatus.DRAFT,
                draftBy: user.id,
                draftAt: new Date(),
            });

            const savedInvoice = await transactionalManager.save(ReturnSellingInvoiceEntity, returnSellingInvoice);

            // Create return selling invoice products.
            const products = resolvedProducts.map(item => {
                return this.returnSellingInvoiceProductsRepository.create({
                    returnSellingInvoice: savedInvoice,
                    sellingInvoiceProduct: item.sellingInvoiceProduct,
                    productId: item.sellingInvoiceProduct.productId,
                    productSku: item.sellingInvoiceProduct.productSku,
                    productName: item.sellingInvoiceProduct.productName,
                    productUnit: item.sellingInvoiceProduct.productUnit,
                    returnQuantity: item.returnQuantity,
                    sellingPrice: item.sellingInvoiceProduct.sellingPrice,
                    totalReturnPrice: item.returnQuantity * item.sellingInvoiceProduct.sellingPrice,
                    notes: item.notes,
                });
            });

            await transactionalManager.save(ReturnSellingInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ReturnSellingInvoiceEntity, {
                where: { id: savedInvoice.id },
                relations: ['sellingInvoice', 'returnSellingInvoiceProducts'],
            });

            return invoiceWithRelations || savedInvoice;
        });
    }

    // Edit the draft return selling invoice.
    async editDraftReturnSellingInvoice(
        returnSellingInvoice: ReturnSellingInvoiceEntity,
        resolvedProducts: ResolvedReturnSellingProductData[],
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalReturnPrice: number },
        notes: string | null,
        user: AccessTokenPayload
    ): Promise<ReturnSellingInvoiceEntity> {
        return await this.returnSellingInvoiceRepository.manager.transaction(async (transactionalManager) => {
            
            // Update return selling invoice.
            returnSellingInvoice.totalProducts = calculatedTotals.totalProducts;
            returnSellingInvoice.totalQuantity = calculatedTotals.totalQuantity;
            returnSellingInvoice.totalReturnPrice = calculatedTotals.totalReturnPrice;
            returnSellingInvoice.notes = notes;
            returnSellingInvoice.draftBy = user.id;
            returnSellingInvoice.draftAt = new Date();

            const savedInvoice = await transactionalManager.save(ReturnSellingInvoiceEntity, returnSellingInvoice);

            // Delete old return selling invoice products.
            await transactionalManager.delete(ReturnSellingInvoiceProductsEntity, {
                returnSellingInvoice: { id: savedInvoice.id }
            });

            // Update return selling invoice products.
            const products = resolvedProducts.map(item => {
                return this.returnSellingInvoiceProductsRepository.create({
                    returnSellingInvoice: savedInvoice,
                    sellingInvoiceProduct: item.sellingInvoiceProduct,
                    productId: item.sellingInvoiceProduct.productId,
                    productSku: item.sellingInvoiceProduct.productSku,
                    productName: item.sellingInvoiceProduct.productName,
                    productUnit: item.sellingInvoiceProduct.productUnit,
                    returnQuantity: item.returnQuantity,
                    sellingPrice: item.sellingInvoiceProduct.sellingPrice,
                    totalReturnPrice: item.returnQuantity * item.sellingInvoiceProduct.sellingPrice,
                    notes: item.notes,
                });
            });

            await transactionalManager.save(ReturnSellingInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ReturnSellingInvoiceEntity, {
                where: { id: savedInvoice.id },
                relations: ['sellingInvoice', 'returnSellingInvoiceProducts'],
            });

            return invoiceWithRelations || savedInvoice;
        });
    }

    // Delete draft return selling invoices.
    async deleteDraftReturnSellingInvoice(ids: string[]): Promise<boolean> {
        return await this.returnSellingInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Delete return selling invoice products.
            await transactionalManager.delete(ReturnSellingInvoiceProductsEntity, {
                returnSellingInvoice: { id: In(ids) }
            });

            // Delete return selling invoice.
            await transactionalManager.delete(ReturnSellingInvoiceEntity, { id: In(ids) });

            return true;
        });
    }

    // Confirm a return selling invoice.
    async confirmReturnSellingInvoice(
        returnSellingInvoice: ReturnSellingInvoiceEntity,
        originalSellingInvoice: SellingInvoiceEntity,
        user: AccessTokenPayload
    ): Promise<ReturnSellingInvoiceEntity | null> {

        // Snapshot values before changes for compensation if TCP fails.
        const previousOriginalStatus = originalSellingInvoice.status;
        const previousReturnCount = originalSellingInvoice.returnCount;

        // Step 1: Local transaction - all DB changes atomically.
        const result = await this.returnSellingInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Generate a new return selling invoice ID.
            const returnInvoiceId = await this.generateReturnInvoiceId(transactionalManager);

            // Load return selling invoice products.
            if (!returnSellingInvoice.returnSellingInvoiceProducts) {
                const loadedReturnInvoice = await transactionalManager.findOne(ReturnSellingInvoiceEntity, {
                    where: { id: returnSellingInvoice.id },
                    relations: ['returnSellingInvoiceProducts'],
                });
                if (loadedReturnInvoice) returnSellingInvoice.returnSellingInvoiceProducts = loadedReturnInvoice.returnSellingInvoiceProducts;
            }

            // Load original selling invoice products.
            if (!originalSellingInvoice.sellingInvoiceProducts) {
                const loadedSellingInvoice = await transactionalManager.findOne(SellingInvoiceEntity, {
                    where: { id: originalSellingInvoice.id },
                    relations: ['sellingInvoiceProducts'],
                });
                if (loadedSellingInvoice) originalSellingInvoice.sellingInvoiceProducts = loadedSellingInvoice.sellingInvoiceProducts;
            }

            // Update return selling invoice.
            returnSellingInvoice.returnInvoiceId = returnInvoiceId;
            returnSellingInvoice.status = ReturnSellingInvoiceStatus.CONFIRMED;
            returnSellingInvoice.confirmedBy = user.id;
            returnSellingInvoice.confirmedAt = new Date();

            // Save return selling invoice.
            const savedReturnInvoice = await transactionalManager.save(ReturnSellingInvoiceEntity, returnSellingInvoice);

            // Create a map of return quantities.
            const returnQuantityMap = new Map<string, number>();
            for (const rp of returnSellingInvoice.returnSellingInvoiceProducts || []) {
                returnQuantityMap.set(rp.productId, rp.returnQuantity);
            }

            // Check if the selling invoice is fully returned.
            let isFullyReturned = true;
            // Create a list of products to update.
            const productsToUpdate: SellingInvoiceProductsEntity[] = [];
            for (const originalProduct of originalSellingInvoice.sellingInvoiceProducts || []) {
                const currentReturnQty = returnQuantityMap.get(originalProduct.productId) || 0;
                if (currentReturnQty > 0) originalProduct.returnQuantity += currentReturnQty;
                if (originalProduct.returnQuantity < originalProduct.quantity) isFullyReturned = false;
            }

            // Update the selling invoice products.
            if (productsToUpdate.length > 0) {
                await transactionalManager.save(SellingInvoiceProductsEntity, productsToUpdate);
            }

            // Update the selling invoice status and return count.
            originalSellingInvoice.status = isFullyReturned ? SellingInvoiceStatus.RETURNED : SellingInvoiceStatus.PARTIALLY_RETURNED;
            originalSellingInvoice.returnCount += 1;
            await transactionalManager.save(SellingInvoiceEntity, originalSellingInvoice);

            // Load return selling invoice with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ReturnSellingInvoiceEntity, {
                where: { id: savedReturnInvoice.id },
                relations: ['sellingInvoice', 'returnSellingInvoiceProducts'],
            });

            // Create a stock update DTO.
            const stockUpdateDto: UpdateProductInventoryBulkRequestDto = {
                invoiceType: InvoiceType.RETURN_SELLING,
                invoiceId: returnSellingInvoice.id,
                products: (returnSellingInvoice.returnSellingInvoiceProducts || []).map(p => ({
                    id: p.productId,
                    quantity: p.returnQuantity,
                    action: StockActionType.ADD,
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
            await this.returnSellingInvoiceRepository.manager.transaction(async (transactionalManager) => {
                await transactionalManager.update(ReturnSellingInvoiceEntity, { id: returnSellingInvoice.id }, {
                    returnInvoiceId: null as any,
                    status: ReturnSellingInvoiceStatus.DRAFT,
                    confirmedBy: null as any,
                    confirmedAt: null as any,
                });

                // Revert original selling invoice products' returnQuantity.
                for (const originalProduct of originalSellingInvoice.sellingInvoiceProducts || []) {
                    const returnQty = result.returnQuantityMap.get(originalProduct.productId) || 0;
                    if (returnQty > 0) {
                        originalProduct.returnQuantity -= returnQty;
                        await transactionalManager.save(SellingInvoiceProductsEntity, originalProduct);
                    }
                }

                // Revert original selling invoice status and return count.
                await transactionalManager.update(SellingInvoiceEntity, { id: originalSellingInvoice.id }, {
                    status: previousOriginalStatus,
                    returnCount: previousReturnCount,
                });
            });
            throw error;
        }

        return result.invoice;
    }

    // Get return selling invoice by ID.
    async getReturnSellingInvoiceById(id: string): Promise<ReturnSellingInvoiceEntity | null> {
        return await this.returnSellingInvoiceRepository.findOne({
            where: { id },
            relations: ['returnSellingInvoiceProducts', 'sellingInvoice'],
        });
    }

    // Get a list of return selling invoices.
    async getListOfReturnSellingInvoices(dto: GetListOfReturnSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<{ data: ReturnSellingInvoiceEntity[], total: number }> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const queryBuilder = this.returnSellingInvoiceRepository.createQueryBuilder('invoice');
        queryBuilder.leftJoinAndSelect('invoice.returnSellingInvoiceProducts', 'products');
        queryBuilder.leftJoinAndSelect('invoice.sellingInvoice', 'sellingInvoice');

        // Apply search filters.
        if (search) {
            if (searchBy === 'returnInvoiceId') {
                queryBuilder.andWhere('invoice.returnInvoiceId ILIKE :search', { search: `${search}%` });
            } else if (searchBy === 'sellingInvoiceId') {
                queryBuilder.andWhere('sellingInvoice.invoiceId ILIKE :search', { search: `${search}%` });
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
                qb.where('invoice.status != :draftStatus', { draftStatus: ReturnSellingInvoiceStatus.DRAFT })
                    .orWhere('invoice.draftBy = :userId', { userId: user.id });
            }));
        }

        // Apply date range filters.
        if (fromDate) {
            switch (status) {
                case ReturnSellingInvoiceStatus.DRAFT:
                    queryBuilder.andWhere('invoice.draftAt >= :fromDate', { fromDate });
                    break;
                case ReturnSellingInvoiceStatus.CONFIRMED:
                    queryBuilder.andWhere('invoice.confirmedAt >= :fromDate', { fromDate });
                    break;
                default:
                    queryBuilder.andWhere('invoice.confirmedAt >= :fromDate', { fromDate });
                    break;
            }
        }

        if (toDate) {
            switch (status) {
                case ReturnSellingInvoiceStatus.DRAFT:
                    queryBuilder.andWhere('invoice.draftAt <= :toDate', { toDate });
                    break;
                case ReturnSellingInvoiceStatus.CONFIRMED:
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
            if (status === ReturnSellingInvoiceStatus.DRAFT) sortField = 'invoice.draftAt';
            else sortField = 'invoice.confirmedAt';
        }

        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }
}
