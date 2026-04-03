import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In, Brackets } from 'typeorm';

// Import error exceptions.
import { Role } from '@app/common/enums/role.enum';
import { ImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';
import { InvoiceType } from '@app/common/enums/invoiceType.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

// Import entities.
import { ImportInvoiceEntity } from '../entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from '../entities/importInvocieProducts.entity';

// Import DTOs.
import {
    CreateImportInvoiceRequestDto,
    EditImportInvoiceRequestDto,
    GetListOfImportInvoiceRequestDto
} from '@app/common/dtos/invoices/importInvoices/crudImportInvoicesRequest.dto';
import { UpdateProductInventoryBulkRequestDto } from '@app/common/dtos/platform/products/crudProductRequest.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import helper service.
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

@Injectable()
export class ImportInvoiceRepository {
    constructor(
        @InjectRepository(ImportInvoiceEntity) private importInvoiceRepository: Repository<ImportInvoiceEntity>,
        @InjectRepository(ImportInvoiceProductsEntity) private importInvoiceProductsRepository: Repository<ImportInvoiceProductsEntity>,
        private invoiceHelperService: InvoiceHelperService,
    ) { }

    // Generate a new import invoice ID.
    // The format is IYY-XXXXXXX (I26-0000001).
    private async generateInvoiceId(manager: EntityManager): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const yearPrefix = `I${year}`;

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

    // Create a new import invoice.
    async createDraftImportInvoice(
        dto: CreateImportInvoiceRequestDto,
        user: AccessTokenPayload,
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalImportPrice: number }
    ): Promise<ImportInvoiceEntity> {
        return await this.importInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Create import invoice. 
            // It is a draft invoice, so it doesn't have an invoice ID yet.
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

            const savedInvoice = await transactionalManager.save(ImportInvoiceEntity, importInvoice);

            // Create import invoice products.
            const products = dto.products.map(product => {
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

            await transactionalManager.save(ImportInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ImportInvoiceEntity, {
                where: { id: savedInvoice.id },
                relations: ['importInvoiceProducts'],
            });

            return invoiceWithRelations || savedInvoice;
        });
    }

    // Edit a draft import invoice.
    async editDraftImportInvoice(
        dto: EditImportInvoiceRequestDto,
        invoice: ImportInvoiceEntity,
        calculatedTotals: { totalProducts: number; totalQuantity: number; totalImportPrice: number },
        user: AccessTokenPayload,
    ): Promise<ImportInvoiceEntity> {
        return await this.importInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Update invoice details.
            invoice.totalProducts = calculatedTotals.totalProducts;
            invoice.totalQuantity = calculatedTotals.totalQuantity;
            invoice.totalImportPrice = calculatedTotals.totalImportPrice;
            invoice.draftBy = user.id;
            invoice.draftAt = new Date();
            invoice.notes = dto.notes ?? null;
            invoice.returnCount = 0;

            await transactionalManager.save(ImportInvoiceEntity, invoice);

            // Delete existing products.
            await transactionalManager.delete(ImportInvoiceProductsEntity, {
                importInvoice: { id: invoice.id },
            });

            // Create new import invoice products.
            const products = dto.products.map(product => {
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

            await transactionalManager.save(ImportInvoiceProductsEntity, products);

            // Reload with relations.
            const invoiceWithRelations = await transactionalManager.findOne(ImportInvoiceEntity, {
                where: { id: invoice.id },
                relations: ['importInvoiceProducts'],
            });

            return invoiceWithRelations || invoice;
        });
    }

    // Delete draft import invoice.
    async deleteDraftImportInvoice(ids: string[]): Promise<boolean> {
        return await this.importInvoiceRepository.manager.transaction(async (transactionalManager) => {

            // Delete related products first.
            await transactionalManager.delete(ImportInvoiceProductsEntity, {
                importInvoice: { id: In(ids) }
            });

            // Delete invoices.
            await transactionalManager.delete(ImportInvoiceEntity, {
                id: In(ids)
            });

            return true;
        });
    }

    // Confirm a draft import invoice.
    async confirmImportInvoice(invoice: ImportInvoiceEntity, user: AccessTokenPayload): Promise<ImportInvoiceEntity | null> {

        // Step 1: Local transaction - confirm the import invoice in the database.
        const result = await this.importInvoiceRepository.manager.transaction(async (transactionalManager) => {

            const invoiceId = await this.generateInvoiceId(transactionalManager);

            let products = invoice.importInvoiceProducts;
            if (!products) {
                const loadedInvoice = await transactionalManager.findOne(ImportInvoiceEntity, {
                    where: { id: invoice.id },
                    relations: ['importInvoiceProducts'],
                });
                if (!loadedInvoice) return null;
                products = loadedInvoice.importInvoiceProducts;
            }

            invoice.invoiceId = invoiceId;
            invoice.status = ImportInvoiceStatus.CONFIRMED;
            invoice.confirmedBy = user.id;
            invoice.confirmedAt = new Date();
            invoice.returnCount = 0;

            await transactionalManager.save(ImportInvoiceEntity, invoice);

            const invoiceWithRelations = await transactionalManager.findOne(ImportInvoiceEntity, {
                where: { id: invoice.id },
                relations: ['importInvoiceProducts'],
            });

            const stockUpdateDto: UpdateProductInventoryBulkRequestDto = {
                invoiceType: InvoiceType.IMPORT,
                invoiceId: invoice.id,
                products: products.map(p => ({
                    id: p.productId,
                    quantity: p.quantity,
                    action: StockActionType.ADD,
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
            await this.importInvoiceRepository.manager.transaction(async (transactionalManager) => {
                await transactionalManager.update(ImportInvoiceEntity, { id: invoice.id }, {
                    invoiceId: null as any,
                    status: ImportInvoiceStatus.DRAFT,
                    confirmedBy: null as any,
                    confirmedAt: null as any,
                });
            });
            throw error;
        }

        return result.invoice;
    }

    // Get import invoice by id.
    async getImportInvoiceById(id: string): Promise<ImportInvoiceEntity | null> {
        return this.importInvoiceRepository.findOne({
            where: { id },
            relations: ['importInvoiceProducts'],
        });
    }

    // Get import invoices by ids.
    async getImportInvoicesByIds(ids: string[]): Promise<ImportInvoiceEntity[]> {
        return await this.importInvoiceRepository.find({
            where: { id: In(ids) },
        });
    }

    // Get a list of import invoices.
    async getListOfImportInvoices(dto: GetListOfImportInvoiceRequestDto, user: AccessTokenPayload): Promise<{ data: ImportInvoiceEntity[], total: number }> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', fromDate, toDate, status } = dto;

        const queryBuilder = this.importInvoiceRepository.createQueryBuilder('invoice');
        queryBuilder.leftJoinAndSelect('invoice.importInvoiceProducts', 'products');

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

        // Apply role-based for ADMIN to filter by userId.
        const isAdmin = user.roles.some(role => role === Role.ADMIN);
        if (!isAdmin) {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where('invoice.status != :draftStatus', { draftStatus: ImportInvoiceStatus.DRAFT })
                    .orWhere('invoice.draftBy = :userId', { userId: user.id });
            }));
        }

        // Apply date range filters.
        if (fromDate) {
            switch (status) {
                case ImportInvoiceStatus.DRAFT:
                    queryBuilder.andWhere('invoice.draftAt >= :fromDate', { fromDate });
                    break;
                case ImportInvoiceStatus.CONFIRMED:
                case ImportInvoiceStatus.PARTIALLY_RETURNED:
                case ImportInvoiceStatus.RETURNED:
                    queryBuilder.andWhere('invoice.confirmedAt >= :fromDate', { fromDate });
                    break;
                default:
                    queryBuilder.andWhere('invoice.confirmedAt >= :fromDate', { fromDate });
                    break;
            }
        }

        if (toDate) {
            switch (status) {
                case ImportInvoiceStatus.DRAFT:
                    queryBuilder.andWhere('invoice.draftAt <= :toDate', { toDate });
                    break;
                case ImportInvoiceStatus.CONFIRMED:
                case ImportInvoiceStatus.PARTIALLY_RETURNED:
                case ImportInvoiceStatus.RETURNED:
                    queryBuilder.andWhere('invoice.confirmedAt <= :toDate', { toDate });
                    break;
                default:
                    queryBuilder.andWhere('invoice.confirmedAt <= :toDate', { toDate });
                    break;
            }
        }

        // Apply sorting.
        let sortField = 'invoice.draftAt';
        if (sortBy === 'invoiceId') sortField = 'invoice.invoiceId';
        else if (sortBy === 'totalImportPrice') sortField = 'invoice.totalImportPrice';
        else if (sortBy === 'createdAt') {
            if (status === ImportInvoiceStatus.DRAFT) sortField = 'invoice.draftAt';
            else sortField = 'invoice.confirmedAt';
        } else if (sortBy === 'confirmedAt') {
            sortField = 'invoice.confirmedAt';
        }

        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }

}
