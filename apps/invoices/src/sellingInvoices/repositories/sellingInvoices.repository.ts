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
            const productIds = dto.products.map(p => p.productId);
            const productDetails = await Promise.all(
                productIds.map(id => this.invoiceHelperService.getProductById(id))
            );

            // Build a lookup map: productId -> product details.
            const productMap = new Map(
                productDetails.map(p => [p.id, p])
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
                const detail = productMap.get(product.productId);
                const unitPrice = detail?.sellingPrice ?? 0;
                const discountRate = resolveDiscountRate(product.productDiscount);
                const subtotal = product.quantity * unitPrice;
                totalSellingPrice += subtotal * (1 - discountRate / 100);
            });

            // Update inventory stock BEFORE saving to DB.
            // If the platform service call fails, the transaction is rolled back.
            const stockUpdateDto: UpdateProductInventoryBulkRequestDto = {
                invoiceType: InvoiceType.SELLING,
                invoiceId: invoiceId,
                products: dto.products.map(p => ({
                    id: p.productId,
                    quantity: p.quantity,
                    action: StockActionType.SUBTRACT,
                })),
            };
            await this.invoiceHelperService.updateProductInventoryStockBulk(stockUpdateDto);

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

            // Create selling invoice products.
            const products = dto.products.map(product => {
                const detail = productMap.get(product.productId);
                const unitPrice = detail?.sellingPrice ?? 0;
                const discountRate = resolveDiscountRate(product.productDiscount);
                const subtotal = product.quantity * unitPrice;
                const totalProductPrice = subtotal * (1 - discountRate / 100);
                return this.sellingInvoiceProductsRepository.create({
                    sellingInvoice: savedInvoice,
                    productId: product.productId,
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
}