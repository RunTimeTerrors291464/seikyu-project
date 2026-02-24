import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';

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

@Injectable()
export class SellingInvoiceRepository {
    constructor(
        @InjectRepository(SellingInvoiceEntity) private sellingInvoiceRepository: Repository<SellingInvoiceEntity>,
        @InjectRepository(SellingInvoiceProductsEntity) private sellingInvoiceProductsRepository: Repository<SellingInvoiceProductsEntity>,
        private invoiceHelperService: InvoiceHelperService,
    ) { }

    // Generate a new selling invoice ID.
    // The format is SYY-XXXXXXX (S26-0000001).
    private async generateInvoiceId(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const yearPrefix = `S${year}`;

        // Find the latest invoice with the same year prefix.
        const latestInvoice = await this.sellingInvoiceRepository
            .createQueryBuilder('invoice')
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
    async createSellingInvoice(dto: CreateSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<SellingInvoiceEntity> {
        return await this.sellingInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Generate invoice ID.
            const invoiceId = await this.generateInvoiceId();

            // Fetch product details from the platform service.
            const productSkus = dto.products.map(p => p.productSku);
            const productDetails = await Promise.all(
                productSkus.map(sku => this.invoiceHelperService.getProductBySku(sku))
            );

            // Build a lookup map: productSku -> product details.
            const productMap = new Map(
                productDetails.map(p => [p.sku, p])
            );

            // Calculate totals.
            const totalProducts = dto.products.length;
            let totalQuantity = 0;
            let totalSellingPrice = 0;
            const invoiceDiscount = dto.invoiceDiscount ?? 0;

            // If the product has its own discount, it overrides the invoice-level discount.
            const resolveDiscountRate = (productDiscount: number | null | undefined): number => {
                return (productDiscount != null && productDiscount > 0)
                    ? productDiscount
                    : invoiceDiscount;
            };

            dto.products.forEach(product => {
                totalQuantity += product.quantity;
                const detail = productMap.get(product.productSku);
                const unitPrice = detail?.sellingPrice ?? 0;
                const discountRate = resolveDiscountRate(product.productDiscount);
                const subtotal = product.quantity * unitPrice;
                totalSellingPrice += subtotal * (1 - discountRate / 100);
            });

            // Create and save the selling invoice.
            const sellingInvoice = this.sellingInvoiceRepository.create({
                invoiceId,
                totalProducts,
                totalQuantity,
                invoiceDiscount,
                totalSellingPrice,
                notes: dto.notes ?? null,
                status: SellingInvoiceStatus.CONFIRMED,
                confirmedBy: user.id,
                confirmedAt: new Date(),
            });

            const savedInvoice = await transactionalManager.save(SellingInvoiceEntity, sellingInvoice);

            // Update inventory stock AFTER saving to DB so we have the UUID.
            // If the platform service call fails, the transaction is rolled back.
            const stockUpdateDto: UpdateProductInventoryBulkRequestDto = {
                invoiceType: InvoiceType.SELLING,
                invoiceId: savedInvoice.id,
                products: dto.products.map(p => ({
                    id: productMap.get(p.productSku)?.id ?? '',
                    quantity: p.quantity,
                    action: StockActionType.SUBTRACT,
                })),
            };
            await this.invoiceHelperService.updateProductInventoryStockBulk(stockUpdateDto);

            // Create selling invoice products.
            const products = dto.products.map(product => {
                const detail = productMap.get(product.productSku);
                const unitPrice = detail?.sellingPrice ?? 0;
                const discountRate = resolveDiscountRate(product.productDiscount);
                const subtotal = product.quantity * unitPrice;
                const totalProductPrice = subtotal * (1 - discountRate / 100);
                return this.sellingInvoiceProductsRepository.create({
                    sellingInvoice: savedInvoice,
                    productId: detail?.id ?? '',
                    productSku: detail?.sku ?? '',
                    productName: detail?.productNames?.[0] ?? '',
                    productUnit: detail?.productUnitName ?? '',
                    quantity: product.quantity,
                    sellingPrice: unitPrice,
                    productDiscount: discountRate,
                    totalSellingPrice: totalProductPrice,
                    notes: product.notes ?? null,
                });
            });

            await transactionalManager.save(SellingInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(SellingInvoiceEntity, {
                where: { id: savedInvoice.id },
                relations: ['sellingInvoiceProducts'],
            });

            return invoiceWithRelations || savedInvoice;
        });
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
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate } = dto;

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