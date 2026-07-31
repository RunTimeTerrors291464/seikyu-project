import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Import entities.
import { StockAdjustmentInvoiceEntity } from '../entities/stockAdjustmentInvoices.entity';

// Import repositories.
import { StockAdjustmentInvoiceRepository } from '../repositories/stockAdjustmentInvoice.repository';

// Import services.
import { ProductsService } from '@src/products/services/products.service';

// Import DTOs.
import {
    CreateStockAdjustmentInvoiceRequestDto,
    EditStockAdjustmentInvoiceRequestDto,
    GetListOfStockAdjustmentInvoiceRequestDto,
} from '@libs/common/dtos/invoices/stockAdjustmentInvoice/crudStockAdjustmentInvoicesRequest.dto';
import {
    GetListOfStockAdjustmentInvoicesResponseDto,
    StockAdjustmentInvoiceResponseDto,
} from '@libs/common/dtos/invoices/stockAdjustmentInvoice/crudStockAdjustmentInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import mappers.
import { StockAdjustmentInvoicesMapper } from '@libs/common/mappers/stockAdjustmentInvoices.mapper';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

@Injectable()
export class StockAdjustmentInvoiceService {
    constructor(
        private readonly stockAdjustmentInvoiceRepository: StockAdjustmentInvoiceRepository,
        private readonly stockAdjustmentInvoicesMapper: StockAdjustmentInvoicesMapper,

        private readonly productsService: ProductsService,
        private readonly dataSource: DataSource,
    ) { }

    // --- DRY methods ---
    // Calculate invoice totals from product lines (distinct product count and sum of quantities).
    private calculateInvoiceTotals(products: Array<{ quantity: number }>) {
        let totalProducts = products.length;
        let totalQuantity = 0;

        products.forEach((item) => {
            totalQuantity += item.quantity;
        });

        return { totalProducts, totalQuantity };
    }

    // Ensure product IDs exist and are active.
    private async ensureProductsExistAndActive(productIds: string[]): Promise<void> {
        const uniqueProductIds = [...new Set(productIds)];
        if (uniqueProductIds.length > 0) await this.productsService.getProductsByIds(uniqueProductIds);
    }

    // Get a stock adjustment invoice by id or throw.
    private async getStockAdjustmentInvoiceByIdOrThrow(id: string): Promise<StockAdjustmentInvoiceEntity> {
        const invoice = await this.stockAdjustmentInvoiceRepository.getStockAdjustmentInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.STOCK_ADJUSTMENT_INVOICE_NOT_FOUND, `Stock adjustment invoice with ID ${id} not found`);
        return invoice;
    }

    // --- Public methods ---
    // Create a new draft stock adjustment invoice.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_STOCK_ADJUSTMENT_INVOICE_SERVICE)
    async createDraftStockAdjustmentInvoice(dto: CreateStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {

        // Check whether the productIds exist and are active.
        const productIds = dto.products.map((p) => p.productId);
        await this.ensureProductsExistAndActive(productIds);

        const calculatedTotals = this.calculateInvoiceTotals(dto.products);

        // Create the draft stock adjustment invoice.
        const savedInvoice = await this.dataSource.transaction((manager) =>
            this.stockAdjustmentInvoiceRepository.createDraftStockAdjustmentInvoice(
                dto,
                calculatedTotals,
                user,
                manager,
            ),
        );

        return this.stockAdjustmentInvoicesMapper.toStockAdjustmentInvoiceResponseDto(savedInvoice);
    }

    // Edit a draft stock adjustment invoice.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_STOCK_ADJUSTMENT_INVOICE_SERVICE)
    async editDraftStockAdjustmentInvoice(dto: EditStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {

        // Get the stock adjustment invoice by id.
        const stockAdjustmentInvoice = await this.getStockAdjustmentInvoiceByIdOrThrow(dto.id);

        // Check if the stock adjustment invoice is in draft status.
        if (stockAdjustmentInvoice.status !== StockAdjustmentInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Stock adjustment invoice is not in draft status.');
        if (stockAdjustmentInvoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to edit this invoice.');

        // Check whether the productIds exist and are active.
        const productIds = dto.products.map((p) => p.productId);
        await this.ensureProductsExistAndActive(productIds);

        const calculatedTotals = this.calculateInvoiceTotals(dto.products);

        // Edit the draft stock adjustment invoice.
        const savedInvoice = await this.dataSource.transaction((manager) =>
            this.stockAdjustmentInvoiceRepository.editDraftStockAdjustmentInvoice(
                stockAdjustmentInvoice,
                dto,
                calculatedTotals,
                user,
                manager,
            ),
        );

        return this.stockAdjustmentInvoicesMapper.toStockAdjustmentInvoiceResponseDto(savedInvoice);
    }

    // Delete stock adjustment invoices.
    // Draft invoices are removed permanently; confirmed ones are soft deleted and cannot be restored.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_STOCK_ADJUSTMENT_INVOICE_SERVICE)
    async deleteStockAdjustmentInvoices(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        const draftIds: string[] = [];
        const confirmedIds: string[] = [];

        // Loop through IDs.
        for (const id of ids) {
            const invoice = await this.getStockAdjustmentInvoiceByIdOrThrow(id);

            if (invoice.status === StockAdjustmentInvoiceStatus.DRAFT) {
                if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to delete this invoice.');
                draftIds.push(id);
            } else {
                confirmedIds.push(id);
            }
        }

        await this.dataSource.transaction(async (manager) => {
            await this.stockAdjustmentInvoiceRepository.deleteDraftStockAdjustmentInvoice(draftIds, manager);
            await this.stockAdjustmentInvoiceRepository.softDeleteStockAdjustmentInvoices(confirmedIds, manager);
        });
        return true;
    }

    // Confirm a draft stock adjustment invoice.
    @HandleServiceError(ErrorCode.CONFIRM_STOCK_ADJUSTMENT_INVOICE_SERVICE)
    async confirmStockAdjustmentInvoice(id: string, user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {

        // Get the stock adjustment invoice by id.
        const invoice = await this.getStockAdjustmentInvoiceByIdOrThrow(id);

        // Check if the stock adjustment invoice is in draft status.
        if (invoice.status !== StockAdjustmentInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Stock adjustment invoice is not in draft status.');

        // Check whether the productIds still exist and are active.
        const lines = invoice.stockAdjustmentInvoiceProducts ?? [];
        const productIds = lines.map((p) => p.productId);
        await this.ensureProductsExistAndActive(productIds);

        // Confirm the stock adjustment invoice.
        const confirmedInvoice = await this.dataSource.transaction((manager) =>
            this.stockAdjustmentInvoiceRepository.confirmStockAdjustmentInvoice(invoice, user, manager),
        );

        if (!confirmedInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Stock adjustment invoice could not be confirmed.');

        return this.stockAdjustmentInvoicesMapper.toStockAdjustmentInvoiceResponseDto(confirmedInvoice);
    }

    // Get stock adjustment invoice by ID.
    @HandleServiceError(ErrorCode.GET_STOCK_ADJUSTMENT_INVOICE_BY_ID_SERVICE)
    async getStockAdjustmentInvoiceById(id: string): Promise<StockAdjustmentInvoiceResponseDto> {
        const invoice = await this.getStockAdjustmentInvoiceByIdOrThrow(id);
        return this.stockAdjustmentInvoicesMapper.toStockAdjustmentInvoiceResponseDto(invoice);
    }

    // Get list of stock adjustment invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_STOCK_ADJUSTMENT_INVOICES_SERVICE)
    async getListOfStockAdjustmentInvoices(dto: GetListOfStockAdjustmentInvoiceRequestDto): Promise<GetListOfStockAdjustmentInvoicesResponseDto> {
        const { data, total } = await this.stockAdjustmentInvoiceRepository.getListOfStockAdjustmentInvoices(dto);

        // Map the invoices to the response DTO.
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: data.map((inv) => this.stockAdjustmentInvoicesMapper.toStockAdjustmentInvoiceWithoutProductsDto(inv)),
        };
    }
}
