import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets } from 'typeorm';

// Import error exceptions.
import { Role } from '@app/common/enums/role.enum';
import { SellingInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@app/common/enums/invoiceType.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

// Import entities.
import { SellingInvoiceEntity } from '../entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '../entities/sellingInvoiceProducts.entity';

// Import DTOs.
import {
    CreateSellingInvoiceRequestDto,
    GetListOfSellingInvoiceRequestDto
} from '@app/common/dtos/invoices/sellingInvoices/crudSellingInvoicesRequest.dto';
import { UpdateProductInventoryBulkRequestDto } from '@app/common/dtos/platform/products/crudProductRequest.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import helper service.
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Interface for resolved products from service.
export interface ResolvedSellingProductData {
    productSku: string;
    productId: string;
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
        private invoiceHelperService: InvoiceHelperService,
    ) { }

    // Generate a new selling invoice ID.
    // The format is SYY-XXXXXXX (S26-0000001).
    private async generateInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const yearPrefix = `S${year}`;

        const latestInvoice = await manager
            .createQueryBuilder(SellingInvoiceEntity, 'invoice')
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

    // Create a new selling invoice.
    async createSellingInvoice(
        dto: CreateSellingInvoiceRequestDto,
        user: AccessTokenPayload,
        calculatedTotals: {
            totalProducts: number;
            totalQuantity: number;
            totalSellingPrice: number;
            invoiceDiscount: number;
            resolvedProducts: ResolvedSellingProductData[];
        }
    ): Promise<SellingInvoiceEntity> {

        // Step 1: Local transaction - save invoice + products in one atomic operation.
        const { invoice, stockUpdateDto } = await this.sellingInvoiceRepository.manager.transaction(async (transactionalManager) => {

            const invoiceId = await this.generateInvoiceId(transactionalManager);

            const sellingInvoice = this.sellingInvoiceRepository.create({
                invoiceId,
                totalProducts: calculatedTotals.totalProducts,
                totalQuantity: calculatedTotals.totalQuantity,
                invoiceDiscount: calculatedTotals.invoiceDiscount,
                totalSellingPrice: calculatedTotals.totalSellingPrice,
                notes: dto.notes ?? null,
                status: SellingInvoiceStatus.CONFIRMED,
                confirmedBy: user.id,
                confirmedAt: new Date(),
            });
            const savedInvoice = await transactionalManager.save(SellingInvoiceEntity, sellingInvoice);

            const products = calculatedTotals.resolvedProducts.map(item => {
                return this.sellingInvoiceProductsRepository.create({
                    sellingInvoice: savedInvoice,
                    productId: item.productId,
                    productSku: item.productSku,
                    productName: item.productName,
                    productUnit: item.productUnit,
                    quantity: item.quantity,
                    sellingPrice: item.sellingPrice,
                    productDiscount: item.appliedDiscount,
                    totalSellingPrice: item.totalProductPrice,
                    notes: item.notes,
                });
            });
            await transactionalManager.save(SellingInvoiceProductsEntity, products);

            const invoiceWithRelations = await transactionalManager.findOne(SellingInvoiceEntity, {
                where: { id: savedInvoice.id },
                relations: ['sellingInvoiceProducts'],
            });

            const stockDto: UpdateProductInventoryBulkRequestDto = {
                invoiceType: InvoiceType.SELLING,
                invoiceId: savedInvoice.id,
                products: calculatedTotals.resolvedProducts.map(p => ({
                    id: p.productId,
                    quantity: p.quantity,
                    action: StockActionType.SUBTRACT,
                })),
            };

            return { invoice: invoiceWithRelations || savedInvoice, stockUpdateDto: stockDto };
        });

        // Step 2: TCP call for updating product inventory stock.
        try {
            await this.invoiceHelperService.updateProductInventoryStockBulk(stockUpdateDto);
        } catch (error) {
            // Step 3: In case of error, rollback the local transaction.
            await this.sellingInvoiceRepository.manager.transaction(async (transactionalManager) => {
                await transactionalManager.delete(SellingInvoiceProductsEntity, { sellingInvoice: { id: invoice.id } });
                await transactionalManager.delete(SellingInvoiceEntity, { id: invoice.id });
            });
            throw error;
        }

        return invoice;
    }

    // Get a selling invoice by id. 
    async getSellingInvoiceById(id: string): Promise<SellingInvoiceEntity | null> {
        return await this.sellingInvoiceRepository.findOne({
            where: { id },
            relations: ['sellingInvoiceProducts'],
        }); 
    }

    // Get a list of selling invoices.
    async getListOfSellingInvoices(dto: GetListOfSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<{ data: SellingInvoiceEntity[], total: number }> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const queryBuilder = this.sellingInvoiceRepository.createQueryBuilder('invoice');
        queryBuilder.leftJoinAndSelect('invoice.sellingInvoiceProducts', 'products');

        // Apply search filters.
        if (search) {
            if (searchBy === 'invoiceId') {
                queryBuilder.andWhere('invoice.invoiceId ILIKE :search', { search: `${search}%` });
            } else if (searchBy === 'userId') {
                queryBuilder.andWhere('invoice.confirmedBy = :search', { search });
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

        // Apply date range filters.
        if (fromDate) {
            queryBuilder.andWhere('invoice.confirmedAt >= :fromDate', { fromDate });
        }

        if (toDate) {
            queryBuilder.andWhere('invoice.confirmedAt <= :toDate', { toDate });
        }

        // Apply sorting.
        let sortField = 'invoice.confirmedAt';
        if (sortBy === 'invoiceId') sortField = 'invoice.invoiceId';
        else if (sortBy === 'totalSellingPrice') sortField = 'invoice.totalSellingPrice';
        else if (sortBy === 'confirmedAt') sortField = 'invoice.confirmedAt';

        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }

}