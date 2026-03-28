import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets } from 'typeorm';

// Import enums.
import { Role } from '@app/common/enums/role.enum';
import { StockAdjustmentInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@app/common/enums/invoiceType.enum';

// Import entities.
import { StockAdjustmentInvoiceEntity } from '../entities/stockAdjustmentInvoices.entity';
import { StockAdjustmentInvoiceProductsEntity } from '../entities/stockAdjustmentInvoiceProducts.entity';

// Import DTOs.
import {
    CreateStockAdjustmentInvoiceRequestDto,
    EditStockAdjustmentInvoiceRequestDto,
    GetListOfStockAdjustmentInvoiceRequestDto,
} from '@app/common/dtos/invoices/stockAdjustmentInvoices/crudStockAdjustmentInvoicesRequest.dto';
import { UpdateProductInventoryBulkRequestDto } from '@app/common/dtos/platform/products/crudProductRequest.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import helper service.
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

@Injectable()
export class StockAdjustmentInvoiceRepository {
    constructor(
        @InjectRepository(StockAdjustmentInvoiceEntity) private stockAdjustmentInvoiceRepository: Repository<StockAdjustmentInvoiceEntity>,
        @InjectRepository(StockAdjustmentInvoiceProductsEntity) private stockAdjustmentInvoiceProductsRepository: Repository<StockAdjustmentInvoiceProductsEntity>,
        private invoiceHelperService: InvoiceHelperService,
    ) { }

    // Generate a new stock adjustment invoice ID.
    // The format is SAYY-XXXXXXX (SA26-0000001).
    private async generateInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const yearPrefix = `SA${year}`;

        const latestInvoice = await manager
            .createQueryBuilder(StockAdjustmentInvoiceEntity, 'invoice')
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

    // Create a new draft stock adjustment invoice.
    async createDraftStockAdjustmentInvoice(
        dto: CreateStockAdjustmentInvoiceRequestDto,
        user: AccessTokenPayload,
        calculatedTotals: { totalProducts: number; totalQuantity: number },
    ): Promise<StockAdjustmentInvoiceEntity> {
        return await this.stockAdjustmentInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Create stock adjustment invoice as draft.
            const invoice = this.stockAdjustmentInvoiceRepository.create({
                totalProducts: calculatedTotals.totalProducts,
                totalQuantity: calculatedTotals.totalQuantity,
                actionReason: dto.actionReason,
                notes: dto.notes ?? null,
                status: StockAdjustmentInvoiceStatus.DRAFT,
                draftBy: user.id,
                draftAt: new Date(),
            });

            const savedInvoice = await transactionalManager.save(StockAdjustmentInvoiceEntity, invoice);

            // Create stock adjustment invoice products.
            const products = dto.products.map(product => {
                return this.stockAdjustmentInvoiceProductsRepository.create({
                    stockAdjustmentInvoice: savedInvoice,
                    productId: product.productId,
                    productSku: product.productSku,
                    productName: product.productName,
                    productUnit: product.productUnit,
                    action: product.action,
                    quantity: product.quantity,
                    notes: product.notes ?? null,
                });
            });

            await transactionalManager.save(StockAdjustmentInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(StockAdjustmentInvoiceEntity, {
                where: { id: savedInvoice.id },
                relations: ['stockAdjustmentInvoiceProducts'],
            });

            return invoiceWithRelations || savedInvoice;
        });
    }

    // Edit a draft stock adjustment invoice.
    async editDraftStockAdjustmentInvoice(
        dto: EditStockAdjustmentInvoiceRequestDto,
        invoice: StockAdjustmentInvoiceEntity,
        calculatedTotals: { totalProducts: number; totalQuantity: number },
        user: AccessTokenPayload,
    ): Promise<StockAdjustmentInvoiceEntity> {
        return await this.stockAdjustmentInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Update invoice details.
            invoice.totalProducts = calculatedTotals.totalProducts;
            invoice.totalQuantity = calculatedTotals.totalQuantity;
            invoice.actionReason = dto.actionReason ?? invoice.actionReason;
            invoice.notes = dto.notes ?? null;
            invoice.draftBy = user.id;
            invoice.draftAt = new Date();

            await transactionalManager.save(StockAdjustmentInvoiceEntity, invoice);

            // Delete existing products.
            await transactionalManager.delete(StockAdjustmentInvoiceProductsEntity, {
                stockAdjustmentInvoice: { id: invoice.id },
            });

            // Create new products.
            const products = dto.products.map(product => {
                return this.stockAdjustmentInvoiceProductsRepository.create({
                    stockAdjustmentInvoice: invoice,
                    productId: product.productId,
                    productSku: product.productSku,
                    productName: product.productName,
                    productUnit: product.productUnit,
                    action: product.action,
                    quantity: product.quantity,
                    notes: product.notes ?? null,
                });
            });

            await transactionalManager.save(StockAdjustmentInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(StockAdjustmentInvoiceEntity, {
                where: { id: invoice.id },
                relations: ['stockAdjustmentInvoiceProducts'],
            });

            return invoiceWithRelations || invoice;
        });
    }

    // Delete draft stock adjustment invoices.
    async deleteDraftStockAdjustmentInvoice(ids: string[]): Promise<boolean> {
        return await this.stockAdjustmentInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Delete related products first.
            await transactionalManager.delete(StockAdjustmentInvoiceProductsEntity, {
                stockAdjustmentInvoice: { id: In(ids) },
            });

            // Delete invoices.
            await transactionalManager.delete(StockAdjustmentInvoiceEntity, {
                id: In(ids),
            });

            return true;
        });
    }

    // Confirm a draft stock adjustment invoice.
    async confirmStockAdjustmentInvoice(invoice: StockAdjustmentInvoiceEntity, user: AccessTokenPayload): Promise<StockAdjustmentInvoiceEntity | null> {

        // Step 1: Local transaction - confirm invoice in DB.
        const result = await this.stockAdjustmentInvoiceRepository.manager.transaction(async (transactionalManager) => {

            const invoiceId = await this.generateInvoiceId(transactionalManager);

            let products = invoice.stockAdjustmentInvoiceProducts;
            if (!products) {
                const loadedInvoice = await transactionalManager.findOne(StockAdjustmentInvoiceEntity, {
                    where: { id: invoice.id },
                    relations: ['stockAdjustmentInvoiceProducts'],
                });
                if (!loadedInvoice) return null;
                products = loadedInvoice.stockAdjustmentInvoiceProducts;
            }

            invoice.invoiceId = invoiceId;
            invoice.status = StockAdjustmentInvoiceStatus.CONFIRMED;
            invoice.confirmedBy = user.id;
            invoice.confirmedAt = new Date();

            await transactionalManager.save(StockAdjustmentInvoiceEntity, invoice);

            const invoiceWithRelations = await transactionalManager.findOne(StockAdjustmentInvoiceEntity, {
                where: { id: invoice.id },
                relations: ['stockAdjustmentInvoiceProducts'],
            });

            const stockUpdateDto: UpdateProductInventoryBulkRequestDto = {
                invoiceType: InvoiceType.STOCK_ADJUSTMENT,
                invoiceId: invoice.id,
                products: products.map(p => ({
                    id: p.productId,
                    quantity: p.quantity,
                    action: p.action,
                })),
            };

            return { invoice: invoiceWithRelations || invoice, stockUpdateDto };
        });

        if (!result) return null;

        // Step 2: TCP call for updating product inventory stock.
        try {
            await this.invoiceHelperService.updateProductInventoryStockBulk(result.stockUpdateDto);
        } catch (error) {
            // Step 3: In case of error, rollback the local transaction.
            await this.stockAdjustmentInvoiceRepository.manager.transaction(async (transactionalManager) => {
                await transactionalManager.update(StockAdjustmentInvoiceEntity, { id: invoice.id }, {
                    invoiceId: null as any,
                    status: StockAdjustmentInvoiceStatus.DRAFT,
                    confirmedBy: null as any,
                    confirmedAt: null as any,
                });
            });
            throw error;
        }

        return result.invoice;
    }

    // Get stock adjustment invoice by id.
    async getStockAdjustmentInvoiceById(id: string): Promise<StockAdjustmentInvoiceEntity | null> {
        return this.stockAdjustmentInvoiceRepository.findOne({
            where: { id },
            relations: ['stockAdjustmentInvoiceProducts'],
        });
    }

    // Get stock adjustment invoices by ids.
    async getStockAdjustmentInvoicesByIds(ids: string[]): Promise<StockAdjustmentInvoiceEntity[]> {
        return await this.stockAdjustmentInvoiceRepository.find({
            where: { id: In(ids) },
        });
    }

    // Get a list of stock adjustment invoices.
    async getListOfStockAdjustmentInvoices(dto: GetListOfStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload): Promise<{ data: StockAdjustmentInvoiceEntity[], total: number }> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status, actionReason } = dto;

        const queryBuilder = this.stockAdjustmentInvoiceRepository.createQueryBuilder('invoice');
        queryBuilder.leftJoinAndSelect('invoice.stockAdjustmentInvoiceProducts', 'products');

        // Apply search filters.
        if (search) {
            if (searchBy === 'invoiceId') {
                queryBuilder.andWhere('invoice.invoiceId ILIKE :search', { search: `${search}%` });
            } else if (searchBy === 'userId') {
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('invoice.draftBy = :search', { search })
                        .orWhere('invoice.confirmedBy = :search', { search });
                }));
            } else if (searchBy === 'productId') {
                queryBuilder.andWhere('products.productId = :search', { search });
            } else {
                queryBuilder.andWhere('invoice.invoiceId ILIKE :search', { search: `${search}%` });
            }
        }

        // Apply status filter.
        if (status !== undefined) {
            queryBuilder.andWhere('invoice.status = :status', { status });
        }

        // Apply action reason filter.
        if (actionReason !== undefined) {
            queryBuilder.andWhere('invoice.actionReason = :actionReason', { actionReason });
        }

        // Apply role-based filter: non-admin can only see their own drafts.
        const isAdmin = user.roles.some(role => role === Role.ADMIN);
        if (!isAdmin) {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where('invoice.status != :draftStatus', { draftStatus: StockAdjustmentInvoiceStatus.DRAFT })
                    .orWhere('invoice.draftBy = :userId', { userId: user.id });
            }));
        }

        // Apply date range filters.
        if (fromDate) {
            if (status === StockAdjustmentInvoiceStatus.DRAFT) {
                queryBuilder.andWhere('invoice.draftAt >= :fromDate', { fromDate });
            } else {
                queryBuilder.andWhere('invoice.confirmedAt >= :fromDate', { fromDate });
            }
        }

        if (toDate) {
            if (status === StockAdjustmentInvoiceStatus.DRAFT) {
                queryBuilder.andWhere('invoice.draftAt <= :toDate', { toDate });
            } else {
                queryBuilder.andWhere('invoice.confirmedAt <= :toDate', { toDate });
            }
        }

        // Apply sorting.
        let sortField = 'invoice.draftAt';
        if (sortBy === 'invoiceId') sortField = 'invoice.invoiceId';
        else if (sortBy === 'totalQuantity') sortField = 'invoice.totalQuantity';
        else if (sortBy === 'createdAt') {
            sortField = status === StockAdjustmentInvoiceStatus.DRAFT ? 'invoice.draftAt' : 'invoice.confirmedAt';
        }

        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }
}
