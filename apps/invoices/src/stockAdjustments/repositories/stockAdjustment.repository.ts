import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';

// Import entities.
import { StockAdjustmentEntity } from '../entities/stockAdjustment.entity';
import { StockAdjustmentProductsEntity } from '../entities/stockAdjustmentProducts.entity';

// Import DTOs.
import {
    CreateStockAdjustmentRequestDto,
    EditStockAdjustmentRequestDto,
    GetListOfStockAdjustmentRequestDto
} from '@app/common/dtos/invoices/stockAdjustments/crudStockAdjustmentRequest.dto';
import { UpdateProductInventoryBulkRequestDto } from '@app/common/dtos/platform/products/crudProductRequest.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import helper repository.
import { InvoiceHelperRepository } from '../../importInvoices/repositories/invoiceHelper.repository';

// Import enums.
import { Role } from '@app/common/enums/role.enum';
import { StockAdjustmentStatus } from '@app/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@app/common/enums/invoiceType.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';
import { StockAdjustmentType } from '@app/common/enums/stockAdjustmentType.enum';

@Injectable()
export class StockAdjustmentRepository {
    constructor(
        @InjectRepository(StockAdjustmentEntity) private stockAdjustmentRepository: Repository<StockAdjustmentEntity>,
        @InjectRepository(StockAdjustmentProductsEntity) private stockAdjustmentProductRepository: Repository<StockAdjustmentProductsEntity>,
        private invoiceHelperRepository: InvoiceHelperRepository,
    ) { }

    // Generate a new stock adjustment ID.
    // The format is SAYY-XXXXXXX (SA26-0000001).
    private async generateAdjustmentId(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const yearPrefix = `SA${year}`;

        // Find the latest adjustment with the same year prefix.
        const latestAdjustment = await this.stockAdjustmentRepository
            .createQueryBuilder('adjustment')
            .where('adjustment.adjustmentId LIKE :prefix', { prefix: `${yearPrefix}-%` })
            .orderBy('LENGTH(adjustment.adjustmentId)', 'DESC')
            .addOrderBy('adjustment.adjustmentId', 'DESC')
            .getOne();

        let sequence = 1;
        if (latestAdjustment && latestAdjustment.adjustmentId) {
            const lastSequence = parseInt(latestAdjustment.adjustmentId.split('-')[1]);
            sequence = lastSequence + 1;
        }
        return `${yearPrefix}-${sequence.toString().padStart(7, '0')}`;
    }

    // Create a new draft stock adjustment.
    async createDraftStockAdjustment(dto: CreateStockAdjustmentRequestDto, user: AccessTokenPayload): Promise<StockAdjustmentEntity> {
        return await this.stockAdjustmentRepository.manager.transaction(async (transactionalManager) => {

            // Calculate totals.
            let totalProducts = dto.products.length;
            let totalIncrease = 0;
            let totalDecrease = 0;

            dto.products.forEach(product => {
                if (product.type === StockActionType.ADD) {
                    totalIncrease += product.quantity;
                } else {
                    totalDecrease += product.quantity;
                }
            });

            // Create stock adjustment.
            const stockAdjustment = this.stockAdjustmentRepository.create({
                totalProducts,
                totalIncrease,
                totalDecrease,
                notes: dto.notes ?? null,
                stockAdjustmentType: dto.stockAdjustmentType,
                referenceId: dto.referenceId ?? null,
                status: StockAdjustmentStatus.DRAFT,
                draftBy: user.id,
                draftAt: new Date(),
            });

            const savedAdjustment = await transactionalManager.save(StockAdjustmentEntity, stockAdjustment);

            // Create products.
            const products = dto.products.map(product => {
                return this.stockAdjustmentProductRepository.create({
                    stockAdjustment: savedAdjustment,
                    productId: product.productId,
                    productSku: product.productSku,
                    productName: product.productName,
                    productUnit: product.productUnit,
                    quantity: product.quantity,
                    type: product.type,
                    notes: product.notes ?? null,
                });
            });

            await transactionalManager.save(StockAdjustmentProductsEntity, products);

            // Reload with relations.
            const adjustmentWithRelations = await transactionalManager.findOne(StockAdjustmentEntity, {
                where: { id: savedAdjustment.id },
                relations: ['stockAdjustmentProducts'],
            });

            return adjustmentWithRelations || savedAdjustment;
        });
    }

    // Edit a draft stock adjustment.
    async editDraftStockAdjustment(dto: EditStockAdjustmentRequestDto, adjustment: StockAdjustmentEntity, user: AccessTokenPayload): Promise<StockAdjustmentEntity> {
        return await this.stockAdjustmentRepository.manager.transaction(async (transactionalManager) => {

            // Calculate totals.
            let totalProducts = dto.products.length;
            let totalIncrease = 0;
            let totalDecrease = 0;

            dto.products.forEach(product => {
                if (product.type === StockActionType.ADD) {
                    totalIncrease += product.quantity;
                } else {
                    totalDecrease += product.quantity;
                }
            });

            // Update adjustment details.
            adjustment.totalProducts = totalProducts;
            adjustment.totalIncrease = totalIncrease;
            adjustment.totalDecrease = totalDecrease;
            adjustment.draftBy = user.id;
            adjustment.draftAt = new Date();
            adjustment.notes = dto.notes ?? null;
            adjustment.stockAdjustmentType = dto.stockAdjustmentType;
            adjustment.referenceId = dto.referenceId ?? null;

            await transactionalManager.save(StockAdjustmentEntity, adjustment);

            // Delete existing products.
            await transactionalManager.delete(StockAdjustmentProductsEntity, {
                stockAdjustment: { id: adjustment.id },
            });

            // Create new products.
            const products = dto.products.map(product => {
                return this.stockAdjustmentProductRepository.create({
                    stockAdjustment: adjustment,
                    productId: product.productId,
                    productSku: product.productSku,
                    productName: product.productName,
                    productUnit: product.productUnit,
                    quantity: product.quantity,
                    type: product.type,
                    notes: product.notes ?? null,
                });
            });

            await transactionalManager.save(StockAdjustmentProductsEntity, products);

            // Reload with relations.
            const adjustmentWithRelations = await transactionalManager.findOne(StockAdjustmentEntity, {
                where: { id: adjustment.id },
                relations: ['stockAdjustmentProducts'],
            });

            return adjustmentWithRelations || adjustment;
        });
    }

    // Delete draft stock adjustment.
    async deleteDraftStockAdjustment(ids: string[]): Promise<boolean> {
        return await this.stockAdjustmentRepository.manager.transaction(async (transactionalManager) => {

            // Delete adjustments.
            await transactionalManager.delete(StockAdjustmentEntity, {
                id: In(ids)
            });

            return true;
        });
    }

    // Confirm a draft stock adjustment.
    async confirmStockAdjustment(adjustment: StockAdjustmentEntity, user: AccessTokenPayload): Promise<StockAdjustmentEntity | null> {
        return await this.stockAdjustmentRepository.manager.transaction(async (transactionalManager) => {

            // Generate adjustment ID.
            const adjustmentId = await this.generateAdjustmentId();

            // Update adjustment details.
            adjustment.adjustmentId = adjustmentId;
            adjustment.status = StockAdjustmentStatus.CONFIRMED;
            adjustment.confirmedBy = user.id;
            adjustment.confirmedAt = new Date();

            await transactionalManager.save(StockAdjustmentEntity, adjustment);

            // Load products if relations are missing.
            let products = adjustment.stockAdjustmentProducts;
            if (!products) {
                const loadedAdjustment = await transactionalManager.findOne(StockAdjustmentEntity, {
                    where: { id: adjustment.id },
                    relations: ['stockAdjustmentProducts'],
                });
                if (!loadedAdjustment) return null;
                products = loadedAdjustment.stockAdjustmentProducts;
            }

            // Update inventory stock.
            // Increase type -> add stock
            // Decrease type -> subtract stock
            const stockUpdateDto: UpdateProductInventoryBulkRequestDto = {
                invoiceType: InvoiceType.STOCK_ADJUSTMENT,
                invoiceId: adjustment.id,
                products: products.map(p => ({
                    id: p.productId,
                    quantity: p.quantity,
                    action: p.type === StockActionType.ADD ? StockActionType.ADD : StockActionType.SUBTRACT,
                })),
            };

            await this.invoiceHelperRepository.updateProductInventoryStockBulk(stockUpdateDto);

            // Reload with relations.
            const adjustmentWithRelations = await transactionalManager.findOne(StockAdjustmentEntity, {
                where: { id: adjustment.id },
                relations: ['stockAdjustmentProducts'],
            });

            return adjustmentWithRelations || adjustment;
        });
    }

    // Get stock adjustment by id.
    async getStockAdjustmentById(id: string): Promise<StockAdjustmentEntity | null> {
        return this.stockAdjustmentRepository.findOne({
            where: { id },
            relations: ['stockAdjustmentProducts'],
        });
    }

    // Get a list of stock adjustments.
    async getListOfStockAdjustments(dto: GetListOfStockAdjustmentRequestDto, user: AccessTokenPayload): Promise<{ data: StockAdjustmentEntity[], total: number }> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const queryBuilder = this.stockAdjustmentRepository.createQueryBuilder('adjustment');
        queryBuilder.leftJoinAndSelect('adjustment.stockAdjustmentProducts', 'products');

        // Apply search filters.
        if (search) {
            if (searchBy === 'adjustmentId') {
                queryBuilder.andWhere('adjustment.adjustmentId ILIKE :search', { search: `${search}%` });
            } else if (searchBy === 'userId') {
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('adjustment.draftBy = :search', { search })
                        .orWhere('adjustment.confirmedBy = :search', { search });
                }));
            } else if (searchBy === 'referenceId') {
                queryBuilder.andWhere('CAST(adjustment.referenceId AS TEXT) ILIKE :search', { search: `${search}%` });
            } else if (searchBy === 'productId') {
                queryBuilder.andWhere('products.productId = :search', { search });
            } else {
                queryBuilder.andWhere('adjustment.adjustmentId ILIKE :search', { search: `${search}%` });
            }
        }

        // Apply stock adjustment type filter.
        if (dto.stockAdjustmentType) {
            queryBuilder.andWhere('adjustment.stockAdjustmentType = :type', { type: dto.stockAdjustmentType });
        }

        // Apply status filter.
        if (status !== undefined) {
            queryBuilder.andWhere('adjustment.status = :status', { status });
        }

        // Apply role-based filtering.
        const isAdmin = user.roles.some(role => role === Role.ADMIN);

        if (!isAdmin) {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where('adjustment.status != :draftStatus', { draftStatus: StockAdjustmentStatus.DRAFT })
                    .orWhere('adjustment.draftBy = :userId', { userId: user.id });
            }));
        }

        // Apply date range filters.
        if (fromDate) {
            switch (status) {
                case StockAdjustmentStatus.DRAFT:
                    queryBuilder.andWhere('adjustment.draftAt >= :fromDate', { fromDate });
                    break;
                case StockAdjustmentStatus.CONFIRMED:
                    queryBuilder.andWhere('adjustment.confirmedAt >= :fromDate', { fromDate });
                    break;
                default:
                    queryBuilder.andWhere('adjustment.confirmedAt >= :fromDate', { fromDate });
                    break;
            }
        }

        if (toDate) {
            switch (status) {
                case StockAdjustmentStatus.DRAFT:
                    queryBuilder.andWhere('adjustment.draftAt <= :toDate', { toDate });
                    break;
                case StockAdjustmentStatus.CONFIRMED:
                    queryBuilder.andWhere('adjustment.confirmedAt <= :toDate', { toDate });
                    break;
                default:
                    queryBuilder.andWhere('adjustment.confirmedAt <= :toDate', { toDate });
                    break;
            }
        }

        // Apply sorting.
        let sortField = 'adjustment.draftAt';

        if (sortBy === 'adjustmentId') sortField = 'adjustment.adjustmentId';
        else if (sortBy === 'totalProducts') sortField = 'adjustment.totalProducts';
        else if (sortBy === 'totalIncrease') sortField = 'adjustment.totalIncrease';
        else if (sortBy === 'totalDecrease') sortField = 'adjustment.totalDecrease';
        else if (sortBy === 'createdAt') {
            if (status === StockAdjustmentStatus.DRAFT) sortField = 'adjustment.draftAt';
            else if (status === StockAdjustmentStatus.CONFIRMED) sortField = 'adjustment.confirmedAt';
            else sortField = 'adjustment.draftAt';
        }

        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }
}
